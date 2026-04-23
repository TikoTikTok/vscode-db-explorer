/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(2));
const fs = __importStar(__webpack_require__(3));
const DatabaseManager_1 = __webpack_require__(4);
const DatabaseTreeProvider_1 = __webpack_require__(7);
const DatabaseEditorProvider_1 = __webpack_require__(8);
function isDbFile(uri) {
    const ext = path.extname(uri.fsPath).toLowerCase();
    return ['.db', '.sqlite', '.sqlite3', '.vscdb', '.s3db', '.sl3'].includes(ext);
}
function activate(context) {
    const manager = DatabaseManager_1.DatabaseManager.getInstance();
    const treeProvider = new DatabaseTreeProvider_1.DatabaseTreeProvider(manager);
    const treeView = vscode.window.createTreeView('dbExplorer', {
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBar);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('dbExplorer.editor', new DatabaseEditorProvider_1.DatabaseEditorProvider(manager, context.extensionPath, statusBar), { webviewOptions: { retainContextWhenHidden: true } }));
    // Status bar is updated by DatabaseEditorProvider via onDidChangeViewState
    context.subscriptions.push(vscode.commands.registerCommand('dbExplorer.show', () => {
        vscode.commands.executeCommand('workbench.view.extension.dbExplorer');
    }), vscode.commands.registerCommand('dbExplorer.openDatabase', async (uri) => {
        if (!uri) {
            const files = await vscode.window.showOpenDialog({
                filters: { 'SQLite Database': ['db', 'sqlite', 'sqlite3', 'vscdb', 's3db', 'sl3'] },
                canSelectMany: false
            });
            if (!files || files.length === 0) {
                return;
            }
            uri = files[0];
        }
        try {
            await manager.openDatabase(uri.fsPath);
            treeProvider.refresh();
            await vscode.commands.executeCommand('vscode.openWith', uri, 'dbExplorer.editor');
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to open database: ${e.message}`);
        }
    }), vscode.commands.registerCommand('dbExplorer.refresh', () => {
        treeProvider.refresh();
    }), vscode.commands.registerCommand('dbExplorer.disconnect', (item) => {
        if (item?.filePath) {
            manager.closeDatabase(item.filePath);
            treeProvider.refresh();
        }
    }), vscode.commands.registerCommand('dbExplorer.openQuery', async (uri) => {
        if (uri) {
            try {
                await manager.openDatabase(uri.fsPath);
                treeProvider.refresh();
                await vscode.commands.executeCommand('vscode.openWith', uri, 'dbExplorer.editor');
            }
            catch (e) {
                vscode.window.showErrorMessage(`Failed to open database: ${e.message}`);
            }
        }
    }), vscode.commands.registerCommand('dbExplorer.exportCSV', async (item) => {
        if (!item?.table || !item?.filePath) {
            vscode.window.showWarningMessage('Please right-click a table in the DB Explorer sidebar to export.');
            return;
        }
        const adapter = manager.getAdapter(item.filePath);
        if (!adapter) {
            return;
        }
        try {
            const csv = adapter.exportTableAsCSV(item.table);
            const saveUri = await vscode.window.showSaveDialog({
                filters: { 'CSV': ['csv'] },
                defaultUri: vscode.Uri.file(item.table + '.csv')
            });
            if (saveUri) {
                fs.writeFileSync(saveUri.fsPath, csv, 'utf8');
                vscode.window.showInformationMessage(`Exported ${item.table} to ${saveUri.fsPath}`);
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(`Export failed: ${e.message}`);
        }
    }), vscode.commands.registerCommand('dbExplorer.exportJSON', async (item) => {
        if (!item?.table || !item?.filePath) {
            vscode.window.showWarningMessage('Please right-click a table in the DB Explorer sidebar to export.');
            return;
        }
        const adapter = manager.getAdapter(item.filePath);
        if (!adapter) {
            return;
        }
        try {
            const json = adapter.exportTableAsJSON(item.table);
            const saveUri = await vscode.window.showSaveDialog({
                filters: { 'JSON': ['json'] },
                defaultUri: vscode.Uri.file(item.table + '.json')
            });
            if (saveUri) {
                fs.writeFileSync(saveUri.fsPath, json, 'utf8');
                vscode.window.showInformationMessage(`Exported ${item.table} to ${saveUri.fsPath}`);
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(`Export failed: ${e.message}`);
        }
    }));
}
function deactivate() {
    DatabaseManager_1.DatabaseManager.getInstance().closeAll();
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseManager = void 0;
const vscode = __importStar(__webpack_require__(1));
const SqliteAdapter_1 = __webpack_require__(5);
class DatabaseManager {
    constructor() {
        this.adapters = new Map();
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChange = this._onDidChange.event;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async openDatabase(filePath) {
        if (this.adapters.has(filePath)) {
            return this.adapters.get(filePath);
        }
        const adapter = new SqliteAdapter_1.SqliteAdapter();
        await adapter.open(filePath);
        this.adapters.set(filePath, adapter);
        this._onDidChange.fire();
        return adapter;
    }
    closeDatabase(filePath) {
        const adapter = this.adapters.get(filePath);
        if (adapter) {
            adapter.close();
            this.adapters.delete(filePath);
            this._onDidChange.fire();
        }
    }
    getAdapter(filePath) {
        return this.adapters.get(filePath);
    }
    getOpenDatabases() {
        return Array.from(this.adapters.keys());
    }
    closeAll() {
        for (const [, adapter] of this.adapters) {
            adapter.close();
        }
        this.adapters.clear();
        this._onDidChange.fire();
    }
}
exports.DatabaseManager = DatabaseManager;


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SqliteAdapter = void 0;
const fs = __importStar(__webpack_require__(3));
const path = __importStar(__webpack_require__(2));
const sql_js_1 = __importDefault(__webpack_require__(6));
class SqliteAdapter {
    constructor() {
        this.db = null;
        this.filePath = '';
    }
    async open(filePath) {
        const wasmPath = path.join(__dirname, 'sql-wasm.wasm');
        const wasmBuf = fs.readFileSync(wasmPath);
        const wasmBinary = wasmBuf.buffer.slice(wasmBuf.byteOffset, wasmBuf.byteOffset + wasmBuf.byteLength);
        const SQL = await (0, sql_js_1.default)({ wasmBinary });
        const fileBuffer = fs.readFileSync(filePath);
        this.db = new SQL.Database(fileBuffer);
        this.filePath = filePath;
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    run(sql, params = []) {
        if (!this.db) {
            throw new Error('Database not open');
        }
        this.db.run(sql, params);
    }
    /** Escape a SQL identifier (table/column name) for use inside double-quoted literals. */
    esc(name) {
        return name.replace(/"/g, '""');
    }
    exec(sql) {
        if (!this.db) {
            throw new Error('Database not open');
        }
        try {
            const results = this.db.exec(sql);
            if (results.length === 0) {
                return { columns: [], rows: [], rowsAffected: 0 };
            }
            return { columns: results[0].columns, rows: results[0].values, rowsAffected: 0 };
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    getTables() {
        const result = this.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
        return result.rows.map(r => {
            const countResult = this.exec(`SELECT COUNT(*) FROM "${this.esc(r[0])}"`);
            return { name: r[0], rowCount: countResult.rows[0][0] };
        });
    }
    getViews() {
        const result = this.exec("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name");
        return result.rows.map(r => r[0]);
    }
    getIndexes() {
        // sqlite_master has no "unique" column; use PRAGMA index_list per table instead
        const tables = this.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const indexes = [];
        for (const tableRow of tables.rows) {
            const tableName = tableRow[0];
            // PRAGMA index_list columns: seq(0), name(1), unique(2), origin(3), partial(4)
            const idxList = this.exec(`PRAGMA index_list("${this.esc(tableName)}")`);
            for (const row of idxList.rows) {
                const name = row[1];
                if (!name.startsWith('sqlite_')) {
                    indexes.push({ name, table: tableName, unique: row[2] === 1 });
                }
            }
        }
        return indexes.sort((a, b) => a.name.localeCompare(b.name));
    }
    getTriggers() {
        const result = this.exec("SELECT name, tbl_name FROM sqlite_master WHERE type='trigger' ORDER BY name");
        return result.rows.map(r => ({ name: r[0], table: r[1] }));
    }
    getTableSchema(table) {
        const colResult = this.exec(`PRAGMA table_info("${this.esc(table)}")`);
        const columns = colResult.rows.map(r => ({
            name: r[1], type: r[2], notnull: r[3] === 1,
            dflt_value: r[4], pk: r[5] === 1
        }));
        const idxResult = this.exec(`PRAGMA index_list("${this.esc(table)}")`);
        const indexes = idxResult.rows.map(r => {
            const idxColResult = this.exec(`PRAGMA index_info("${this.esc(r[1])}")`);
            return { name: r[1], unique: r[2] === 1, columns: idxColResult.rows.map(c => c[2]) };
        });
        const fkResult = this.exec(`PRAGMA foreign_key_list("${this.esc(table)}")`);
        const foreignKeys = fkResult.rows.map(r => ({
            from: r[3], table: r[2], to: r[4],
            on_update: r[5], on_delete: r[6]
        }));
        const sqlResult = this.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.replace(/'/g, "''")}'`);
        const sql = sqlResult.rows[0]?.[0] || '';
        return { name: table, sql, columns, indexes, foreignKeys };
    }
    getTableData(table, offset, limit, sortCol, sortDir = 'ASC', filter) {
        let wherePart = '';
        if (filter && filter.trim()) {
            const colResult = this.exec(`PRAGMA table_info("${this.esc(table)}")`);
            const cols = colResult.rows.map(r => r[1]);
            const conditions = cols.map(c => `CAST("${this.esc(c)}" AS TEXT) LIKE '%${filter.replace(/'/g, "''")}%'`).join(' OR ');
            wherePart = `WHERE ${conditions}`;
        }
        const orderPart = sortCol ? `ORDER BY "${this.esc(sortCol)}" ${sortDir}` : '';
        const countResult = this.exec(`SELECT COUNT(*) FROM "${this.esc(table)}" ${wherePart}`);
        const total = countResult.rows[0][0];
        const dataResult = this.exec(`SELECT * FROM "${this.esc(table)}" ${wherePart} ${orderPart} LIMIT ${limit} OFFSET ${offset}`);
        return { columns: dataResult.columns, rows: dataResult.rows, total, offset, limit };
    }
    executeQuery(sql) {
        const result = this.exec(sql);
        // Persist file and report affected rows for write queries
        const rowsAffected = this.db ? this.db.getRowsModified() : 0;
        if (rowsAffected > 0) {
            this.saveToFile();
        }
        return { ...result, rowsAffected };
    }
    insertRow(table, data) {
        const cols = Object.keys(data).map(c => `"${this.esc(c)}"`).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        this.run(`INSERT INTO "${this.esc(table)}" (${cols}) VALUES (${placeholders})`, values);
        this.saveToFile();
    }
    updateCell(table, pkCol, pkVal, col, val) {
        this.run(`UPDATE "${this.esc(table)}" SET "${this.esc(col)}" = ? WHERE "${this.esc(pkCol)}" = ?`, [val, pkVal]);
        this.saveToFile();
    }
    deleteRows(table, pkCol, pkVals) {
        const placeholders = pkVals.map(() => '?').join(', ');
        this.run(`DELETE FROM "${this.esc(table)}" WHERE "${this.esc(pkCol)}" IN (${placeholders})`, pkVals);
        this.saveToFile();
    }
    getDatabaseInfo() {
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
            sqliteVersion: versionResult.rows[0]?.[0] || 'unknown',
            pageSize: pageSizeResult.rows[0]?.[0] || 0,
            pageCount: pageCountResult.rows[0]?.[0] || 0,
            encoding: encodingResult.rows[0]?.[0] || 'UTF-8',
            journalMode: journalModeResult.rows[0]?.[0] || 'delete',
            walMode: journalModeResult.rows[0]?.[0] === 'wal',
            tableCount: tables.length,
            tables
        };
    }
    exportTableAsCSV(table) {
        const data = this.getTableData(table, 0, 999999);
        const escape = (v) => {
            const s = v === null || v === undefined ? '' : String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        const lines = [data.columns.map(escape).join(',')];
        for (const row of data.rows) {
            lines.push(row.map(escape).join(','));
        }
        return lines.join('\n');
    }
    exportTableAsJSON(table) {
        const data = this.getTableData(table, 0, 999999);
        const objects = data.rows.map(row => {
            const obj = {};
            data.columns.forEach((col, i) => { obj[col] = row[i]; });
            return obj;
        });
        return JSON.stringify(objects, null, 2);
    }
    saveToFile() {
        if (!this.db || !this.filePath) {
            return;
        }
        const data = this.db.export();
        fs.writeFileSync(this.filePath, Buffer.from(data));
    }
}
exports.SqliteAdapter = SqliteAdapter;


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("./sql-wasm.js");

/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseTreeProvider = exports.DatabaseTreeItem = void 0;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(2));
class DatabaseTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, itemType, filePath, table, description, stableId) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.itemType = itemType;
        this.filePath = filePath;
        this.table = table;
        this.contextValue = itemType;
        if (description) {
            this.description = description;
        }
        if (stableId) {
            this.id = stableId;
        }
        this.setupIcon();
    }
    setupIcon() {
        switch (this.itemType) {
            case 'database':
                this.iconPath = new vscode.ThemeIcon('database');
                break;
            case 'folder':
            case 'folder-views':
            case 'folder-indexes':
            case 'folder-triggers':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'table':
                this.iconPath = new vscode.ThemeIcon('table');
                break;
            case 'column':
                this.iconPath = new vscode.ThemeIcon('symbol-field');
                break;
            case 'view':
                this.iconPath = new vscode.ThemeIcon('eye');
                break;
            case 'index':
                this.iconPath = new vscode.ThemeIcon('list-ordered');
                break;
            case 'trigger':
                this.iconPath = new vscode.ThemeIcon('zap');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
    }
}
exports.DatabaseTreeItem = DatabaseTreeItem;
class DatabaseTreeProvider {
    constructor(manager) {
        this.manager = manager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        manager.onDidChange(() => this.refresh());
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            const databases = this.manager.getOpenDatabases();
            if (databases.length === 0) {
                const emptyItem = new DatabaseTreeItem('No databases open. Click + to open.', vscode.TreeItemCollapsibleState.None, 'empty', undefined, undefined, undefined, 'empty-placeholder');
                emptyItem.command = { command: 'dbExplorer.openDatabase', title: 'Open Database' };
                return Promise.resolve([emptyItem]);
            }
            return Promise.resolve(databases.map(dbPath => {
                const item = new DatabaseTreeItem(path.basename(dbPath), vscode.TreeItemCollapsibleState.Expanded, 'database', dbPath, undefined, dbPath, `db:${dbPath}`);
                item.tooltip = dbPath;
                return item;
            }));
        }
        if (element.itemType === 'database' && element.filePath) {
            const fp = element.filePath;
            return Promise.resolve([
                new DatabaseTreeItem('Tables', vscode.TreeItemCollapsibleState.Expanded, 'folder', fp, undefined, '', `${fp}:tables`),
                new DatabaseTreeItem('Views', vscode.TreeItemCollapsibleState.Collapsed, 'folder-views', fp, undefined, '', `${fp}:views`),
                new DatabaseTreeItem('Indexes', vscode.TreeItemCollapsibleState.Collapsed, 'folder-indexes', fp, undefined, '', `${fp}:indexes`),
                new DatabaseTreeItem('Triggers', vscode.TreeItemCollapsibleState.Collapsed, 'folder-triggers', fp, undefined, '', `${fp}:triggers`),
            ]);
        }
        if (element.itemType === 'folder' && element.filePath) {
            try {
                const adapter = this.manager.getAdapter(element.filePath);
                if (!adapter) {
                    return Promise.resolve([]);
                }
                const tables = adapter.getTables();
                return Promise.resolve(tables.map(t => {
                    const item = new DatabaseTreeItem(t.name, vscode.TreeItemCollapsibleState.Collapsed, 'table', element.filePath, t.name, `${t.rowCount} rows`, `${element.filePath}:table:${t.name}`);
                    item.tooltip = `${t.name} (${t.rowCount} rows)`;
                    return item;
                }));
            }
            catch (e) {
                return Promise.resolve([]);
            }
        }
        if (element.itemType === 'folder-views' && element.filePath) {
            try {
                const adapter = this.manager.getAdapter(element.filePath);
                if (!adapter) {
                    return Promise.resolve([]);
                }
                const views = adapter.getViews();
                return Promise.resolve(views.map(v => new DatabaseTreeItem(v, vscode.TreeItemCollapsibleState.None, 'view', element.filePath, undefined, undefined, `${element.filePath}:view:${v}`)));
            }
            catch (e) {
                return Promise.resolve([]);
            }
        }
        if (element.itemType === 'folder-indexes' && element.filePath) {
            try {
                const adapter = this.manager.getAdapter(element.filePath);
                if (!adapter) {
                    return Promise.resolve([]);
                }
                const indexes = adapter.getIndexes();
                return Promise.resolve(indexes.map(i => new DatabaseTreeItem(i.name, vscode.TreeItemCollapsibleState.None, 'index', element.filePath, undefined, `on ${i.table}${i.unique ? ' (unique)' : ''}`, `${element.filePath}:index:${i.name}`)));
            }
            catch (e) {
                return Promise.resolve([]);
            }
        }
        if (element.itemType === 'folder-triggers' && element.filePath) {
            try {
                const adapter = this.manager.getAdapter(element.filePath);
                if (!adapter) {
                    return Promise.resolve([]);
                }
                const triggers = adapter.getTriggers();
                return Promise.resolve(triggers.map(t => new DatabaseTreeItem(t.name, vscode.TreeItemCollapsibleState.None, 'trigger', element.filePath, undefined, `on ${t.table}`, `${element.filePath}:trigger:${t.name}`)));
            }
            catch (e) {
                return Promise.resolve([]);
            }
        }
        if (element.itemType === 'table' && element.filePath && element.table) {
            try {
                const adapter = this.manager.getAdapter(element.filePath);
                if (!adapter) {
                    return Promise.resolve([]);
                }
                const schema = adapter.getTableSchema(element.table);
                return Promise.resolve(schema.columns.map(col => {
                    const badges = [];
                    if (col.pk) {
                        badges.push('PK');
                    }
                    if (col.notnull) {
                        badges.push('NOT NULL');
                    }
                    const label = `${col.name} (${col.type || 'ANY'}${badges.length ? ' · ' + badges.join(' · ') : ''})`;
                    return new DatabaseTreeItem(label, vscode.TreeItemCollapsibleState.None, 'column', element.filePath, undefined, undefined, `${element.filePath}:col:${element.table}:${col.name}`);
                }));
            }
            catch (e) {
                return Promise.resolve([]);
            }
        }
        return Promise.resolve([]);
    }
}
exports.DatabaseTreeProvider = DatabaseTreeProvider;


