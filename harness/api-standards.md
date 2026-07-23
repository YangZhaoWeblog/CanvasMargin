# API Standards

> status: active
> owner: api-contracts
> layer: profile
> 本文件负责 Obsidian、Canvas、Markdown mark、settings 与 persistent data contract；不负责 UI copy、release 或业务实现。

## Activation

本仓通过 Markdown source、Canvas JSON、Obsidian plugin data 与 internal Canvas API 暴露跨边界接口，因此本 profile 始终 active。

## Markdown Mark Contract

- 新写入统一使用 `<mark class="cN" id="anc-{nanoid}">text</mark>`。
- Anchor id 是 21-character nanoid；Markdown 存 `anc-{id}`，Canvas metadata 存 raw id。
- Reader 必须继续支持旧 `class="... anc-{id} ..."` 格式。
- 不使用 `data-*` 存 anchor；Obsidian sanitization 可能剥离它。

## Canvas Metadata Contract

- Metadata 存在 node 顶层：`canvasMargin: { anc: string }`。
- 不把 plugin metadata 塞进 `node.text` 的 HTML comment。
- 写 metadata 时 preserve existing node data。
- Global dedup 扫描所有 `.canvas` 文件；当前 Canvas 只负责 actual placement。

## Obsidian Integration

- Commands 和 ribbon actions 通过 plugin lifecycle 注册。
- Document-level listener 必须在 `onunload` 清理。
- Canvas API 是 internal API；`src/canvas.d.ts` 只维护本仓实际用到的 narrow typing。
- Workspace logic 必须处理 multiple leaves 与 hidden tabs，不能猜测 target leaf。

## Settings Contract

- Defaults 放在 `DEFAULT_SETTINGS`。
- Load 使用 `Object.assign({}, DEFAULT_SETTINGS, data ?? {})`。
- Save 通过 `saveData`。
- 新 setting 要有 default、settings UI 和旧 saved data 缺字段的 compatibility handling。

## Compatibility And Verification

- 没有 migration plan，不移除 old mark parsing。
- Manifest id 改动视为 breaking。
- Rendered Markdown / Live Preview / Canvas / settings / workspace 路径改动后，在 real Obsidian test vault 手测：load plugin、new/old mark、remove、sync/dedup、双向 jump 与 settings persistence。
- Pure helper 的行为改动需要 focused Vitest；自动测试不覆盖 Obsidian lifecycle、workspace leaves、Canvas DOM events 或 settings UI。

## Anti-Patterns

- 不要把 Canvas metadata 写回 `node.text`。
- 不要恢复旧 metadata helper 或 text-comment parsing。
- 不要新增 top sync panel；同步入口保持 ribbon + command palette，除非先有新的 product decision。
