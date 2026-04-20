import { MarkdownView, Notice, Plugin, type WorkspaceLeaf } from "obsidian";
import { annotateSelection, shouldSkipAnnotation, removeAnnotation } from "./annotator";
import {
  scanFileAncs,
  scanCanvasAncs,
  scanCanvasJsonAncs,
  computeSyncDiff,
  nextNodeY,
  createNodes,
  type VaultAnc,
  type CanvasAncInfo,
} from "./syncer";
import { findAncInCanvasJson, findAncInMdContent } from "./jumper";
import { extractAncFromMeta, ANC_RE } from "./models";
import type { PluginSettings } from "./models";
import { DEFAULT_SETTINGS } from "./models";
import { CanvasAnnotatorSettingTab } from "./settings";
import type { CanvasView } from "./canvas";
import { FloatingToolbar, getToolbarAction } from "./toolbar";
import { syncPanelExtension } from "./panel";

export default class CanvasAnnotatorPlugin extends Plugin {
  settings: PluginSettings = { ...DEFAULT_SETTINGS };
  private toolbar: FloatingToolbar | null = null;
  private mouseupHandler: (() => void) | null = null;
  private mousedownHandler: ((e: MouseEvent) => void) | null = null;
  private scrollHandler: (() => void) | null = null;
  private suppressScrollUntil = 0; // timestamp: ignore scroll events before this
  /** Rect of a mark element captured on mousedown, before CM6 collapses the decoration. */
  private pendingRemoveRect: DOMRect | null = null;

