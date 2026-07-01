> status: active
> owner: large-workflow
> layer: profile
> 本文件负责 Planner / Generator / Evaluator 协议；不替代 AGENTS.md 主流程。

# PGE Protocol

## Activation

默认进入 PGE：

- medium / large work；
- 跨多个 source modules；
- 触碰 Obsidian integration behavior：`main.ts`、workspace events、settings、Canvas jump/sync；
- 触碰 user data path：Markdown mark、`.canvas`、`canvasMargin`；
- release / hook / harness 规则改动；
- repeated failure 或需要独立验收的改动。

Small low-risk work 可 solo：docs typo、单文件小配置、无行为变化的小修。Small risky work 仍需要 independent evaluator。

## Roles

| Role | Responsibility | Output |
|---|---|---|
| Planner | 冻结 goal、scope、acceptance、non-goals、order、first tracer bullet、fallback | `docs/pge/<sprint>-spec.md` 或 task-local contract |
| Generator | 只按 locked contract 实现，行为改动走 TDD tracer bullet | code、tests、`verify_cmd`、contract/status update |
| Evaluator | 独立挑战 contract 与 diff，不改文件 | `PASS` / `PASS_WITH_NOTES` / `FAIL` |

Project-level Codex agents:

- `.codex/agents/pge-generator.toml`
- `.codex/agents/pge-evaluator.toml`

Templates:

- `docs/pge/spec.template.md`
- `docs/pge/eval.template.md`

## Sprint Contract

PGE task 至少冻结：

1. goal；
2. scope；
3. acceptance criteria；
4. non-goals；
5. implementation order；
6. first tracer bullet：首个失败测试或最小可观察验证切口；
7. manual Obsidian verification checklist；
8. fallback / restore condition。

Contract 未锁定前，不进生产代码。

## Generator Protocol

- Pre-contract mode 只输出 Implementation Probe，不改 production code 或 tests。
- Behavior work 使用 tracer bullets：一个行为测试或验证切口 -> 最小实现 -> 下一个行为。
- 有自动测试条件时先确认 RED；无自动测试条件时写明原因和最小手测切口。
- 不删除、放宽或改写既有 test assertions 来换取通过。
- 不越过 contract；scope 扩大时回 Planner。
- 完成时记录 `verify_cmd` 和未手测风险。

## Evaluator Protocol

Evaluator 独立于实现者，不改文件。按顺序检查：

1. contract compliance；
2. tests 未被削弱；
3. TDD tracer evidence 或无法自动化测试的理由；
4. Markdown / Canvas user-data safety；
5. Obsidian lifecycle 与 manual verification gaps；
6. minimality、local style、剩余风险。

结论只能是：

- `PASS`
- `PASS_WITH_NOTES`
- `FAIL`

## Fallback

无法真正分发独立 Generator / Evaluator 时，必须记录：

```json
{
  "pge_fallback": {
    "enabled": true,
    "reason": "runtime cannot spawn independent PGE agent",
    "roles_collapsed": ["generator"],
    "lost_guarantees": ["context isolation"],
    "mitigations": ["explicit contract", "independent reviewer after implementation"],
    "restore_condition": "runtime exposes independent PGE agents or user authorizes subagents",
    "owner_ack_required": false
  }
}
```

允许 fallback；禁止 silent solo。

## Circuit Breaker

同一 interface / flow 连续 3 轮未通过 tests、reference alignment 或 evaluator review：

1. 停止继续实现；
2. 记录 mismatch 和 recovery condition；
3. 回到 Planner / 用户澄清；
4. 可复用踩坑写入 `harness/failures.md`。
