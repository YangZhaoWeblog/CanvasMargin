> status: active
> owner: review
> layer: universal
> 本文件负责 code review 方式和 reject 条件；不负责具体实现方案。

# Code Review

## Stance

用户要求 review 时，默认进入 bug/risk review，不做泛泛重写建议。Findings 置顶，按严重程度排序，并引用 file/line。

## What To Check

- 行为是否偏离 tests、README、manifest 或既有 module contracts。
- Obsidian lifecycle 是否有问题：未注册/未清理 listener、DOM 泄漏、workspace 假设过强。
- Canvas metadata 是否仍满足 `canvasMargin: { anc }` current contract。
- Mark compatibility 是否同时读取 `id="anc-..."` 和旧 class-encoded anchor。
- 用户数据风险：Markdown 和 `.canvas` mutation 必须 minimal、可解释、可回退。
- Verification gap：pure functions 要有 Vitest；Obsidian UI paths 要 manual vault check。
- Debug leftovers：交付代码不应遗留临时 `console.*`。

## Output Format

1. Findings first，最高严重度优先。
2. Open questions / assumptions。
3. Findings 后面再放 brief change summary。
4. 如果没发现问题，明确说 no findings，并说明剩余 test/manual-QA risk。

## Reject Reasons

- 未记录 behavior decision 就削弱 test assertions。
- Metadata 被移回 `node.text` comment。
- 恢复旧 text-comment metadata helper 或旧 top sync panel，而没有新的 decision。
- 依据 stale docs 改规则，而不是核对当前 `src/` 和 tests。
- Build 或相关 tests 被跳过且无理由。
