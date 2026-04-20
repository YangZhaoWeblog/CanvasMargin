/**
 * Pure function: determine what action the toolbar should offer
 * given the current cursor/selection position in the document.
 *
 * Returns:
 *  "annotate" — selection exists and is not inside an existing mark
 *  "remove"   — cursor/selection is inside an existing mark
 *  null       — no selection and not in a mark (hide toolbar)
 */
export function getToolbarAction(
  doc: string,
  from: number,
  to: number,
): "annotate" | "remove" | null {
  const hasSelection = from !== to;

  // Check if position is inside an existing <mark>
  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // Case 1: cursor/selection entirely within inner text
    if (from >= openEnd && to <= closeStart) return "remove";

    // Case 2: selection overlaps the mark tag itself (e.g. user selected the raw <mark ...>text</mark>)
    if (from < closeEnd && to > openStart) return "remove";
  }

  if (hasSelection) return "annotate";
  return null;
}

/**
 * Manages the floating toolbar DOM element.
 * The toolbar appears near the text selection and shows one action button.
 */
export class FloatingToolbar {
  private el: HTMLElement;
  private onAnnotate: () => void;
  private onRemove: () => void;

  constructor(onAnnotate: () => void, onRemove: () => void) {
    this.onAnnotate = onAnnotate;
    this.onRemove = onRemove;

    this.el = document.createElement("div");
    this.el.className = "canvas-annotator-toolbar";
    this.el.style.display = "none";
    document.body.appendChild(this.el);
  }

  show(action: "annotate" | "remove", rect: DOMRect) {
    // Clear previous content
    while (this.el.firstChild) this.el.removeChild(this.el.firstChild);

    const btn = document.createElement("button");
    if (action === "annotate") {
      btn.textContent = "✎ 摘录";
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.onAnnotate();
        this.hide();
      });
    } else {
      btn.textContent = "✂ 取消";
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.onRemove();
        this.hide();
      });
    }
    this.el.appendChild(btn);

    // Position above the selection
    this.el.style.display = "flex";
    this.el.style.position = "fixed";
    this.el.style.top = `${rect.top - 40}px`;
    this.el.style.left = `${rect.left + rect.width / 2}px`;
    this.el.style.transform = "translateX(-50%)";
  }

  hide() {
    this.el.style.display = "none";
  }

  destroy() {
    this.el.remove();
  }
}
