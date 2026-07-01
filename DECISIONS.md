# 决策记录（DECISIONS.md）

> 只记录关键 why。倒序追加；字段保持：背景 / 选择 / 理由 / 代价 / 回滚 / 关联。

## 记录

### 2026-07-01：项目 harness 接入 PGE Generator / Evaluator baseline

- **背景**：`harness-init` 已升级，原项目 harness 只有简版 PGE 文档，缺少项目级 Generator / Evaluator agent 和 contract/eval 模板。
- **选择**：将 `.codex/agents/pge-generator.toml`、`.codex/agents/pge-evaluator.toml`、`docs/pge/*template.md` 接入本仓，并升级 `harness/pge-protocol.md`。
- **理由**：medium+ / risky work 需要文件化 contract 与独立 evaluator，避免同上下文 self-review 失真。
- **代价**：新增少量流程文件；small low-risk work 仍允许 solo。
- **回滚**：如果 PGE 对本项目过重，将 `.codex/agents` 和 `docs/pge` 降级为 stub，并收窄 `pge-protocol.md` activation。
- **关联**：`.codex/agents/`、`docs/pge/`、`harness/pge-protocol.md`

### 2026-07-01：Obsidian 规范 gate 采用 lint/build/test 分层

- **背景**：项目需要区分 Community plugin 规范、TypeScript 架构债和 Obsidian runtime 手测。
- **选择**：新增 `eslint-plugin-obsidianmd` gate；typed `any` 债暂不作为 blocker；release 前保留 manual vault verification。
- **理由**：官方规则能捕捉 manifest、settings、DOM 和 UI 风险；Canvas/internal API 类型债需要单独重构。
- **代价**：`npm run lint` 当前允许 warnings。
- **回滚**：若 lint 插件误报阻塞开发，则收窄到 release-only gate。
- **关联**：`eslint.config.mjs`、`harness/testing.md`、`harness/deployment.md`

### 2026-07-01：删除旧实现文档，只保留反模式和决策原因

- **背景**：旧 plans/specs 含大量可照抄的旧实现片段，容易误导后续 AI 需求。
- **选择**：删除旧实现本体，把有效原因压缩到 current docs、harness 和本文件。
- **理由**：Git history 足够追溯；工作区只保留当前 contract 和简短 anti-pattern。
- **代价**：不能在工作区直接阅读早期执行计划。
- **回滚**：需要历史复盘时从 git history 查看旧 docs。
- **关联**：`docs/design-spec.md`、`harness/api-standards.md`、`harness/code-review.md`

### 2026-07-01：Harness 写作风格采用中文主干 + precise English terms

- **背景**：主要读者是中文用户；关键 English terms 有助于 LLM 稳定理解技术语义。
- **选择**：中文主干 + 文件名、API、命令、protocol、精确技术词保留英文。
- **理由**：兼顾人工可读性和技术 token 稳定性。
- **代价**：需要避免随机夹杂英文。
- **回滚**：团队要求统一英文或统一中文。
- **关联**：`AGENTS.md`、`harness/instruction-governance.md`

### 2026-07-01：覆盖式重建 harness，以真实代码和配置为事实源

- **背景**：用户要求 `$harness-init` 覆盖现有 harness，并提醒旧文档可能不匹配代码。
- **选择**：从 `src/`、tests、package/manifest、脚本和 README 重新生成；Obsidian/Canvas 规则归到 `api-standards` 和 `dependency-map`。
- **理由**：旧文档已经漂移，不能继续作为规则来源。
- **代价**：旧 harness 的细叙述被压缩；project-grown 规则后续再沉淀。
- **回滚**：发现新 harness 漏掉仍被 hook 或团队流程依赖的硬约束。
- **关联**：`AGENTS.md`、`harness/*.md`、`src/models.ts`、`src/syncer.ts`

### 2026-06-02：真相源优先级

- **背景**：曾因旧 docs / 旧 harness 把已废弃协议写进规则。
- **选择**：冲突时按 `src/` > tests > package/manifest > README / current docs 判断。
- **理由**：运行代码和测试比文档更接近真实行为。
- **代价**：遇到冲突必须读代码，不能只读文档。
- **回滚**：项目事实源发生根本变化。
- **关联**：`harness/failures.md`

### 2026-06-02：Canvas 节点元数据用 `canvasMargin` 顶层字段

- **背景**：早期把锚点 ID 嵌在 Canvas node text 中，用户编辑节点时容易误删，也会和其他插件耦合。
- **选择**：使用 node 顶层 JSON 字段 `canvasMargin: { anc }`。
- **理由**：字段语义清楚，序列化自然，用户编辑文本不会误碰 metadata。
- **代价**：旧数据迁移属于一次性历史处理；当前实现只维护 `canvasMargin` contract。
- **回滚**：Obsidian Canvas 不再支持顶层自定义字段。
- **关联**：`harness/api-standards.md`、commit `4d50de5`

### 2026-06-02：用 `id="anc-..."` 而不是 `data-anc`

- **背景**：mark 标签需要携带稳定 ID 以关联 Canvas node。
- **选择**：新写入使用 `id="anc-..."`，继续读取旧 class-encoded anchors。
- **理由**：Obsidian sanitization 可能剥离 `data-*`；`id` 比 class 更像主键。
- **代价**：HTML 标准要求 id 唯一，但单文件渲染中风险可控。
- **回滚**：Obsidian 允许 `data-*` 且 id 唯一性成为真实问题。
- **关联**：`harness/api-standards.md`

### 2026-06-02：不在 worktree 内自动安装 git hook

- **背景**：仓库曾处于 worktree，且用户全局可能已有 `core.hooksPath`。
- **选择**：只保留 `scripts/` gate，不自动写 git hooks。
- **理由**：避免污染主仓 hook 或覆盖用户全局 hook。
- **代价**：未手动启用 hook 时，违规不会被 git 自动拒绝。
- **回滚**：用户决定为本仓启用 `core.hooksPath scripts/githooks`。
- **关联**：`scripts/README.md`