/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseEditorProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(2));
const WebviewBuilder_1 = __webpack_require__(9);
class DatabaseEditorProvider {
    constructor(manager, extensionPath, statusBar) {
        this.manager = manager;
        this.extensionPath = extensionPath;
        this.statusBar = statusBar;
        this._onDidChangeCustomDocument = new vscode.EventEmitter();
        this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    }
    async openCustomDocument(uri, _openContext, _token) {
        try {
            await this.manager.openDatabase(uri.fsPath);
        }
        catch (e) {
            throw new Error(`Failed to open database: ${e.message}`);
        }
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = WebviewBuilder_1.WebviewBuilder.build(webviewPanel.webview, this.extensionPath, document.uri.fsPath);
        // Update status bar as this panel gains/loses focus
        const dbName = path.basename(document.uri.fsPath);
        const updateStatusBar = (active) => {
            if (!this.statusBar) {
                return;
            }
            if (active) {
                this.statusBar.text = `$(database) DB: ${dbName}`;
                this.statusBar.show();
            }
            else {
                this.statusBar.hide();
            }
        };
        updateStatusBar(true);
        webviewPanel.onDidChangeViewState(e => updateStatusBar(e.webviewPanel.active));
        webviewPanel.onDidDispose(() => { if (this.statusBar) {
            this.statusBar.hide();
        } });
        webviewPanel.webview.onDidReceiveMessage(async (msg) => {
            const filePath = document.uri.fsPath;
            const adapter = this.manager.getAdapter(filePath);
            if (!adapter) {
                webviewPanel.webview.postMessage({ type: 'error', error: 'Database not open' });
                return;
            }
            try {
                switch (msg.type) {
                    case 'ready':
                    case 'getTables': {
                        const tables = adapter.getTables();
                        webviewPanel.webview.postMessage({ type: 'tablesResult', tables });
                        break;
                    }
                    case 'getData': {
                        const data = adapter.getTableData(msg.table, msg.offset || 0, msg.limit || 50, msg.sortCol, msg.sortDir || 'ASC', msg.filter);
                        webviewPanel.webview.postMessage({ type: 'dataResult', data });
                        break;
                    }
                    case 'query': {
                        try {
                            const result = adapter.executeQuery(msg.sql);
                            webviewPanel.webview.postMessage({ type: 'queryResult', result });
                        }
                        catch (e) {
                            webviewPanel.webview.postMessage({ type: 'queryError', error: e.message });
                        }
                        break;
                    }
                    case 'getSchema': {
                        const schema = adapter.getTableSchema(msg.table);
                        webviewPanel.webview.postMessage({ type: 'schemaResult', schema });
                        break;
                    }
                    case 'getDbInfo': {
                        const info = adapter.getDatabaseInfo();
                        webviewPanel.webview.postMessage({ type: 'dbInfoResult', info });
                        break;
                    }
                    case 'updateCell': {
                        adapter.updateCell(msg.table, msg.pkCol, msg.pkVal, msg.col, msg.val);
                        webviewPanel.webview.postMessage({ type: 'updateSuccess' });
                        break;
                    }
                    case 'insertRow': {
                        adapter.insertRow(msg.table, msg.data);
                        webviewPanel.webview.postMessage({ type: 'insertSuccess' });
                        break;
                    }
                    case 'deleteRows': {
                        adapter.deleteRows(msg.table, msg.pkCol, msg.pkVals);
                        webviewPanel.webview.postMessage({ type: 'deleteSuccess' });
                        break;
                    }
                    case 'exportCSV': {
                        const csv = adapter.exportTableAsCSV(msg.table);
                        webviewPanel.webview.postMessage({ type: 'exportCSVResult', csv, table: msg.table });
                        break;
                    }
                    case 'exportJSON': {
                        const json = adapter.exportTableAsJSON(msg.table);
                        webviewPanel.webview.postMessage({ type: 'exportJSONResult', json, table: msg.table });
                        break;
                    }
                    case 'getAllSchemas': {
                        const tables = adapter.getTables();
                        const schemas = {};
                        for (const t of tables) {
                            const schema = adapter.getTableSchema(t.name);
                            schemas[t.name] = schema.columns.map(c => c.name);
                        }
                        webviewPanel.webview.postMessage({ type: 'allSchemasResult', schemas, version: msg.version });
                        break;
                    }
                    case 'refreshData': {
                        const tables = adapter.getTables();
                        webviewPanel.webview.postMessage({ type: 'tablesResult', tables });
                        break;
                    }
                    default:
                        webviewPanel.webview.postMessage({ type: 'error', error: `Unknown message type: ${msg.type}` });
                }
            }
            catch (e) {
                const errMsg = e?.message || String(e) || `Unknown error in handler: ${msg.type}`;
                console.error('[DB-Explorer] handler error:', msg.type, errMsg, e?.stack || '');
                webviewPanel.webview.postMessage({ type: 'error', error: errMsg });
            }
        });
    }
    saveCustomDocument(_document, _cancellation) {
        return Promise.resolve();
    }
    saveCustomDocumentAs(_document, _destination, _cancellation) {
        return Promise.resolve();
    }
    revertCustomDocument(_document, _cancellation) {
        return Promise.resolve();
    }
    backupCustomDocument(_document, context, _cancellation) {
        return Promise.resolve({ id: context.destination.toString(), delete: () => { } });
    }
}
exports.DatabaseEditorProvider = DatabaseEditorProvider;


