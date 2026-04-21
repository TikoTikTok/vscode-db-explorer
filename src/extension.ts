import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager } from './database/DatabaseManager';
import { DatabaseTreeProvider } from './providers/DatabaseTreeProvider';
import { DatabaseEditorProvider } from './providers/DatabaseEditorProvider';

function isDbFile(uri: vscode.Uri): boolean {
  const ext = path.extname(uri.fsPath).toLowerCase();
  return ['.db', '.sqlite', '.sqlite3', '.vscdb', '.s3db', '.sl3'].includes(ext);
}

export function activate(context: vscode.ExtensionContext) {
  const manager = DatabaseManager.getInstance();
  const treeProvider = new DatabaseTreeProvider(manager);

  const treeView = vscode.window.createTreeView('dbExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(treeView);

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'dbExplorer.editor',
      new DatabaseEditorProvider(manager, context.extensionPath, statusBar),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Status bar is updated by DatabaseEditorProvider via onDidChangeViewState

  context.subscriptions.push(
    vscode.commands.registerCommand('dbExplorer.show', () => {
      vscode.commands.executeCommand('workbench.view.extension.dbExplorer');
    }),

    vscode.commands.registerCommand('dbExplorer.openDatabase', async (uri?: vscode.Uri) => {
      if (!uri) {
        const files = await vscode.window.showOpenDialog({
          filters: { 'SQLite Database': ['db', 'sqlite', 'sqlite3', 'vscdb', 's3db', 'sl3'] },
          canSelectMany: false
        });
        if (!files || files.length === 0) { return; }
        uri = files[0];
      }
      try {
        await manager.openDatabase(uri.fsPath);
        treeProvider.refresh();
        await vscode.commands.executeCommand('vscode.openWith', uri, 'dbExplorer.editor');
      } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to open database: ${e.message}`);
      }
    }),

    vscode.commands.registerCommand('dbExplorer.refresh', () => {
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand('dbExplorer.disconnect', (item: any) => {
      if (item?.filePath) {
        manager.closeDatabase(item.filePath);
        treeProvider.refresh();
      }
    }),

    vscode.commands.registerCommand('dbExplorer.openQuery', async (uri?: vscode.Uri) => {
      if (uri) {
        try {
          await manager.openDatabase(uri.fsPath);
          treeProvider.refresh();
          await vscode.commands.executeCommand('vscode.openWith', uri, 'dbExplorer.editor');
        } catch (e: any) {
          vscode.window.showErrorMessage(`Failed to open database: ${e.message}`);
        }
      }
    }),

    vscode.commands.registerCommand('dbExplorer.exportCSV', async (item: any) => {
      if (!item?.table || !item?.filePath) {
        vscode.window.showWarningMessage('Please right-click a table in the DB Explorer sidebar to export.');
        return;
      }
      const adapter = manager.getAdapter(item.filePath);
      if (!adapter) { return; }
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
      } catch (e: any) {
        vscode.window.showErrorMessage(`Export failed: ${e.message}`);
      }
    }),

    vscode.commands.registerCommand('dbExplorer.exportJSON', async (item: any) => {
      if (!item?.table || !item?.filePath) {
        vscode.window.showWarningMessage('Please right-click a table in the DB Explorer sidebar to export.');
        return;
      }
      const adapter = manager.getAdapter(item.filePath);
      if (!adapter) { return; }
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
      } catch (e: any) {
        vscode.window.showErrorMessage(`Export failed: ${e.message}`);
      }
    })
  );
}

export function deactivate() {
  DatabaseManager.getInstance().closeAll();
}
