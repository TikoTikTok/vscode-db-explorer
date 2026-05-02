export interface TableInfo { name: string; rowCount: number; }
export interface ColumnInfo { name: string; type: string; notnull: boolean; dflt_value: any; pk: boolean; }
export interface IndexInfo { name: string; unique: boolean; columns: string[]; }
export interface ForeignKeyInfo { from: string; table: string; to: string; on_update: string; on_delete: string; }
export interface TableSchema { name: string; sql: string; columns: ColumnInfo[]; indexes: IndexInfo[]; foreignKeys: ForeignKeyInfo[]; }
export interface QueryResult { columns: string[]; rows: any[][]; rowsAffected: number; }
export interface DatabaseInfo { filePath: string; fileSize: number; sqliteVersion: string; pageSize: number; pageCount: number; encoding: string; journalMode: string; walMode: boolean; tableCount: number; tables: { name: string; rowCount: number }[]; }
export interface DataPage { columns: string[]; rows: any[][]; total: number; offset: number; limit: number; pkCol: string | null; }
