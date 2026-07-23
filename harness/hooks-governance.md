# Hooks Governance

> status: active
> owner: hook-governance
> layer: universal
> 本文件负责 hook boundaries 与 enablement guidance；不负责 PGE、testing、review 或 commit rules。

## Principles

- hook 只运行 machine-decidable、low-cost、low-false-positive check。
- semantic judgment 归 Challenge Gate、Evaluator 或 review。
- Git hook 保护 commit boundary；workflow command 保护 start boundary；Codex hook 仅在 input stable 且不需要 AI judgment 时启用。

## Not Enabled By Default

- `.git/hooks/pre-commit`：依赖 local machine state，不是 repository rule source。
- Codex CSC hook：只有稳定且无 AI transcript/context input 时才考虑启用。
- Stop hook：频率高且没有精确 default matcher。
- Spec / Harness drift hook：semantic drift 归 Planner/Evaluator/human review。

不要新增 Harness-specific hook 或 checker。只在 repository 已拥有且适合 machine check 的范围复用已有 hook。
