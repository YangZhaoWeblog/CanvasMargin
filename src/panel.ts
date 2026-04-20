// src/panel.ts
import { showPanel } from "@codemirror/view";
import { StateField } from "@codemirror/state";
import type { Panel, EditorView } from "@codemirror/view";

export function syncPanelExtension(onSync: () => void) {
  function createSyncPanel(_view: EditorView): Panel {
    const dom = document.createElement("div");
    dom.className = "canvas-annotator-sync-panel";

    const btn = document.createElement("button");
    btn.textContent = "⟳ 同步到 Canvas";
    btn.addEventListener("click", () => onSync());
    dom.appendChild(btn);

    return { top: true, dom };
  }

  const panelField = StateField.define<boolean>({
    create: () => true,
    update: (value) => value,
    provide: (f) => showPanel.from(f, (on) => (on ? createSyncPanel : null)),
  });

  return panelField;
}
