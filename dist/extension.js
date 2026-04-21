/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
const DatabaseTreeProvider_1 = __webpack_require__(9);
const DatabaseEditorProvider_1 = __webpack_require__(10);
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

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

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
            const countResult = this.exec(`SELECT COUNT(*) FROM "${r[0]}"`);
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
            const idxList = this.exec(`PRAGMA index_list("${tableName}")`);
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
        const colResult = this.exec(`PRAGMA table_info("${table}")`);
        const columns = colResult.rows.map(r => ({
            name: r[1], type: r[2], notnull: r[3] === 1,
            dflt_value: r[4], pk: r[5] === 1
        }));
        const idxResult = this.exec(`PRAGMA index_list("${table}")`);
        const indexes = idxResult.rows.map(r => {
            const idxColResult = this.exec(`PRAGMA index_info("${r[1]}")`);
            return { name: r[1], unique: r[2] === 1, columns: idxColResult.rows.map(c => c[2]) };
        });
        const fkResult = this.exec(`PRAGMA foreign_key_list("${table}")`);
        const foreignKeys = fkResult.rows.map(r => ({
            from: r[3], table: r[2], to: r[4],
            on_update: r[5], on_delete: r[6]
        }));
        const sqlResult = this.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
        const sql = sqlResult.rows[0]?.[0] || '';
        return { name: table, sql, columns, indexes, foreignKeys };
    }
    getTableData(table, offset, limit, sortCol, sortDir = 'ASC', filter) {
        let wherePart = '';
        if (filter && filter.trim()) {
            const colResult = this.exec(`PRAGMA table_info("${table}")`);
            const cols = colResult.rows.map(r => r[1]);
            const conditions = cols.map(c => `CAST("${c}" AS TEXT) LIKE '%${filter.replace(/'/g, "''")}%'`).join(' OR ');
            wherePart = `WHERE ${conditions}`;
        }
        const orderPart = sortCol ? `ORDER BY "${sortCol}" ${sortDir}` : '';
        const countResult = this.exec(`SELECT COUNT(*) FROM "${table}" ${wherePart}`);
        const total = countResult.rows[0][0];
        const dataResult = this.exec(`SELECT * FROM "${table}" ${wherePart} ${orderPart} LIMIT ${limit} OFFSET ${offset}`);
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
        const cols = Object.keys(data).map(c => `"${c}"`).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        this.run(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, values);
        this.saveToFile();
    }
    updateCell(table, pkCol, pkVal, col, val) {
        this.run(`UPDATE "${table}" SET "${col}" = ? WHERE "${pkCol}" = ?`, [val, pkVal]);
        this.saveToFile();
    }
    deleteRows(table, pkCol, pkVals) {
        const placeholders = pkVals.map(() => '?').join(', ');
        this.run(`DELETE FROM "${table}" WHERE "${pkCol}" IN (${placeholders})`, pkVals);
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
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);

// We are modularizing this manually because the current modularize setting in Emscripten has some issues:
// https://github.com/kripken/emscripten/issues/5820
// In addition, When you use emcc's modularization, it still expects to export a global object called `Module`,
// which is able to be used/called before the WASM is loaded.
// The modularization below exports a promise that loads and resolves to the actual sql.js module.
// That way, this module can't be used before the WASM is finished loading.

// We are going to define a function that a user will call to start loading initializing our Sql.js library
// However, that function might be called multiple times, and on subsequent calls, we don't actually want it to instantiate a new instance of the Module
// Instead, we want to return the previously loaded module

// TODO: Make this not declare a global if used in the browser
var initSqlJsPromise = undefined;