  async onload() {
    await this.loadSettings();

    // ── CM6 top panel ──
    this.registerEditorExtension([syncPanelExtension(() => this.syncAnnotations())]);

    // ── Ribbon (backup entry point) ──
    this.addRibbonIcon("refresh-cw", "Sync annotations to Canvas", () => this.syncAnnotations());

    // ── Floating toolbar ──
    this.toolbar = new FloatingToolbar(
      () => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!mdView) return;
        this.doAnnotate(mdView);
      },
      () => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!mdView) return;
        this.doRemove(mdView);
      },
    );

    // mouseup listener — shows toolbar or auto-annotates
    this.mouseupHandler = () => setTimeout(() => this.handleMouseup(), 150);
    document.addEventListener("mouseup", this.mouseupHandler);

    // mousedown listener — capture mark rect BEFORE CM6 collapses the decoration
    this.mousedownHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // New format: id="anc-xxx"; old format: class contains "anc-"
      const markEl = target.closest?.('mark[id^="anc-"], mark[class*="anc-"]') as HTMLElement | null;
      this.pendingRemoveRect = markEl ? markEl.getBoundingClientRect() : null;
    };
    document.addEventListener("mousedown", this.mousedownHandler);

    // Hide toolbar on scroll — but not if we just showed it (suppress race condition)
    this.scrollHandler = () => {
      if (Date.now() < this.suppressScrollUntil) return;
      this.toolbar?.hide();
    };
    document.addEventListener("scroll", this.scrollHandler, true);

    // ── Commands ──
    this.addCommand({
      id: "annotate-selection",
      name: "Annotate selection",
      editorCallback: (_editor) => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!mdView) return;
        this.doAnnotate(mdView);
      },
    });

    this.addCommand({
      id: "sync-annotations",
      name: "Sync annotations to Canvas",
      callback: () => this.syncAnnotations(),
    });

    this.addCommand({
      id: "jump-to-annotation",
      name: "Jump to linked annotation",
      callback: () => this.jumpToAnnotation(),
    });

    // ── Canvas double-click → jump to MD ──
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.bindCanvasDblClick())
    );
    this.bindCanvasDblClick();

    // ── Post-processor: click-to-jump ──
    this.registerMarkdownPostProcessor((el) => {
      el.querySelectorAll<HTMLElement>("mark").forEach((markEl) => {
        if (markEl.dataset.ancBound === "1") return;

        // New format: id="anc-xxx"
        let ancId: string | null = null;
        const id = markEl.id;
        if (id?.startsWith("anc-")) {
          ancId = id.slice(4);
        } else {
          // Old format: class="cN anc-xxx"
          const ancClass = Array.from(markEl.classList).find((c) => c.startsWith("anc-"));
          if (ancClass) ancId = ancClass.slice(4);
        }
        if (!ancId) return;

        markEl.dataset.ancBound = "1";
        markEl.addClass("canvas-annotator-link");
        markEl.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.jumpToCanvasByAncId(ancId!);
        });
      });
    });

    this.addSettingTab(new CanvasAnnotatorSettingTab(this.app, this));
  }

  onunload() {
    if (this.mouseupHandler) {
      document.removeEventListener("mouseup", this.mouseupHandler);
    }
    if (this.mousedownHandler) {
      document.removeEventListener("mousedown", this.mousedownHandler);
    }
    if (this.scrollHandler) {
      document.removeEventListener("scroll", this.scrollHandler, true);
    }
    this.toolbar?.destroy();
  }

  private handleMouseup() {
    // Fast path: mousedown captured a mark element's rect before CM6 collapsed it.
    // Use that rect directly — bypasses unreliable getCursor() timing entirely.
    if (this.pendingRemoveRect) {
      const rect = this.pendingRemoveRect;
      this.pendingRemoveRect = null;
      this.suppressScrollUntil = Date.now() + 300;
      this.toolbar?.show("remove", rect);
      return;
    }

    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      this.toolbar?.hide();
      return;
    }
    const editor = mdView.editor;
    const doc = editor.getValue();
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));

    const action = getToolbarAction(doc, from, to);

    if (!action) {
      this.toolbar?.hide();
      return;
    }

    // autoAnnotate mode: skip toolbar, annotate immediately
    if (action === "annotate" && this.settings.autoAnnotate) {
      if (!shouldSkipAnnotation(doc, from, to)) {
        this.doAnnotate(mdView);
      }
      return;
    }

    // Show floating toolbar
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.toolbar?.hide();
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      this.toolbar?.hide();
      return;
    }
    // Suppress scroll-hide for 300ms after showing — prevents CM6 reflow race
    this.suppressScrollUntil = Date.now() + 300;
    this.toolbar?.show(action, rect);
  }

  private async doAnnotate(mdView: MarkdownView) {
    const editor = mdView.editor;
    const selection = editor.getSelection();
    if (!selection) {
      new Notice("请先选中文本");
      return;
    }
    const doc = editor.getValue();
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));
    if (shouldSkipAnnotation(doc, from, to)) return;

    const result = annotateSelection(doc, from, to, this.settings.annotationColor);
    editor.setValue(result.newDoc);
    editor.setCursor(editor.offsetToPos(to + (result.newDoc.length - doc.length)));

    // autoSync: pass the new anc directly — only if split pair is valid
    if (this.settings.autoSync) {
      const { error: syncError } = this.getVisibleSplitPair();
      if (!syncError) {
        await this.syncAnnotations({ ancId: result.ancId, text: selection });
      }
    }
  }

  private doRemove(mdView: MarkdownView) {
    const editor = mdView.editor;
    const doc = editor.getValue();
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));
    const result = removeAnnotation(doc, from, to);
    if (!result) {
      new Notice("光标处没有摘录锚点");
      return;
    }
    editor.setValue(result.newDoc);
    editor.setCursor(editor.offsetToPos(result.from));
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async syncAnnotations(immediate?: { ancId: string; text: string }) {
    const { canvasLeaf, mdLeaf, error } = this.getVisibleSplitPair();
    if (error || !canvasLeaf || !mdLeaf) {
      new Notice(error ?? "请在分屏中打开笔记和 Canvas");
      return;
    }
    const canvasView = canvasLeaf.view as unknown as CanvasView;
    const canvas = canvasView.canvas;

    // Fast path: called from doAnnotate with fresh anc — skip vault cache
    if (immediate) {
      const currentCanvasAncs = scanCanvasAncs(canvas.getData().nodes);
      if (currentCanvasAncs.has(immediate.ancId)) return; // already exists
      const startY = nextNodeY(currentCanvasAncs, this.settings.nodeGap);
      createNodes(
        canvas,
        [{ ancId: immediate.ancId, text: immediate.text, sourcePath: "" }],
        startY,
        this.settings.annotationColor,
        this.settings.nodeGap,
      );
      return;
    }

    // Full sync path: scan only the visible md file
    const allVaultAncs: VaultAnc[] = [];
    const mdView = mdLeaf.view as MarkdownView;
    if (mdView.file) {
      const content = await this.app.vault.cachedRead(mdView.file);
      const fileAncs = scanFileAncs(content);
      for (const fa of fileAncs) {
        allVaultAncs.push({ ...fa, sourcePath: mdView.file.path });
      }
    }

    // Build global anc map: union of ALL .canvas files in vault
    // This prevents duplicating a node that already exists in another canvas
    const globalCanvasAncs = new Map<string, CanvasAncInfo>();
    const canvasFiles = this.app.vault.getFiles().filter((f) => f.extension === "canvas");
    for (const file of canvasFiles) {
      const json = await this.app.vault.cachedRead(file);
      const ancIds = scanCanvasJsonAncs(json);
      // For global dedup we only need the set of IDs; store dummy info
      for (const ancId of ancIds) {
        if (!globalCanvasAncs.has(ancId)) {
          globalCanvasAncs.set(ancId, { nodeId: "", y: 0, height: 0 });
        }
      }
    }

    // Current canvas ancs (used for orphan count + nextNodeY)
    const currentCanvasAncs = scanCanvasAncs(canvas.getData().nodes);
    // Merge current canvas info into global map (so orphan count uses real data)
    for (const [ancId, info] of currentCanvasAncs) {
      globalCanvasAncs.set(ancId, info);
    }

    const diff = computeSyncDiff(allVaultAncs, globalCanvasAncs);

    if (diff.toCreate.length === 0) {
      let msg = "已完全同步，无新节点需要创建";
      // Orphan count: ancs in current canvas not in vault
      const orphanCount = [...currentCanvasAncs.keys()].filter(
        (id) => !allVaultAncs.some((a) => a.ancId === id)
      ).length;
      if (orphanCount > 0) {
        msg += `\n发现 ${orphanCount} 个孤儿锚点`;
      }
      new Notice(msg);
      return;
    }

    const startY = nextNodeY(currentCanvasAncs, this.settings.nodeGap);
    const created = createNodes(
      canvas,
      diff.toCreate,
      startY,
      this.settings.annotationColor,
      this.settings.nodeGap,
    );

    // Orphan count only for current canvas
    const orphanCount = [...currentCanvasAncs.keys()].filter(
      (id) => !allVaultAncs.some((a) => a.ancId === id)
    ).length;

    let msg = `✓ 已创建 ${created} 个新节点`;
    if (orphanCount > 0) {
      msg += `，发现 ${orphanCount} 个孤儿锚点`;
    }
    new Notice(msg, 4000);
  }

  private async jumpToAnnotation() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (activeView) {
      await this.jumpMdToCanvas(activeView);
    } else {
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
    await this.jumpToCanvasByAncId(m[1]);
  }

  /** Core logic: given an ancId, search all canvas files and zoom to the matching node. */
  private async jumpToCanvasByAncId(ancId: string) {
    const canvasFiles = this.app.vault.getFiles().filter((f) => f.extension === "canvas");
    for (const file of canvasFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInCanvasJson(content, ancId);
      if (result) {
        // Reuse existing canvas leaf for this file, or split a new one
        const existingLeaf = this.app.workspace
          .getLeavesOfType("canvas")
          .find((l) => (l.view as any)?.file?.path === file.path);
        const leaf = existingLeaf ?? this.app.workspace.getLeaf("split");
        await leaf.openFile(file);
        setTimeout(() => {
          const cv = leaf.view as unknown as CanvasView;
          if (!cv?.canvas) return;
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
    const selectedNodes = [...canvasView.canvas.selection];
    if (selectedNodes.length === 0) {
      new Notice("请先选中一个 Canvas 节点");
      return;
    }
    const ancId = extractAncFromMeta(selectedNodes[0].getData().text ?? "");
    if (!ancId) {
      new Notice("该节点没有摘录锚点");
      return;
    }
    await this.jumpMdByAncId(ancId);
  }

  private getCanvasView(): CanvasView | null {
    const leaves = this.app.workspace.getLeavesOfType("canvas");
    if (leaves.length === 0) return null;
    return leaves[0].view as unknown as CanvasView;
  }

  /**
   * Find exactly 1 visible md leaf + 1 visible canvas leaf in the current split layout.
   * "Visible" = shown in a split pane (not hidden behind a tab).
   */
  private getVisibleSplitPair(): {
    mdLeaf: WorkspaceLeaf | null;
    canvasLeaf: WorkspaceLeaf | null;
    error: string | null;
  } {
    const visibleMd: WorkspaceLeaf[] = [];
    const visibleCanvas: WorkspaceLeaf[] = [];

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!leaf.view?.containerEl?.isShown()) return;
      const vt = leaf.view.getViewType();
      if (vt === "markdown") visibleMd.push(leaf);
      else if (vt === "canvas") visibleCanvas.push(leaf);
    });

    if (visibleMd.length === 0)
      return { mdLeaf: null, canvasLeaf: null, error: "请先打开笔记文件" };
    if (visibleCanvas.length === 0)
      return { mdLeaf: null, canvasLeaf: null, error: "请先打开 Canvas" };
    if (visibleMd.length > 1)
      return { mdLeaf: null, canvasLeaf: null, error: "检测到多个可见笔记，请只保留一个" };
    if (visibleCanvas.length > 1)
      return { mdLeaf: null, canvasLeaf: null, error: "检测到多个可见 Canvas，请只保留一个" };

    return { mdLeaf: visibleMd[0], canvasLeaf: visibleCanvas[0], error: null };
  }

  /**
   * Bind a dblclick handler to every open canvas leaf's container.
   * Uses a data attribute to avoid double-binding.
   * Called on load and on layout-change (new canvas opened).
   */
  private bindCanvasDblClick() {
    this.app.workspace.getLeavesOfType("canvas").forEach((leaf) => {
      const container = leaf.view.containerEl;
      if (container.dataset.ancDblBound === "1") return;
      container.dataset.ancDblBound = "1";
      container.addEventListener("dblclick", async (e: MouseEvent) => {
        const canvasView = leaf.view as unknown as CanvasView;
        const selected = [...canvasView.canvas.selection];
        if (selected.length === 0) return;
        const ancId = extractAncFromMeta(selected[0].getData().text ?? "");
        if (!ancId) return;
        e.stopPropagation();
        await this.jumpMdByAncId(ancId);
      });
    });
  }

  /** Search all md files for ancId and scroll to it. */
  private async jumpMdByAncId(ancId: string) {
    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const file of mdFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInMdContent(content, ancId);
      if (result) {
        const existingLeaf = this.app.workspace
          .getLeavesOfType("markdown")
          .find((l) => (l.view as any)?.file?.path === file.path);
        const leaf = existingLeaf ?? this.app.workspace.getLeaf("split");
        await leaf.openFile(file);
        setTimeout(() => {
          const mdView = leaf.view as unknown as MarkdownView;
          if (!mdView?.editor) return;
          const pos = mdView.editor.offsetToPos(result.offset);
          mdView.editor.setCursor(pos);
          mdView.editor.scrollIntoView({ from: pos, to: pos }, true);
        }, 200);
        return;
      }
    }
    new Notice("未找到对应的 md 标记");
  }
}
