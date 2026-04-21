import * as vscode from 'vscode';
import { SqliteAdapter } from './SqliteAdapter';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private adapters: Map<string, SqliteAdapter> = new Map();
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) { DatabaseManager.instance = new DatabaseManager(); }
    return DatabaseManager.instance;
  }

  async openDatabase(filePath: string): Promise<SqliteAdapter> {
    if (this.adapters.has(filePath)) { return this.adapters.get(filePath)!; }
    const adapter = new SqliteAdapter();
    await adapter.open(filePath);
    this.adapters.set(filePath, adapter);
    this._onDidChange.fire();
    return adapter;
  }

  closeDatabase(filePath: string): void {
    const adapter = this.adapters.get(filePath);
    if (adapter) {
      adapter.close();
      this.adapters.delete(filePath);
      this._onDidChange.fire();
    }
  }

  getAdapter(filePath: string): SqliteAdapter | undefined {
    return this.adapters.get(filePath);
  }

  getOpenDatabases(): string[] {
    return Array.from(this.adapters.keys());
  }

  closeAll(): void {
    for (const [, adapter] of this.adapters) { adapter.close(); }
    this.adapters.clear();
    this._onDidChange.fire();
  }
}
