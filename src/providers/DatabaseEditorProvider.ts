import * as vscode from 'vscode';
import * as path from 'path';
import { DatabaseManager } from '../database/DatabaseManager';
import { WebviewBuilder } from '../webview/WebviewBuilder';

interface DbDocument extends vscode.CustomDocument {
  readonly uri: vscode.Uri;
}

export class DatabaseEditorProvider implements vscode.CustomEditorProvider<DbDocument> {
  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<DbDocument>>();
  readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

  constructor(
    private readonly manager: DatabaseManager,
    private readonly extensionPath: string,
    private readonly statusBar?: vscode.StatusBarItem,
    private readonly outputChannel?: vscode.OutputChannel
  ) {}

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken
  ): Promise<DbDocument> {
    try {
      await this.manager.openDatabase(uri.fsPath);
    } catch (e: any) {
      throw new Error(`Failed to open database: ${e.message}`);
    }
    return { uri, dispose: () => {} };
  }

  async resolveCustomEditor(
    document: DbDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = WebviewBuilder.build(webviewPanel.webview, this.extensionPath, document.uri.fsPath);

    // Update status bar as this panel gains/loses focus
    const dbName = path.basename(document.uri.fsPath);
    const updateStatusBar = (active: boolean) => {
      if (!this.statusBar) { return; }
      if (active) {
        this.statusBar.text = `$(database) DB: ${dbName}`;
        this.statusBar.show();
      } else {
        this.statusBar.hide();
      }
    };
    updateStatusBar(true);
    webviewPanel.onDidChangeViewState(e => updateStatusBar(e.webviewPanel.active));
    webviewPanel.onDidDispose(() => { if (this.statusBar) { this.statusBar.hide(); } });

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
            const data = adapter.getTableData(
              msg.table, msg.offset || 0, msg.limit || 50,
              msg.sortCol, msg.sortDir || 'ASC', msg.filter
            );
            webviewPanel.webview.postMessage({ type: 'dataResult', data });
            break;
          }
          case 'query': {
            try {
              const result = adapter.executeQuery(msg.sql);
              webviewPanel.webview.postMessage({ type: 'queryResult', result });
            } catch (e: any) {
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
            const schemas: Record<string, string[]> = {};
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
      } catch (e: any) {
        const errMsg = e?.message || String(e) || `Unknown error in handler: ${msg.type}`;
        const logLine = `[${new Date().toISOString()}] Error in handler "${msg.type}": ${errMsg}\n${e?.stack || ''}`;
        console.error('[DB-Explorer] handler error:', msg.type, errMsg, e?.stack || '');
        if (this.outputChannel) {
          this.outputChannel.appendLine(logLine);
          this.outputChannel.show(true); // show without stealing focus
        }
        webviewPanel.webview.postMessage({ type: 'error', error: errMsg });
      }
    });
  }

  saveCustomDocument(_document: DbDocument, _cancellation: vscode.CancellationToken): Thenable<void> {
    return Promise.resolve();
  }

  saveCustomDocumentAs(_document: DbDocument, _destination: vscode.Uri, _cancellation: vscode.CancellationToken): Thenable<void> {
    return Promise.resolve();
  }

  revertCustomDocument(_document: DbDocument, _cancellation: vscode.CancellationToken): Thenable<void> {
    return Promise.resolve();
  }

  backupCustomDocument(_document: DbDocument, context: vscode.CustomDocumentBackupContext, _cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
    return Promise.resolve({ id: context.destination.toString(), delete: () => {} });
  }
}
