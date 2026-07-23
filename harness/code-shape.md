# Project Code Shape

> status: active
> owner: project-code-shape
> layer: project-grown
> 只记录经 review 或 failure 证实的项目特有 schema；architecture 归 `docs/architecture.md`，universal principle 归 `coding-style.md`，incident history 归 `failures.md`。

每个 schema 必须恰好包含四项：

- **Use when**: concrete trigger。
- **Prefer**: local positive shape。
- **Avoid**: proven negative shape 及其 cost。
- **Exception**: 防止 mechanical enforcement 的 valid control。

## Current State

当前没有同时具备真实 negative、正向 shape 和 valid control 的 project-grown code schema。不要从 module map、API contract 或单次偏好凭空造 rule；这些事实分别由 `docs/architecture.md` 与 `harness/api-standards.md` 负责。
