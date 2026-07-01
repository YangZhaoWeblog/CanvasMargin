import { App, PluginSettingTab, Setting } from "obsidian";
import type CanvasAnnotatorPlugin from "./main";

const COLOR_IDS = ["1", "2", "3", "4", "5", "6"];

export class CanvasAnnotatorSettingTab extends PluginSettingTab {
  plugin: CanvasAnnotatorPlugin;

  constructor(app: App, plugin: CanvasAnnotatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ── Color picker ──
    const colorSetting = new Setting(containerEl)
      .setName("摘录颜色")
      .setDesc("新摘录的高亮颜色和 Canvas 节点颜色");

    const swatchContainer = colorSetting.controlEl.createDiv();
    swatchContainer.addClass("canvas-annotator-swatch-container");

    const swatches: HTMLElement[] = [];
    for (const idx of COLOR_IDS) {
      const swatch = swatchContainer.createDiv();
      swatch.addClass("canvas-annotator-swatch");
      swatch.addClass(`canvas-annotator-swatch-${idx}`);

      if (idx === this.plugin.settings.annotationColor) {
        swatch.addClass("canvas-annotator-swatch--selected");
      }

      swatch.addEventListener("click", () => {
        this.plugin.settings.annotationColor = idx;
        void this.plugin.saveSettings();
        for (const s of swatches) s.removeClass("canvas-annotator-swatch--selected");
        swatch.addClass("canvas-annotator-swatch--selected");
      });
      swatches.push(swatch);
    }

    // ── Node gap ──
    new Setting(containerEl)
      .setName("节点间距")
      .setDesc("Canvas 中自动排列节点的垂直间距 (px)")
      .addText((t) =>
        t.setValue(String(this.plugin.settings.nodeGap)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n >= 0) {
            this.plugin.settings.nodeGap = n;
            await this.plugin.saveSettings();
          }
        })
      );

    // ── autoAnnotate ──
    new Setting(containerEl)
      .setName("沉浸摘录模式")
      .setDesc("开启后，鼠标松开（mouseup）有选区时自动摘录，不弹浮动工具栏")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoAnnotate).onChange(async (v) => {
          this.plugin.settings.autoAnnotate = v;
          await this.plugin.saveSettings();
        })
      );

    // ── autoSync ──
    new Setting(containerEl)
      .setName("摘录后自动同步")
      .setDesc("摘录后若检测到有打开的 Canvas，立即同步（无需手动点同步）")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoSync).onChange(async (v) => {
          this.plugin.settings.autoSync = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
