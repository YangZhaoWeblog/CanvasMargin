> status: active
> owner: instruction-governance
> layer: universal
> 本文件负责 harness 规则的增长、归属和删除；不负责项目功能。

# Instruction Governance

## Rule Layers

- **universal**: 跨仓库适用，例如 verification discipline 和 review stance。
- **profile**: 由本 repo 的 stack / shape 激活，例如 Obsidian plugin rules。
- **project-grown**: 来自本项目真实 incidents 或 repeated decisions。

## Editing Rules

- `AGENTS.md` 保持 200 行以内。
- Operational detail 放到最小 owner 的 `harness/*.md`。
- 每个 harness 文件开头必须有 `status`、`owner`、`layer` 和 scope/boundary 行。
- Unknown facts 标成 `unknown` 或 TODO。
- 不核对当前 code/config，不要把 historical docs 复制成 rules。
- 默认写作风格：中文主干 + precise English terms；文件名、API、命令、protocol 名保持英文。

## Promotion Rules

满足以下条件时，新增或强化 rule：

- 同一 mistake 重复出现；
- 用户纠正了 generated code/docs；
- hook 或 test 已经 enforce；
- decision 改变项目 behavior 或 compatibility。

## Deprecation Rules

只有以下情况才移除或削弱 rule：

- code 和 tests 已不再匹配它；
- 用户明确改变 constraint；
- 它应该归到另一个 owner file。

重大 rule change 如果改变项目行为或 contributor obligations，需要记录到 `DECISIONS.md`。
