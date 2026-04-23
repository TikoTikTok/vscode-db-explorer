import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class WebviewBuilder {
  static build(webview: vscode.Webview, extensionPath: string, filePath: string): string {
    const cssPath = path.join(extensionPath, 'media', 'main.css');
    const jsPath = path.join(extensionPath, 'media', 'main.js');
    const css = fs.readFileSync(cssPath, 'utf8');
    const js = fs.readFileSync(jsPath, 'utf8');
    const nonce = WebviewBuilder.getNonce();
    const fileName = path.basename(filePath);

    // Editor bundle loaded as a webview resource (not inlined) to keep HTML small
    const editorBundleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(extensionPath, 'dist', 'editor-bundle.js'))
    );

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
<div id="error-toast" class="error-toast" style="display:none;" role="alert">
  <span id="error-toast-msg"></span>
  <button id="error-toast-close" class="error-toast-close" aria-label="Dismiss">✕</button>
</div>
<script nonce="${nonce}">window.__DB_NONCE__ = '${nonce}';</script>
<script src="${editorBundleUri}"></script>
<script nonce="${nonce}">${js}</script>
</body>
</html>`;
  }

  static getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
    return text;
  }
}
