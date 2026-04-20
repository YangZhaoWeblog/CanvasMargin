# Canvas Annotator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian plugin that lets users highlight text in md notes, sync those highlights as nodes to an open Canvas, and jump bidirectionally between md highlights and Canvas nodes.

**Architecture:** Three independent modules — annotator (md → mark tag), syncer (diff anc IDs → create Canvas nodes), jumper (bidirectional navigation via anc matching). They share a models.ts for constants/regex/types. Canvas interaction uses undocumented but stable internal APIs (typed via a local `.d.ts`). Anchors stored in HTML class attributes (`anc-{nanoid}`) because Obsidian's DOMPurify strips `data-*`.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild (CJS bundle), vitest, nanoid

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/models.ts` | Constants, regex, types, shared metadata helpers |
| `src/annotator.ts` | Wrap selected text in `<mark>` with color class + anc ID |
| `src/syncer.ts` | Diff vault ancs vs Canvas ancs → create missing nodes |
| `src/jumper.ts` | Bidirectional jump: md↔Canvas via anc matching |
| `src/settings.ts` | Settings tab with color swatch picker |
| `src/canvas.d.ts` | Type declarations for Canvas internal API |
| `src/main.ts` | Plugin entry: register commands, wire modules |
| `styles.css` | `mark.c1`–`mark.c6` color definitions |
| `tests/models.test.ts` | Unit tests for models |
| `tests/annotator.test.ts` | Unit tests for annotator |
| `tests/syncer.test.ts` | Unit tests for syncer |
| `tests/jumper.test.ts` | Unit tests for jumper |
| `manifest.json` | Obsidian plugin manifest |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript config |
| `esbuild.config.mjs` | Build config |
| `.gitignore` | Ignore node_modules, main.js |

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `esbuild.config.mjs`, `manifest.json`, `.gitignore`, `styles.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "canvas-annotator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "esbuild": "^0.25.0",
    "obsidian": "latest",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  },
  "dependencies": {
    "nanoid": "^5.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "module": "ESNext",
    "target": "ES2020",
    "moduleResolution": "node",
    "strict": true,
    "noImplicitAny": true,
    "isolatedModules": true,
    "lib": ["DOM", "ES2020"],
    "allowSyntheticDefaultImports": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create esbuild.config.mjs**

```javascript
import esbuild from "esbuild";
import { builtinModules } from "node:module";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...builtinModules,
  ],
  format: "cjs",
  target: "es2020",
  outfile: "main.js",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  minify: prod,
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

- [ ] **Step 4: Create manifest.json**

```json
{
  "id": "canvas-annotator",
  "name": "Canvas Annotator",
  "version": "0.1.0",
  "minAppVersion": "1.5.0",
  "description": "Highlight text in notes, sync to Canvas nodes, jump bidirectionally",
  "author": "yangzhao",
  "isDesktopOnly": true
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
main.js
dist/
```

- [ ] **Step 6: Create styles.css**

```css
mark.c1 { background: var(--color-red); }
mark.c2 { background: var(--color-orange); }
mark.c3 { background: var(--color-yellow); }
mark.c4 { background: var(--color-green); }
mark.c5 { background: var(--color-cyan); }
mark.c6 { background: var(--color-purple); }
```

- [ ] **Step 7: Install dependencies and verify build scaffold**

Run: `cd /Users/yangzhao/Code/canvas-annotator && npm install`
Expected: `node_modules/` created, no errors.

Then create a minimal `src/main.ts`:

```typescript
import { Plugin } from "obsidian";

export default class CanvasAnnotatorPlugin extends Plugin {
  async onload() {
    console.log("Canvas Annotator loaded");
  }
}
```

Run: `npm run build`
Expected: `main.js` created, zero errors.

- [ ] **Step 8: Symlink into vault for manual testing**

Run: `ln -s /Users/yangzhao/Code/canvas-annotator /Users/yangzhao/Documents/MyDigitalGarden/.obsidian/plugins/canvas-annotator`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold canvas-annotator plugin"
```

---

### Task 2: models.ts — Constants, types, and shared helpers

**Files:**
- Create: `src/models.ts`
- Create: `tests/models.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  ANC_RE,
  ANC_CLASS_RE,
  CARD_META_RE,
  NODE_GAP,
  NODE_WIDTH,
  extractAncFromClass,
  extractAncFromMeta,
  buildMarkTag,
  buildNodeText,
  type PluginSettings,
  DEFAULT_SETTINGS,
} from "../src/models";

describe("ANC_RE", () => {
  it("matches a 21-char nanoid anchor in class string", () => {
    const cls = "c5 anc-V1StGXR8_Z5jdHi6B-myT";
    const m = cls.match(ANC_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("V1StGXR8_Z5jdHi6B-myT");
  });

  it("does not match short strings", () => {
    expect("c5 anc-short".match(ANC_RE)).toBeNull();
  });
});

describe("ANC_CLASS_RE", () => {
  it("matches mark tag with anc class in markdown source", () => {
    const md = '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello</mark>';
    const m = md.match(ANC_CLASS_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("V1StGXR8_Z5jdHi6B-myT");
    expect(m![2]).toBe("hello");
  });

  it("handles multiword content", () => {
    const md = '<mark class="c3 anc-abcdefghij1234567890A">some long text here</mark>';
    const m = md.match(ANC_CLASS_RE);
    expect(m).not.toBeNull();
    expect(m![2]).toBe("some long text here");
  });
});

describe("extractAncFromClass", () => {
  it("extracts anchor from class string", () => {
    expect(extractAncFromClass("c5 anc-V1StGXR8_Z5jdHi6B-myT")).toBe("V1StGXR8_Z5jdHi6B-myT");
  });

  it("returns null when no anchor", () => {
    expect(extractAncFromClass("c5")).toBeNull();
  });
});

describe("extractAncFromMeta", () => {
  it("extracts anc from card metadata", () => {
    const text = 'hello\n<!--card:{"anc":"abc123def456789012345"}-->';
    expect(extractAncFromMeta(text)).toBe("abc123def456789012345");
  });

  it("returns null when no anc field", () => {
    const text = 'hello\n<!--card:{"id":123}-->';
    expect(extractAncFromMeta(text)).toBeNull();
  });

  it("returns null when no metadata", () => {
    expect(extractAncFromMeta("plain text")).toBeNull();
  });
});

describe("buildMarkTag", () => {
  it("wraps text with mark tag containing color and anchor classes", () => {
    const result = buildMarkTag("hello world", "5", "V1StGXR8_Z5jdHi6B-myT");
    expect(result).toBe('<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello world</mark>');
  });
});

describe("buildNodeText", () => {
  it("creates node text with anchor metadata", () => {
    const result = buildNodeText("hello world", "V1StGXR8_Z5jdHi6B-myT");
    expect(result).toBe('hello world\n<!--card:{"anc":"V1StGXR8_Z5jdHi6B-myT"}-->');
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_SETTINGS.annotationColor).toBe("5");
    expect(DEFAULT_SETTINGS.nodeGap).toBe(20);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/yangzhao/Code/canvas-annotator && npx vitest run tests/models.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// src/models.ts

/** Matches anc-{21 chars} in a class string. Group 1 = the nanoid. */
export const ANC_RE = /anc-([A-Za-z0-9_-]{21})/;

/** Matches a full <mark> tag with anc class. Group 1 = nanoid, Group 2 = inner text. */
export const ANC_CLASS_RE = /<mark\s+class="[^"]*anc-([A-Za-z0-9_-]{21})[^"]*">([\s\S]*?)<\/mark>/;

/** Global version for scanning all marks in a file. */
export const ANC_CLASS_RE_GLOBAL = /<mark\s+class="[^"]*anc-([A-Za-z0-9_-]{21})[^"]*">([\s\S]*?)<\/mark>/g;

/** Matches <!--card:{JSON}--> metadata. Group 1 = the JSON string. */
export const CARD_META_RE = /<!--card:(.*?)-->/;

/** Default gap between auto-placed nodes (px). */
export const NODE_GAP = 20;

/** Default width for auto-created nodes (px). */
export const NODE_WIDTH = 300;

/** Default height for auto-created nodes (px). */
export const NODE_HEIGHT = 100;

/** Extract anc ID from a class string like "c5 anc-xxx". Returns null if not found. */
export function extractAncFromClass(classStr: string): string | null {
  const m = classStr.match(ANC_RE);
  return m ? m[1] : null;
}

/** Extract anc field from <!--card:{...}--> metadata in text. Returns null if not found. */
export function extractAncFromMeta(text: string): string | null {
  const m = CARD_META_RE.exec(text);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    return typeof obj.anc === "string" ? obj.anc : null;
  } catch {
    return null;
  }
}

/** Build a <mark> tag string: `<mark class="cN anc-{id}">text</mark>` */
export function buildMarkTag(text: string, color: string, ancId: string): string {
  return `<mark class="c${color} anc-${ancId}">${text}</mark>`;
}

/** Build Canvas node text with anchor metadata appended. */
export function buildNodeText(text: string, ancId: string): string {
  return `${text}\n<!--card:${JSON.stringify({ anc: ancId })}-->`;
}

export interface PluginSettings {
  annotationColor: string; // "1"-"6"
  nodeGap: number;         // px between auto-placed nodes
}

export const DEFAULT_SETTINGS: PluginSettings = {
  annotationColor: "5",
  nodeGap: 20,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/models.test.ts`
Expected: all 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/models.ts tests/models.test.ts
git commit -m "feat: add models with constants, types, and metadata helpers"
```

---

### Task 3: Canvas type declarations

**Files:**
- Create: `src/canvas.d.ts`

No tests needed — this is a type-only file.

- [ ] **Step 1: Create Canvas type declarations**

These are minimal types extracted from `obsidian-advanced-canvas`'s Canvas.d.ts, covering only the APIs we use:

```typescript
// src/canvas.d.ts
// Minimal type declarations for Obsidian Canvas internal API.
// Based on obsidian-advanced-canvas. These are undocumented APIs.

import { ItemView } from "obsidian";

export interface CanvasView extends ItemView {
  canvas: Canvas;
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CanvasNodeData {
  id: string;
  type: string;
  text?: string;
  file?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  getData(): CanvasNodeData;
  getBBox(): BBox;
}

export interface Canvas {
  nodes: Map<string, CanvasNode>;
  createTextNode(options: {
    pos: { x: number; y: number };
    size: { width: number; height: number };
    text: string;
    focus?: boolean;
  }): CanvasNode;
  addNode(node: CanvasNode): void;
  removeNode(node: CanvasNode): void;
  requestSave(): void;
  zoomToBbox(bbox: BBox): void;
  selectOnly(node: CanvasNode): void;
  getData(): { nodes: CanvasNodeData[]; edges: any[] };
}
```

- [ ] **Step 2: Verify build still works**

Run: `npm run build`
Expected: zero errors (`.d.ts` is type-only, no JS output).

- [ ] **Step 3: Commit**

```bash
git add src/canvas.d.ts
git commit -m "feat: add Canvas internal API type declarations"
```

---

### Task 4: annotator.ts — Highlight text in md

**Files:**
- Create: `src/annotator.ts`
- Create: `tests/annotator.test.ts`

- [ ] **Step 1: Write failing tests**

The annotator's core logic is: given selected text + surrounding document content + cursor position → produce new document content with `<mark>` tag inserted + return the generated anc ID.

```typescript
import { describe, it, expect } from "vitest";
import { annotateSelection } from "../src/annotator";

describe("annotateSelection", () => {
  it("wraps plain selected text with mark tag", () => {
    const doc = "Hello world, this is a test.";
    const result = annotateSelection(doc, 13, 17, "5");
    // "this" is at positions 13-17
    expect(result.newDoc).toMatch(/<mark class="c5 anc-[A-Za-z0-9_-]{21}">this<\/mark>/);
    expect(result.ancId).toMatch(/^[A-Za-z0-9_-]{21}$/);
    // Text before and after is preserved
    expect(result.newDoc).toContain("Hello world, ");
    expect(result.newDoc).toContain(" is a test.");
  });

  it("preserves multiline content around selection", () => {
    const doc = "Line 1\nLine 2\nLine 3";
    const result = annotateSelection(doc, 7, 13, "3");
    expect(result.newDoc).toContain("Line 1\n");
    expect(result.newDoc).toMatch(/<mark class="c3 anc-[A-Za-z0-9_-]{21}">Line 2<\/mark>/);
    expect(result.newDoc).toContain("\nLine 3");
  });

  it("generates unique IDs for different calls", () => {
    const doc = "Hello world";
    const r1 = annotateSelection(doc, 0, 5, "5");
    const r2 = annotateSelection(doc, 0, 5, "5");
    expect(r1.ancId).not.toBe(r2.ancId);
  });

  it("uses the specified color number", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 0, 5, "1");
    expect(result.newDoc).toContain('class="c1 anc-');
  });

  it("handles selection at start of document", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 0, 5, "5");
    expect(result.newDoc).toMatch(/^<mark class="c5 anc-[A-Za-z0-9_-]{21}">Hello<\/mark> world$/);
  });

  it("handles selection at end of document", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 6, 11, "5");
    expect(result.newDoc).toMatch(/^Hello <mark class="c5 anc-[A-Za-z0-9_-]{21}">world<\/mark>$/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/annotator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// src/annotator.ts
import { nanoid } from "nanoid";
import { buildMarkTag } from "./models";

export interface AnnotationResult {
  newDoc: string;
  ancId: string;
  selectedText: string;
}

/**
 * Insert a <mark> annotation around the selected text in a document.
 * @param doc - Full document text
 * @param from - Selection start offset (inclusive)
 * @param to - Selection end offset (exclusive)
 * @param color - Color number "1"-"6"
 * @returns New document text with mark tag, the generated anc ID, and selected text
 */
export function annotateSelection(
  doc: string,
  from: number,
  to: number,
  color: string,
): AnnotationResult {
  const selectedText = doc.slice(from, to);
  const ancId = nanoid();
  const markTag = buildMarkTag(selectedText, color, ancId);
  const newDoc = doc.slice(0, from) + markTag + doc.slice(to);
  return { newDoc, ancId, selectedText };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/annotator.test.ts`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/annotator.ts tests/annotator.test.ts
git commit -m "feat: add annotator module for md text highlighting"
```

---

### Task 5: syncer.ts — Diff and create Canvas nodes

**Files:**
- Create: `src/syncer.ts`
- Create: `tests/syncer.test.ts`

- [ ] **Step 1: Write failing tests**

The syncer has two testable pure functions: `scanVaultAncs` (extract all anc IDs from md content) and `scanCanvasAncs` (extract all anc IDs from Canvas data). The actual Canvas node creation depends on Obsidian APIs and will be integration-tested manually.

```typescript
import { describe, it, expect } from "vitest";
import { scanFileAncs, scanCanvasAncs, computeSyncDiff } from "../src/syncer";

describe("scanFileAncs", () => {
  it("extracts all anc IDs and their text from a markdown string", () => {
    const md = [
      'Some text before',
      '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">highlighted one</mark>',
      'middle text',
      '<mark class="c3 anc-abcdefghij1234567890A">highlighted two</mark>',
      'end text',
    ].join("\n");
    const result = scanFileAncs(md);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ ancId: "V1StGXR8_Z5jdHi6B-myT", text: "highlighted one" });
    expect(result[1]).toEqual({ ancId: "abcdefghij1234567890A", text: "highlighted two" });
  });

  it("returns empty array when no marks", () => {
    expect(scanFileAncs("plain text")).toEqual([]);
  });

  it("handles mark tag spanning multiple words", () => {
    const md = '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello world foo</mark>';
    const result = scanFileAncs(md);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("hello world foo");
  });
});

describe("scanCanvasAncs", () => {
  it("extracts anc IDs from Canvas node data", () => {
    const nodes = [
      { id: "n1", type: "text", text: 'hello\n<!--card:{"anc":"abc12345678901234567"}-->', x: 0, y: 0, width: 300, height: 100 },
      { id: "n2", type: "text", text: 'no anchor here', x: 0, y: 100, width: 300, height: 100 },
      { id: "n3", type: "text", text: '<!--card:{"anc":"def12345678901234567","id":99}-->', x: 0, y: 200, width: 300, height: 100 },
    ];
    const result = scanCanvasAncs(nodes);
    expect(result).toEqual(
      new Map([
        ["abc12345678901234567", { nodeId: "n1", y: 0, height: 100 }],
        ["def12345678901234567", { nodeId: "n3", y: 200, height: 100 }],
      ])
    );
  });

  it("returns empty map when no ancs", () => {
    const nodes = [
      { id: "n1", type: "text", text: "plain", x: 0, y: 0, width: 300, height: 100 },
    ];
    expect(scanCanvasAncs(nodes).size).toBe(0);
  });
});

describe("computeSyncDiff", () => {
  it("identifies new ancs that need Canvas nodes", () => {
    const vaultAncs = [
      { ancId: "aaa12345678901234567", text: "text A", sourcePath: "note1.md" },
      { ancId: "bbb12345678901234567", text: "text B", sourcePath: "note1.md" },
      { ancId: "ccc12345678901234567", text: "text C", sourcePath: "note2.md" },
    ];
    const canvasAncs = new Map([
      ["aaa12345678901234567", { nodeId: "n1", y: 0, height: 100 }],
    ]);
    const diff = computeSyncDiff(vaultAncs, canvasAncs);
    expect(diff.toCreate).toHaveLength(2);
    expect(diff.toCreate[0].ancId).toBe("bbb12345678901234567");
    expect(diff.toCreate[1].ancId).toBe("ccc12345678901234567");
    expect(diff.orphanCount).toBe(0);
  });

  it("counts orphans: canvas has anc not in vault", () => {
    const vaultAncs = [
      { ancId: "aaa12345678901234567", text: "text A", sourcePath: "note1.md" },
    ];
    const canvasAncs = new Map([
      ["aaa12345678901234567", { nodeId: "n1", y: 0, height: 100 }],
      ["zzz12345678901234567", { nodeId: "n2", y: 100, height: 100 }],
    ]);
    const diff = computeSyncDiff(vaultAncs, canvasAncs);
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.orphanCount).toBe(1);
  });

  it("returns empty when fully synced", () => {
    const vaultAncs = [
      { ancId: "aaa12345678901234567", text: "text A", sourcePath: "note1.md" },
    ];
    const canvasAncs = new Map([
      ["aaa12345678901234567", { nodeId: "n1", y: 0, height: 100 }],
    ]);
    const diff = computeSyncDiff(vaultAncs, canvasAncs);
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.orphanCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/syncer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// src/syncer.ts
import {
  ANC_CLASS_RE_GLOBAL,
  extractAncFromMeta,
  buildNodeText,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_GAP,
} from "./models";
import type { Canvas, CanvasNodeData } from "./canvas";

export interface FileAnc {
  ancId: string;
  text: string;
}

export interface VaultAnc extends FileAnc {
  sourcePath: string;
}

export interface CanvasAncInfo {
  nodeId: string;
  y: number;
  height: number;
}

export interface SyncDiff {
  toCreate: VaultAnc[];
  orphanCount: number;
}

/** Scan a single md file's content for all <mark class="cN anc-xxx">text</mark> entries. */
export function scanFileAncs(content: string): FileAnc[] {
  const results: FileAnc[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex for global regex
  const re = new RegExp(ANC_CLASS_RE_GLOBAL.source, "g");
  while ((m = re.exec(content)) !== null) {
    results.push({ ancId: m[1], text: m[2] });
  }
  return results;
}

/** Scan Canvas node data for all anc IDs in <!--card:{...}--> metadata. */
export function scanCanvasAncs(
  nodes: Pick<CanvasNodeData, "id" | "type" | "text" | "y" | "height">[]
): Map<string, CanvasAncInfo> {
  const result = new Map<string, CanvasAncInfo>();
  for (const node of nodes) {
    if (node.type !== "text" || !node.text) continue;
    const anc = extractAncFromMeta(node.text);
    if (anc) {
      result.set(anc, { nodeId: node.id, y: node.y, height: node.height });
    }
  }
  return result;
}

/** Compute which vault ancs need new Canvas nodes, and count orphans. */
export function computeSyncDiff(
  vaultAncs: VaultAnc[],
  canvasAncs: Map<string, CanvasAncInfo>,
): SyncDiff {
  const vaultAncIds = new Set(vaultAncs.map((a) => a.ancId));
  const toCreate = vaultAncs.filter((a) => !canvasAncs.has(a.ancId));
  let orphanCount = 0;
  for (const ancId of canvasAncs.keys()) {
    if (!vaultAncIds.has(ancId)) orphanCount++;
  }
  return { toCreate, orphanCount };
}

/** Calculate the Y position for the next new node based on existing Canvas nodes. */
export function nextNodeY(canvasAncs: Map<string, CanvasAncInfo>, gap: number): number {
  let maxBottom = 0;
  for (const info of canvasAncs.values()) {
    const bottom = info.y + info.height;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  return maxBottom > 0 ? maxBottom + gap : 0;
}

/**
 * Create Canvas nodes for the given anchors.
 * This function calls Canvas internal API and must run when a Canvas is open.
 */
export function createNodes(
  canvas: Canvas,
  toCreate: VaultAnc[],
  startY: number,
  color: string,
  gap: number,
): number {
  let y = startY;
  for (const anc of toCreate) {
    const text = buildNodeText(anc.text, anc.ancId);
    canvas.createTextNode({
      pos: { x: 0, y },
      size: { width: NODE_WIDTH, height: NODE_HEIGHT },
      text,
    });
    y += NODE_HEIGHT + gap;
  }
  canvas.requestSave();
  return toCreate.length;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/syncer.test.ts`
Expected: all 8 tests PASS.

- [ ] **Step 5: Add test for nextNodeY**

Add to `tests/syncer.test.ts`:

```typescript
import { nextNodeY } from "../src/syncer";

describe("nextNodeY", () => {
  it("returns 0 when no existing nodes", () => {
    expect(nextNodeY(new Map(), 20)).toBe(0);
  });

  it("returns maxBottom + gap", () => {
    const canvasAncs = new Map([
      ["a".repeat(21), { nodeId: "n1", y: 0, height: 100 }],
      ["b".repeat(21), { nodeId: "n2", y: 120, height: 100 }],
    ]);
    expect(nextNodeY(canvasAncs, 20)).toBe(240); // 120 + 100 + 20
  });
});
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/syncer.ts tests/syncer.test.ts
git commit -m "feat: add syncer module for diff-and-create Canvas nodes"
```

---

### Task 6: jumper.ts — Bidirectional navigation

**Files:**
- Create: `src/jumper.ts`
- Create: `tests/jumper.test.ts`

- [ ] **Step 1: Write failing tests**

The jumper has two pure search functions: `findAncInCanvasFiles` (search .canvas JSONs for an anc) and `findAncInMdFiles` (search .md files for an anc class). Actual file I/O and navigation uses Obsidian API, tested manually.

```typescript
import { describe, it, expect } from "vitest";
import { findAncInCanvasJson, findAncInMdContent } from "../src/jumper";

describe("findAncInCanvasJson", () => {
  it("finds the node ID containing the given anc", () => {
    const json = JSON.stringify({
      nodes: [
        { id: "n1", type: "text", text: 'hello\n<!--card:{"anc":"abc12345678901234567"}-->', x: 0, y: 0, width: 300, height: 100 },
        { id: "n2", type: "text", text: "no anchor", x: 0, y: 100, width: 300, height: 100 },
      ],
      edges: [],
    });
    const result = findAncInCanvasJson(json, "abc12345678901234567");
    expect(result).not.toBeNull();
    expect(result!.nodeId).toBe("n1");
  });

  it("returns null when anc not found", () => {
    const json = JSON.stringify({ nodes: [], edges: [] });
    expect(findAncInCanvasJson(json, "abc12345678901234567")).toBeNull();
  });
});

describe("findAncInMdContent", () => {
  it("finds the character offset of the mark tag", () => {
    const md = 'line 1\n<mark class="c5 anc-abc12345678901234567">hi</mark>\nline 3';
    const result = findAncInMdContent(md, "abc12345678901234567");
    expect(result).not.toBeNull();
    expect(result!.offset).toBe(7); // starts after "line 1\n"
  });

  it("returns null when anc not found", () => {
    expect(findAncInMdContent("plain text", "abc12345678901234567")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/jumper.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// src/jumper.ts
import { extractAncFromMeta } from "./models";

export interface CanvasSearchResult {
  nodeId: string;
}

export interface MdSearchResult {
  offset: number;
}

/** Search a Canvas JSON string for a node containing the given anc ID. */
export function findAncInCanvasJson(json: string, ancId: string): CanvasSearchResult | null {
  try {
    const data = JSON.parse(json);
    const nodes: any[] = data.nodes ?? [];
    for (const node of nodes) {
      if (node.type !== "text" || !node.text) continue;
      const anc = extractAncFromMeta(node.text);
      if (anc === ancId) {
        return { nodeId: node.id };
      }
    }
  } catch {
    // Invalid JSON, skip
  }
  return null;
}

/** Search md content for a <mark> tag with the given anc ID. Returns the character offset. */
export function findAncInMdContent(content: string, ancId: string): MdSearchResult | null {
  const pattern = `anc-${ancId}`;
  const idx = content.indexOf(pattern);
  if (idx === -1) return null;
  // Walk backwards to find the start of the <mark tag
  const markStart = content.lastIndexOf("<mark", idx);
  if (markStart === -1) return null;
  return { offset: markStart };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/jumper.test.ts`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/jumper.ts tests/jumper.test.ts
git commit -m "feat: add jumper module for bidirectional anc search"
```

---

### Task 7: settings.ts — Settings tab with color swatches

**Files:**
- Create: `src/settings.ts`

No unit tests — settings tab depends on Obsidian DOM APIs. Tested manually.

- [ ] **Step 1: Write implementation**

```typescript
// src/settings.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import type CanvasAnnotatorPlugin from "./main";
import type { PluginSettings } from "./models";

const COLOR_CSS_VARS: Record<string, string> = {
  "1": "--color-red",
  "2": "--color-orange",
  "3": "--color-yellow",
  "4": "--color-green",
  "5": "--color-cyan",
  "6": "--color-purple",
};

export class CanvasAnnotatorSettingTab extends PluginSettingTab {
  plugin: CanvasAnnotatorPlugin;

  constructor(app: App, plugin: CanvasAnnotatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas Annotator Settings" });

    // ── Color picker: 6 clickable swatches ──
    const colorSetting = new Setting(containerEl)
      .setName("摘录颜色")
      .setDesc("新摘录的高亮颜色和 Canvas 节点颜色");

    const swatchContainer = colorSetting.controlEl.createDiv();
    swatchContainer.style.display = "flex";
    swatchContainer.style.gap = "6px";

    const swatches: HTMLElement[] = [];

    for (const [idx, cssVar] of Object.entries(COLOR_CSS_VARS)) {
      const swatch = swatchContainer.createDiv();
      const resolved = getComputedStyle(document.body).getPropertyValue(cssVar).trim();
      swatch.style.backgroundColor = resolved || cssVar;
      swatch.style.width = "28px";
      swatch.style.height = "28px";
      swatch.style.borderRadius = "6px";
      swatch.style.cursor = "pointer";
      swatch.style.border = "2px solid transparent";
      swatch.style.transition = "border-color 0.15s";

      if (idx === this.plugin.settings.annotationColor) {
        swatch.style.border = "2px solid var(--text-normal)";
      }

      swatch.addEventListener("click", async () => {
        this.plugin.settings.annotationColor = idx;
        await this.plugin.saveSettings();
        for (const s of swatches) {
          s.style.border = "2px solid transparent";
        }
        swatch.style.border = "2px solid var(--text-normal)";
      });

      swatches.push(swatch);
    }

    // ── Node gap ──
    new Setting(containerEl)
      .setName("节点间距")
      .setDesc("Canvas 中自动排列节点的垂直间距 (px)")
      .addText((t) =>
        t
          .setValue(String(this.plugin.settings.nodeGap))
          .onChange(async (v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 0) {
              this.plugin.settings.nodeGap = n;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
```

- [ ] **Step 2: Verify build works**

Run: `npm run build`
Expected: zero errors (main.ts still minimal, but settings.ts must compile).

Note: This will fail because main.ts doesn't export the right type yet. That's expected — we'll wire it in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/settings.ts
git commit -m "feat: add settings tab with color swatches"
```

---

### Task 8: main.ts — Plugin wiring

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Write full main.ts**

```typescript
// src/main.ts
import { ItemView, MarkdownView, Notice, Plugin } from "obsidian";
import { annotateSelection } from "./annotator";
import {
  scanFileAncs,
  scanCanvasAncs,
  computeSyncDiff,
  nextNodeY,
  createNodes,
  type VaultAnc,
} from "./syncer";
import { findAncInCanvasJson, findAncInMdContent } from "./jumper";
import { extractAncFromClass, extractAncFromMeta, ANC_RE } from "./models";
import type { PluginSettings } from "./models";
import { DEFAULT_SETTINGS } from "./models";
import { CanvasAnnotatorSettingTab } from "./settings";
import type { Canvas, CanvasView, CanvasNode } from "./canvas";

export default class CanvasAnnotatorPlugin extends Plugin {
  settings: PluginSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

    // Command: Annotate selection
    this.addCommand({
      id: "annotate-selection",
      name: "Annotate selection",
      editorCallback: (editor) => {
        const selection = editor.getSelection();
        if (!selection) {
          new Notice("请先选中文本");
          return;
        }
        const doc = editor.getValue();
        const from = editor.posToOffset(editor.getCursor("from"));
        const to = editor.posToOffset(editor.getCursor("to"));
        const result = annotateSelection(doc, from, to, this.settings.annotationColor);
        editor.setValue(result.newDoc);
        // Place cursor after the inserted mark tag
        const newCursorPos = from + result.newDoc.length - doc.length + (to - from);
        editor.setCursor(editor.offsetToPos(to + (result.newDoc.length - doc.length)));
        new Notice("已摘录");
      },
    });

    // Command: Sync annotations to Canvas
    this.addCommand({
      id: "sync-annotations",
      name: "Sync annotations to Canvas",
      callback: () => this.syncAnnotations(),
    });

    // Command: Jump to linked annotation
    this.addCommand({
      id: "jump-to-annotation",
      name: "Jump to linked annotation",
      callback: () => this.jumpToAnnotation(),
    });

    this.addSettingTab(new CanvasAnnotatorSettingTab(this.app, this));
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /** Scan vault for all anc marks, diff against open Canvas, create missing nodes. */
  private async syncAnnotations() {
    const canvasView = this.getCanvasView();
    if (!canvasView) {
      new Notice("请先打开一个 Canvas 文件");
      return;
    }
    const canvas = canvasView.canvas;

    // Collect all ancs from all md files in vault
    const allVaultAncs: VaultAnc[] = [];
    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const file of mdFiles) {
      const content = await this.app.vault.cachedRead(file);
      const fileAncs = scanFileAncs(content);
      for (const fa of fileAncs) {
        allVaultAncs.push({ ...fa, sourcePath: file.path });
      }
    }

    // Collect all ancs from Canvas
    const canvasData = canvas.getData();
    const canvasAncs = scanCanvasAncs(canvasData.nodes);

    // Compute diff
    const diff = computeSyncDiff(allVaultAncs, canvasAncs);

    if (diff.toCreate.length === 0) {
      let msg = "已完全同步，无新节点需要创建";
      if (diff.orphanCount > 0) {
        msg += `\n发现 ${diff.orphanCount} 个孤儿锚点`;
      }
      new Notice(msg);
      return;
    }

    // Create nodes
    const startY = nextNodeY(canvasAncs, this.settings.nodeGap);
    const created = createNodes(
      canvas,
      diff.toCreate,
      startY,
      this.settings.annotationColor,
      this.settings.nodeGap,
    );

    let msg = `✓ 已创建 ${created} 个新节点`;
    if (diff.orphanCount > 0) {
      msg += `，发现 ${diff.orphanCount} 个孤儿锚点`;
    }
    new Notice(msg, 4000);
  }

  /** Jump bidirectionally: md → Canvas or Canvas → md. */
  private async jumpToAnnotation() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView) {
      // We're in a markdown file → jump to Canvas
      await this.jumpMdToCanvas(activeView);
    } else {
      // Try Canvas → md
      const canvasView = this.getCanvasView();
      if (canvasView) {
        await this.jumpCanvasToMd(canvasView);
      } else {
        new Notice("请在 md 文件或 Canvas 中使用此命令");
      }
    }
  }

  private async jumpMdToCanvas(view: MarkdownView) {
    const editor = view.editor;
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const m = line.match(ANC_RE);
    if (!m) {
      new Notice("光标处没有摘录锚点");
      return;
    }
    const ancId = m[1];

    // Search all .canvas files
    const canvasFiles = this.app.vault.getFiles().filter((f) => f.extension === "canvas");
    for (const file of canvasFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInCanvasJson(content, ancId);
      if (result) {
        // Open the canvas file
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
        // Wait briefly for Canvas view to initialize
        setTimeout(() => {
          const cv = this.getCanvasView();
          if (!cv) return;
          const node = cv.canvas.nodes.get(result.nodeId);
          if (node) {
            cv.canvas.selectOnly(node);
            cv.canvas.zoomToBbox(node.getBBox());
          }
        }, 200);
        return;
      }
    }
    new Notice("未找到对应的 Canvas 节点");
  }

  private async jumpCanvasToMd(canvasView: CanvasView) {
    const canvas = canvasView.canvas;
    // Get selected node
    const selectedNodes = [...canvas.nodes.values()].filter(
      (n: any) => n.nodeEl?.hasClass?.("is-focused") || false
    );
    if (selectedNodes.length === 0) {
      new Notice("请先选中一个 Canvas 节点");
      return;
    }
    const node = selectedNodes[0];
    const nodeData = node.getData();
    const ancId = extractAncFromMeta(nodeData.text ?? "");
    if (!ancId) {
      new Notice("该节点没有摘录锚点");
      return;
    }

    // Search all md files
    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const file of mdFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInMdContent(content, ancId);
      if (result) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
        // Wait for editor to load, then scroll
        setTimeout(() => {
          const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!mdView) return;
          const pos = mdView.editor.offsetToPos(result.offset);
          mdView.editor.setCursor(pos);
          mdView.editor.scrollIntoView(
            { from: pos, to: pos },
            true,
          );
        }, 200);
        return;
      }
    }
    new Notice("未找到对应的 md 标记");
  }

  private getCanvasView(): CanvasView | null {
    const leaves = this.app.workspace.getLeavesOfType("canvas");
    if (leaves.length === 0) return null;
    // Return the most recently active canvas leaf
    return leaves[0].view as unknown as CanvasView;
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: `main.js` created, zero errors.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: all tests PASS (main.ts has no unit tests — it's Obsidian wiring).

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire up plugin commands, sync, and jump logic"
```

---

### Task 9: Color assignment on Canvas node creation

The `createNodes` function in syncer.ts currently doesn't set `color` on the created node. Canvas text nodes accept a `color` field. We need to update `createTextNode` to pass the color.

**Files:**
- Modify: `src/syncer.ts`
- Modify: `src/canvas.d.ts`

- [ ] **Step 1: Update canvas.d.ts to include color in createTextNode**

Add `color` to the createTextNode options:

```typescript
  createTextNode(options: {
    pos: { x: number; y: number };
    size: { width: number; height: number };
    text: string;
    focus?: boolean;
    color?: string;
  }): CanvasNode;
```

- [ ] **Step 2: Update createNodes to pass color**

In `src/syncer.ts`, update the `createNodes` function:

```typescript
export function createNodes(
  canvas: Canvas,
  toCreate: VaultAnc[],
  startY: number,
  color: string,
  gap: number,
): number {
  let y = startY;
  for (const anc of toCreate) {
    const text = buildNodeText(anc.text, anc.ancId);
    const node = canvas.createTextNode({
      pos: { x: 0, y },
      size: { width: NODE_WIDTH, height: NODE_HEIGHT },
      text,
      color,
    });
    y += NODE_HEIGHT + gap;
  }
  canvas.requestSave();
  return toCreate.length;
}
```

- [ ] **Step 3: Build and run tests**

Run: `npx vitest run && npm run build`
Expected: all tests PASS, build clean.

- [ ] **Step 4: Commit**

```bash
git add src/syncer.ts src/canvas.d.ts
git commit -m "feat: pass annotation color to Canvas node creation"
```

---

### Task 10: Integration build + symlink verification

**Files:** No new files.

- [ ] **Step 1: Full build**

Run: `cd /Users/yangzhao/Code/canvas-annotator && npm run build`
Expected: zero errors.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: all tests PASS. Print the count.

- [ ] **Step 3: Verify symlink exists**

Run: `ls -la /Users/yangzhao/Documents/MyDigitalGarden/.obsidian/plugins/canvas-annotator`
Expected: symlink points to `/Users/yangzhao/Code/canvas-annotator`.

- [ ] **Step 4: Verify plugin files**

Run: `ls /Users/yangzhao/Code/canvas-annotator/main.js /Users/yangzhao/Code/canvas-annotator/manifest.json /Users/yangzhao/Code/canvas-annotator/styles.css`
Expected: all three files exist.

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "chore: integration build verification"
```
