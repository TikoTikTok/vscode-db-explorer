(function() {
  const vscode = acquireVsCodeApi();

  const state = {
    currentTable: null,
    currentTab: 'data',
    pageOffset: 0,
    pageSize: 50,
    sortCol: null,
    sortDir: 'ASC',
    filterText: '',
    queryHistory: [],
    totalRows: 0,
    tables: [],
    columns: [],
    selectedRows: new Set(),
    pkColumn: null
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupTabSwitching();
    setupDataTab();
    setupQueryTab();
    setupSchemaTab();
    vscode.postMessage({ type: 'getTables' });
  }

  function setupTabSwitching() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchTab(btn.dataset.tab);
      });
    });
  }

  function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(function(c) {
      c.classList.remove('active');
    });
    var panel = document.getElementById('tab-' + tab);
    if (panel) { panel.classList.add('active'); }
    if (tab === 'info') { loadInfo(); }
    if (tab === 'schema' && state.currentTable) {
      var sel = document.getElementById('schema-table-select');
      if (sel) { sel.value = state.currentTable; }
    }
  }

  function setupDataTab() {
    var filterInput = document.getElementById('filter-input');
    var filterTimer = null;
    if (filterInput) {
      filterInput.addEventListener('input', function(e) {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(function() {
          state.filterText = e.target.value;
          state.pageOffset = 0;
          if (state.currentTable) { loadData(); }
        }, 300);
      });
    }

    var pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', function(e) {
        state.pageSize = parseInt(e.target.value);
        state.pageOffset = 0;
        if (state.currentTable) { loadData(); }
      });
    }

    var btnPrev = document.getElementById('btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', function() {
        if (state.pageOffset > 0) {
          state.pageOffset = Math.max(0, state.pageOffset - state.pageSize);
          loadData();
        }
      });
    }

    var btnNext = document.getElementById('btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', function() {
        if (state.pageOffset + state.pageSize < state.totalRows) {
          state.pageOffset += state.pageSize;
          loadData();
        }
      });
    }

    var btnInsert = document.getElementById('btn-insert');
    if (btnInsert) {
      btnInsert.addEventListener('click', function() {
        if (!state.currentTable || !state.columns.length) { return; }
        showInsertDialog();
      });
    }

    var btnDelete = document.getElementById('btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', function() {
        if (!state.currentTable || state.selectedRows.size === 0) {
          showError('Please select rows to delete.');
          return;
        }
        if (!state.pkColumn) {
          showError('Cannot delete: no primary key column found.');
          return;
        }
        var count = state.selectedRows.size;
        if (confirm('Delete ' + count + ' selected row(s)?')) {
          vscode.postMessage({
            type: 'deleteRows',
            table: state.currentTable,
            pkCol: state.pkColumn,
            pkVals: Array.from(state.selectedRows)
          });
        }
      });
    }

    var btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', function() {
        vscode.postMessage({ type: 'refreshData' });
      });
    }
  }

  function loadData() {
    if (!state.currentTable) { return; }
    showLoading(true);
    vscode.postMessage({
      type: 'getData',
      table: state.currentTable,
      offset: state.pageOffset,
      limit: state.pageSize,
      sortCol: state.sortCol,
      sortDir: state.sortDir,
      filter: state.filterText
    });
  }

  function renderTableList(tables) {
    state.tables = tables;
    var container = document.getElementById('table-list');
    if (!container) { return; }

    var schemaSelect = document.getElementById('schema-table-select');
    if (schemaSelect) {
      schemaSelect.innerHTML = '<option value="">Select table...</option>';
      tables.forEach(function(t) {
        var opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name;
        schemaSelect.appendChild(opt);
      });
    }

    if (tables.length === 0) {
      container.innerHTML = '<div style="padding:12px;opacity:0.6;font-size:12px;">No tables found</div>';
      return;
    }

    container.innerHTML = '';
    tables.forEach(function(t) {
      var item = document.createElement('div');
      item.className = 'table-item' + (state.currentTable === t.name ? ' active' : '');
      item.dataset.table = t.name;
      item.innerHTML = '<span class="table-name">' + escapeHtml(t.name) + '</span><span class="row-count-badge">' + t.rowCount + '</span>';
      item.addEventListener('click', function() { selectTable(t.name); });
      container.appendChild(item);
    });
  }

  function selectTable(tableName) {
    state.currentTable = tableName;
    state.pageOffset = 0;
    state.sortCol = null;
    state.sortDir = 'ASC';
    state.filterText = '';
    state.selectedRows.clear();
    var filterInput = document.getElementById('filter-input');
    if (filterInput) { filterInput.value = ''; }

    document.querySelectorAll('.table-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.table === tableName);
    });

    if (state.currentTab === 'data') {
      loadData();
    } else if (state.currentTab === 'schema') {
      var sel = document.getElementById('schema-table-select');
      if (sel) { sel.value = tableName; }
      loadSchema(tableName);
    }
  }

  function renderDataGrid(data) {
    showLoading(false);
    state.totalRows = data.total;
    state.columns = data.columns;
    state.pkColumn = data.columns && data.columns.length > 0 ? data.columns[0] : null;

    var container = document.getElementById('data-grid-container');
    if (!container) { return; }

    if (!data.columns || data.columns.length === 0) {
      container.innerHTML = '<div style="padding:20px;opacity:0.6;">Table is empty or has no columns.</div>';
      updateStatusText(data);
      return;
    }

    var table = document.createElement('table');
    table.className = 'data-grid';

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');

    var thCheck = document.createElement('th');
    thCheck.className = 'checkbox-cell';
    var selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.title = 'Select all';
    selectAll.addEventListener('change', function(e) {
      var checked = e.target.checked;
      document.querySelectorAll('.row-checkbox').forEach(function(cb) {
        cb.checked = checked;
        var row = cb.closest('tr');
        var pkVal = row ? row.dataset.pkVal : undefined;
        if (pkVal !== undefined) {
          if (checked) { state.selectedRows.add(pkVal); }
          else { state.selectedRows.delete(pkVal); }
        }
        if (row) { row.classList.toggle('selected', checked); }
      });
    });
    thCheck.appendChild(selectAll);
    headerRow.appendChild(thCheck);

    data.columns.forEach(function(col) {
      var th = document.createElement('th');
      th.textContent = col;
      th.dataset.col = col;
      if (state.sortCol === col) {
        th.classList.add(state.sortDir === 'ASC' ? 'sort-asc' : 'sort-desc');
      }
      th.addEventListener('click', function() {
        if (state.sortCol === col) {
          state.sortDir = state.sortDir === 'ASC' ? 'DESC' : 'ASC';
        } else {
          state.sortCol = col;
          state.sortDir = 'ASC';
        }
        loadData();
      });
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    data.rows.forEach(function(row) {
      var tr = document.createElement('tr');
      var pkVal = row[0];
      tr.dataset.pkVal = pkVal !== null && pkVal !== undefined ? String(pkVal) : '';
      if (state.selectedRows.has(String(pkVal))) { tr.classList.add('selected'); }

      var tdCheck = document.createElement('td');
      tdCheck.className = 'checkbox-cell';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'row-checkbox';
      cb.checked = state.selectedRows.has(String(pkVal));
      (function(pkValCaptured, trCaptured) {
        cb.addEventListener('change', function(e) {
          var pkValStr = String(pkValCaptured);
          if (e.target.checked) { state.selectedRows.add(pkValStr); }
          else { state.selectedRows.delete(pkValStr); }
          trCaptured.classList.toggle('selected', e.target.checked);
        });
      })(pkVal, tr);
      tdCheck.appendChild(cb);
      tr.appendChild(tdCheck);

      row.forEach(function(cell, colIdx) {
        var td = document.createElement('td');
        var colName = data.columns[colIdx];
        if (cell === null || cell === undefined) {
          td.innerHTML = '<span class="null-value">NULL</span>';
        } else if (cell instanceof Uint8Array || cell instanceof ArrayBuffer) {
          var byteLen = cell.byteLength !== undefined ? cell.byteLength : cell.length;
          td.innerHTML = '<span class="null-value">&lt;BLOB ' + byteLen + ' bytes&gt;</span>';
          td.title = 'BLOB (' + byteLen + ' bytes)';
        } else {
          td.textContent = String(cell);
          td.title = String(cell);
        }
        (function(tdCaptured, rowCaptured, colNameCaptured, pkColCaptured, pkValCaptured) {
          tdCaptured.addEventListener('dblclick', function() {
            makeEditable(tdCaptured, rowCaptured, colNameCaptured, pkColCaptured, pkValCaptured);
          });
        })(td, row, colName, state.pkColumn, pkVal);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);

    updateStatusText(data);
  }

  function updateStatusText(data) {
    var statusEl = document.getElementById('status-text');
    if (!statusEl) { return; }
    if (data.total === 0) {
      statusEl.textContent = 'No rows';
    } else {
      var from = data.offset + 1;
      var to = Math.min(data.offset + data.limit, data.total);
      statusEl.textContent = 'Showing ' + from + '\u2013' + to + ' of ' + data.total + ' rows';
    }
    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    if (btnPrev) { btnPrev.disabled = data.offset === 0; }
    if (btnNext) { btnNext.disabled = (data.offset + data.limit) >= data.total; }
  }

  function makeEditable(cell, row, colName, pkCol, pkVal) {
    if (cell.querySelector('input')) { return; }
    var originalHTML = cell.innerHTML;
    var originalText = cell.textContent === 'NULL' ? '' : cell.textContent;
    cell.classList.add('editing');
    var input = document.createElement('input');
    input.value = originalText;
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    var committed = false;

    function commit() {
      if (committed) { return; }
      committed = true;
      var newVal = input.value;
      cell.classList.remove('editing');
      cell.textContent = newVal;
      vscode.postMessage({
        type: 'updateCell',
        table: state.currentTable,
        pkCol: pkCol,
        pkVal: pkVal,
        col: colName,
        val: newVal
      });
    }

    function cancel() {
      if (committed) { return; }
      committed = true;
      cell.classList.remove('editing');
      cell.innerHTML = originalHTML;
    }

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { commit(); }
      if (e.key === 'Escape') { cancel(); }
    });
    input.addEventListener('blur', function() {
      setTimeout(function() { if (!committed) { cancel(); } }, 100);
    });
  }

  function showInsertDialog() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;';

    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:var(--vscode-editor-background);border:1px solid var(--vscode-panel-border);border-radius:6px;padding:20px;min-width:400px;max-width:600px;max-height:80vh;overflow-y:auto;';

    var title = document.createElement('h3');
    title.style.cssText = 'margin:0 0 16px;font-size:14px;';
    title.innerHTML = 'Insert New Row into <em>' + escapeHtml(state.currentTable) + '</em>';
    dialog.appendChild(title);

    var form = document.createElement('form');
    state.columns.forEach(function(col) {
      var group = document.createElement('div');
      group.style.cssText = 'margin-bottom:10px;';
      var label = document.createElement('label');
      label.style.cssText = 'display:block;font-size:12px;margin-bottom:4px;opacity:0.8;';
      label.textContent = col;
      var input = document.createElement('input');
      input.name = col;
      input.placeholder = 'NULL';
      input.style.cssText = 'width:100%;padding:5px 8px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,#666);border-radius:3px;font-size:13px;box-sizing:border-box;';
      group.appendChild(label);
      group.appendChild(input);
      form.appendChild(group);
    });

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;margin-top:16px;justify-content:flex-end;';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn';
    cancelBtn.addEventListener('click', function() { document.body.removeChild(overlay); });

    var insertBtn = document.createElement('button');
    insertBtn.type = 'button';
    insertBtn.textContent = 'Insert';
    insertBtn.className = 'btn btn-primary';
    insertBtn.addEventListener('click', function() {
      var data = {};
      state.columns.forEach(function(col) {
        var input = form.querySelector('[name="' + col + '"]');
        var val = input ? input.value : '';
        data[col] = val === '' ? null : val;
      });
      vscode.postMessage({ type: 'insertRow', table: state.currentTable, data: data });
      document.body.removeChild(overlay);
    });

    btns.appendChild(cancelBtn);
    btns.appendChild(insertBtn);
    dialog.appendChild(form);
    dialog.appendChild(btns);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) { document.body.removeChild(overlay); }
    });
  }

  function setupQueryTab() {
    var btnRun = document.getElementById('btn-run-query');
    if (btnRun) { btnRun.addEventListener('click', runQuery); }

    var btnClear = document.getElementById('btn-clear-query');
    if (btnClear) {
      btnClear.addEventListener('click', function() {
        var editor = document.getElementById('sql-editor');
        if (editor) { editor.value = ''; }
        var results = document.getElementById('query-results');
        if (results) { results.innerHTML = ''; }
        var errEl = document.getElementById('query-error');
        if (errEl) { errEl.style.display = 'none'; }
      });
    }

    var sqlEditor = document.getElementById('sql-editor');
    if (sqlEditor) {
      sqlEditor.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); runQuery(); }
      });
    }

    var historySelect = document.getElementById('query-history');
    if (historySelect) {
      historySelect.addEventListener('change', function(e) {
        var val = e.target.value;
        if (val) {
          var editor = document.getElementById('sql-editor');
          if (editor) { editor.value = val; }
        }
      });
    }
  }

  function runQuery() {
    var editor = document.getElementById('sql-editor');
    var sql = editor ? editor.value.trim() : '';
    if (!sql) { return; }
    addToHistory(sql);
    var errEl = document.getElementById('query-error');
    if (errEl) { errEl.style.display = 'none'; }
    var results = document.getElementById('query-results');
    if (results) { results.innerHTML = ''; }
    showLoading(true);
    vscode.postMessage({ type: 'query', sql: sql });
  }

  function addToHistory(sql) {
    state.queryHistory = state.queryHistory.filter(function(q) { return q !== sql; });
    state.queryHistory.unshift(sql);
    if (state.queryHistory.length > 20) { state.queryHistory.pop(); }
    var historySelect = document.getElementById('query-history');
    if (!historySelect) { return; }
    historySelect.innerHTML = '<option value="">Query history...</option>';
    state.queryHistory.forEach(function(q) {
      var opt = document.createElement('option');
      opt.value = q;
      opt.textContent = q.length > 60 ? q.substring(0, 60) + '...' : q;
      historySelect.appendChild(opt);
    });
  }

  function renderQueryResults(result) {
    showLoading(false);
    var container = document.getElementById('query-results');
    if (!container) { return; }

    if (!result.columns || result.columns.length === 0) {
      var affectedMsg = (result.rowsAffected > 0)
        ? result.rowsAffected + ' row(s) affected.'
        : 'Query executed successfully. No results returned.';
      container.innerHTML = '<div style="padding:12px;opacity:0.6;">' + affectedMsg + '</div>';
      return;
    }

    var table = document.createElement('table');
    table.className = 'data-grid';
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    result.columns.forEach(function(col) {
      var th = document.createElement('th');
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    result.rows.forEach(function(row) {
      var tr = document.createElement('tr');
      row.forEach(function(cell) {
        var td = document.createElement('td');
        if (cell === null || cell === undefined) {
          td.innerHTML = '<span class="null-value">NULL</span>';
        } else if (cell instanceof Uint8Array || cell instanceof ArrayBuffer) {
          var byteLen = cell.byteLength !== undefined ? cell.byteLength : cell.length;
          td.innerHTML = '<span class="null-value">&lt;BLOB ' + byteLen + ' bytes&gt;</span>';
          td.title = 'BLOB (' + byteLen + ' bytes)';
        } else {
          td.textContent = String(cell);
          td.title = String(cell);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.innerHTML = '';

    var rowCount = document.createElement('div');
    rowCount.style.cssText = 'padding:6px 0;font-size:12px;opacity:0.7;';
    rowCount.textContent = result.rows.length + ' row(s) returned';
    container.appendChild(rowCount);
    container.appendChild(table);
  }

  function renderQueryError(error) {
    showLoading(false);
    var errEl = document.getElementById('query-error');
    if (errEl) {
      errEl.textContent = 'Error: ' + error;
      errEl.style.display = 'block';
    }
  }

  function setupSchemaTab() {
    var btnLoad = document.getElementById('btn-load-schema');
    if (btnLoad) {
      btnLoad.addEventListener('click', function() {
        var sel = document.getElementById('schema-table-select');
        var tableName = sel ? sel.value : '';
        if (tableName) { loadSchema(tableName); }
      });
    }
  }

  function loadSchema(tableName) {
    showLoading(true);
    vscode.postMessage({ type: 'getSchema', table: tableName });
  }

  function renderSchema(schema) {
    showLoading(false);
    var container = document.getElementById('schema-content');
    if (!container) { return; }

    var html = '';

    html += '<div class="schema-section"><h3>Create Statement</h3><pre class="schema-sql">' + escapeHtml(schema.sql || '') + '</pre></div>';

    html += '<div class="schema-section"><h3>Columns (' + schema.columns.length + ')</h3>';
    html += '<table class="schema-table"><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Nullable</th><th>Default</th><th>Flags</th></tr></thead><tbody>';
    schema.columns.forEach(function(col, i) {
      var typeClass = (col.type || '').toLowerCase().split('(')[0].trim() || 'text';
      var badges = '';
      if (col.pk) { badges += '<span class="type-badge pk">PK</span>'; }
      if (col.notnull) { badges += '<span class="type-badge notnull">NOT NULL</span>'; }
      html += '<tr>';
      html += '<td style="opacity:0.5">' + (i + 1) + '</td>';
      html += '<td><strong>' + escapeHtml(col.name) + '</strong></td>';
      html += '<td><span class="type-badge ' + typeClass + '">' + escapeHtml(col.type || 'ANY') + '</span></td>';
      html += '<td>' + (col.notnull ? 'No' : 'Yes') + '</td>';
      html += '<td>' + (col.dflt_value !== null && col.dflt_value !== undefined ? escapeHtml(String(col.dflt_value)) : '<span class="null-value">NULL</span>') + '</td>';
      html += '<td>' + badges + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    if (schema.indexes && schema.indexes.length > 0) {
      html += '<div class="schema-section"><h3>Indexes (' + schema.indexes.length + ')</h3>';
      html += '<table class="schema-table"><thead><tr><th>Name</th><th>Columns</th><th>Unique</th></tr></thead><tbody>';
      schema.indexes.forEach(function(idx) {
        html += '<tr><td>' + escapeHtml(idx.name) + '</td><td>' + escapeHtml((idx.columns || []).join(', ')) + '</td><td>' + (idx.unique ? '&#10003; Yes' : 'No') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    if (schema.foreignKeys && schema.foreignKeys.length > 0) {
      html += '<div class="schema-section"><h3>Foreign Keys (' + schema.foreignKeys.length + ')</h3>';
      html += '<table class="schema-table"><thead><tr><th>From</th><th>References</th><th>On Update</th><th>On Delete</th></tr></thead><tbody>';
      schema.foreignKeys.forEach(function(fk) {
        html += '<tr><td>' + escapeHtml(fk.from) + '</td><td>' + escapeHtml(fk.table) + '.' + escapeHtml(fk.to) + '</td><td>' + escapeHtml(fk.on_update || '') + '</td><td>' + escapeHtml(fk.on_delete || '') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    container.innerHTML = html;
  }

  function loadInfo() {
    showLoading(true);
    vscode.postMessage({ type: 'getDbInfo' });
  }

  function renderInfo(info) {
    showLoading(false);
    var container = document.getElementById('info-content');
    if (!container) { return; }

    var fileSizeFormatted = formatBytes(info.fileSize);
    var dbSizeFormatted = formatBytes(info.pageSize * info.pageCount);

    var html = '<div class="info-section"><h2>Database Info</h2><div class="info-grid">';
    html += '<div><div class="info-label">File Path</div><div class="info-value" style="word-break:break-all;font-size:12px;">' + escapeHtml(info.filePath) + '</div></div>';
    html += '<div><div class="info-label">File Size</div><div class="info-value">' + fileSizeFormatted + '</div></div>';
    html += '<div><div class="info-label">SQLite Version</div><div class="info-value">' + escapeHtml(info.sqliteVersion) + '</div></div>';
    html += '<div><div class="info-label">Page Size</div><div class="info-value">' + info.pageSize + ' bytes</div></div>';
    html += '<div><div class="info-label">Page Count</div><div class="info-value">' + info.pageCount + '</div></div>';
    html += '<div><div class="info-label">Database Size</div><div class="info-value">' + dbSizeFormatted + '</div></div>';
    html += '<div><div class="info-label">Encoding</div><div class="info-value">' + escapeHtml(info.encoding) + '</div></div>';
    html += '<div><div class="info-label">Journal Mode</div><div class="info-value">' + escapeHtml(info.journalMode) + '</div></div>';
    html += '<div><div class="info-label">WAL Mode</div><div class="info-value">' + (info.walMode ? 'Enabled' : 'Disabled') + '</div></div>';
    html += '<div><div class="info-label">Table Count</div><div class="info-value">' + info.tableCount + '</div></div>';
    html += '</div></div>';

    if (info.tables && info.tables.length > 0) {
      html += '<div class="info-section"><h2>Tables</h2>';
      html += '<table class="schema-table"><thead><tr><th>Table Name</th><th>Row Count</th></tr></thead><tbody>';
      info.tables.forEach(function(t) {
        html += '<tr><td>' + escapeHtml(t.name) + '</td><td>' + t.rowCount.toLocaleString() + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    container.innerHTML = html;
  }

  window.addEventListener('message', function(event) {
    var msg = event.data;
    switch (msg.type) {
      case 'tablesResult':
        renderTableList(msg.tables);
        if (msg.tables && msg.tables.length > 0 && !state.currentTable) {
          selectTable(msg.tables[0].name);
        } else if (state.currentTable && state.currentTab === 'data') {
          // Reload data grid when refreshing an already-selected table
          loadData();
        } else {
          // Empty database or no table selected — dismiss loading immediately
          showLoading(false);
        }
        break;
      case 'dataResult':
        renderDataGrid(msg.data);
        break;
      case 'queryResult':
        renderQueryResults(msg.result);
        break;
      case 'queryError':
        renderQueryError(msg.error);
        break;
      case 'schemaResult':
        renderSchema(msg.schema);
        break;
      case 'dbInfoResult':
        renderInfo(msg.info);
        break;
      case 'updateSuccess':
        loadData();
        break;
      case 'insertSuccess':
        state.pageOffset = 0;
        loadData();
        vscode.postMessage({ type: 'getTables' });
        break;
      case 'deleteSuccess':
        state.selectedRows.clear();
        loadData();
        vscode.postMessage({ type: 'getTables' });
        break;
      case 'error':
        showLoading(false);
        showError(msg.error);
        break;
    }
  });

  function showLoading(visible) {
    var el = document.getElementById('loading-overlay');
    if (el) { el.style.display = visible ? 'flex' : 'none'; }
  }

  function showError(msg) {
    var toast = document.getElementById('error-toast');
    if (!toast) { return; }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(function() { toast.style.display = 'none'; }, 5000);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) { return ''; }
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) { return '0 B'; }
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
})();
