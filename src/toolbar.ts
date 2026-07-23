/**
 * 1. 纯函数：根据当前选区判断 toolbar 应该提供哪个动作。
 *
 * 返回：
 * "annotate" 表示普通选区，可以摘录；
 * "remove" 表示选区碰到已有 mark，可以取消；
 * null 是防御分支，表示没有选区。
 */
export function getToolbarAction(
  doc: string,
  from: number,
  to: number,
): "annotate" | "remove" | null {
  // 1. 调用方通常已保证有选区，这里仍保留防御检查。
  if (from === to) return null;

  // 2. 用完整 mark 范围判断选区是否和已有摘录重叠。
  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    // 3. 定位当前 mark 的开标签和闭标签范围。
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // 4. 只要选区碰到 mark 的任何部分，就显示“取消”。
    if (from < closeEnd && to > openStart) return "remove";
  }

  // 5. 没碰到已有 mark，就显示“摘录”。
  return "annotate";
}

/**
 * 2. 管理浮动 toolbar DOM。
 * 它只显示一个按钮：摘录或取消。
 */
export class FloatingToolbar {
  private el: HTMLElement;
  private onAnnotate: () => void;
  private onRemove: () => void;

  constructor(onAnnotate: () => void, onRemove: () => void) {
    // 1. 回调由 main.ts 注入，toolbar 自己不直接操作编辑器。
    this.onAnnotate = onAnnotate;
    this.onRemove = onRemove;

    // 2. DOM 节点挂在 body 上，默认隐藏。
    this.el = document.body.createDiv({
      cls: ["canvas-annotator-toolbar", "canvas-annotator-toolbar--hidden"],
    });
  }

  show(action: "annotate" | "remove", rect: DOMRect) {
    // 1. 每次展示前重建按钮，避免旧事件和旧文字残留。
    while (this.el.firstChild) this.el.removeChild(this.el.firstChild);

    const btn = this.el.createEl("button");
    if (action === "annotate") {
      // 2. 普通选区显示“摘录”。
      btn.textContent = "✎ 摘录";
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.onAnnotate();
        this.hide();
      });
    } else {
      // 3. 命中已有 mark 时显示“取消”。
      btn.textContent = "✂ 取消";
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.onRemove();
        this.hide();
      });
    }

    // 4. 用 CSS 变量定位在浏览器选区上方。
    this.el.style.setProperty("--canvas-annotator-toolbar-top", `${rect.top - 40}px`);
    this.el.style.setProperty("--canvas-annotator-toolbar-left", `${rect.left + rect.width / 2}px`);
    this.el.removeClass("canvas-annotator-toolbar--hidden");
  }

  hide() {
    // 1. 隐藏不销毁，方便下一次选区复用。
    this.el.addClass("canvas-annotator-toolbar--hidden");
  }

  destroy() {
    // 1. 插件卸载时移除 DOM，避免残留在 Obsidian 页面里。
    this.el.remove();
  }
}
