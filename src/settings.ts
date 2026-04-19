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
