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
import { extractAncFromMeta, ANC_RE } from "./models";
import type { PluginSettings } from "./models";
import { DEFAULT_SETTINGS } from "./models";
import { CanvasAnnotatorSettingTab } from "./settings";
import type { Canvas, CanvasView, CanvasNode } from "./canvas";

export default class CanvasAnnotatorPlugin extends Plugin {
  settings: PluginSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

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
        editor.setCursor(editor.offsetToPos(to + (result.newDoc.length - doc.length)));
        new Notice("已摘录");
      },
    });

    this.addRibbonIcon("lucide-refresh-cw", "Sync annotations to Canvas", () => this.syncAnnotations());

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

    this.addSettingTab(new CanvasAnnotatorSettingTab(this.app, this));
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async syncAnnotations() {
    const canvasView = this.getCanvasView();
    if (!canvasView) {
      new Notice("请先打开一个 Canvas 文件");
      return;
    }
    const canvas = canvasView.canvas;

    const allVaultAncs: VaultAnc[] = [];
    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const file of mdFiles) {
      const content = await this.app.vault.cachedRead(file);
      const fileAncs = scanFileAncs(content);
      for (const fa of fileAncs) {
        allVaultAncs.push({ ...fa, sourcePath: file.path });
      }
    }

    const canvasData = canvas.getData();
    const canvasAncs = scanCanvasAncs(canvasData.nodes);

    const diff = computeSyncDiff(allVaultAncs, canvasAncs);

    if (diff.toCreate.length === 0) {
      let msg = "已完全同步，无新节点需要创建";
      if (diff.orphanCount > 0) {
        msg += `\n发现 ${diff.orphanCount} 个孤儿锚点`;
      }
      new Notice(msg);
      return;
    }

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
    const ancId = m[1];

    const canvasFiles = this.app.vault.getFiles().filter((f) => f.extension === "canvas");
    for (const file of canvasFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInCanvasJson(content, ancId);
      if (result) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
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

    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const file of mdFiles) {
      const content = await this.app.vault.cachedRead(file);
      const result = findAncInMdContent(content, ancId);
      if (result) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
        setTimeout(() => {
          const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!mdView) return;
          const pos = mdView.editor.offsetToPos(result.offset);
          mdView.editor.setCursor(pos);
          mdView.editor.scrollIntoView({ from: pos, to: pos }, true);
        }, 200);
        return;
      }
    }
    new Notice("未找到对应的 md 标记");
  }

  private getCanvasView(): CanvasView | null {
    const leaves = this.app.workspace.getLeavesOfType("canvas");
    if (leaves.length === 0) return null;
    return leaves[0].view as unknown as CanvasView;
  }
}
