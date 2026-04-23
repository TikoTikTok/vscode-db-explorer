import * as vscode from 'vscode';
import * as path from 'path';
import { DatabaseManager } from '../database/DatabaseManager';

export class DatabaseTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: string,
    public readonly filePath?: string,
    public readonly table?: string,
    description?: string,
    stableId?: string
  ) {
    super(label, collapsibleState);
    this.contextValue = itemType;
    if (description) { this.description = description; }
    if (stableId) { this.id = stableId; }
    this.setupIcon();
  }

  private setupIcon(): void {
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

export class DatabaseTreeProvider implements vscode.TreeDataProvider<DatabaseTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DatabaseTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly manager: DatabaseManager) {
    manager.onDidChange(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DatabaseTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DatabaseTreeItem): Thenable<DatabaseTreeItem[]> {
    if (!element) {
      const databases = this.manager.getOpenDatabases();
      if (databases.length === 0) {
        const emptyItem = new DatabaseTreeItem('No databases open. Click + to open.', vscode.TreeItemCollapsibleState.None, 'empty', undefined, undefined, undefined, 'empty-placeholder');
        emptyItem.command = { command: 'dbExplorer.openDatabase', title: 'Open Database' };
        return Promise.resolve([emptyItem]);
      }
      return Promise.resolve(databases.map(dbPath => {
        const item = new DatabaseTreeItem(
          path.basename(dbPath),
          vscode.TreeItemCollapsibleState.Expanded,
          'database',
          dbPath,
          undefined,
          dbPath,
          `db:${dbPath}`
        );
        item.tooltip = dbPath;
        return item;
      }));
    }

    if (element.itemType === 'database' && element.filePath) {
      const fp = element.filePath;
      return Promise.resolve([
        new DatabaseTreeItem('Tables',   vscode.TreeItemCollapsibleState.Expanded,  'folder',          fp, undefined, '', `${fp}:tables`),
        new DatabaseTreeItem('Views',    vscode.TreeItemCollapsibleState.Collapsed, 'folder-views',    fp, undefined, '', `${fp}:views`),
        new DatabaseTreeItem('Indexes',  vscode.TreeItemCollapsibleState.Collapsed, 'folder-indexes',  fp, undefined, '', `${fp}:indexes`),
        new DatabaseTreeItem('Triggers', vscode.TreeItemCollapsibleState.Collapsed, 'folder-triggers', fp, undefined, '', `${fp}:triggers`),
      ]);
    }

    if (element.itemType === 'folder' && element.filePath) {
      try {
        const adapter = this.manager.getAdapter(element.filePath);
        if (!adapter) { return Promise.resolve([]); }
        const tables = adapter.getTables();
        return Promise.resolve(tables.map(t => {
          const item = new DatabaseTreeItem(
            t.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'table',
            element.filePath,
            t.name,
            `${t.rowCount} rows`,
            `${element.filePath}:table:${t.name}`
          );
          item.tooltip = `${t.name} (${t.rowCount} rows)`;
          return item;
        }));
      } catch (e) {
        return Promise.resolve([]);
      }
    }

    if (element.itemType === 'folder-views' && element.filePath) {
      try {
        const adapter = this.manager.getAdapter(element.filePath);
        if (!adapter) { return Promise.resolve([]); }
        const views = adapter.getViews();
        return Promise.resolve(views.map(v => new DatabaseTreeItem(v, vscode.TreeItemCollapsibleState.None, 'view', element.filePath, undefined, undefined, `${element.filePath}:view:${v}`)));
      } catch (e) {
        return Promise.resolve([]);
      }
    }

    if (element.itemType === 'folder-indexes' && element.filePath) {
      try {
        const adapter = this.manager.getAdapter(element.filePath);
        if (!adapter) { return Promise.resolve([]); }
        const indexes = adapter.getIndexes();
        return Promise.resolve(indexes.map(i => new DatabaseTreeItem(
          i.name,
          vscode.TreeItemCollapsibleState.None,
          'index',
          element.filePath,
          undefined,
          `on ${i.table}${i.unique ? ' (unique)' : ''}`,
          `${element.filePath}:index:${i.name}`
        )));
      } catch (e) {
        return Promise.resolve([]);
      }
    }

    if (element.itemType === 'folder-triggers' && element.filePath) {
      try {
        const adapter = this.manager.getAdapter(element.filePath);
        if (!adapter) { return Promise.resolve([]); }
        const triggers = adapter.getTriggers();
        return Promise.resolve(triggers.map(t => new DatabaseTreeItem(
          t.name,
          vscode.TreeItemCollapsibleState.None,
          'trigger',
          element.filePath,
          undefined,
          `on ${t.table}`,
          `${element.filePath}:trigger:${t.name}`
        )));
      } catch (e) {
        return Promise.resolve([]);
      }
    }

    if (element.itemType === 'table' && element.filePath && element.table) {
      try {
        const adapter = this.manager.getAdapter(element.filePath);
        if (!adapter) { return Promise.resolve([]); }
        const schema = adapter.getTableSchema(element.table);
        return Promise.resolve(schema.columns.map(col => {
          const badges = [];
          if (col.pk) { badges.push('PK'); }
          if (col.notnull) { badges.push('NOT NULL'); }
          const label = `${col.name} (${col.type || 'ANY'}${badges.length ? ' · ' + badges.join(' · ') : ''})`;
          return new DatabaseTreeItem(label, vscode.TreeItemCollapsibleState.None, 'column', element.filePath, undefined, undefined, `${element.filePath}:col:${element.table}:${col.name}`);
        }));
      } catch (e) {
        return Promise.resolve([]);
      }
    }

    return Promise.resolve([]);
  }
}
