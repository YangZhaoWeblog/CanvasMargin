import { App, PluginSettingTab, Setting } from "obsidian";
import type CanvasAnnotatorPlugin from "./main";

/** 1. Obsidian Canvas 支持的颜色编号；这里和 CSS swatch 对应。 */
const COLOR_IDS = ["1", "2", "3", "4", "5", "6"];

/** 2. 插件设置页：只负责 UI 和保存 settings，不直接做摘录/同步。 */
export class CanvasAnnotatorSettingTab extends PluginSettingTab {
  plugin: CanvasAnnotatorPlugin;

  constructor(app: App, plugin: CanvasAnnotatorPlugin) {
    // 1. 保存 plugin 引用，后续读写 this.plugin.settings。
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    // 1. 每次打开设置页都重绘，保证显示的是最新 settings。
    const { containerEl } = this;
    containerEl.empty();

    // 2. 颜色设置：影响新 mark 的 class 和新 Canvas node 的 color。
    const colorSetting = new Setting(containerEl)
      .setName("摘录颜色")
      .setDesc("新摘录的高亮颜色和 Canvas 节点颜色");

    const swatchContainer = colorSetting.controlEl.createDiv();
    swatchContainer.addClass("canvas-annotator-swatch-container");

    const swatches: HTMLElement[] = [];
    for (const idx of COLOR_IDS) {
      // 3. 每个颜色编号渲染成一个可点击色块。
      const swatch = swatchContainer.createDiv();
      swatch.addClass("canvas-annotator-swatch");
      swatch.addClass(`canvas-annotator-swatch-${idx}`);

      // 4. 当前设置值对应的色块加 selected 样式。
      if (idx === this.plugin.settings.annotationColor) {
        swatch.addClass("canvas-annotator-swatch--selected");
      }

      swatch.addEventListener("click", () => {
        // 5. 点击后立即保存，并刷新本地 selected 样式。
        this.plugin.settings.annotationColor = idx;
        void this.plugin.saveSettings();
        for (const s of swatches) s.removeClass("canvas-annotator-swatch--selected");
        swatch.addClass("canvas-annotator-swatch--selected");
      });
      swatches.push(swatch);
    }

    // 6. 节点间距：影响自动创建 Canvas 节点时的纵向排列。
    new Setting(containerEl)
      .setName("节点间距")
      .setDesc("Canvas 中自动排列节点的垂直间距 (px)")
      .addText((t) =>
        t.setValue(String(this.plugin.settings.nodeGap)).onChange(async (v) => {
          // 7. 只接受非负整数；非法输入不会覆盖已有设置。
          const n = parseInt(v, 10);
          if (!isNaN(n) && n >= 0) {
            this.plugin.settings.nodeGap = n;
            await this.plugin.saveSettings();
          }
        })
      );

    // 8. 沉浸摘录：mouseup 有选区时直接写 mark，不弹 toolbar。
    new Setting(containerEl)
      .setName("沉浸摘录模式")
      .setDesc("开启后，鼠标松开（mouseup）有选区时自动摘录，不弹浮动工具栏")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoAnnotate).onChange(async (v) => {
          this.plugin.settings.autoAnnotate = v;
          await this.plugin.saveSettings();
        })
      );

    // 9. 自动同步：摘录后在有效分屏里立即创建 Canvas node。
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
