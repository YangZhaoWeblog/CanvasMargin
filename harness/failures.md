> status: active
> owner: failure-log
> layer: project-grown
> 本文件负责记录真实踩坑和可复用教训；不负责一般开发流程。

# Failures

只记录会改变未来行为的 failures。

## When To Record

- Investigation 超过 10 分钟。
- Generated code 或 docs 被人工纠正。
- Obsidian、DOMPurify、CodeMirror 或 Canvas 行为偏离预期。
- Internal Canvas API 变化导致 break。
- 同一区域反复修改。
- Existing docs 被证明与 code 或 tests 冲突。

## Entry Format

```md
## YYYY-MM-DD - Short title

- **Trigger**:
- **Symptom**:
- **Root cause**:
- **Fix**:
- **Future rule**:
- **Refs**:
```

## Known Current Drift

### 2026-07-01 - Harness 因现有 docs 可能漂移而重建

- **Trigger**: 用户要求 full harness re-init，并提醒现有 docs 可能不匹配真实代码。
- **Symptom**: README 已有漂移：英文描述 `canvasMargin`，中文仍提到 `<!--card:...-->`。
- **Root cause**: Historical design docs 和旧 user-facing docs 没有与 implementation 同步。
- **Fix**: 新 harness 把 `src/`、tests、`package.json`、`manifest.json` 作为 primary facts；旧 implementation plans 后续已删除，current docs 只保留当前设计摘要。
- **Future rule**: Harness / architecture work 必须先 scan code/config，再标注 unknown facts，不直接复制旧规则或旧实现。
- **Refs**: `src/models.ts`, `src/syncer.ts`, `README.md`, `README-zh.md`。
