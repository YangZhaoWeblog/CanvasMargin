> status: active
> owner: vocabulary
> layer: profile
> 本文件负责项目术语和模块含义；不负责编码规范。

# Glossary

- **CanvasMargin**: 产品名，面向用户的 plugin experience。
- **`canvas-annotator`**: npm package name 和 manifest id。
- **mark**: 存在 note source 里的 Markdown inline HTML highlight。
- **anc**: anchor id，连接 note mark 与 Canvas node。Markdown 里存成 `anc-{nanoid}`，Canvas metadata 里存 raw nanoid。
- **new mark format**: `<mark class="cN" id="anc-{id}">text</mark>`。
- **old mark format**: `<mark class="cN anc-{id}">text</mark>`。必须保留 read-only compatibility。
- **`canvasMargin`**: Canvas node 顶层字段，值为 `{ anc: string }`。
- **Canvas node**: 由摘录创建的 Obsidian Canvas text node。
- **orphan anchor**: Canvas node anchor 在 scanned Markdown marks 中已不存在。
- **visible split pair**: 正好一个 visible Markdown leaf + 一个 visible Canvas leaf；sync 依赖这个 layout。
- **autoAnnotate**: setting；mouseup selection 直接生成 mark，不显示 toolbar。
- **autoSync**: setting；annotation 后如果 split pair 有效，立即创建 Canvas node。

## Module Map

- `main.ts`: lifecycle、commands、workspace leaf orchestration、notices。
- `annotator.ts`: pure annotation / removal transforms。
- `syncer.ts`: scan / diff logic + Canvas node creation。
- `jumper.ts`: anchor lookup 的 pure search helpers。
- `toolbar.ts`: toolbar action decision + DOM widget。
- `settings.ts`: Obsidian settings UI。
- `models.ts`: shared regex、constants、settings、metadata helpers。
- `canvas.d.ts`: Obsidian internal Canvas APIs 的 local type declarations。