/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebviewBuilder = void 0;
const fs = __importStar(__webpack_require__(3));
const path = __importStar(__webpack_require__(2));
const vscode = __importStar(__webpack_require__(1));
class WebviewBuilder {
    static build(webview, extensionPath, filePath) {
        const cssPath = path.join(extensionPath, 'media', 'main.css');
        const jsPath = path.join(extensionPath, 'media', 'main.js');
        const css = fs.readFileSync(cssPath, 'utf8');
        const js = fs.readFileSync(jsPath, 'utf8');
        const nonce = WebviewBuilder.getNonce();
        const fileName = path.basename(filePath);
        // Editor bundle loaded as a webview resource (not inlined) to keep HTML small
        const editorBundleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist', 'editor-bundle.js')));
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}' ${webview.cspSource};">
  <title>DB Explorer - ${fileName}</title>
  <style nonce="${nonce}">${css}</style>
</head>
<body>
<div class="app-container">
  <div class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">Tables</span>
      <button class="icon-btn" id="btn-refresh" title="Refresh">&#x21BA;</button>
    </div>
    <div id="table-list" class="table-list"></div>
  </div>
  <div class="main-content">
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="data">Data</button>
      <button class="tab-btn" data-tab="query">Query</button>
      <button class="tab-btn" data-tab="schema">Schema</button>
      <button class="tab-btn" data-tab="info">Info</button>
    </div>

