# Label Designer

A client-side web app for designing printable labels: text, QR codes, barcodes, shapes, lines, SVG/images, with export to PNG, PDF, XML, ZPL, and print. Built with [Fabric.js](http://fabricjs.com/).

## Features

- **Canvas** – Resize, presets (Avery, metric, etc.), background color, snap to grid, zoom
- **Text** – Add text, font, color, size, align, bold/italic
- **QR & Barcode** – Full options (error correction, margin, colors; Code 128/39, EAN, UPC)
- **Graphics** – Rect, rounded rect, circle, triangle, star; SVG/image upload; image from URL
- **Line** – Color and width
- **Edit** – Undo/redo, duplicate, opacity, align, multi-select (Shift+click), copy/paste, delete
- **Layers** – List, reorder, rename, delete; **Properties** tab for selected object (position, size, angle, opacity, fill/stroke, text options)
- **Import/Export** – Open JSON, XML, PNG, JPG, SVG, MD, PDF; save/load JSON; export PNG (1×–3×), PDF, XML, ZPL; print

## Project structure

```
├── index.html           # Main app (loads css/ and js/main.js)
├── css/
│   ├── base.css         # Layout
│   ├── panels.css       # Left & right panels
│   └── canvas.css       # Canvas area
├── js/
│   ├── main.js          # Entry (imports all modules)
│   ├── core.js          # Canvas, undo/redo, state
│   ├── layers.js        # Layers list
│   ├── canvas.js        # Resize, presets, zoom, align, opacity
│   ├── tools.js         # Text, QR, barcode, shapes, line, duplicate, copy/paste
│   ├── importExport.js  # Open, save, export, print
│   ├── selection.js     # Selection & text controls, keyboard
│   ├── properties.js    # Properties panel
│   └── init.js          # Panel state, initial setup
├── package.json
├── vite.config.js
├── style.css            # Legacy (app uses css/)
└── script.js.backup     # Legacy single-file script
```

## Getting started

**Requires Node.js** (for the dev server; ES modules don’t run from `file://`).

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173).

**Build for production:**

```bash
npm run build
```

Output is in `dist/`. Serve that folder (e.g. `npm run preview`) or deploy to any static host.

## Dependencies (CDN, in index.html)

- Fabric.js, QRCode.js, JsBarcode, jsPDF, PDF.js

No `npm install` of these; they load from CDN.

## Customization

- **Themes** – Edit `css/base.css`, `css/panels.css`, `css/canvas.css` (dark theme is in panels).
- **New export formats** – See `js/importExport.js`.
- **New tools** – See `js/tools.js` and add UI in `index.html`.

## License

MIT.
