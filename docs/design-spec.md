# CanvasMargin Current Design

> status: current
> 本文件只描述当前实现与当前产品边界；历史错误实现不保留在这里。

## Product Shape

CanvasMargin 是 Obsidian desktop plugin。核心 workflow：

1. 用户在 Markdown note 中选择文本。
2. 插件把选区写成 `<mark class="cN" id="anc-{nanoid}">text</mark>`。
3. 用户手动 sync，或在有效 split pair 下使用 Auto sync。
4. 插件创建 Canvas text node，并在 node 顶层写入 `canvasMargin: { anc }`。
5. 用户可以从 note mark 跳到 Canvas node，也可以从 Canvas node 跳回 note。

## Current UX

- 默认模式：选中文字后显示 floating toolbar。
- Floating toolbar actions:
  - plain selection → **✎ 摘录**
  - selection/cursor overlaps mark → **✂ 取消**
- Immersive mode：`autoAnnotate=true` 时，mouseup selection 直接创建 mark，不显示 toolbar。
- Sync 入口：ribbon icon 和 command palette。
- Auto sync：`autoSync=true` 且 exactly one visible Markdown leaf + one visible Canvas leaf 时，摘录后立即创建 Canvas node。

## Data Contracts

- New mark format: `<mark class="cN" id="anc-{nanoid}">text</mark>`。
- Backward-compatible read format: `class="... anc-{nanoid} ..."`。
- Canvas metadata: top-level `canvasMargin: { anc: string }`。
- Canvas node text is user text only；plugin metadata 不写入 node text。
- Settings 通过 Obsidian plugin data 保存，并与 `DEFAULT_SETTINGS` merge。

## Non-Goals

- 不做 Anki export。
- 不自动同步已经创建的 Canvas node text。
- 不做 mark 删除后自动删除 Canvas node；当前只提示 orphan anchors。
- 不跨多个 visible Markdown leaves 或多个 visible Canvas leaves 自动猜测目标。
- 不新增 top sync panel；同步入口保持 ribbon + command palette。

## Anti-Patterns

- 不要把 Canvas metadata 写入 `node.text`。
- 不要恢复旧 metadata helpers 或旧 text-comment parsing。
- 不要用 `data-*` 存 anchor。
- 不要从历史 plans/specs 复制实现；当前事实源是 `src/`、`tests/`、`manifest.json`、`package.json`。
