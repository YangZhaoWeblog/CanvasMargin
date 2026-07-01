/**
 * Pure function: determine what action the toolbar should offer
 * given the current selection position in the document.
 *
 * Precondition: from !== to (caller guarantees a selection exists).
 *
 * Returns:
 *  "annotate" — selection is not inside an existing mark
 *  "remove"   — selection overlaps an existing mark
 *  null       — no selection (defensive, should not happen)
 */
export function getToolbarAction(
  doc: string,
  from: number,
  to: number,
): "annotate" | "remove" | null {
  if (from === to) return null; // defensive: no selection → no action

  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // Selection overlaps any part of the mark tag → remove
    if (from < closeEnd && to > openStart) return "remove";
  }

  return "annotate";
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

    this.el = document.body.createDiv({
      cls: ["canvas-annotator-toolbar", "canvas-annotator-toolbar--hidden"],
    });
  }

  show(action: "annotate" | "remove", rect: DOMRect) {
    // Clear previous content
    while (this.el.firstChild) this.el.removeChild(this.el.firstChild);

    const btn = this.el.createEl("button");
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

    // Position above the selection
    this.el.style.setProperty("--canvas-annotator-toolbar-top", `${rect.top - 40}px`);
    this.el.style.setProperty("--canvas-annotator-toolbar-left", `${rect.left + rect.width / 2}px`);
    this.el.removeClass("canvas-annotator-toolbar--hidden");
  }

  hide() {
    this.el.addClass("canvas-annotator-toolbar--hidden");
  }

  destroy() {
    this.el.remove();
  }
}
