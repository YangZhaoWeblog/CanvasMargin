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

## Entries

### 2026-07-01 - Docs drift polluted harness

- **Trigger**: 规则重建时发现 README / historical docs 与代码不一致。
- **Symptom**: 旧 Canvas metadata 协议被写入规则。
- **Root cause**: 先信 docs，后看 code。
- **Fix**: 删除旧 implementation plans；current docs 只保留当前设计。
- **Future rule**: 先读 `src/`、tests、package/manifest，再读 docs。
- **Refs**: `src/models.ts`, `src/syncer.ts`, `README.md`, `README-zh.md`。
