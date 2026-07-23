# Workflow Gates

> status: active
> owner: execution-gates
> layer: universal
> 本文件负责 execution、verification、commit gates；不负责 topic-specific implementation rule。

## Context Gate

读取足以安全决定下一步的最小 context：`AGENTS.md`、相关 Harness owner、target files、nearby tests 和 relevant failure notes。

## Size & Risk Gate

- **Non-code**：Harness、文档、静态 config 或 local-gate 文档；不进入 PGE，按影响范围做 proportional verification 和 review。
- **Small code**：local bug/config/code change，通常 1–3 files。
- **Medium code**：multi-file feature、public interface、state/schema 或 critical flow。
- **Large code**：new module、cross-module change、new dependency 或 high-risk workflow。

当代码 scope 跨 owner、public API / state / deployment behavior 出现时升级分类；非代码更新不会仅因 file count 升级为 PGE。

## Path Gate

Small code 在 Coding Start Check 后可直接推进。Medium+ 或 critical-flow 的**代码行为**必须用 `$pge-workflow` 完成 Grill、Contract Challenge、Contract lock 和 Human Start，再回到 Verify/Close。Harness、文档和其他非代码工作走 normal review path，不进 PGE。

## Coding Start Check

进入 production code 前：

1. 确认 branch 非 protected branch。
2. 检查 worktree，保护 unrelated user changes。
3. 确认 required context 和 design artifacts 存在。
4. 确认 verification strategy。
5. PGE code work 还需确认 protocol v2、Grill Closure、locked Contract，以及与当前 revision 匹配的 `human_start_gate.status = approved`、non-empty channel/evidence。
6. PGE code work 直接读取 active Contract，核对 revision、locked decision、Review base 和 Human Start evidence；缺失或 stale 时停止 production code / code-writing agent。

## Dirty Worktree Protocol

- 既有 change 视为 user work；编辑 touched file 前先读 relevant diff。
- 避免 unrelated formatting。
- destructive action 前确认 exact target 与 scope；不明确时先问。

## Verification Gate

- Docs/Harness/static config：检查 links、rendering、ownership、stale references 和 relevant local gate；通常不需要 build。
- Pure helper code：targeted Vitest + `npm run lint` + `npm run build`。
- Cross-module code：相关 Vitest、`npm run lint`、`npm test`、`npm run build`。
- Obsidian integration：automated gates + `api-standards.md` 的 manual vault verification。

记录 command 和 result；不得 silent skip。

## Circuit Breaker Gate

同一 interface / flow 连续三轮 tests、reference alignment 或 review 失败时，停止 patching，记录 evidence/recovery condition，回到 design 或 user clarification。

## Commit Gate

commit 前确认 Coding Start Check 仍成立、verification 已运行、没有 unrelated file。Normal PGE / fallback 需要 current-revision Human Start；有 Evaluator 时需要 `PASS` 或 owner-accepted `PASS_WITH_NOTES`，`FAIL` 阻止 commit/close。Non-PGE non-trivial work 需要 independent AI review；Harness build 的独立 review 也在此列。Human PR review 保持独立。

Serial task 默认 current workspace + semantic branch。parallel code-writing 默认 git worktree，一份 PGE 一条 branch；shared protocol、migration、state machine、public-interface hot zone 或 shared helper hot zone 保持 serial。
