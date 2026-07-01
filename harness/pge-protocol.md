> status: active
> owner: large-workflow
> layer: universal
> 本文件负责中大型任务的 plan、generate、evaluate 协议；不负责日常小修。

# PGE Protocol

当任务跨多个 modules、触碰 user data，或贯穿 annotation / sync / jump / settings 行为时，使用 PGE。

## Tiers

- **Tier 1**: small，单 owner module，单 verification path。不需要 PGE。
- **Tier 2**: 多 modules 或 integration behavior。编辑前写 short plan。
- **Tier 3**: migration、release、long-running work，或 repeated failure。使用 `.pge/` 下的 file-based handoff。

## Required Contract For Tier 2+

先定义：

- goal；
- modules touched；
- behavior contract；
- tests to add or run；
- manual Obsidian checks；
- rollback 或 safe stopping point。

## Sub-Agent Limits

如果使用 sub-agents：

- depth <= 2；
- parallel agents <= 5；
- 用 `.pge/*.md` 做 file handoff；
- 不依赖 chat-only handoff 保存 implementation state。

## Evaluation

Evaluator 检查：

- code 是否匹配 contract；
- tests 是否未被削弱；
- user-data paths 是否安全；
- manual verification gaps 是否明确。
