# CanvasMargin

**Highlight text in notes, sync excerpts to Obsidian Canvas as linked nodes.**

> 中文文档：[README-zh.md](README-zh.md)

---

## What It Does

CanvasMargin connects reading notes with Obsidian Canvas. Highlight a passage, sync it to a Canvas text node, then jump between the note mark and the Canvas node.

```text
Reading note                    Canvas
──────────────────              ──────────────────────────
...some text...                 ┌─────────────────────┐
<mark>this insight</mark>  ──►  │ this insight        │
...more text...                 │ canvasMargin:{anc:…}│
                                └─────────────────────┘
         ◄── double-click node to jump back
```

## Features

| Feature | How to trigger |
|---|---|
| Highlight selection | Select text → floating toolbar → **✎ Excerpt** |
| Remove highlight | Click inside a highlight → floating toolbar → **✂ Remove** |
| Sync to Canvas | Ribbon icon or command palette |
| Jump: note → Canvas | Click any highlight in Reading/Live Preview mode |
| Jump: Canvas → note | Double-click a CanvasMargin node |
| Auto-excerpt mode | Settings → **Immersive mode** |
| Auto-sync | Settings → **Auto sync** |

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Copy them to `.obsidian/plugins/canvas-annotator/`.
3. Enable the plugin in **Settings → Community Plugins**.

### BRAT

Add `YangZhaoWeblog/CanvasMargin` in [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Usage

### Highlight Text

1. Open a Markdown note in Live Preview or Editing mode.
2. Select text.
3. Click **✎ Excerpt** in the floating toolbar.

Or enable **Immersive mode**: mouseup with a selection creates the mark immediately.

### Sync to Canvas

Open a Canvas file, then click the **↻** ribbon icon or run `Canvas Annotator: Sync annotations` from the command palette.

When **Auto sync** is enabled and exactly one visible note plus one visible Canvas are open, a new Canvas node is created immediately after highlighting.

### Jump Between Note and Canvas

- **Note → Canvas**: click a highlighted passage in Reading mode or rendered Live Preview.
- **Canvas → Note**: double-click a CanvasMargin node.

### Remove a Highlight

Click inside a highlight, then click **✂ Remove** in the floating toolbar. The `<mark>` tag is removed and the original text remains.

## Settings

| Setting | Default | Description |
|---|---|---|
| Highlight color | Cyan (5) | Color for new marks and Canvas nodes |
| Node gap | 20 px | Vertical gap between auto-placed Canvas nodes |
| Immersive mode | Off | Mouseup selection creates a mark immediately |
| Auto sync | Off | Create a Canvas node right after highlighting when a valid split pair exists |

## How It Works

- Highlights are stored directly in Markdown as `<mark class="cN" id="anc-{nanoid}">text</mark>`.
- Old marks using `class="cN anc-xxx"` are still read for compatibility.
- Canvas nodes store link metadata in a top-level JSON field: `"canvasMargin": { "anc": "..." }`.
- Sync scans all `.canvas` files in the vault to avoid creating duplicate nodes for the same anchor.

## Compatibility

- Obsidian 1.5.0+
- Desktop only

## Release Checklist

Before publishing a GitHub release:

```bash
npm run lint
npm run build
npm test
npm audit
```

The release tag must match `manifest.json` `version`. Upload `main.js`, `manifest.json`, and `styles.css` as release assets.

## For Contributors

- [AGENTS.md](AGENTS.md) — agent entrypoint and project map
- [harness/](harness/) — operational rules
- [docs/design-spec.md](docs/design-spec.md) — current design summary
- [PROGRESS.md](PROGRESS.md) / [DECISIONS.md](DECISIONS.md) — current state and rationale

## License

MIT
