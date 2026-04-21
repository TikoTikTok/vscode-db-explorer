import * as fs from 'fs';
import * as path from 'path';
import initSqlJs from 'sql.js';
import { TableInfo, ColumnInfo, IndexInfo, ForeignKeyInfo, TableSchema, QueryResult, DatabaseInfo, DataPage } from './types';

export class SqliteAdapter {
  private db: any = null;
  private filePath: string = '';

  async open(filePath: string): Promise<void> {
    const wasmPath = path.join(__dirname, 'sql-wasm.wasm');
    const wasmBuf = fs.readFileSync(wasmPath);
    const wasmBinary = wasmBuf.buffer.slice(wasmBuf.byteOffset, wasmBuf.byteOffset + wasmBuf.byteLength) as ArrayBuffer;
    const SQL = await initSqlJs({ wasmBinary });
    const fileBuffer = fs.readFileSync(filePath);
    this.db = new SQL.Database(fileBuffer);
    this.filePath = filePath;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private run(sql: string, params: any[] = []): void {
    if (!this.db) { throw new Error('Database not open'); }
    this.db.run(sql, params);
  }

  private exec(sql: string): QueryResult {
    if (!this.db) { throw new Error('Database not open'); }
    try {
      const results = this.db.exec(sql);
      if (results.length === 0) { return { columns: [], rows: [], rowsAffected: 0 }; }
      return { columns: results[0].columns, rows: results[0].values as any[][], rowsAffected: 0 };
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  getTables(): TableInfo[] {
    const result = this.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    return result.rows.map(r => {
      const countResult = this.exec(`SELECT COUNT(*) FROM "${r[0]}"`);
      return { name: r[0] as string, rowCount: countResult.rows[0][0] as number };
    });
  }

  getViews(): string[] {
    const result = this.exec("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name");
    return result.rows.map(r => r[0] as string);
  }

  getIndexes(): { name: string; table: string; unique: boolean }[] {
    // sqlite_master has no "unique" column; use PRAGMA index_list per table instead
    const tables = this.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const indexes: { name: string; table: string; unique: boolean }[] = [];
    for (const tableRow of tables.rows) {
      const tableName = tableRow[0] as string;
      // PRAGMA index_list columns: seq(0), name(1), unique(2), origin(3), partial(4)
      const idxList = this.exec(`PRAGMA index_list("${tableName}")`);
      for (const row of idxList.rows) {
        const name = row[1] as string;
        if (!name.startsWith('sqlite_')) {
          indexes.push({ name, table: tableName, unique: row[2] === 1 });
        }
      }
    }
    return indexes.sort((a, b) => a.name.localeCompare(b.name));
  }

  getTriggers(): { name: string; table: string }[] {
    const result = this.exec("SELECT name, tbl_name FROM sqlite_master WHERE type='trigger' ORDER BY name");
    return result.rows.map(r => ({ name: r[0] as string, table: r[1] as string }));
  }

  getTableSchema(table: string): TableSchema {
    const colResult = this.exec(`PRAGMA table_info("${table}")`);
    const columns: ColumnInfo[] = colResult.rows.map(r => ({
      name: r[1] as string, type: r[2] as string, notnull: r[3] === 1,
      dflt_value: r[4], pk: r[5] === 1
    }));

    const idxResult = this.exec(`PRAGMA index_list("${table}")`);
    const indexes: IndexInfo[] = idxResult.rows.map(r => {
      const idxColResult = this.exec(`PRAGMA index_info("${r[1]}")`);
      return { name: r[1] as string, unique: r[2] === 1, columns: idxColResult.rows.map(c => c[2] as string) };
    });

    const fkResult = this.exec(`PRAGMA foreign_key_list("${table}")`);
    const foreignKeys: ForeignKeyInfo[] = fkResult.rows.map(r => ({
      from: r[3] as string, table: r[2] as string, to: r[4] as string,
      on_update: r[5] as string, on_delete: r[6] as string
    }));

    const sqlResult = this.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
    const sql = sqlResult.rows[0]?.[0] as string || '';

    return { name: table, sql, columns, indexes, foreignKeys };
  }

  getTableData(table: string, offset: number, limit: number, sortCol?: string, sortDir: 'ASC' | 'DESC' = 'ASC', filter?: string): DataPage {
    let wherePart = '';
    if (filter && filter.trim()) {
      const colResult = this.exec(`PRAGMA table_info("${table}")`);
      const cols = colResult.rows.map(r => r[1] as string);
      const conditions = cols.map(c => `CAST("${c}" AS TEXT) LIKE '%${filter.replace(/'/g, "''")}%'`).join(' OR ');
      wherePart = `WHERE ${conditions}`;
    }
    const orderPart = sortCol ? `ORDER BY "${sortCol}" ${sortDir}` : '';
    const countResult = this.exec(`SELECT COUNT(*) FROM "${table}" ${wherePart}`);
    const total = countResult.rows[0][0] as number;
    const dataResult = this.exec(`SELECT * FROM "${table}" ${wherePart} ${orderPart} LIMIT ${limit} OFFSET ${offset}`);
    return { columns: dataResult.columns, rows: dataResult.rows, total, offset, limit };
  }

  executeQuery(sql: string): QueryResult {
    const result = this.exec(sql);
    // Persist file and report affected rows for write queries
    const rowsAffected = this.db ? (this.db.getRowsModified() as number) : 0;
    if (rowsAffected > 0) { this.saveToFile(); }
    return { ...result, rowsAffected };
  }

  insertRow(table: string, data: Record<string, any>): void {
    const cols = Object.keys(data).map(c => `"${c}"`).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    this.run(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, values);
    this.saveToFile();
  }

  updateCell(table: string, pkCol: string, pkVal: any, col: string, val: any): void {
    this.run(`UPDATE "${table}" SET "${col}" = ? WHERE "${pkCol}" = ?`, [val, pkVal]);
    this.saveToFile();
  }

  deleteRows(table: string, pkCol: string, pkVals: any[]): void {
    const placeholders = pkVals.map(() => '?').join(', ');
    this.run(`DELETE FROM "${table}" WHERE "${pkCol}" IN (${placeholders})`, pkVals);
    this.saveToFile();
  }

  getDatabaseInfo(): DatabaseInfo {
    const pageSizeResult = this.exec('PRAGMA page_size');
    const pageCountResult = this.exec('PRAGMA page_count');
    const encodingResult = this.exec('PRAGMA encoding');
    const journalModeResult = this.exec('PRAGMA journal_mode');
    const versionResult = this.exec('SELECT sqlite_version()');

    const tables = this.getTables();
    const fileSize = fs.existsSync(this.filePath) ? fs.statSync(this.filePath).size : 0;

    return {
      filePath: this.filePath,
      fileSize,
      sqliteVersion: versionResult.rows[0]?.[0] as string || 'unknown',
      pageSize: pageSizeResult.rows[0]?.[0] as number || 0,
      pageCount: pageCountResult.rows[0]?.[0] as number || 0,
      encoding: encodingResult.rows[0]?.[0] as string || 'UTF-8',
      journalMode: journalModeResult.rows[0]?.[0] as string || 'delete',
      walMode: journalModeResult.rows[0]?.[0] === 'wal',
      tableCount: tables.length,
      tables
    };
  }

  exportTableAsCSV(table: string): string {
    const data = this.getTableData(table, 0, 999999);
    const escape = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) { return `"${s.replace(/"/g, '""')}"`; }
      return s;
    };
    const lines = [data.columns.map(escape).join(',')];
    for (const row of data.rows) { lines.push(row.map(escape).join(',')); }
    return lines.join('\n');
  }

  exportTableAsJSON(table: string): string {
    const data = this.getTableData(table, 0, 999999);
    const objects = data.rows.map(row => {
      const obj: Record<string, any> = {};
      data.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    return JSON.stringify(objects, null, 2);
  }

  saveToFile(): void {
    if (!this.db || !this.filePath) { return; }
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }
}
