# Label Maker – JavaScript modules

The app uses **ES modules** and a single entry **`main.js`**, which imports the rest in order. All modules share the **`LabelMaker`** namespace on `window`.

| File | Role |
|------|------|
| **core.js** | Canvas instance, undo/redo, `saveState`, shared state (`selectedTextObj`, `isRestoring`) |
| **layers.js** | Layers list UI, `updateLayersList`, `highlightSelectedLayer`, `updateEmptyState` |
| **canvas.js** | Resize, presets, grid, zoom, align, opacity, background color |
| **tools.js** | Add text/QR/barcode/shapes/line/image/SVG, duplicate, copy/paste |
| **importExport.js** | Open (JSON/XML/image/SVG/MD/PDF), save/load JSON, export PNG/PDF/XML/ZPL, print, clear, new |
| **selection.js** | Selection events, left-panel text controls, keyboard shortcuts (Undo/Redo/Delete/Ctrl+C/V) |
| **properties.js** | Right-panel Properties tab, object property inputs |
| **init.js** | Panel state (localStorage), build presets, initial `saveState` / `updateLayersList` / zoom |

Inline `onclick` handlers in `index.html` call global functions; those are assigned to `window` by each module.

## Build (Vite)

- **Dev:** `npm install` then `npm run dev` — serves the app with hot reload; open the URL shown (e.g. http://localhost:5173).
- **Build:** `npm run build` — outputs to `dist/`.
- **Preview build:** `npm run preview` — serves `dist/` locally.

The old single-file script is kept as **`script.js.backup`** for reference.

**Note:** `npm audit` may report moderate issues in Vite/esbuild (dev server). They affect only the dev environment, not the built `dist/` output used in production.
