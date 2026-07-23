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
import { readMarginMeta, ANC_RE } from "./models";
import type { PluginSettings } from "./models";
import { DEFAULT_SETTINGS } from "./models";
import { CanvasAnnotatorSettingTab } from "./settings";
import type { CanvasView } from "./canvas";
import { FloatingToolbar, getToolbarAction } from "./toolbar";

export default class CanvasAnnotatorPlugin extends Plugin {
  settings: PluginSettings = { ...DEFAULT_SETTINGS };
  private toolbar: FloatingToolbar | null = null;
  private mouseupHandler: (() => void) | null = null;
  private scrollHandler: (() => void) | null = null;

  async onload() {
    // 1. 先加载持久化设置，后面的命令和 UI 都会读取它。
    await this.loadSettings();

    // 2. 左侧 ribbon 入口：手动把 Markdown 摘录同步到 Canvas。
    this.addRibbonIcon("refresh-cw", "Sync annotations to Canvas", () => this.syncAnnotations());

    // 3. 浮动工具栏入口：普通选区做摘录，已有 mark 做取消。
    this.toolbar = new FloatingToolbar(
      () => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!mdView) return;
        void this.doAnnotate(mdView);
      },
      () => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!mdView) return;
        this.doRemove(mdView);
      },
    );

    // 4. mouseup 是默认阅读流程的触发点：选中文本后决定显示 toolbar 或自动摘录。
    this.mouseupHandler = () => window.setTimeout(() => this.handleMouseup(), 150);
    this.registerDomEvent(document, "mouseup", this.mouseupHandler);

    // 5. 滚动时隐藏 toolbar，避免按钮停在旧选区位置。
    this.scrollHandler = () => { this.toolbar?.hide(); };
    this.registerDomEvent(document, "scroll", this.scrollHandler, { capture: true });

    // 6. 命令面板入口：和 toolbar/ribbon 复用同一套实现。
    this.addCommand({
      id: "annotate-selection",
      name: "Annotate selection",
      editorCallback: (_editor) => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!mdView) return;
        void this.doAnnotate(mdView);
      },
    });

    this.addCommand({
      id: "sync-annotations",
      name: "Sync annotations to Canvas",
      callback: () => { void this.syncAnnotations(); },
    });

    this.addCommand({
      id: "jump-to-annotation",
      name: "Jump to linked annotation",
      callback: () => { void this.jumpToAnnotation(); },
    });

    // 7. Canvas 双击跳转链路：选中的 CanvasMargin node -> Markdown mark。
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.bindCanvasDblClick())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.bindCanvasDblClick())
    );
    this.bindCanvasDblClick();

    // 8. Markdown 渲染后处理：点击 mark -> 关联的 Canvas node。
    this.registerMarkdownPostProcessor((el) => {
      el.querySelectorAll<HTMLElement>("mark").forEach((markEl) => {
        // 1. 同一个 rendered mark 只绑定一次点击事件。
        if (markEl.dataset.ancBound === "1") return;

        // 2. 新格式从 id="anc-xxx" 读取 anchor。
        let ancId: string | null = null;
        const id = markEl.id;
        if (id?.startsWith("anc-")) {
          ancId = id.slice(4);
        } else {
          // 3. 旧格式从 class="... anc-xxx" 读取 anchor。
          const ancClass = Array.from(markEl.classList).find((c) => c.startsWith("anc-"));
          if (ancClass) ancId = ancClass.slice(4);
        }
        if (!ancId) return;

        // 4. 标记为可跳转样式，并绑定点击到 Canvas 的动作。
        markEl.dataset.ancBound = "1";
        markEl.addClass("canvas-annotator-link");
        markEl.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          void this.jumpToCanvasByAncId(ancId);
        });
      });
    });

    // 9. 注册设置页，供用户调整颜色、间距、沉浸摘录和自动同步。
    this.addSettingTab(new CanvasAnnotatorSettingTab(this.app, this));
  }

  onunload() {
    // 1. 插件卸载时销毁手动创建的 toolbar DOM。
    this.toolbar?.destroy();
  }

  private handleMouseup() {
    // 1. toolbar 只服务当前活动 Markdown 视图。
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      this.toolbar?.hide();
      return;
    }

    // 2. 把 CodeMirror 选区转换成全文 offset，交给纯函数判断。
    const editor = mdView.editor;
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));

    // 3. 没有选区说明只是单击；mark 跳转由 Markdown post-processor 处理。
    if (from === to) {
      this.toolbar?.hide();
      return;
    }

    // 4. 选区碰到已有 mark 时，toolbar 从“摘录”切换成“取消”。
    const doc = editor.getValue();
    const action = getToolbarAction(doc, from, to);

    if (!action) {
      this.toolbar?.hide();
      return;
    }

    // 5. 沉浸摘录模式跳过 toolbar，直接写入 mark。
    if (action === "annotate" && this.settings.autoAnnotate) {
      if (!shouldSkipAnnotation(doc, from, to)) {
        void this.doAnnotate(mdView);
      }
      return;
    }

    // 6. 默认模式把 toolbar 显示在浏览器选区附近。
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { this.toolbar?.hide(); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { this.toolbar?.hide(); return; }
    this.toolbar?.show(action, rect);
  }

  private async doAnnotate(mdView: MarkdownView) {
    // 1. 从 CodeMirror 读取选中文本和全文 offset。
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

    // 2. 用规范格式替换选区：<mark class="cN" id="anc-...">。
    const result = annotateSelection(doc, from, to, this.settings.annotationColor);
    editor.setValue(result.newDoc);
    editor.setCursor(editor.offsetToPos(to + (result.newDoc.length - doc.length)));

    // 3. 自动同步只在一个可见笔记 + 一个可见 Canvas 的无歧义分屏里运行。
    if (this.settings.autoSync) {
      const { error: syncError } = this.getVisibleSplitPair();
      if (!syncError) {
        await this.syncAnnotations({ ancId: result.ancId, text: selection });
      }
    }
  }

  private doRemove(mdView: MarkdownView) {
    // 1. 去掉外层 <mark> 标签，保留用户原文。
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
    // 1. Obsidian loadData 可能返回 undefined，所以要和 DEFAULT_SETTINGS 合并。
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    // 1. 所有设置页变更最终都落到 Obsidian 插件数据里。
    await this.saveData(this.settings);
  }

  private async syncAnnotations(immediate?: { ancId: string; text: string }) {
    // 1. 同步入口故意收窄：必须恰好一个可见 Markdown leaf 和一个 Canvas leaf。
    const { canvasLeaf, mdLeaf, error } = this.getVisibleSplitPair();
    if (error || !canvasLeaf || !mdLeaf) {
      new Notice(error ?? "请在分屏中打开笔记和 Canvas");
      return;
    }
    const canvasView = canvasLeaf.view as unknown as CanvasView;
    const canvas = canvasView.canvas;

    // 2. 快路径：自动同步已经知道新 anchor，所以不重新扫描 vault。
    if (immediate) {
      const currentCanvasAncs = scanCanvasAncs(canvas.getData().nodes);
      if (currentCanvasAncs.has(immediate.ancId)) return; // 已存在就不重复创建。
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

    // 3. 完整同步路径：只收集当前可见 Markdown 文件里的 anchor。
    const allVaultAncs: VaultAnc[] = [];
    const mdView = mdLeaf.view as MarkdownView;
    if (mdView.file) {
      const content = await this.app.vault.cachedRead(mdView.file);
      const fileAncs = scanFileAncs(content);
      for (const fa of fileAncs) {
        allVaultAncs.push({ ...fa, sourcePath: mdView.file.path });
      }
    }

    // 4. 构建全库 Canvas anchor map，避免同一 anchor 在别的 Canvas 已存在时重复创建。
    const globalCanvasAncs = new Map<string, CanvasAncInfo>();
    const canvasFiles = this.app.vault.getFiles().filter((f) => f.extension === "canvas");
    for (const file of canvasFiles) {
      const json = await this.app.vault.cachedRead(file);
      const ancIds = scanCanvasJsonAncs(json);
      // 5. 全局去重只需要知道 ancId 存在，位置先放占位值。
      for (const ancId of ancIds) {
        if (!globalCanvasAncs.has(ancId)) {
          globalCanvasAncs.set(ancId, { nodeId: "", y: 0, height: 0 });
        }
      }
    }

    // 6. 当前 Canvas 的 anchor 带真实位置信息，用于摆放和孤儿统计。
    const currentCanvasAncs = scanCanvasAncs(canvas.getData().nodes);
    for (const [ancId, info] of currentCanvasAncs) {
      globalCanvasAncs.set(ancId, info);
    }

    const diff = computeSyncDiff(allVaultAncs, globalCanvasAncs);

    // 7. 孤儿检测扫描所有 Markdown 文件，避免隐藏笔记里的 anchor 被误判。
    const allVaultAncIds = new Set<string>();
    for (const file of this.app.vault.getMarkdownFiles()) {
      const content = await this.app.vault.cachedRead(file);
      for (const fa of scanFileAncs(content)) allVaultAncIds.add(fa.ancId);
    }
    const orphanCount = [...currentCanvasAncs.keys()].filter(
      (id) => !allVaultAncIds.has(id)
    ).length;

    if (diff.toCreate.length === 0) {
      let msg = "已完全同步，无新节点需要创建";
      if (orphanCount > 0) msg += `\n发现 ${orphanCount} 个孤儿锚点`;
      new Notice(msg);
      return;
    }

    // 8. 为缺失的 anchor 创建 Canvas 节点，并放到现有 CanvasMargin 节点下方。
    const startY = nextNodeY(currentCanvasAncs, this.settings.nodeGap);
    const created = createNodes(
      canvas,
      diff.toCreate,
      startY,
      this.settings.annotationColor,
      this.settings.nodeGap,
    );

    let msg = `✓ 已创建 ${created} 个新节点`;
    if (orphanCount > 0) msg += `，发现 ${orphanCount} 个孤儿锚点`;
    new Notice(msg, 4000);
  }

  private async jumpToAnnotation() {
    // 1. 同一个命令根据当前活动界面决定跳转方向。
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
    // 1. 从 Markdown 跳 Canvas 时，光标所在行必须包含 anc-xxx。
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

  /** 2. 给定 ancId，搜索所有 Canvas 文件并聚焦匹配节点。 */
  private async jumpToCanvasByAncId(ancId: string) {
    // 1. 先搜持久化 Canvas JSON，找到后再打开或复用对应 Canvas leaf。
    const canvasFiles = this.app.vault.getFiles().filter((f) => f.extension === "canvas");
    for (const file of canvasFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInCanvasJson(content, ancId);
      if (result) {
        // 2. 如果目标 Canvas 已打开就复用，否则新开一个 split leaf。
        const existingLeaf = this.app.workspace
          .getLeavesOfType("canvas")
          .find((l) => (l.view as any)?.file?.path === file.path);
        const leaf = existingLeaf ?? this.app.workspace.getLeaf("split");
        await leaf.openFile(file);
        // 3. 等 Canvas 内部状态加载完成后，再选中并缩放到目标 node。
        window.setTimeout(() => {
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
    // 1. 从 Canvas 跳 Markdown 时，先读取选中 node 的 canvasMargin metadata。
    const selectedNodes = [...canvasView.canvas.selection];
    if (selectedNodes.length === 0) {
      new Notice("请先选中一个 Canvas 节点");
      return;
    }
    const ancId = readMarginMeta(selectedNodes[0].getData());
    if (!ancId) {
      new Notice("该节点没有摘录锚点");
      return;
    }
    await this.jumpMdByAncId(ancId);
  }

  private getCanvasView(): CanvasView | null {
    // 1. 命令面板场景下，取第一个已打开的 Canvas view。
    const leaves = this.app.workspace.getLeavesOfType("canvas");
    if (leaves.length === 0) return null;
    return leaves[0].view as unknown as CanvasView;
  }

  /**
   * 1. 在当前分屏布局里寻找恰好一个可见 Markdown 和一个可见 Canvas。
   * “可见”表示在 split pane 中显示，不是藏在后台 tab。
   */
  private getVisibleSplitPair(): {
    mdLeaf: WorkspaceLeaf | null;
    canvasLeaf: WorkspaceLeaf | null;
    error: string | null;
  } {
    // 1. 遍历所有 leaf，只收集真正显示出来的 Markdown/Canvas。
    const visibleMd: WorkspaceLeaf[] = [];
    const visibleCanvas: WorkspaceLeaf[] = [];

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!leaf.view?.containerEl?.isShown()) return;
      const vt = leaf.view.getViewType();
      if (vt === "markdown") visibleMd.push(leaf);
      else if (vt === "canvas") visibleCanvas.push(leaf);
    });

    // 2. 没有目标或目标过多都直接返回错误，不猜用户想同步哪一个。
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
   * 1. 给每个打开的 Canvas leaf 绑定双击处理。
   * 使用 WeakSet 防止 layout-change 多次触发时重复绑定。
   */
  private boundCanvasLeaves = new WeakSet<object>();

  private bindCanvasDblClick() {
    this.app.workspace.getLeavesOfType("canvas").forEach((leaf) => {
      // 1. 每个 leaf 只绑定一次；Obsidian 可能在多个 layout 事件里报告同一个 leaf。
      if (this.boundCanvasLeaves.has(leaf)) return;
      this.boundCanvasLeaves.add(leaf);

      const container = leaf.view.containerEl;
      const canvasView = leaf.view as unknown as CanvasView;
      let lastSelectedNode: any = null;

      // 2. capture 阶段先记住当前选中节点，早于 Canvas 自己处理鼠标事件。
      this.registerDomEvent(container, "mousedown", () => {
        const selected = [...canvasView.canvas.selection];
        lastSelectedNode = selected.length > 0 ? selected[0] : null;
      }, true);

      // 3. 双击 CanvasMargin node 时拦截默认编辑行为，改为跳回 Markdown。
      this.registerDomEvent(container, "dblclick", async (e: MouseEvent) => {
        if (!lastSelectedNode) return;
        const ancId = readMarginMeta(lastSelectedNode.getData());
        lastSelectedNode = null;
        if (!ancId) return;
        e.preventDefault();
        e.stopPropagation();
        await this.jumpMdByAncId(ancId);
      }, true);
    });
  }

  /** 2. 搜索所有 Markdown 文件，找到 ancId 后打开并滚动到对应 mark。 */
  private async jumpMdByAncId(ancId: string) {
    // 1. 先搜持久化 Markdown 文本，这样目标笔记没打开也能找到。
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
        this.app.workspace.setActiveLeaf(leaf, { focus: true });

        // 2. 等 Markdown view 渲染完成，再尝试定位 anchor。
        window.setTimeout(() => {
          const mdView = leaf.view as unknown as MarkdownView;
          if (!mdView) return;

          // 3. Source/Live Preview 模式可以直接按 editor offset 跳转。
          if (mdView.editor) {
            const pos = mdView.editor.offsetToPos(result.offset);
            mdView.editor.setCursor(pos);
            mdView.editor.scrollIntoView({ from: pos, to: pos }, true);
            return;
          }

          // 4. Reading 模式没有 editor 定位，只能查渲染后的 DOM 元素。
          const container = leaf.view.containerEl;
          let ancEl: Element | null = null;
          try { ancEl = container.querySelector(`[id="anc-${ancId}"]`); } catch { /* */ }
          if (!ancEl) {
            try { ancEl = container.querySelector(`[class*="anc-${ancId}"]`); } catch { /* */ }
          }
          if (!ancEl) {
            // 5. CSS selector 查不到时，兜底遍历所有 mark。
            ancEl = Array.from(container.querySelectorAll("mark")).find(
              (m) => m.id === `anc-${ancId}` || m.classList.contains(`anc-${ancId}`)
            ) ?? null;
          }
          if (ancEl) {
            ancEl.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            new Notice("阅读模式下未找到锚点元素");
          }
        }, 300);
        return;
      }
    }
    new Notice("未找到对应的 md 标记");
  }
}
