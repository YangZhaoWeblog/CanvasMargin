> status: active
> owner: api-contracts
> layer: profile
> 本文件负责 Obsidian、Canvas、Markdown mark 和 settings 接口；不负责 UI copy 或 release。

# API Standards

## Markdown Mark Contract

- 新写入统一使用 `<mark class="cN" id="anc-{nanoid}">text</mark>`。
- Anchor id 是 21 字符 nanoid。
- Reader 必须继续支持旧格式 `class="... anc-{id} ..."`。
- 不要用 `data-*` 存 anchor；Obsidian sanitization 可能剥离这些属性。

## Canvas Metadata Contract

- Metadata 存在 node 顶层：`canvasMargin: { anc: string }`。
- 不要把 plugin metadata 塞进 `node.text` 的 HTML comment。
- 给 node 添加 metadata 时，要 preserve existing node data。
- Global dedup 扫描所有 `.canvas` 文件；当前 Canvas 只负责实际 placement。

## Obsidian Integration

- Commands 和 ribbon actions 通过 plugin lifecycle 注册。
- Document-level listeners 必须在 `onunload` 清理。
- Canvas API 属于 internal API，本仓通过 `src/canvas.d.ts` 做 local typing。
- Workspace logic 必须考虑 multiple leaves 和 hidden tabs。

## Settings Contract

- Defaults 放在 `DEFAULT_SETTINGS`。
- Load 时使用 `Object.assign({}, DEFAULT_SETTINGS, data ?? {})`。
- Save 通过 `saveData`。
- 新 setting 需要 default、settings UI，以及对旧 saved data 缺字段的 compatibility handling。

## Compatibility Rules

- 没有 migration plan，不要移除 old mark parsing。
- Manifest id 变更视为 breaking。
- 触碰 rendered Markdown / Live Preview / Canvas 路径后，在真实 Obsidian 里验证 DOM behavior。

## Anti-Patterns

- 不要把 Canvas metadata 写进 `node.text`。
- 不要恢复旧 metadata helper 或 text-comment parsing。
- 不要新增 top sync panel；同步入口保持 ribbon + command palette，除非先记录新的 product decision。
