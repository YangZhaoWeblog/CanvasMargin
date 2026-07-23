# Instruction Governance

> status: active
> owner: instruction-governance
> layer: universal
> 本文件负责 rule placement 与 Harness evolution；不负责 execution gate 或产品功能。

## Placement Rules

- high-frequency hard constraint 和 workflow routing 放入 `AGENTS.md`。
- topic rule 放进 focused `harness/*.md`；每个文件开头有 status、owner、layer 与 scope/boundary。
- task-specific plan 放 project docs，不变成 permanent harness。
- real incident 和 lesson 先放 `failures.md`。
- 当前事实以 code/tests/config 为准；未核对时不得把 historical docs 复制为规则。

## Layers

- `universal`: cross-project execution 和 governance。
- `profile`: 由 repo type / stack 激活。
- `project-grown`: 本项目真实 feedback 后证实的 local rule。

## Good / Bad Patterns

- Good：短 entrypoint、one owner per rule、topic file scope 窄、先记录 failure 再抽象、table 只在降低阅读成本时使用。
- Bad：把所有新 rule 堆进 `AGENTS.md`、跨文件复制、没有 trigger/action 的 slogan、example 比 rule 更长。

## Maintenance

- Harness 文件过大或拥有多个 topic 时，按 owner 拆分而非继续加 section。
- 默认写作风格：中文主干 + precise English terms；文件名、API、命令、protocol 名保持英文。
- 重大 rule change 若改变 project behavior 或 contributor obligation，记录到 `DECISIONS.md`。
- 删除或削弱 rule 仅在 code/tests 不再匹配、用户改变 constraint，或它应归另一个 owner 时进行。

## Plan Mode Workflow Check

输出 `<proposed_plan>` 前完成轻量 check：Intake、Context、Size & Risk、Path、Verify。plan 触碰 medium+ code、PGE、hooks、commits、cross-repository sync 或 Harness governance 时，说明路径以及是否需要 full PGE。

## Hard-Blocking Clarification

- 只在安全推进不可能时询问；可用低风险、可逆 assumption 处理的不确定性，要说明 assumption 并继续。
- 没有 hard blocker 时写 `硬阻塞澄清：无硬阻塞`。
- 用户明确要求 analysis-only 或不实现时保持 target repository read-only；planning artifact 仅在用户授权且 workflow 允许时写入。

## Confirmation And Human Start

- 普通 “ok” / “continue” 只推进当前 discussion，不产生无关 write authority。
- PGE Human Start 的短回复，必须直接回答当前 revision 的显式开工问题；Grill confirmation、silence 或旧 Contract approval 都不算。
- Harness、文档和其他非代码更新不走 PGE，也不需要 Human Start；仍按适用的 Context、Verify 和 independent-review gate 执行。

## Multi-Agent Activation

独立 evaluation、可独立验收 slice、多模块代码行为或 PGE roles separation 时评估 multi-agent。PGE 用 `$pge-workflow` 和 `pge-protocol.md` 决定 independent agent、fallback 或 parallel dispatch；除 Human Start 外，只有 owner acknowledgement、platform permission、额外 workspace cost 或 irreversible parallel code-writing 需要先问用户。
