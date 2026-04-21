# DB Explorer

> A rich, zero-dependency VSCode extension for exploring, editing, and querying SQLite databases — `.db`, `.sqlite`, `.sqlite3`, `.vscdb`, `.s3db`, `.sl3` — without leaving your editor.

---

## ✨ Features at a Glance

| Feature | Details |
|---|---|
| 🗂️ **Data Browser** | Paginated grid with sort, filter, inline edit, insert & delete |
| 🔍 **SQL Query Editor** | Full SQL execution with Ctrl+Enter, results grid, query history |
| 📐 **Schema Viewer** | Column types, PKs, indexes, foreign keys, CREATE SQL |
| ℹ️ **Database Info** | File size, page size, encoding, WAL mode, per-table row counts |
| 📤 **Export** | Export any table to CSV or JSON in one click |
| 🌲 **Sidebar Tree** | Activity bar panel — tables, views, indexes, triggers per DB |
| 🎨 **Theme-aware UI** | Adapts to any VSCode dark / light / high-contrast theme |
| ⚡ **Zero dependencies** | Powered by [sql.js](https://github.com/sql-js/sql.js) (WebAssembly) — no native binaries |

---

## 📂 Supported File Formats

| Extension | Description |
|---|---|
| `.db` | Generic SQLite database |
| `.sqlite` | SQLite database |
| `.sqlite3` | SQLite3 database |
| `.vscdb` | VSCode internal state database |
| `.s3db` | S3 SQLite variant |
| `.sl3` | SQLite3 alternate extension |

---

## 🖥️ Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  DB EXPLORER          [Activity Bar icon]                        │
├──────────────┬──────────────────────────────────────────────────┤
│  📁 myapp.db │  [ Data ] [ Query ] [ Schema ] [ Info ]          │
│   ├─ Tables  │ ┌──────────────────────────────────────────────┐ │
│   │  ├─users │ │ 🔎 Filter...          [Insert] [Delete] [↺]  │ │
│   │  ├─posts │ ├──────┬───────────────┬──────────┬────────────┤ │
│   │  └─tags  │ │  ☐  │ id  ↑         │ name     │ email      │ │
│   ├─ Views   │ ├──────┼───────────────┼──────────┼────────────┤ │
│   ├─ Indexes │ │  ☐  │ 1             │ Alice    │ a@ex.com   │ │
│   └─ Triggers│ │  ☐  │ 2             │ Bob      │ b@ex.com   │ │
│              │ ├──────┴───────────────┴──────────┴────────────┤ │
│  📁 logs.db  │ │ ◀ Prev   1–50 of 1,842 rows   50 ▾   Next ▶ │ │
│   └─ Tables  │ └──────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Open a database

**Option A — Double-click** any `.db` / `.sqlite` / `.sqlite3` / `.vscdb` file in the Explorer panel. DB Explorer opens automatically instead of the hex view.

**Option B — Activity Bar** → click the 🗄️ database icon → click **+** (Open Database) → browse to your file.

**Option C — Command Palette** (`Ctrl+Shift+P`):
```
DB Explorer: Open Database
```

---

## 📖 Tab Reference

### 🗂️ Data Tab

Browse, filter, sort, edit, insert, and delete rows.

| Action | How |
|---|---|
| Sort column | Click column header (toggles ASC → DESC → none) |
| Filter rows | Type in the 🔎 filter bar (real-time, searches all columns) |
| Change page size | Use the rows-per-page dropdown (50 / 100 / 500) |
| Inline edit cell | **Double-click** a cell → type → **Enter** to save, **Esc** to cancel |
| Insert new row | Click **Insert** → fill in the dialog → confirm |
| Delete rows | Check row checkboxes → click **Delete** |
| Refresh data | Click **↺** or reload the editor |

### 🔍 Query Tab

Write and run arbitrary SQL against the open database.

| Action | How |
|---|---|
| Run query | **Ctrl+Enter** or click **▶ Run** |
| Query history | Click the history dropdown to re-run a previous query |
| View results | Results appear in a sortable grid below the editor |
| See errors | Errors are shown in a red banner with the SQLite message |

**Example queries:**
```sql
-- Top 10 heaviest tables
SELECT name, COUNT(*) AS rows FROM sqlite_master
JOIN (SELECT tbl_name, COUNT(*) FROM ... ) ...;

-- Full-text search across a column
SELECT * FROM articles WHERE content LIKE '%keyword%';

-- Schema introspection
PRAGMA table_info(users);
PRAGMA index_list(users);
PRAGMA foreign_key_list(orders);
```

### 📐 Schema Tab

Select a table from the dropdown to view:
- **Column list** — name, type (color-coded badge), nullable, default value, primary key flag
- **Indexes** — name, unique flag, covered columns
- **Foreign keys** — from/to column, reference table, on-delete / on-update rules
- **CREATE SQL** — the raw DDL statement for the table

**Type badge colors:**

| Color | Types |
|---|---|
| 🔵 Blue | `INTEGER`, `INT`, `BIGINT` |
| 🟢 Green | `TEXT`, `VARCHAR`, `CHAR` |
| 🟠 Orange | `REAL`, `FLOAT`, `DOUBLE`, `NUMERIC` |
| 🟣 Purple | `BLOB` |
| ⚫ Gray | `NULL` / unknown |

### ℹ️ Info Tab

Overview of the database file:

- File path & size
- SQLite version (from `PRAGMA user_version`)
- Page size, page count, free pages
- Text encoding (`UTF-8` / `UTF-16`)
- Journal mode (`DELETE` / `WAL` / `MEMORY` / …)
- Per-table row counts (mini table)

---

## 🖱️ Context Menus

Right-click a **database file** in the VSCode Explorer:

| Menu item | Action |
|---|---|
| DB Explorer: Open Database | Open in DB Explorer editor |
| DB Explorer: Open SQL Query | Jump straight to the Query tab |

Right-click a **table node** in the DB Explorer sidebar:

| Menu item | Action |
|---|---|
| View Data | Load the table in the Data tab |
| Export as CSV | Save table contents as `.csv` |
| Export as JSON | Save table contents as `.json` |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Run SQL query (when Query tab is focused) |
| `Enter` | Confirm inline cell edit |
| `Escape` | Cancel inline cell edit |
| `Double-click` | Start inline cell edit |

---

## 📤 Export

1. Right-click a table in the sidebar → **Export as CSV** or **Export as JSON**
2. A save dialog appears — choose location and filename
3. The file is written immediately

CSV export respects the current filter but exports **all matching rows** (ignoring pagination).

---

## 🏗️ Architecture

```
vscode-db-explorer/
├── src/
│   ├── extension.ts                  # Activation, commands, status bar
│   ├── database/
│   │   ├── SqliteAdapter.ts          # sql.js (WASM) wrapper
│   │   ├── DatabaseManager.ts        # Singleton — open DB registry
│   │   └── types.ts                  # Shared TypeScript interfaces
│   ├── providers/
│   │   ├── DatabaseTreeProvider.ts   # Sidebar tree data provider
│   │   └── DatabaseEditorProvider.ts # Custom editor + message bus
│   └── webview/
│       └── WebviewBuilder.ts         # Generates webview HTML
├── media/
│   ├── main.css                      # Rich, VSCode-themed styles
│   └── main.js                       # Webview client (vanilla JS)
└── dist/
    ├── extension.js                  # Webpack bundle
    └── sql-wasm.wasm                 # SQLite WebAssembly binary
```

**Data flow:**

```
File system (.db)
      │  fs.readFileSync
      ▼
 SqliteAdapter (sql.js WASM)
      │  query / mutate
      ▼
DatabaseEditorProvider
      │  postMessage (JSON)
      ▼
  Webview (media/main.js)
      │  render
      ▼
   User's screen
```

Mutations (inline edit, insert, delete) call `db.export()` → `fs.writeFileSync` so changes are persisted back to the file immediately.

---

## 🔧 Requirements

- **VSCode** 1.80 or newer
- **No external tools** — SQLite is bundled as WebAssembly via [sql.js](https://github.com/sql-js/sql.js)
- Works on **Linux, macOS, Windows** (and VSCode Remote / SSH)

---

## 🛠️ Building from Source

```bash
git clone <repo>
cd vscode-db-explorer
npm install
npm run compile       # development build
npm run package       # production (minified) build
```

Press **F5** in VSCode to launch the Extension Development Host.

---

## 🤝 AI Agent Integration

This extension ships with a companion **agent skill** (`db_explorer` skill in the platform's `agents/skills/` system) that lets AI agents interact with SQLite databases programmatically:

```python
# List all databases in the project
call_skill("db_list_databases", {"path": "."})

# Query a database
call_skill("db_query", {"db_path": "app.db", "sql": "SELECT * FROM users LIMIT 5"})

# Inspect schema
call_skill("db_schema", {"db_path": "app.db", "table": "users"})

# Full database overview
call_skill("db_info", {"db_path": "app.db"})

# Export table data
call_skill("db_export_table", {"db_path": "app.db", "table": "users", "format": "csv"})
```

See [`agents/skills/db_explorer.py`](../agents/skills/db_explorer.py) for the full implementation.

---

## 📄 License

MIT
