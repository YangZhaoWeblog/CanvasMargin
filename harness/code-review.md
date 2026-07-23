# Code Review

> status: active
> owner: code-review
> layer: universal
> 本文件负责 review order、severity、evidence 和 conclusion；领域规则仍归各自 Harness owner。

## Review Order

1. 记录 Review base 与 candidate 的 immutable full commit SHA。PGE evaluation 要求 in-scope change 已提交、无 staged/unstaged production diff、每个 untracked path 已分类；随后完整阅读 `git diff <base-sha>...<candidate-sha>`。
2. **Standards**：在读 tests 或 author rationale 前，按 `coding-style.md`、触发的 `code-shape.md` schema 与相关 API/storage/database owner 冻结 findings。
3. **Spec**：对照 originating Contract、issue 或 approved plan，识别 missing behavior、incorrect behavior 与 scope creep。
4. 阅读 tests 与 verification evidence；它们可以确认行为，但不能消除 production findings。
5. 分别报告两个轴，再给出 required overall conclusion。

不要把 generic smell catalog 粘到每次 review。已记录的 repository rule 优先；schema 的 valid control 阻止机械 finding；tooling-owned formatting 不做人工重审。

## Severity

- Critical：security、authorization、data/state corruption、deterministic-runtime breach，或超出 approved behavior boundary。
- Major：incorrect behavior、missing acceptance、fake verification、materially harmful design，或 broken workflow gate。
- Minor：不阻塞 acceptance 的 maintainability / clarity 问题。

每条 finding 都应引用 file/location、evidence、impact、governing rule 或 Contract clause 与 required action；不要凑数量。

## Conclusions

- PGE 只返回 `PASS`、`PASS_WITH_NOTES` 或 `FAIL`。
- 未解决的 Critical 或 Major 必须为 `FAIL`。
- `PASS_WITH_NOTES` 关闭前需要 explicit owner acceptance。
- PGE Evaluator 是该任务的独立 AI review；不要再加重复 generic reviewer。
- 非 PGE 的 non-trivial work 仍需要 independent review；human PR review 始终独立存在。