var initSqlJs = function (moduleConfig) {

    if (initSqlJsPromise){
      return initSqlJsPromise;
    }
    // If we're here, we've never called this function before
    initSqlJsPromise = new Promise(function (resolveModule, reject) {

        // We are modularizing this manually because the current modularize setting in Emscripten has some issues:
        // https://github.com/kripken/emscripten/issues/5820

        // The way to affect the loading of emcc compiled modules is to create a variable called `Module` and add
        // properties to it, like `preRun`, `postRun`, etc
        // We are using that to get notified when the WASM has finished loading.
        // Only then will we return our promise

        // If they passed in a moduleConfig object, use that
        // Otherwise, initialize Module to the empty object
        var Module = typeof moduleConfig !== 'undefined' ? moduleConfig : {};

        // EMCC only allows for a single onAbort function (not an array of functions)
        // So if the user defined their own onAbort function, we remember it and call it
        var originalOnAbortFunction = Module['onAbort'];
        Module['onAbort'] = function (errorThatCausedAbort) {
            reject(new Error(errorThatCausedAbort));
            if (originalOnAbortFunction){
              originalOnAbortFunction(errorThatCausedAbort);
            }
        };

        Module['postRun'] = Module['postRun'] || [];
        Module['postRun'].push(function () {
            // When Emscripted calls postRun, this promise resolves with the built Module
            resolveModule(Module);
        });

        // There is a section of code in the emcc-generated code below that looks like this:
        // (Note that this is lowercase `module`)
        // if (typeof module !== 'undefined') {
        //     module['exports'] = Module;
        // }
        // When that runs, it's going to overwrite our own modularization export efforts in shell-post.js!
        // The only way to tell emcc not to emit it is to pass the MODULARIZE=1 or MODULARIZE_INSTANCE=1 flags,
        // but that carries with it additional unnecessary baggage/bugs we don't want either.
        // So, we have three options:
        // 1) We undefine `module`
        // 2) We remember what `module['exports']` was at the beginning of this function and we restore it later
        // 3) We write a script to remove those lines of code as part of the Make process.
        //
        // Since those are the only lines of code that care about module, we will undefine it. It's the most straightforward
        // of the options, and has the side effect of reducing emcc's efforts to modify the module if its output were to change in the future.
        // That's a nice side effect since we're handling the modularization efforts ourselves
        module = undefined;

        // The emcc-generated code and shell-post.js code goes below,
        // meaning that all of it runs inside of this promise. If anything throws an exception, our promise will abort
var k;k||=typeof Module != 'undefined' ? Module : {};var aa=!!globalThis.window,ba=!!globalThis.WorkerGlobalScope,ca=globalThis.process?.versions?.node&&"renderer"!=globalThis.process?.type;
k.onRuntimeInitialized=function(){function a(f,l){switch(typeof l){case "boolean":bc(f,l?1:0);break;case "number":cc(f,l);break;case "string":dc(f,l,-1,-1);break;case "object":if(null===l)lb(f);else if(null!=l.length){var n=da(l.length);m.set(l,n);ec(f,n,l.length,-1);ea(n)}else sa(f,"Wrong API use : tried to return a value of an unknown type ("+l+").",-1);break;default:lb(f)}}function b(f,l){for(var n=[],p=0;p<f;p+=1){var u=r(l+4*p,"i32"),v=fc(u);if(1===v||2===v)u=gc(u);else if(3===v)u=hc(u);else if(4===
v){v=u;u=ic(v);v=jc(v);for(var K=new Uint8Array(u),I=0;I<u;I+=1)K[I]=m[v+I];u=K}else u=null;n.push(u)}return n}function c(f,l){this.Qa=f;this.db=l;this.Oa=1;this.mb=[]}function d(f,l){this.db=l;this.fb=fa(f);if(null===this.fb)throw Error("Unable to allocate memory for the SQL string");this.lb=this.fb;this.$a=this.sb=null}function e(f){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(null!=f){var l=this.filename,n="/",p=l;n&&(n="string"==typeof n?n:ha(n),p=l?ia(n+"/"+l):n);l=ja(!0,!0);p=ka(p,
l);if(f){if("string"==typeof f){n=Array(f.length);for(var u=0,v=f.length;u<v;++u)n[u]=f.charCodeAt(u);f=n}la(p,l|146);n=ma(p,577);na(n,f,0,f.length,0);oa(n);la(p,l)}}this.handleError(q(this.filename,g));this.db=r(g,"i32");ob(this.db);this.gb={};this.Sa={}}var g=y(4),h=k.cwrap,q=h("sqlite3_open","number",["string","number"]),w=h("sqlite3_close_v2","number",["number"]),t=h("sqlite3_exec","number",["number","string","number","number","number"]),x=h("sqlite3_changes","number",["number"]),D=h("sqlite3_prepare_v2",
"number",["number","string","number","number","number"]),pb=h("sqlite3_sql","string",["number"]),lc=h("sqlite3_normalized_sql","string",["number"]),qb=h("sqlite3_prepare_v2","number",["number","number","number","number","number"]),mc=h("sqlite3_bind_text","number",["number","number","number","number","number"]),rb=h("sqlite3_bind_blob","number",["number","number","number","number","number"]),nc=h("sqlite3_bind_double","number",["number","number","number"]),oc=h("sqlite3_bind_int","number",["number",
"number","number"]),pc=h("sqlite3_bind_parameter_index","number",["number","string"]),qc=h("sqlite3_step","number",["number"]),rc=h("sqlite3_errmsg","string",["number"]),sc=h("sqlite3_column_count","number",["number"]),tc=h("sqlite3_data_count","number",["number"]),uc=h("sqlite3_column_double","number",["number","number"]),sb=h("sqlite3_column_text","string",["number","number"]),vc=h("sqlite3_column_blob","number",["number","number"]),wc=h("sqlite3_column_bytes","number",["number","number"]),xc=h("sqlite3_column_type",
"number",["number","number"]),yc=h("sqlite3_column_name","string",["number","number"]),zc=h("sqlite3_reset","number",["number"]),Ac=h("sqlite3_clear_bindings","number",["number"]),Bc=h("sqlite3_finalize","number",["number"]),tb=h("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),fc=h("sqlite3_value_type","number",["number"]),ic=h("sqlite3_value_bytes","number",["number"]),hc=h("sqlite3_value_text","string",["number"]),jc=h("sqlite3_value_blob",
"number",["number"]),gc=h("sqlite3_value_double","number",["number"]),cc=h("sqlite3_result_double","",["number","number"]),lb=h("sqlite3_result_null","",["number"]),dc=h("sqlite3_result_text","",["number","string","number","number"]),ec=h("sqlite3_result_blob","",["number","number","number","number"]),bc=h("sqlite3_result_int","",["number","number"]),sa=h("sqlite3_result_error","",["number","string","number"]),ub=h("sqlite3_aggregate_context","number",["number","number"]),ob=h("RegisterExtensionFunctions",
"number",["number"]),vb=h("sqlite3_update_hook","number",["number","number","number"]);c.prototype.bind=function(f){if(!this.Qa)throw"Statement closed";this.reset();return Array.isArray(f)?this.Gb(f):null!=f&&"object"===typeof f?this.Hb(f):!0};c.prototype.step=function(){if(!this.Qa)throw"Statement closed";this.Oa=1;var f=qc(this.Qa);switch(f){case 100:return!0;case 101:return!1;default:throw this.db.handleError(f);}};c.prototype.Ab=function(f){null==f&&(f=this.Oa,this.Oa+=1);return uc(this.Qa,f)};
c.prototype.Ob=function(f){null==f&&(f=this.Oa,this.Oa+=1);f=sb(this.Qa,f);if("function"!==typeof BigInt)throw Error("BigInt is not supported");return BigInt(f)};c.prototype.Tb=function(f){null==f&&(f=this.Oa,this.Oa+=1);return sb(this.Qa,f)};c.prototype.getBlob=function(f){null==f&&(f=this.Oa,this.Oa+=1);var l=wc(this.Qa,f);f=vc(this.Qa,f);for(var n=new Uint8Array(l),p=0;p<l;p+=1)n[p]=m[f+p];return n};c.prototype.get=function(f,l){l=l||{};null!=f&&this.bind(f)&&this.step();f=[];for(var n=tc(this.Qa),
p=0;p<n;p+=1)switch(xc(this.Qa,p)){case 1:var u=l.useBigInt?this.Ob(p):this.Ab(p);f.push(u);break;case 2:f.push(this.Ab(p));break;case 3:f.push(this.Tb(p));break;case 4:f.push(this.getBlob(p));break;default:f.push(null)}return f};c.prototype.qb=function(){for(var f=[],l=sc(this.Qa),n=0;n<l;n+=1)f.push(yc(this.Qa,n));return f};c.prototype.zb=function(f,l){f=this.get(f,l);l=this.qb();for(var n={},p=0;p<l.length;p+=1)n[l[p]]=f[p];return n};c.prototype.Sb=function(){return pb(this.Qa)};c.prototype.Pb=
function(){return lc(this.Qa)};c.prototype.run=function(f){null!=f&&this.bind(f);this.step();return this.reset()};c.prototype.wb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);f=fa(f);this.mb.push(f);this.db.handleError(mc(this.Qa,l,f,-1,0))};c.prototype.Fb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);var n=da(f.length);m.set(f,n);this.mb.push(n);this.db.handleError(rb(this.Qa,l,n,f.length,0))};c.prototype.vb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);this.db.handleError((f===(f|0)?oc:nc)(this.Qa,
l,f))};c.prototype.Ib=function(f){null==f&&(f=this.Oa,this.Oa+=1);rb(this.Qa,f,0,0,0)};c.prototype.xb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);switch(typeof f){case "string":this.wb(f,l);return;case "number":this.vb(f,l);return;case "bigint":this.wb(f.toString(),l);return;case "boolean":this.vb(f+0,l);return;case "object":if(null===f){this.Ib(l);return}if(null!=f.length){this.Fb(f,l);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+f+").";};c.prototype.Hb=function(f){var l=
this;Object.keys(f).forEach(function(n){var p=pc(l.Qa,n);0!==p&&l.xb(f[n],p)});return!0};c.prototype.Gb=function(f){for(var l=0;l<f.length;l+=1)this.xb(f[l],l+1);return!0};c.prototype.reset=function(){this.freemem();return 0===Ac(this.Qa)&&0===zc(this.Qa)};c.prototype.freemem=function(){for(var f;void 0!==(f=this.mb.pop());)ea(f)};c.prototype.Ya=function(){this.freemem();var f=0===Bc(this.Qa);delete this.db.gb[this.Qa];this.Qa=0;return f};d.prototype.next=function(){if(null===this.fb)return{done:!0};
null!==this.$a&&(this.$a.Ya(),this.$a=null);if(!this.db.db)throw this.ob(),Error("Database closed");var f=pa(),l=y(4);qa(g);qa(l);try{this.db.handleError(qb(this.db.db,this.lb,-1,g,l));this.lb=r(l,"i32");var n=r(g,"i32");if(0===n)return this.ob(),{done:!0};this.$a=new c(n,this.db);this.db.gb[n]=this.$a;return{value:this.$a,done:!1}}catch(p){throw this.sb=z(this.lb),this.ob(),p;}finally{ra(f)}};d.prototype.ob=function(){ea(this.fb);this.fb=null};d.prototype.Qb=function(){return null!==this.sb?this.sb:
z(this.lb)};"function"===typeof Symbol&&"symbol"===typeof Symbol.iterator&&(d.prototype[Symbol.iterator]=function(){return this});e.prototype.run=function(f,l){if(!this.db)throw"Database closed";if(l){f=this.tb(f,l);try{f.step()}finally{f.Ya()}}else this.handleError(t(this.db,f,0,0,g));return this};e.prototype.exec=function(f,l,n){if(!this.db)throw"Database closed";var p=null,u=null,v=null;try{v=u=fa(f);var K=y(4);for(f=[];0!==r(v,"i8");){qa(g);qa(K);this.handleError(qb(this.db,v,-1,g,K));var I=r(g,
"i32");v=r(K,"i32");if(0!==I){var H=null;p=new c(I,this);for(null!=l&&p.bind(l);p.step();)null===H&&(H={columns:p.qb(),values:[]},f.push(H)),H.values.push(p.get(null,n));p.Ya()}}return f}catch(L){throw p&&p.Ya(),L;}finally{u&&ea(u)}};e.prototype.Mb=function(f,l,n,p,u){"function"===typeof l&&(p=n,n=l,l=void 0);f=this.tb(f,l);try{for(;f.step();)n(f.zb(null,u))}finally{f.Ya()}if("function"===typeof p)return p()};e.prototype.tb=function(f,l){qa(g);this.handleError(D(this.db,f,-1,g,0));f=r(g,"i32");if(0===
f)throw"Nothing to prepare";var n=new c(f,this);null!=l&&n.bind(l);return this.gb[f]=n};e.prototype.Ub=function(f){return new d(f,this)};e.prototype.Nb=function(){Object.values(this.gb).forEach(function(l){l.Ya()});Object.values(this.Sa).forEach(A);this.Sa={};this.handleError(w(this.db));var f=ta(this.filename);this.handleError(q(this.filename,g));this.db=r(g,"i32");ob(this.db);return f};e.prototype.close=function(){null!==this.db&&(Object.values(this.gb).forEach(function(f){f.Ya()}),Object.values(this.Sa).forEach(A),
this.Sa={},this.Za&&(A(this.Za),this.Za=void 0),this.handleError(w(this.db)),ua("/"+this.filename),this.db=null)};e.prototype.handleError=function(f){if(0===f)return null;f=rc(this.db);throw Error(f);};e.prototype.Rb=function(){return x(this.db)};e.prototype.Kb=function(f,l){Object.prototype.hasOwnProperty.call(this.Sa,f)&&(A(this.Sa[f]),delete this.Sa[f]);var n=va(function(p,u,v){u=b(u,v);try{var K=l.apply(null,u)}catch(I){sa(p,I,-1);return}a(p,K)},"viii");this.Sa[f]=n;this.handleError(tb(this.db,
f,l.length,1,0,n,0,0,0));return this};e.prototype.Jb=function(f,l){var n=l.init||function(){return null},p=l.finalize||function(H){return H},u=l.step;if(!u)throw"An aggregate function must have a step function in "+f;var v={};Object.hasOwnProperty.call(this.Sa,f)&&(A(this.Sa[f]),delete this.Sa[f]);l=f+"__finalize";Object.hasOwnProperty.call(this.Sa,l)&&(A(this.Sa[l]),delete this.Sa[l]);var K=va(function(H,L,Pa){var V=ub(H,1);Object.hasOwnProperty.call(v,V)||(v[V]=n());L=b(L,Pa);L=[v[V]].concat(L);
try{v[V]=u.apply(null,L)}catch(Dc){delete v[V],sa(H,Dc,-1)}},"viii"),I=va(function(H){var L=ub(H,1);try{var Pa=p(v[L])}catch(V){delete v[L];sa(H,V,-1);return}a(H,Pa);delete v[L]},"vi");this.Sa[f]=K;this.Sa[l]=I;this.handleError(tb(this.db,f,u.length-1,1,0,0,K,I,0));return this};e.prototype.Zb=function(f){this.Za&&(vb(this.db,0,0),A(this.Za),this.Za=void 0);if(!f)return this;this.Za=va(function(l,n,p,u,v){switch(n){case 18:l="insert";break;case 23:l="update";break;case 9:l="delete";break;default:throw"unknown operationCode in updateHook callback: "+
n;}p=z(p);u=z(u);if(v>Number.MAX_SAFE_INTEGER)throw"rowId too big to fit inside a Number";f(l,p,u,Number(v))},"viiiij");vb(this.db,this.Za,0);return this};c.prototype.bind=c.prototype.bind;c.prototype.step=c.prototype.step;c.prototype.get=c.prototype.get;c.prototype.getColumnNames=c.prototype.qb;c.prototype.getAsObject=c.prototype.zb;c.prototype.getSQL=c.prototype.Sb;c.prototype.getNormalizedSQL=c.prototype.Pb;c.prototype.run=c.prototype.run;c.prototype.reset=c.prototype.reset;c.prototype.freemem=
c.prototype.freemem;c.prototype.free=c.prototype.Ya;d.prototype.next=d.prototype.next;d.prototype.getRemainingSQL=d.prototype.Qb;e.prototype.run=e.prototype.run;e.prototype.exec=e.prototype.exec;e.prototype.each=e.prototype.Mb;e.prototype.prepare=e.prototype.tb;e.prototype.iterateStatements=e.prototype.Ub;e.prototype["export"]=e.prototype.Nb;e.prototype.close=e.prototype.close;e.prototype.handleError=e.prototype.handleError;e.prototype.getRowsModified=e.prototype.Rb;e.prototype.create_function=e.prototype.Kb;
e.prototype.create_aggregate=e.prototype.Jb;e.prototype.updateHook=e.prototype.Zb;k.Database=e};var wa="./this.program",xa=(a,b)=>{throw b;},ya=globalThis.document?.currentScript?.src; true?ya=__filename:0;var za="",Aa,Ba;
if(ca){var fs=__webpack_require__(7);za=__dirname+"/";Ba=a=>{a=Ca(a)?new URL(a):a;return fs.readFileSync(a)};Aa=async a=>{a=Ca(a)?new URL(a):a;return fs.readFileSync(a,void 0)};1<process.argv.length&&(wa=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2); true&&(module.exports=k);xa=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba){try{za=(new URL(".",ya)).href}catch{}ba&&(Ba=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});
Aa=async a=>{if(Ca(a))return new Promise((c,d)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{200==e.status||0==e.status&&e.response?c(e.response):d(e.status)};e.onerror=d;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+" : "+b.url);}}var Da=console.log.bind(console),B=console.error.bind(console),Ea,Fa=!1,Ga,Ca=a=>a.startsWith("file://"),m,C,Ha,E,F,Ia,Ja,G;
function Ka(){var a=La.buffer;m=new Int8Array(a);Ha=new Int16Array(a);C=new Uint8Array(a);new Uint16Array(a);E=new Int32Array(a);F=new Uint32Array(a);Ia=new Float32Array(a);Ja=new Float64Array(a);G=new BigInt64Array(a);new BigUint64Array(a)}function Ma(a){k.onAbort?.(a);a="Aborted("+a+")";B(a);Fa=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Na;
async function Oa(a){if(!Ea)try{var b=await Aa(a);return new Uint8Array(b)}catch{}if(a==Na&&Ea)a=new Uint8Array(Ea);else if(Ba)a=Ba(a);else throw"both async and sync fetching of the wasm failed";return a}async function Qa(a,b){try{var c=await Oa(a);return await WebAssembly.instantiate(c,b)}catch(d){B(`failed to asynchronously prepare wasm: ${d}`),Ma(d)}}
async function Ra(a){var b=Na;if(!Ea&&!Ca(b)&&!ca)try{var c=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(c,a)}catch(d){B(`wasm streaming compile failed: ${d}`),B("falling back to ArrayBuffer instantiation")}return Qa(b,a)}class Sa{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}var Ta=a=>{for(;0<a.length;)a.shift()(k)},Ua=[],Va=[],Wa=()=>{var a=k.preRun.shift();Va.push(a)},J=0,Xa=null;
function r(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return m[a];case "i8":return m[a];case "i16":return Ha[a>>1];case "i32":return E[a>>2];case "i64":return G[a>>3];case "float":return Ia[a>>2];case "double":return Ja[a>>3];case "*":return F[a>>2];default:Ma(`invalid type for getValue: ${b}`)}}var Ya=!0;
function qa(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":m[a]=0;break;case "i8":m[a]=0;break;case "i16":Ha[a>>1]=0;break;case "i32":E[a>>2]=0;break;case "i64":G[a>>3]=BigInt(0);break;case "float":Ia[a>>2]=0;break;case "double":Ja[a>>3]=0;break;case "*":F[a>>2]=0;break;default:Ma(`invalid type for setValue: ${b}`)}}
var Za=new TextDecoder,$a=(a,b,c,d)=>{c=b+c;if(d)return c;for(;a[b]&&!(b>=c);)++b;return b},z=(a,b,c)=>a?Za.decode(C.subarray(a,$a(C,a,b,c))):"",ab=(a,b)=>{for(var c=0,d=a.length-1;0<=d;d--){var e=a[d];"."===e?a.splice(d,1):".."===e?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a},ia=a=>{var b="/"===a.charAt(0),c="/"===a.slice(-1);(a=ab(a.split("/").filter(d=>!!d),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a},bb=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},cb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],db=()=>{if(ca){var a=__webpack_require__(8);return b=>a.randomFillSync(b)}return b=>crypto.getRandomValues(b)},eb=a=>{(eb=db())(a)},fb=(...a)=>{for(var b="",c=!1,d=a.length-1;-1<=d&&!c;d--){c=0<=d?a[d]:"/";if("string"!=typeof c)throw new TypeError("Arguments to path.resolve must be strings");if(!c)return"";b=c+"/"+b;c="/"===c.charAt(0)}b=ab(b.split("/").filter(e=>!!e),!c).join("/");return(c?"/":
"")+b||"."},gb=a=>{var b=$a(a,0);return Za.decode(a.buffer?a.subarray(0,b):new Uint8Array(a.slice(0,b)))},hb=[],ib=a=>{for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);127>=d?b++:2047>=d?b+=2:55296<=d&&57343>=d?(b+=4,++c):b+=3}return b},M=(a,b,c,d)=>{if(!(0<d))return 0;var e=c;d=c+d-1;for(var g=0;g<a.length;++g){var h=a.codePointAt(g);if(127>=h){if(c>=d)break;b[c++]=h}else if(2047>=h){if(c+1>=d)break;b[c++]=192|h>>6;b[c++]=128|h&63}else if(65535>=h){if(c+2>=d)break;b[c++]=224|h>>12;b[c++]=128|
h>>6&63;b[c++]=128|h&63}else{if(c+3>=d)break;b[c++]=240|h>>18;b[c++]=128|h>>12&63;b[c++]=128|h>>6&63;b[c++]=128|h&63;g++}}b[c]=0;return c-e},jb=[];function kb(a,b){jb[a]={input:[],output:[],eb:b};mb(a,nb)}
var nb={open(a){var b=jb[a.node.rdev];if(!b)throw new N(43);a.tty=b;a.seekable=!1},close(a){a.tty.eb.fsync(a.tty)},fsync(a){a.tty.eb.fsync(a.tty)},read(a,b,c,d){if(!a.tty||!a.tty.eb.Bb)throw new N(60);for(var e=0,g=0;g<d;g++){try{var h=a.tty.eb.Bb(a.tty)}catch(q){throw new N(29);}if(void 0===h&&0===e)throw new N(6);if(null===h||void 0===h)break;e++;b[c+g]=h}e&&(a.node.atime=Date.now());return e},write(a,b,c,d){if(!a.tty||!a.tty.eb.ub)throw new N(60);try{for(var e=0;e<d;e++)a.tty.eb.ub(a.tty,b[c+e])}catch(g){throw new N(29);
}d&&(a.node.mtime=a.node.ctime=Date.now());return e}},wb={Bb(){a:{if(!hb.length){var a=null;if(ca){var b=Buffer.alloc(256),c=0,d=process.stdin.fd;try{c=fs.readSync(d,b,0,256)}catch(e){if(e.toString().includes("EOF"))c=0;else throw e;}0<c&&(a=b.slice(0,c).toString("utf-8"))}else globalThis.window?.prompt&&(a=window.prompt("Input: "),null!==a&&(a+="\n"));if(!a){a=null;break a}b=Array(ib(a)+1);a=M(a,b,0,b.length);b.length=a;hb=b}a=hb.shift()}return a},ub(a,b){null===b||10===b?(Da(gb(a.output)),a.output=
[]):0!=b&&a.output.push(b)},fsync(a){0<a.output?.length&&(Da(gb(a.output)),a.output=[])},hc(){return{bc:25856,dc:5,ac:191,cc:35387,$b:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},ic(){return 0},jc(){return[24,80]}},xb={ub(a,b){null===b||10===b?(B(gb(a.output)),a.output=[]):0!=b&&a.output.push(b)},fsync(a){0<a.output?.length&&(B(gb(a.output)),a.output=[])}},O={Wa:null,Xa(){return O.createNode(null,"/",16895,0)},createNode(a,b,c,d){if(24576===(c&61440)||4096===(c&61440))throw new N(63);
O.Wa||(O.Wa={dir:{node:{Ta:O.La.Ta,Ua:O.La.Ua,lookup:O.La.lookup,ib:O.La.ib,rename:O.La.rename,unlink:O.La.unlink,rmdir:O.La.rmdir,readdir:O.La.readdir,symlink:O.La.symlink},stream:{Va:O.Ma.Va}},file:{node:{Ta:O.La.Ta,Ua:O.La.Ua},stream:{Va:O.Ma.Va,read:O.Ma.read,write:O.Ma.write,jb:O.Ma.jb,kb:O.Ma.kb}},link:{node:{Ta:O.La.Ta,Ua:O.La.Ua,readlink:O.La.readlink},stream:{}},yb:{node:{Ta:O.La.Ta,Ua:O.La.Ua},stream:yb}});c=zb(a,b,c,d);P(c.mode)?(c.La=O.Wa.dir.node,c.Ma=O.Wa.dir.stream,c.Na={}):32768===
(c.mode&61440)?(c.La=O.Wa.file.node,c.Ma=O.Wa.file.stream,c.Ra=0,c.Na=null):40960===(c.mode&61440)?(c.La=O.Wa.link.node,c.Ma=O.Wa.link.stream):8192===(c.mode&61440)&&(c.La=O.Wa.yb.node,c.Ma=O.Wa.yb.stream);c.atime=c.mtime=c.ctime=Date.now();a&&(a.Na[b]=c,a.atime=a.mtime=a.ctime=c.atime);return c},fc(a){return a.Na?a.Na.subarray?a.Na.subarray(0,a.Ra):new Uint8Array(a.Na):new Uint8Array(0)},La:{Ta(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=
a.rdev;P(a.mode)?b.size=4096:32768===(a.mode&61440)?b.size=a.Ra:40960===(a.mode&61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},Ua(a,b){for(var c of["mode","atime","mtime","ctime"])null!=b[c]&&(a[c]=b[c]);void 0!==b.size&&(b=b.size,a.Ra!=b&&(0==b?(a.Na=null,a.Ra=0):(c=a.Na,a.Na=new Uint8Array(b),c&&a.Na.set(c.subarray(0,Math.min(b,a.Ra))),a.Ra=b)))},lookup(){O.nb||(O.nb=
new N(44),O.nb.stack="<generic error, no stack>");throw O.nb;},ib(a,b,c,d){return O.createNode(a,b,c,d)},rename(a,b,c){try{var d=Q(b,c)}catch(g){}if(d){if(P(a.mode))for(var e in d.Na)throw new N(55);Ab(d)}delete a.parent.Na[a.name];b.Na[c]=a;a.name=c;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Na[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var c=Q(a,b),d;for(d in c.Na)throw new N(55);delete a.Na[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".","..",...Object.keys(a.Na)]},
symlink(a,b,c){a=O.createNode(a,b,41471,0);a.link=c;return a},readlink(a){if(40960!==(a.mode&61440))throw new N(28);return a.link}},Ma:{read(a,b,c,d,e){var g=a.node.Na;if(e>=a.node.Ra)return 0;a=Math.min(a.node.Ra-e,d);if(8<a&&g.subarray)b.set(g.subarray(e,e+a),c);else for(d=0;d<a;d++)b[c+d]=g[e+d];return a},write(a,b,c,d,e,g){b.buffer===m.buffer&&(g=!1);if(!d)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(b.subarray&&(!a.Na||a.Na.subarray)){if(g)return a.Na=b.subarray(c,c+d),a.Ra=d;if(0===a.Ra&&
0===e)return a.Na=b.slice(c,c+d),a.Ra=d;if(e+d<=a.Ra)return a.Na.set(b.subarray(c,c+d),e),d}g=e+d;var h=a.Na?a.Na.length:0;h>=g||(g=Math.max(g,h*(1048576>h?2:1.125)>>>0),0!=h&&(g=Math.max(g,256)),h=a.Na,a.Na=new Uint8Array(g),0<a.Ra&&a.Na.set(h.subarray(0,a.Ra),0));if(a.Na.subarray&&b.subarray)a.Na.set(b.subarray(c,c+d),e);else for(g=0;g<d;g++)a.Na[e+g]=b[c+g];a.Ra=Math.max(a.Ra,e+d);return d},Va(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.Ra);if(0>b)throw new N(28);
return b},jb(a,b,c,d,e){if(32768!==(a.node.mode&61440))throw new N(43);a=a.node.Na;if(e&2||!a||a.buffer!==m.buffer){e=!0;d=65536*Math.ceil(b/65536);var g=Bb(65536,d);g&&C.fill(0,g,g+d);d=g;if(!d)throw new N(48);if(a){if(0<c||c+b<a.length)a.subarray?a=a.subarray(c,c+b):a=Array.prototype.slice.call(a,c,c+b);m.set(a,d)}}else e=!1,d=a.byteOffset;return{Xb:d,Eb:e}},kb(a,b,c,d){O.Ma.write(a,b,0,d,c,!1);return 0}}},ja=(a,b)=>{var c=0;a&&(c|=365);b&&(c|=146);return c},Cb=null,Db={},Eb=[],Fb=1,R=null,Gb=!1,
Hb=!0,N=class{name="ErrnoError";constructor(a){this.Pa=a}},Ib=class{hb={};node=null;get flags(){return this.hb.flags}set flags(a){this.hb.flags=a}get position(){return this.hb.position}set position(a){this.hb.position=a}},Jb=class{La={};Ma={};bb=null;constructor(a,b,c,d){a||=this;this.parent=a;this.Xa=a.Xa;this.id=Fb++;this.name=b;this.mode=c;this.rdev=d;this.atime=this.mtime=this.ctime=Date.now()}get read(){return 365===(this.mode&365)}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return 146===
(this.mode&146)}set write(a){a?this.mode|=146:this.mode&=-147}};
function S(a,b={}){if(!a)throw new N(44);b.pb??(b.pb=!0);"/"===a.charAt(0)||(a="//"+a);var c=0;a:for(;40>c;c++){a=a.split("/").filter(q=>!!q);for(var d=Cb,e="/",g=0;g<a.length;g++){var h=g===a.length-1;if(h&&b.parent)break;if("."!==a[g])if(".."===a[g])if(e=bb(e),d===d.parent){a=e+"/"+a.slice(g+1).join("/");c--;continue a}else d=d.parent;else{e=ia(e+"/"+a[g]);try{d=Q(d,a[g])}catch(q){if(44===q?.Pa&&h&&b.Wb)return{path:e};throw q;}!d.bb||h&&!b.pb||(d=d.bb.root);if(40960===(d.mode&61440)&&(!h||b.ab)){if(!d.La.readlink)throw new N(52);
d=d.La.readlink(d);"/"===d.charAt(0)||(d=bb(e)+"/"+d);a=d+"/"+a.slice(g+1).join("/");continue a}}}return{path:e,node:d}}throw new N(32);}function ha(a){for(var b;;){if(a===a.parent)return a=a.Xa.Db,b?"/"!==a[a.length-1]?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Kb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%R.length}
function Ab(a){var b=Kb(a.parent.id,a.name);if(R[b]===a)R[b]=a.cb;else for(b=R[b];b;){if(b.cb===a){b.cb=a.cb;break}b=b.cb}}function Q(a,b){var c=P(a.mode)?(c=Lb(a,"x"))?c:a.La.lookup?0:2:54;if(c)throw new N(c);for(c=R[Kb(a.id,b)];c;c=c.cb){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.La.lookup(a,b)}function zb(a,b,c,d){a=new Jb(a,b,c,d);b=Kb(a.parent.id,a.name);a.cb=R[b];return R[b]=a}function P(a){return 16384===(a&61440)}
function Lb(a,b){return Hb?0:b.includes("r")&&!(a.mode&292)||b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73)?2:0}function Mb(a,b){if(!P(a.mode))return 54;try{return Q(a,b),20}catch(c){}return Lb(a,"wx")}function Nb(a,b,c){try{var d=Q(a,b)}catch(e){return e.Pa}if(a=Lb(a,"wx"))return a;if(c){if(!P(d.mode))return 54;if(d===d.parent||"/"===ha(d))return 10}else if(P(d.mode))return 31;return 0}function Ob(a){if(!a)throw new N(63);return a}
function T(a){a=Eb[a];if(!a)throw new N(8);return a}function Pb(a,b=-1){a=Object.assign(new Ib,a);if(-1==b)a:{for(b=0;4096>=b;b++)if(!Eb[b])break a;throw new N(33);}a.fd=b;return Eb[b]=a}function Qb(a,b=-1){a=Pb(a,b);a.Ma?.ec?.(a);return a}function Rb(a,b,c){var d=a?.Ma.Ua;a=d?a:b;d??=b.La.Ua;Ob(d);d(a,c)}var yb={open(a){a.Ma=Db[a.node.rdev].Ma;a.Ma.open?.(a)},Va(){throw new N(70);}};function mb(a,b){Db[a]={Ma:b}}
function Sb(a,b){var c="/"===b;if(c&&Cb)throw new N(10);if(!c&&b){var d=S(b,{pb:!1});b=d.path;d=d.node;if(d.bb)throw new N(10);if(!P(d.mode))throw new N(54);}b={type:a,kc:{},Db:b,Vb:[]};a=a.Xa(b);a.Xa=b;b.root=a;c?Cb=a:d&&(d.bb=b,d.Xa&&d.Xa.Vb.push(b))}function Tb(a,b,c){var d=S(a,{parent:!0}).node;a=cb(a);if(!a)throw new N(28);if("."===a||".."===a)throw new N(20);var e=Mb(d,a);if(e)throw new N(e);if(!d.La.ib)throw new N(63);return d.La.ib(d,a,b,c)}
function ka(a,b=438){return Tb(a,b&4095|32768,0)}function U(a,b=511){return Tb(a,b&1023|16384,0)}function Ub(a,b,c){"undefined"==typeof c&&(c=b,b=438);Tb(a,b|8192,c)}function Vb(a,b){if(!fb(a))throw new N(44);var c=S(b,{parent:!0}).node;if(!c)throw new N(44);b=cb(b);var d=Mb(c,b);if(d)throw new N(d);if(!c.La.symlink)throw new N(63);c.La.symlink(c,b,a)}
function Wb(a){var b=S(a,{parent:!0}).node;a=cb(a);var c=Q(b,a),d=Nb(b,a,!0);if(d)throw new N(d);if(!b.La.rmdir)throw new N(63);if(c.bb)throw new N(10);b.La.rmdir(b,a);Ab(c)}function ua(a){var b=S(a,{parent:!0}).node;if(!b)throw new N(44);a=cb(a);var c=Q(b,a),d=Nb(b,a,!1);if(d)throw new N(d);if(!b.La.unlink)throw new N(63);if(c.bb)throw new N(10);b.La.unlink(b,a);Ab(c)}function Xb(a,b){a=S(a,{ab:!b}).node;return Ob(a.La.Ta)(a)}
function Yb(a,b,c,d){Rb(a,b,{mode:c&4095|b.mode&-4096,ctime:Date.now(),Lb:d})}function la(a,b){a="string"==typeof a?S(a,{ab:!0}).node:a;Yb(null,a,b)}function Zb(a,b,c){if(P(b.mode))throw new N(31);if(32768!==(b.mode&61440))throw new N(28);var d=Lb(b,"w");if(d)throw new N(d);Rb(a,b,{size:c,timestamp:Date.now()})}
function ma(a,b,c=438){if(""===a)throw new N(44);if("string"==typeof b){var d={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if("undefined"==typeof d)throw Error(`Unknown file open mode: ${b}`);b=d}c=b&64?c&4095|32768:0;if("object"==typeof a)d=a;else{var e=a.endsWith("/");var g=S(a,{ab:!(b&131072),Wb:!0});d=g.node;a=g.path}g=!1;if(b&64)if(d){if(b&128)throw new N(20);}else{if(e)throw new N(31);d=Tb(a,c|511,0);g=!0}if(!d)throw new N(44);8192===(d.mode&61440)&&(b&=-513);if(b&65536&&!P(d.mode))throw new N(54);
if(!g&&(d?40960===(d.mode&61440)?e=32:(e=["r","w","rw"][b&3],b&512&&(e+="w"),e=P(d.mode)&&("r"!==e||b&576)?31:Lb(d,e)):e=44,e))throw new N(e);b&512&&!g&&(e=d,e="string"==typeof e?S(e,{ab:!0}).node:e,Zb(null,e,0));b=Pb({node:d,path:ha(d),flags:b&-131713,seekable:!0,position:0,Ma:d.Ma,Yb:[],error:!1});b.Ma.open&&b.Ma.open(b);g&&la(d,c&511);return b}function oa(a){if(null===a.fd)throw new N(8);a.rb&&(a.rb=null);try{a.Ma.close&&a.Ma.close(a)}catch(b){throw b;}finally{Eb[a.fd]=null}a.fd=null}
function $b(a,b,c){if(null===a.fd)throw new N(8);if(!a.seekable||!a.Ma.Va)throw new N(70);if(0!=c&&1!=c&&2!=c)throw new N(28);a.position=a.Ma.Va(a,b,c);a.Yb=[]}function ac(a,b,c,d,e){if(0>d||0>e)throw new N(28);if(null===a.fd)throw new N(8);if(1===(a.flags&2097155))throw new N(8);if(P(a.node.mode))throw new N(31);if(!a.Ma.read)throw new N(28);var g="undefined"!=typeof e;if(!g)e=a.position;else if(!a.seekable)throw new N(70);b=a.Ma.read(a,b,c,d,e);g||(a.position+=b);return b}
function na(a,b,c,d,e){if(0>d||0>e)throw new N(28);if(null===a.fd)throw new N(8);if(0===(a.flags&2097155))throw new N(8);if(P(a.node.mode))throw new N(31);if(!a.Ma.write)throw new N(28);a.seekable&&a.flags&1024&&$b(a,0,2);var g="undefined"!=typeof e;if(!g)e=a.position;else if(!a.seekable)throw new N(70);b=a.Ma.write(a,b,c,d,e,void 0);g||(a.position+=b);return b}
function ta(a){var b=b||0;var c="binary";"utf8"!==c&&"binary"!==c&&Ma(`Invalid encoding type "${c}"`);b=ma(a,b);a=Xb(a).size;var d=new Uint8Array(a);ac(b,d,0,a,0);"utf8"===c&&(d=gb(d));oa(b);return d}
function W(a,b,c){a=ia("/dev/"+a);var d=ja(!!b,!!c);W.Cb??(W.Cb=64);var e=W.Cb++<<8|0;mb(e,{open(g){g.seekable=!1},close(){c?.buffer?.length&&c(10)},read(g,h,q,w){for(var t=0,x=0;x<w;x++){try{var D=b()}catch(pb){throw new N(29);}if(void 0===D&&0===t)throw new N(6);if(null===D||void 0===D)break;t++;h[q+x]=D}t&&(g.node.atime=Date.now());return t},write(g,h,q,w){for(var t=0;t<w;t++)try{c(h[q+t])}catch(x){throw new N(29);}w&&(g.node.mtime=g.node.ctime=Date.now());return t}});Ub(a,d,e)}var X={};
function Y(a,b,c){if("/"===b.charAt(0))return b;a=-100===a?"/":T(a).path;if(0==b.length){if(!c)throw new N(44);return a}return a+"/"+b}
function kc(a,b){F[a>>2]=b.dev;F[a+4>>2]=b.mode;F[a+8>>2]=b.nlink;F[a+12>>2]=b.uid;F[a+16>>2]=b.gid;F[a+20>>2]=b.rdev;G[a+24>>3]=BigInt(b.size);E[a+32>>2]=4096;E[a+36>>2]=b.blocks;var c=b.atime.getTime(),d=b.mtime.getTime(),e=b.ctime.getTime();G[a+40>>3]=BigInt(Math.floor(c/1E3));F[a+48>>2]=c%1E3*1E6;G[a+56>>3]=BigInt(Math.floor(d/1E3));F[a+64>>2]=d%1E3*1E6;G[a+72>>3]=BigInt(Math.floor(e/1E3));F[a+80>>2]=e%1E3*1E6;G[a+88>>3]=BigInt(b.ino);return 0}
var Cc=void 0,Ec=()=>{var a=E[+Cc>>2];Cc+=4;return a},Fc=0,Gc=[0,31,60,91,121,152,182,213,244,274,305,335],Hc=[0,31,59,90,120,151,181,212,243,273,304,334],Ic={},Jc=a=>{Ga=a;Ya||0<Fc||(k.onExit?.(a),Fa=!0);xa(a,new Sa(a))},Kc=a=>{if(!Fa)try{a()}catch(b){b instanceof Sa||"unwind"==b||xa(1,b)}finally{if(!(Ya||0<Fc))try{Ga=a=Ga,Jc(a)}catch(b){b instanceof Sa||"unwind"==b||xa(1,b)}}},Lc={},Nc=()=>{if(!Mc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??
"C").replace("-","_")+".UTF-8",_:wa||"./this.program"},b;for(b in Lc)void 0===Lc[b]?delete a[b]:a[b]=Lc[b];var c=[];for(b in a)c.push(`${b}=${a[b]}`);Mc=c}return Mc},Mc,Oc=(a,b,c,d)=>{var e={string:t=>{var x=0;if(null!==t&&void 0!==t&&0!==t){x=ib(t)+1;var D=y(x);M(t,C,D,x);x=D}return x},array:t=>{var x=y(t.length);m.set(t,x);return x}};a=k["_"+a];var g=[],h=0;if(d)for(var q=0;q<d.length;q++){var w=e[c[q]];w?(0===h&&(h=pa()),g[q]=w(d[q])):g[q]=d[q]}c=a(...g);return c=function(t){0!==h&&ra(h);return"string"===
b?z(t):"boolean"===b?!!t:t}(c)},fa=a=>{var b=ib(a)+1,c=da(b);c&&M(a,C,c,b);return c},Pc,Qc=[],A=a=>{Pc.delete(Z.get(a));Z.set(a,null);Qc.push(a)},Rc=a=>{const b=a.length;return[b%128|128,b>>7,...a]},Sc={i:127,p:127,j:126,f:125,d:124,e:111},Tc=a=>Rc(Array.from(a,b=>Sc[b])),va=(a,b)=>{if(!Pc){Pc=new WeakMap;var c=Z.length;if(Pc)for(var d=0;d<0+c;d++){var e=Z.get(d);e&&Pc.set(e,d)}}if(c=Pc.get(a)||0)return c;c=Qc.length?Qc.pop():Z.grow(1);try{Z.set(c,a)}catch(g){if(!(g instanceof TypeError))throw g;
b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Rc([1,96,...Tc(b.slice(1)),...Tc("v"===b[0]?"":b[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(b);b=(new WebAssembly.Instance(b,{e:{f:a}})).exports.f;Z.set(c,b)}Pc.set(a,c);return c};R=Array(4096);Sb(O,"/");U("/tmp");U("/home");U("/home/web_user");
(function(){U("/dev");mb(259,{read:()=>0,write:(d,e,g,h)=>h,Va:()=>0});Ub("/dev/null",259);kb(1280,wb);kb(1536,xb);Ub("/dev/tty",1280);Ub("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,c=()=>{0===b&&(eb(a),b=a.byteLength);return a[--b]};W("random",c);W("urandom",c);U("/dev/shm");U("/dev/shm/tmp")})();
(function(){U("/proc");var a=U("/proc/self");U("/proc/self/fd");Sb({Xa(){var b=zb(a,"fd",16895,73);b.Ma={Va:O.Ma.Va};b.La={lookup(c,d){c=+d;var e=T(c);c={parent:null,Xa:{Db:"fake"},La:{readlink:()=>e.path},id:c+1};return c.parent=c},readdir(){return Array.from(Eb.entries()).filter(([,c])=>c).map(([c])=>c.toString())}};return b}},"/proc/self/fd")})();k.noExitRuntime&&(Ya=k.noExitRuntime);k.print&&(Da=k.print);k.printErr&&(B=k.printErr);k.wasmBinary&&(Ea=k.wasmBinary);k.thisProgram&&(wa=k.thisProgram);
if(k.preInit)for("function"==typeof k.preInit&&(k.preInit=[k.preInit]);0<k.preInit.length;)k.preInit.shift()();k.stackSave=()=>pa();k.stackRestore=a=>ra(a);k.stackAlloc=a=>y(a);k.cwrap=(a,b,c,d)=>{var e=!c||c.every(g=>"number"===g||"boolean"===g);return"string"!==b&&e&&!d?k["_"+a]:(...g)=>Oc(a,b,c,g)};k.addFunction=va;k.removeFunction=A;k.UTF8ToString=z;k.stringToNewUTF8=fa;k.writeArrayToMemory=(a,b)=>{m.set(a,b)};
var da,ea,Bb,Uc,ra,y,pa,La,Z,Vc={a:(a,b,c,d)=>Ma(`Assertion failed: ${z(a)}, at: `+[b?z(b):"unknown filename",c,d?z(d):"unknown function"]),i:function(a,b){try{return a=z(a),la(a,b),0}catch(c){if("undefined"==typeof X||"ErrnoError"!==c.name)throw c;return-c.Pa}},L:function(a,b,c){try{b=z(b);b=Y(a,b);if(c&-8)return-28;var d=S(b,{ab:!0}).node;if(!d)return-44;a="";c&4&&(a+="r");c&2&&(a+="w");c&1&&(a+="x");return a&&Lb(d,a)?-2:0}catch(e){if("undefined"==typeof X||"ErrnoError"!==e.name)throw e;return-e.Pa}},
j:function(a,b){try{var c=T(a);Yb(c,c.node,b,!1);return 0}catch(d){if("undefined"==typeof X||"ErrnoError"!==d.name)throw d;return-d.Pa}},h:function(a){try{var b=T(a);Rb(b,b.node,{timestamp:Date.now(),Lb:!1});return 0}catch(c){if("undefined"==typeof X||"ErrnoError"!==c.name)throw c;return-c.Pa}},b:function(a,b,c){Cc=c;try{var d=T(a);switch(b){case 0:var e=Ec();if(0>e)break;for(;Eb[e];)e++;return Qb(d,e).fd;case 1:case 2:return 0;case 3:return d.flags;case 4:return e=Ec(),d.flags|=e,0;case 12:return e=
Ec(),Ha[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(g){if("undefined"==typeof X||"ErrnoError"!==g.name)throw g;return-g.Pa}},g:function(a,b){try{var c=T(a),d=c.node,e=c.Ma.Ta;a=e?c:d;e??=d.La.Ta;Ob(e);var g=e(a);return kc(b,g)}catch(h){if("undefined"==typeof X||"ErrnoError"!==h.name)throw h;return-h.Pa}},H:function(a,b){b=-9007199254740992>b||9007199254740992<b?NaN:Number(b);try{if(isNaN(b))return-61;var c=T(a);if(0>b||0===(c.flags&2097155))throw new N(28);Zb(c,c.node,b);return 0}catch(d){if("undefined"==
typeof X||"ErrnoError"!==d.name)throw d;return-d.Pa}},G:function(a,b){try{if(0===b)return-28;var c=ib("/")+1;if(b<c)return-68;M("/",C,a,b);return c}catch(d){if("undefined"==typeof X||"ErrnoError"!==d.name)throw d;return-d.Pa}},K:function(a,b){try{return a=z(a),kc(b,Xb(a,!0))}catch(c){if("undefined"==typeof X||"ErrnoError"!==c.name)throw c;return-c.Pa}},C:function(a,b,c){try{return b=z(b),b=Y(a,b),U(b,c),0}catch(d){if("undefined"==typeof X||"ErrnoError"!==d.name)throw d;return-d.Pa}},J:function(a,
b,c,d){try{b=z(b);var e=d&256;b=Y(a,b,d&4096);return kc(c,e?Xb(b,!0):Xb(b))}catch(g){if("undefined"==typeof X||"ErrnoError"!==g.name)throw g;return-g.Pa}},x:function(a,b,c,d){Cc=d;try{b=z(b);b=Y(a,b);var e=d?Ec():0;return ma(b,c,e).fd}catch(g){if("undefined"==typeof X||"ErrnoError"!==g.name)throw g;return-g.Pa}},v:function(a,b,c,d){try{b=z(b);b=Y(a,b);if(0>=d)return-28;var e=S(b).node;if(!e)throw new N(44);if(!e.La.readlink)throw new N(28);var g=e.La.readlink(e);var h=Math.min(d,ib(g)),q=m[c+h];M(g,
C,c,d+1);m[c+h]=q;return h}catch(w){if("undefined"==typeof X||"ErrnoError"!==w.name)throw w;return-w.Pa}},u:function(a){try{return a=z(a),Wb(a),0}catch(b){if("undefined"==typeof X||"ErrnoError"!==b.name)throw b;return-b.Pa}},f:function(a,b){try{return a=z(a),kc(b,Xb(a))}catch(c){if("undefined"==typeof X||"ErrnoError"!==c.name)throw c;return-c.Pa}},r:function(a,b,c){try{b=z(b);b=Y(a,b);if(c)if(512===c)Wb(b);else return-28;else ua(b);return 0}catch(d){if("undefined"==typeof X||"ErrnoError"!==d.name)throw d;
return-d.Pa}},q:function(a,b,c){try{b=z(b);b=Y(a,b,!0);var d=Date.now(),e,g;if(c){var h=F[c>>2]+4294967296*E[c+4>>2],q=E[c+8>>2];1073741823==q?e=d:1073741822==q?e=null:e=1E3*h+q/1E6;c+=16;h=F[c>>2]+4294967296*E[c+4>>2];q=E[c+8>>2];1073741823==q?g=d:1073741822==q?g=null:g=1E3*h+q/1E6}else g=e=d;if(null!==(g??e)){a=e;var w=S(b,{ab:!0}).node;Ob(w.La.Ua)(w,{atime:a,mtime:g})}return 0}catch(t){if("undefined"==typeof X||"ErrnoError"!==t.name)throw t;return-t.Pa}},m:()=>Ma(""),l:()=>{Ya=!1;Fc=0},A:function(a,
b){a=-9007199254740992>a||9007199254740992<a?NaN:Number(a);a=new Date(1E3*a);E[b>>2]=a.getSeconds();E[b+4>>2]=a.getMinutes();E[b+8>>2]=a.getHours();E[b+12>>2]=a.getDate();E[b+16>>2]=a.getMonth();E[b+20>>2]=a.getFullYear()-1900;E[b+24>>2]=a.getDay();var c=a.getFullYear();E[b+28>>2]=(0!==c%4||0===c%100&&0!==c%400?Hc:Gc)[a.getMonth()]+a.getDate()-1|0;E[b+36>>2]=-(60*a.getTimezoneOffset());c=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();var d=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();
E[b+32>>2]=(c!=d&&a.getTimezoneOffset()==Math.min(d,c))|0},y:function(a,b,c,d,e,g,h){e=-9007199254740992>e||9007199254740992<e?NaN:Number(e);try{var q=T(d);if(0!==(b&2)&&0===(c&2)&&2!==(q.flags&2097155))throw new N(2);if(1===(q.flags&2097155))throw new N(2);if(!q.Ma.jb)throw new N(43);if(!a)throw new N(28);var w=q.Ma.jb(q,a,e,b,c);var t=w.Xb;E[g>>2]=w.Eb;F[h>>2]=t;return 0}catch(x){if("undefined"==typeof X||"ErrnoError"!==x.name)throw x;return-x.Pa}},z:function(a,b,c,d,e,g){g=-9007199254740992>g||
9007199254740992<g?NaN:Number(g);try{var h=T(e);if(c&2){c=g;if(32768!==(h.node.mode&61440))throw new N(43);if(!(d&2)){var q=C.slice(a,a+b);h.Ma.kb&&h.Ma.kb(h,q,c,b,d)}}}catch(w){if("undefined"==typeof X||"ErrnoError"!==w.name)throw w;return-w.Pa}},n:(a,b)=>{Ic[a]&&(clearTimeout(Ic[a].id),delete Ic[a]);if(!b)return 0;var c=setTimeout(()=>{delete Ic[a];Kc(()=>Uc(a,performance.now()))},b);Ic[a]={id:c,lc:b};return 0},B:(a,b,c,d)=>{var e=(new Date).getFullYear(),g=(new Date(e,0,1)).getTimezoneOffset();
e=(new Date(e,6,1)).getTimezoneOffset();F[a>>2]=60*Math.max(g,e);E[b>>2]=Number(g!=e);b=h=>{var q=Math.abs(h);return`UTC${0<=h?"-":"+"}${String(Math.floor(q/60)).padStart(2,"0")}${String(q%60).padStart(2,"0")}`};a=b(g);b=b(e);e<g?(M(a,C,c,17),M(b,C,d,17)):(M(a,C,d,17),M(b,C,c,17))},d:()=>Date.now(),s:()=>2147483648,c:()=>performance.now(),o:a=>{var b=C.length;a>>>=0;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);a:{d=(Math.min(2147483648,65536*Math.ceil(Math.max(a,
d)/65536))-La.buffer.byteLength+65535)/65536|0;try{La.grow(d);Ka();var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},E:(a,b)=>{var c=0,d=0,e;for(e of Nc()){var g=b+c;F[a+d>>2]=g;c+=M(e,C,g,Infinity)+1;d+=4}return 0},F:(a,b)=>{var c=Nc();F[a>>2]=c.length;a=0;for(var d of c)a+=ib(d)+1;F[b>>2]=a;return 0},e:function(a){try{var b=T(a);oa(b);return 0}catch(c){if("undefined"==typeof X||"ErrnoError"!==c.name)throw c;return c.Pa}},p:function(a,b){try{var c=T(a);m[b]=c.tty?2:P(c.mode)?3:40960===(c.mode&
61440)?7:4;Ha[b+2>>1]=0;G[b+8>>3]=BigInt(0);G[b+16>>3]=BigInt(0);return 0}catch(d){if("undefined"==typeof X||"ErrnoError"!==d.name)throw d;return d.Pa}},w:function(a,b,c,d){try{a:{var e=T(a);a=b;for(var g,h=b=0;h<c;h++){var q=F[a>>2],w=F[a+4>>2];a+=8;var t=ac(e,m,q,w,g);if(0>t){var x=-1;break a}b+=t;if(t<w)break;"undefined"!=typeof g&&(g+=t)}x=b}F[d>>2]=x;return 0}catch(D){if("undefined"==typeof X||"ErrnoError"!==D.name)throw D;return D.Pa}},D:function(a,b,c,d){b=-9007199254740992>b||9007199254740992<
b?NaN:Number(b);try{if(isNaN(b))return 61;var e=T(a);$b(e,b,c);G[d>>3]=BigInt(e.position);e.rb&&0===b&&0===c&&(e.rb=null);return 0}catch(g){if("undefined"==typeof X||"ErrnoError"!==g.name)throw g;return g.Pa}},I:function(a){try{var b=T(a);return b.Ma?.fsync?.(b)}catch(c){if("undefined"==typeof X||"ErrnoError"!==c.name)throw c;return c.Pa}},t:function(a,b,c,d){try{a:{var e=T(a);a=b;for(var g,h=b=0;h<c;h++){var q=F[a>>2],w=F[a+4>>2];a+=8;var t=na(e,m,q,w,g);if(0>t){var x=-1;break a}b+=t;if(t<w)break;
"undefined"!=typeof g&&(g+=t)}x=b}F[d>>2]=x;return 0}catch(D){if("undefined"==typeof X||"ErrnoError"!==D.name)throw D;return D.Pa}},k:Jc};
function Wc(){function a(){k.calledRun=!0;if(!Fa){if(!k.noFSInit&&!Gb){var b,c;Gb=!0;b??=k.stdin;c??=k.stdout;d??=k.stderr;b?W("stdin",b):Vb("/dev/tty","/dev/stdin");c?W("stdout",null,c):Vb("/dev/tty","/dev/stdout");d?W("stderr",null,d):Vb("/dev/tty1","/dev/stderr");ma("/dev/stdin",0);ma("/dev/stdout",1);ma("/dev/stderr",1)}Xc.N();Hb=!1;k.onRuntimeInitialized?.();if(k.postRun)for("function"==typeof k.postRun&&(k.postRun=[k.postRun]);k.postRun.length;){var d=k.postRun.shift();Ua.push(d)}Ta(Ua)}}if(0<
J)Xa=Wc;else{if(k.preRun)for("function"==typeof k.preRun&&(k.preRun=[k.preRun]);k.preRun.length;)Wa();Ta(Va);0<J?Xa=Wc:k.setStatus?(k.setStatus("Running..."),setTimeout(()=>{setTimeout(()=>k.setStatus(""),1);a()},1)):a()}}var Xc;
(async function(){function a(c){c=Xc=c.exports;k._sqlite3_free=c.P;k._sqlite3_value_text=c.Q;k._sqlite3_prepare_v2=c.R;k._sqlite3_step=c.S;k._sqlite3_reset=c.T;k._sqlite3_exec=c.U;k._sqlite3_finalize=c.V;k._sqlite3_column_name=c.W;k._sqlite3_column_text=c.X;k._sqlite3_column_type=c.Y;k._sqlite3_errmsg=c.Z;k._sqlite3_clear_bindings=c._;k._sqlite3_value_blob=c.$;k._sqlite3_value_bytes=c.aa;k._sqlite3_value_double=c.ba;k._sqlite3_value_int=c.ca;k._sqlite3_value_type=c.da;k._sqlite3_result_blob=c.ea;
k._sqlite3_result_double=c.fa;k._sqlite3_result_error=c.ga;k._sqlite3_result_int=c.ha;k._sqlite3_result_int64=c.ia;k._sqlite3_result_null=c.ja;k._sqlite3_result_text=c.ka;k._sqlite3_aggregate_context=c.la;k._sqlite3_column_count=c.ma;k._sqlite3_data_count=c.na;k._sqlite3_column_blob=c.oa;k._sqlite3_column_bytes=c.pa;k._sqlite3_column_double=c.qa;k._sqlite3_bind_blob=c.ra;k._sqlite3_bind_double=c.sa;k._sqlite3_bind_int=c.ta;k._sqlite3_bind_text=c.ua;k._sqlite3_bind_parameter_index=c.va;k._sqlite3_sql=
c.wa;k._sqlite3_normalized_sql=c.xa;k._sqlite3_changes=c.ya;k._sqlite3_close_v2=c.za;k._sqlite3_create_function_v2=c.Aa;k._sqlite3_update_hook=c.Ba;k._sqlite3_open=c.Ca;da=k._malloc=c.Da;ea=k._free=c.Ea;k._RegisterExtensionFunctions=c.Fa;Bb=c.Ga;Uc=c.Ha;ra=c.Ia;y=c.Ja;pa=c.Ka;La=c.M;Z=c.O;Ka();J--;k.monitorRunDependencies?.(J);0==J&&Xa&&(c=Xa,Xa=null,c());return Xc}J++;k.monitorRunDependencies?.(J);var b={a:Vc};if(k.instantiateWasm)return new Promise(c=>{k.instantiateWasm(b,(d,e)=>{c(a(d,e))})});
Na??=k.locateFile?k.locateFile("sql-wasm.wasm",za):za+"sql-wasm.wasm";return a((await Ra(b)).instance)})();Wc();


        // The shell-pre.js and emcc-generated code goes above
        return Module;
    }); // The end of the promise being returned

  return initSqlJsPromise;
} // The end of our initSqlJs function

// This bit below is copied almost exactly from what you get when you use the MODULARIZE=1 flag with emcc
// However, we don't want to use the emcc modularization. See shell-pre.js
if (true){
    module.exports = initSqlJs;
    // This will allow the module to be used in ES6 or CommonJS
    module.exports["default"] = initSqlJs;
}
else // removed by dead control flow
{}


/***/ }),
/* 7 */
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),
/* 8 */
/***/ ((module) => {

"use strict";
module.exports = require("node:crypto");

/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
    constructor(label, collapsibleState, itemType, filePath, table, description) {
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
                const emptyItem = new DatabaseTreeItem('No databases open. Click + to open.', vscode.TreeItemCollapsibleState.None, 'empty');
                emptyItem.command = { command: 'dbExplorer.openDatabase', title: 'Open Database' };
                return Promise.resolve([emptyItem]);
            }
            return Promise.resolve(databases.map(dbPath => {
                const item = new DatabaseTreeItem(path.basename(dbPath), vscode.TreeItemCollapsibleState.Expanded, 'database', dbPath, undefined, dbPath);
                item.tooltip = dbPath;
                return item;
            }));
        }
        if (element.itemType === 'database' && element.filePath) {
            return Promise.resolve([
                new DatabaseTreeItem('Tables', vscode.TreeItemCollapsibleState.Expanded, 'folder', element.filePath, undefined, ''),
                new DatabaseTreeItem('Views', vscode.TreeItemCollapsibleState.Collapsed, 'folder-views', element.filePath, undefined, ''),
                new DatabaseTreeItem('Indexes', vscode.TreeItemCollapsibleState.Collapsed, 'folder-indexes', element.filePath, undefined, ''),
                new DatabaseTreeItem('Triggers', vscode.TreeItemCollapsibleState.Collapsed, 'folder-triggers', element.filePath, undefined, ''),
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
                    const item = new DatabaseTreeItem(t.name, vscode.TreeItemCollapsibleState.Collapsed, 'table', element.filePath, t.name, `${t.rowCount} rows`);
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
                return Promise.resolve(views.map(v => new DatabaseTreeItem(v, vscode.TreeItemCollapsibleState.None, 'view', element.filePath)));
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
                return Promise.resolve(indexes.map(i => new DatabaseTreeItem(i.name, vscode.TreeItemCollapsibleState.None, 'index', element.filePath, undefined, `on ${i.table}${i.unique ? ' (unique)' : ''}`)));
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
                return Promise.resolve(triggers.map(t => new DatabaseTreeItem(t.name, vscode.TreeItemCollapsibleState.None, 'trigger', element.filePath, undefined, `on ${t.table}`)));
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
                    return new DatabaseTreeItem(label, vscode.TreeItemCollapsibleState.None, 'column', element.filePath);
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
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
const WebviewBuilder_1 = __webpack_require__(11);
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
                webviewPanel.webview.postMessage({ type: 'error', error: e.message });
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
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
class WebviewBuilder {
    static build(webview, extensionPath, filePath) {
        const cssPath = path.join(extensionPath, 'media', 'main.css');
        const jsPath = path.join(extensionPath, 'media', 'main.js');
        const css = fs.readFileSync(cssPath, 'utf8');
        const js = fs.readFileSync(jsPath, 'utf8');
        const nonce = WebviewBuilder.getNonce();
        const fileName = path.basename(filePath);
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
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
      <textarea id="sql-editor" class="sql-editor" placeholder="SELECT * FROM table_name LIMIT 100;"></textarea>
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
<div id="error-toast" class="error-toast" style="display:none;"></div>
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
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
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