---
name: db-explorer
description: >
  Build, install, update, and extend the vscode-db-explorer VSCode extension.
  Handles the full lifecycle: source edits → webpack compile → copy runtime files
  to both ~/.vscode/extensions and ~/.vscode-server/extensions.
  Supports .db, .sqlite, .sqlite3, .vscdb, .s3db, .sl3 formats.
  Use when the user asks to: modify the DB Explorer extension, add features to it,
  fix bugs in it, reinstall it, rebuild it, or work with SQLite databases in VSCode.
---

# Skill: DB Explorer VSCode Extension

## Project Location

```
/home/okit/proj/vscode-db-explorer/   ← source root
```

## Key File Map

| File | Role |
|------|------|
| `src/extension.ts` | Activation, commands, status bar, message routing |
| `src/database/SqliteAdapter.ts` | sql.js (WASM) wrapper — all SQLite operations |
| `src/database/DatabaseManager.ts` | Singleton registry of open databases |
| `src/database/types.ts` | Shared TypeScript interfaces |
| `src/providers/DatabaseTreeProvider.ts` | Sidebar tree (tables/views/indexes/triggers) |
| `src/providers/DatabaseEditorProvider.ts` | Custom editor + webview message bus |
| `src/webview/WebviewBuilder.ts` | Generates full webview HTML from media/ files |
| `media/main.css` | Rich VSCode-themed UI styles (496 lines) |
| `media/main.js` | Webview client — all interactivity, vanilla JS (738 lines) |
| `webpack.config.js` | Bundles src/ → dist/extension.js; copies sql-wasm.wasm |
| `dist/extension.js` | Compiled output — DO NOT edit directly |
| `dist/sql-wasm.wasm` | SQLite WebAssembly binary (copied from node_modules) |

## Build Workflow

```bash
cd /home/okit/proj/vscode-db-explorer
npm run compile          # dev build (fast, with source maps)
npm run package          # production build (minified)
```

> ⚠️ Always run `npm run compile` after any change to `src/` or `media/`.
> Changes to `media/main.css` and `media/main.js` do NOT require recompile —
> they are read at runtime by WebviewBuilder.ts and served directly.

## Install Workflow

After building, copy runtime files and register in VSCode's extension registry:

```bash
EXT_ID="okit.db-explorer-0.1.0"
SRC="/home/okit/proj/vscode-db-explorer"

for DIR in ~/.vscode/extensions ~/.vscode-server/extensions; do
  DEST="$DIR/$EXT_ID"
  mkdir -p "$DEST/dist" "$DEST/media"
  cp "$SRC/package.json"              "$DEST/package.json"
  cp "$SRC/dist/extension.js"         "$DEST/dist/extension.js"
  cp "$SRC/dist/extension.js.map"     "$DEST/dist/extension.js.map"
  cp "$SRC/dist/sql-wasm.wasm"        "$DEST/dist/sql-wasm.wasm"
  cp "$SRC/dist/sql-wasm.js"          "$DEST/dist/sql-wasm.js"
  cp "$SRC/dist/editor-bundle.js"     "$DEST/dist/editor-bundle.js"
  cp "$SRC/dist/editor-bundle.js.map" "$DEST/dist/editor-bundle.js.map"
  cp "$SRC/media/main.css"            "$DEST/media/main.css"
  cp "$SRC/media/main.js"             "$DEST/media/main.js"
  cp "$SRC/media/database.svg"        "$DEST/media/database.svg"

  # ⚠️ CRITICAL: Register in VSCode's extensions registry or it won't load
  REGISTRY="$DIR/extensions.json"
  python3 -c "
import json, time, sys
path = sys.argv[1]
try:
    data = json.load(open(path))
except:
    data = []
data = [e for e in data if e.get('identifier', {}).get('id') != 'okit.db-explorer']
data.append({
    'identifier': {'id': 'okit.db-explorer'},
    'version': '0.1.0',
    'location': {'\$mid': 1, 'path': sys.argv[2], 'scheme': 'file'},
    'relativeLocation': 'okit.db-explorer-0.1.0',
    'metadata': {
        'installedTimestamp': int(time.time() * 1000),
        'pinned': False, 'source': 'vsix', 'targetPlatform': 'undefined',
        'updated': False, 'isPreReleaseVersion': False, 'hasPreReleaseVersion': False
    }
})
json.dump(data, open(path, 'w'), indent=2)
print('Registered in', path)
" "$REGISTRY" "$DEST"
done
echo "✅ Installed and registered in both VSCode extension dirs"
```

> ⚠️ **CRITICAL**: VSCode only loads extensions listed in `extensions.json`.
> Simply copying files to the extensions folder is NOT enough — the registry entry is required.
> Without it: no activity bar icon, no commands in palette, extension silently ignored.

**Runtime-only files** (do NOT copy node_modules or src — webpack bundled everything):
- `package.json`, `dist/extension.js`, `dist/extension.js.map`, `dist/sql-wasm.wasm`, `media/main.css`, `media/main.js`, `media/database.svg`

After install: user must **Reload Window** (`Ctrl+Shift+P → Reload Window`) in VSCode.

## Full Rebuild + Reinstall (one-liner sequence)

