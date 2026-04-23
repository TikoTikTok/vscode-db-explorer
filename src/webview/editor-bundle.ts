import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { sql, SQLite } from '@codemirror/lang-sql';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

const schemaComp = new Compartment();
let editorView: EditorView | null = null;

// Overlay VSCode CSS variables on top of oneDark for container/gutter colours
const vscodeOverride = EditorView.theme({
  '&': { height: '100%', fontSize: '13px' },
  '.cm-scroller': {
    fontFamily: 'var(--vscode-editor-font-family, "Consolas", "Courier New", monospace)',
    overflow: 'auto',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--vscode-editorSuggestWidget-background, #252526)',
    border: '1px solid var(--vscode-editorSuggestWidget-border, #454545)',
    color: 'var(--vscode-editorSuggestWidget-foreground, #d4d4d4)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--vscode-editorSuggestWidget-selectedBackground, #094771)',
    color: 'var(--vscode-editorSuggestWidget-selectedForeground, #ffffff)',
  },
});

function createEditor(container: HTMLElement, onSubmit: (sqlText: string) => void): EditorView {
  const nonce: string = (window as any).__DB_NONCE__ || '';

  const state = EditorState.create({
    doc: '',
    extensions: [
      EditorView.cspNonce.of(nonce),
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      closeBrackets(),
      bracketMatching(),
      schemaComp.of(sql({ dialect: SQLite })),
      autocompletion({ defaultKeymap: true }),
      oneDark,
      vscodeOverride,
      keymap.of([
        {
          key: 'Ctrl-Enter',
          run: () => {
            if (editorView) { onSubmit(editorView.state.doc.toString()); }
            return true;
          },
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        indentWithTab,
        ...historyKeymap,
        ...completionKeymap,
      ]),
    ],
  });

  editorView = new EditorView({ state, parent: container });
  return editorView;
}

function updateSchema(schema: Record<string, string[]>): void {
  if (!editorView) { return; }
  editorView.dispatch({
    effects: schemaComp.reconfigure(sql({ dialect: SQLite, schema })),
  });
}

function getValue(): string {
  return editorView ? editorView.state.doc.toString() : '';
}

function setValue(text: string): void {
  if (!editorView) { return; }
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: text },
  });
}

(window as any).DbEditorAPI = { createEditor, updateSchema, getValue, setValue };
