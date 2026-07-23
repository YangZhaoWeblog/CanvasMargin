# Failures

> status: active
> owner: failures
> layer: project-grown
> 本文件负责 real incident 和 reusable lesson；不负责 speculative rule。

## When To Record

以下任一情况记录事实，再决定是否抽象为 rule：non-obvious bug、workflow miss、repeated misunderstanding、rule conflict、investigation 超过 10 分钟、generated code/docs 被人工纠正、Obsidian/DOMPurify/CodeMirror/Canvas 行为偏离预期、internal Canvas API break，或同一区域反复修改。

## Entry Format

```md
### YYYY-MM-DD - Short title

- **Trigger**:
- **Symptom**:
- **Root cause**:
- **Fix**:
- **Future rule**:
- **Refs**:
```

不要把 one-off incident 变成 broad policy；repeated failure 成为 rule 时更新其最小 owner。

## Entries

### 2026-07-01 - Docs drift polluted harness

- **Trigger**: 规则重建时发现 README / historical docs 与代码不一致。
- **Symptom**: 旧 Canvas metadata 协议被写入规则。
- **Root cause**: 先信 docs，后看 code。
- **Fix**: 删除旧 implementation plans；current docs 只保留当前设计。
- **Future rule**: 先读 `src/`、tests、package/manifest，再读 docs。
- **Refs**: `src/models.ts`, `src/syncer.ts`, `README.md`, `README-zh.md`。
