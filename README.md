# CanvasMargin

**Highlight text in notes, sync excerpts to Obsidian Canvas as linked nodes.**

> 中文文档：[README-zh.md](README-zh.md)

---

## What it does

CanvasMargin bridges your reading notes and Obsidian Canvas. Highlight a passage → it becomes a linked node on your Canvas. Double-click a node → jump back to the exact line in your note.

```
Reading note                    Canvas
──────────────────              ──────────────────────────
...some text...                 ┌─────────────────────┐
<mark>this insight</mark>  ──►  │ this insight        │
...more text...                 │ <!--card:{anc:...}-->│
                                └─────────────────────┘
         ◄── double-click node to jump back
```

---

## Features

| Feature | How to trigger |
|---------|---------------|
| Highlight selection | Select text → floating toolbar → **✎ Excerpt** |
| Remove highlight | Click inside a highlight → floating toolbar → **✂ Remove** |
| Sync to Canvas | Ribbon icon, or the sync button in the editor top bar |
| Jump: note → Canvas | Click any highlight in Reading/Live Preview mode |
| Jump: Canvas → note | Double-click a Canvas node |
| Auto-excerpt mode | Settings → **Immersive mode**: mouseup with selection = instant highlight |
| Auto-sync | Settings → **Auto sync**: sync to open Canvas right after highlighting |

---

## Installation

### Manual (current)

1. Download `main.js`, `manifest.json`, `styles.css` from the latest release.
2. Copy to `.obsidian/plugins/canvas-margin/`.
3. Enable in **Settings → Community Plugins**.

### BRAT (beta)

Add `your-github-username/canvas-annotator` in [BRAT](https://github.com/TfTHacker/obsidian42-brat).

---

## Usage

### Highlight text

1. Open a Markdown note in Live Preview or Editing mode.
2. Select any text.
3. A floating toolbar appears — click **✎ Excerpt**.

Or enable **Immersive mode** in settings: any mouseup-selection is highlighted immediately without the toolbar.

### Sync to Canvas

Open a Canvas file, then click the **↻** ribbon icon (or the sync button at the top of any note). New highlights become text nodes arranged vertically on the Canvas.

**Auto sync**: when enabled, the node is created on the open Canvas immediately after each highlight — no manual sync needed.

### Jump between note and Canvas

- **Note → Canvas**: click a highlighted passage (Reading mode or rendered Live Preview line).
- **Canvas → Note**: double-click a CanvasMargin node.

### Remove a highlight

Click anywhere inside a highlight — the toolbar shows **✂ Remove**. Click it to strip the `<mark>` tag and restore plain text.

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Highlight color | Cyan (5) | Color swatch for new highlights and Canvas nodes |
| Node gap | 20 px | Vertical spacing between auto-placed Canvas nodes |
| Immersive mode | Off | Mouseup with selection → highlight immediately |
| Auto sync | Off | Sync to open Canvas right after each highlight |

---

## How it works (for the curious)

- Highlights are stored as `<mark class="cN" id="anc-{nanoid}">text</mark>` directly in your Markdown source — no separate database, no YAML pollution.
- Canvas nodes carry a `<!--card:{"anc":"..."}-->` comment that links back to the source highlight.
- Sync scans **all** `.canvas` files in your vault to avoid duplicates across canvases.
- The floating toolbar uses a `mousedown` event to capture the mark element's position *before* CodeMirror collapses its decoration — this is why the toolbar appears reliably even in Live Preview.

---

## Compatibility

- Obsidian 1.1+
- Notes with the old highlight format (`class="cN anc-xxx"`) are fully supported — no migration needed.

---

## License

MIT