    <div id="tab-data" class="tab-content active">
      <div class="toolbar">
        <input id="filter-input" type="text" placeholder="Filter rows..." class="filter-input">
        <button id="btn-insert" class="btn btn-primary">+ Insert Row</button>
        <button id="btn-delete" class="btn btn-danger">Delete Selected</button>
        <select id="page-size-select" class="select-input">
          <option value="50">50 rows</option>
          <option value="100">100 rows</option>
          <option value="500">500 rows</option>
        </select>
      </div>
      <div id="data-grid-container" class="grid-container"></div>
      <div class="pagination-bar">
        <button id="btn-prev" class="btn">&#8592; Prev</button>
        <span id="status-text" class="status-text">Select a table</span>
        <button id="btn-next" class="btn">Next &#8594;</button>
      </div>
    </div>

    <div id="tab-query" class="tab-content">
      <div class="query-toolbar">
        <select id="query-history" class="select-input"><option value="">Query history...</option></select>
        <button id="btn-run-query" class="btn btn-primary">&#9654; Run (Ctrl+Enter)</button>
        <button id="btn-clear-query" class="btn">Clear</button>
      </div>
      <div id="query-editor-container" class="query-editor-container"></div>
      <div id="query-error" class="error-banner" style="display:none;"></div>
      <div id="query-results" class="grid-container results-area"></div>
    </div>

    <div id="tab-schema" class="tab-content">
      <div class="toolbar">
        <select id="schema-table-select" class="select-input"><option value="">Select table...</option></select>
        <button id="btn-load-schema" class="btn btn-primary">Load Schema</button>
      </div>
      <div id="schema-content" class="schema-view"></div>
    </div>

    <div id="tab-info" class="tab-content">
      <div id="info-content" class="info-view"></div>
    </div>
  </div>
</div>
<div id="loading-overlay" class="loading-overlay" style="display:none;">
  <div class="spinner"></div>
</div>
<div id="error-toast" class="error-toast" style="display:none;" role="alert"></div>
<script nonce="${nonce}">window.__DB_NONCE__ = '${nonce}';</script>
<script src="${editorBundleUri}"></script>
<script nonce="${nonce}">${js}</script>
</body>
</html>`;
    }
    static getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.WebviewBuilder = WebviewBuilder;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map