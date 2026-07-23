# Glossary

> status: active
> owner: glossary
> layer: project-grown
> 本文件负责 project terms 与 module meaning；不负责 workflow 或 implementation rule。

## Terms

- **CanvasMargin**: 面向用户的产品名与 plugin experience。
- **`canvas-annotator`**: npm package name 和 manifest id。
- **mark**: note source 中的 Markdown inline HTML highlight。
- **anc**: 连接 note mark 与 Canvas node 的 anchor id；Markdown 存 `anc-{nanoid}`，Canvas metadata 存 raw nanoid。
- **new mark format**: `<mark class="cN" id="anc-{id}">text</mark>`。
- **old mark format**: `<mark class="cN anc-{id}">text</mark>`；必须 read-only compatibility。
- **`canvasMargin`**: Canvas node 顶层字段，值为 `{ anc: string }`。
- **Canvas node**: 由摘录创建的 Obsidian Canvas text node。
- **orphan anchor**: Canvas node 的 anchor 在 scanned Markdown marks 中已不存在。
- **visible split pair**: 正好一个 visible Markdown leaf + 一个 visible Canvas leaf；sync 依赖这个 layout。
- **autoAnnotate**: setting；mouseup selection 直接生成 mark，不显示 toolbar。
- **autoSync**: setting；annotation 后若 split pair 有效，立即创建 Canvas node。

## Module Map

- `main.ts`: lifecycle、commands、workspace leaf orchestration、notices。
- `annotator.ts`: pure annotation / removal transform。
- `syncer.ts`: scan / diff logic 与 Canvas node creation。
- `jumper.ts`: anchor lookup pure helper。
- `toolbar.ts`: toolbar action decision 与 DOM widget。
- `settings.ts`: Obsidian settings UI。
- `models.ts`: shared regex、constants、settings、metadata helper。
- `canvas.d.ts`: Obsidian internal Canvas APIs 的 local type declarations。