```bash
cd /home/okit/proj/vscode-db-explorer && npm run compile && \
EXT_ID="okit.db-explorer-0.1.0" && SRC=$(pwd) && \
for DIR in ~/.vscode/extensions ~/.vscode-server/extensions; do
  DEST="$DIR/$EXT_ID"
  mkdir -p "$DEST/dist" "$DEST/media"
  cp "$SRC/package.json" "$DEST/"
  cp "$SRC/dist/extension.js" "$SRC/dist/extension.js.map" "$SRC/dist/sql-wasm.wasm" "$DEST/dist/"
  cp "$SRC/media/main.css" "$SRC/media/main.js" "$SRC/media/database.svg" "$DEST/media/"
  python3 -c "
import json,time,sys; p=sys.argv[1]; d=json.load(open(p)) if __import__('os').path.exists(p) else []
d=[e for e in d if e.get('identifier',{}).get('id')!='okit.db-explorer']
d.append({'identifier':{'id':'okit.db-explorer'},'version':'0.1.0','location':{'\$mid':1,'path':sys.argv[2],'scheme':'file'},'relativeLocation':'okit.db-explorer-0.1.0','metadata':{'installedTimestamp':int(time.time()*1000),'pinned':False,'source':'vsix','targetPlatform':'undefined','updated':False,'isPreReleaseVersion':False,'hasPreReleaseVersion':False}})
json.dump(d,open(p,'w'),indent=2)
" "$DIR/extensions.json" "$DEST"
done && echo "✅ Done"
```

## Architecture: Extension ↔ Webview Communication

```
Extension Host (Node.js)              Webview (browser sandbox)
────────────────────────              ─────────────────────────
DatabaseEditorProvider                media/main.js
  .onDidReceiveMessage()  ←────────── vscode.postMessage({ type, ...args })
  panel.webview.postMessage() ──────► window.addEventListener('message', ...)
```

### Message types (webview → extension):
| type | args | Response |
|------|------|----------|
| `getTables` | — | `{ type:'tables', tables:[{name,rowCount}] }` |
| `getData` | `table, offset, limit, sort, filter` | `{ type:'data', columns, rows, total }` |
| `query` | `sql` | `{ type:'queryResult', columns, rows }` or `{ type:'queryError', message }` |
| `getSchema` | `table` | `{ type:'schema', schema }` |
| `getDbInfo` | — | `{ type:'dbInfo', info }` |
| `updateCell` | `table, pkCol, pkVal, col, val` | `{ type:'updateOk' }` or `{ type:'error' }` |
| `insertRow` | `table, data` | `{ type:'insertOk' }` |
| `deleteRows` | `table, pkCol, pkVals` | `{ type:'deleteOk' }` |
| `exportCSV` | `table` | saves file, shows VSCode save dialog |
| `exportJSON` | `table` | saves file, shows VSCode save dialog |

## Adding a New Feature — Checklist

1. **UI change only** (style/layout): edit `media/main.css` or `media/main.js` → re-copy to install dirs (no recompile)
2. **New webview→extension message**: add handler in `DatabaseEditorProvider.ts` → `npm run compile` → reinstall
3. **New DB operation**: add method to `SqliteAdapter.ts` → expose via `DatabaseManager.ts` → wire in provider → compile → reinstall
4. **New command**: register in `extension.ts` + add to `package.json` `contributes.commands` and `menus` → compile → reinstall
5. **New sidebar action**: update `DatabaseTreeProvider.ts` + `package.json` menus → compile → reinstall

## Supported Formats

`.db` `.sqlite` `.sqlite3` `.vscdb` `.s3db` `.sl3`

Checked in: `src/extension.ts → isDbFile()` and `package.json → customEditors[].selector`

To add a new format: update BOTH locations.

## sql.js WASM Notes

- WASM binary: `dist/sql-wasm.wasm` (copied by webpack from `node_modules/sql.js/dist/`)
- Loaded in `SqliteAdapter.open()` via `initSqlJs({ wasmBinary: fs.readFileSync(wasmPath) })`
- `wasmPath = path.join(__dirname, 'sql-wasm.wasm')` → resolves to `dist/sql-wasm.wasm` at runtime
- After mutations: `db.export()` returns `Uint8Array` → write with `fs.writeFileSync(filePath, Buffer.from(result))`

## Debugging

```bash
# Check extension is listed
ls ~/.vscode-server/extensions/ | grep db-explorer

# Check compiled output is fresh
ls -la /home/okit/proj/vscode-db-explorer/dist/

# Re-run compile with verbose output
cd /home/okit/proj/vscode-db-explorer && npx webpack --display-error-details
```

In VSCode: **Help → Toggle Developer Tools** in the Extension Development Host to see webview console errors.

## Git / Publishing

```bash
cd /home/okit/proj/vscode-db-explorer
git add -A && git commit -m "feat: <description>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin main
```

GitHub repo: `https://github.com/TikoTikTok/vscode-db-explorer`

## Common Mistakes to Avoid

- ❌ Editing `dist/extension.js` directly — always edit `src/` and recompile
- ❌ Forgetting to copy to BOTH `~/.vscode/extensions` AND `~/.vscode-server/extensions`
- ❌ **Not registering in `extensions.json`** — VSCode ignores extensions not listed in this registry file; copying files alone is NOT enough; the extension will be silently absent from activity bar and command palette
- ❌ Forgetting to reload VSCode window after install
- ❌ Copying `node_modules/` to the install dir (it's not needed — webpack bundled everything)
- ❌ Missing `media/main.css`, `media/main.js`, or `media/database.svg` in the copy step
- ❌ Not bumping version in `package.json` when changing the extension ID in the install path
