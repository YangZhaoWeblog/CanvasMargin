# Coding Style

> status: active
> owner: coding-style
> layer: universal
> 本文件负责 universal code decisions 与已核对的 repository facts；project correction 归 `code-shape.md`。

## Decisions

- 为下一位读者优化：clarity、simplicity、local consistency 优先于时髦模式。
- 发明 vocabulary、wrapper 或 abstraction 前，先搜索同层和邻近 flow。
- 让 use-case flow 可见：rejection、policy、state change、side effect、result/event 应可按顺序 review。
- 在可避免的 persistence / external effect 前完成本地可判定的 rejection。
- 命名真实 object、role、transition 和 ordering basis；generic name 只用于真正 generic referent。
- 既有 capability contract 匹配时复用；删掉 abstraction 会损失 behavior、stable boundary、reusable policy 或 material clarity 时才保留。
- helper 要消费多个耦合字段时保留 cohesive loaded object；不要扩张会表达不同 snapshot 的 scalar tunnel。
- 按 semantic groups 和 spatial proximity 排版；不为数字化行宽机械格式化。
- 仅在 business stage 或意外顺序需要时写短 navigation comment。
- defensive check 只放在真实 trust boundary 或已观察 failure；test double 必须遵守 production contract。
- tests 保护 observable behavior 与 business-significant order，不保护 incidental helper choreography。
- 测试通过不自动证明 naming、abstraction、visible flow 或 semantic layout 合格；production diff 要独立 review。
- 不扩张 approved goal；GREEN 后只处理 current-change residue，不顺手清理 unrelated code。

## Detected Repository Facts

- TypeScript 配置启用 `strict`、`noImplicitAny`、`isolatedModules`；type-only 位置使用 `type` import。
- `main.ts` 是 Obsidian lifecycle/workspace orchestration；`settings.ts` 只拥有 settings UI。
- `annotator.ts`、`syncer.ts`、`jumper.ts` 与 `toolbar.ts` 的可纯化行为应保持可单测，不能反向 import `main.ts`。
- `models.ts` 持有 shared regex、constants、settings shape 和 metadata helper；`canvas.d.ts` 只声明实际使用的 narrow Canvas internal API subset。
- `nanoid` 是唯一 runtime npm dependency；新增 runtime dependency 要有明确 local-code 不足和 bundle-impact 证据。
- `main.js`、`dist/`、`node_modules/` 是 generated/local output，不手改或提交。
