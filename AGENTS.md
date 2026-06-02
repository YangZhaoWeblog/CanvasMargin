# CanvasMargin (canvas-annotator)

> AI Agent 入口。`CLAUDE.md` / `GEMINI.md` / `CODEBUDDY.md` 通过软链读取本文件。
> **目标 ≤200 行**。超出视为设计失败 → 拆到 `harness/*.md`。
> 详细规约下沉，本文件只做硬约束 + 索引。

## Identity

- **产品品牌**：CanvasMargin（用户层名字）
- **仓库 / manifest id**：`canvas-annotator`（变更需评估社区插件迁移成本）
- **项目定位**：Obsidian 桌面插件——在 markdown 笔记里高亮文本，把高亮以 `canvasMargin` 字段同步成 Canvas 节点；可双向跳转。
- **仓库类型**：single-package plugin（npm + esbuild + vitest）
- **AI 角色**：高级开发者，遵守本文件所有约束；产出经 hook 验证。

## Stack

| 层 | 技术 | 版本 |
|----|------|------|
| 语言 | TypeScript（strict） | ≥5.8 |
| 运行时 | Obsidian desktop（Electron） | ≥1.5.0 |
| 编辑器 | CodeMirror 6（externalized） | obsidian 内置 |
| 构建 | esbuild（CJS bundle → `main.js`） | ≥0.25 |
| 测试 | vitest（纯函数单元测试） | ≥3.0 |
| 唯一 runtime 依赖 | nanoid | ≥5.1 |
| 类型守门 | `tsc -noEmit` | 在 build 中跑 |
| Linter | 无 | TS strict 是质量门 |

## Commands

```bash
npm run dev              # esbuild watch
npm run build            # tsc -noEmit + esbuild prod
npm test                 # vitest run（全部）
npm run test:watch       # vitest 监听
npx vitest run tests/syncer.test.ts            # 单文件
npx vitest run -t "should compute sync diff"   # 单测试名
```

> 项目无 Makefile；`npm run build` 等价于"完整门禁"（type-check + bundle）。详见 [development.md](harness/development.md)。

## Structure

```
canvas-annotator/
├── src/                # 8 个模块（详见 glossary.md §模块责任）
│   ├── main.ts             # 入口：注册命令 + 编排
│   ├── annotator.ts        # CM 事务级插入/移除 <mark>
│   ├── syncer.ts           # vault marks ↔ Canvas nodes diff
│   ├── jumper.ts           # 双向跳转
│   ├── toolbar.ts          # 选区浮动工具条 + getToolbarAction 纯函数
│   ├── settings.ts         # 设置 UI
│   ├── models.ts           # 共享核心：regex/类型/builder/canvasMargin 读写
│   └── canvas.d.ts         # Obsidian 内部 Canvas API 类型声明
├── tests/              # 5 个 *.test.ts 纯函数单测
├── docs/               # 设计文档（含 specs/）
├── harness/            # 开发规约（AI + 人共读）
└── .harness/           # 状态文件（机器可读）
```

## Rules（违反即 BLOCK，hook 强制）

1. AGENTS.md 行数 ≤200（razor BLOCK；超出拆到 `harness/*`）
2. PROGRESS.md 同时只能有 1 个 `- [~]` in-progress 标记（WIP=1）
3. 测试断言不可被 AI 修改（test-guard hook 检测）
4. main 分支不直接改（feature branch + PR/merge）
5. 提交信息 `type(scope): message`（Conventional Commits）
6. sub-agent 嵌套深度 ≤2，单 message 并行 ≤5
7. 通过 `npm run build` 才算完成（type-check + bundle 必过）
8. **Obsidian 内手动验证** 是单测之外的完成定义（见 [testing.md](harness/testing.md)）
9. **Canvas 节点元数据走 `canvasMargin` 顶层字段**——不在 `node.text` 里塞 HTML 注释（见 [obsidian-api.md](harness/obsidian-api.md) §metadata）

## Workflow（AI 严格遵守）

1. **读 AGENTS.md + 相关 `harness/*.md`**——动手前的硬约束
2. **查 [failures.md](harness/failures.md)**——避免重复踩坑
3. **判 PGE 档位** → [development.md](harness/development.md) §PGE
   - 档 1：≤2h、单文件、单 harness 子规约
   - 档 2：跨多模块（如改 annotator 又改 syncer）
   - 档 3：跨天 / `/loop`
4. **TDD 优先**：先写 vitest 失败用例（Red），再实现
5. **最小变更实现**：让测试通过（Green），不做"顺便重构"
6. **过 `npm run build`**：tsc strict + esbuild 必过
7. **Obsidian 内手测**：纯函数外的所有路径都需要在真实 Vault 验证
8. **更新状态文件**：PROGRESS.md（what）+ DECISIONS.md（why）
9. **沉淀踩坑**：满足触发条件即写 `harness/failures.md`

### 踩坑触发（满足任一即必须记录）

- 排查 > 10 分钟的非显然 bug
- 生成代码被人工纠正
- Obsidian DOMPurify / CodeMirror 行为偏离预期
- Canvas API 内部变化导致 break
- 同一区域反复修改

格式见 [failures.md](harness/failures.md) 头部。

### Sub-agent 调用约束（PGE 档 2/3）

- 深度 ≤2 层（主 → sub → sub-sub）
- 单 message 并行 ≤5
- 必须文件交接（写 `.pge/*.md`），禁止 SendMessage
- 短命 sub-agent 退出后状态写入文件
- E 启动时只给 `.pge/spec.md` + git diff，不给 G 实现笔记

## Prohibitions

| ❌ 禁止 | ✅ 替代 |
|--------|---------|
| `console.log` 调试残留 | 删除前提交 |
| 跳过测试提 PR | `npm run build && npm test` 通过 |
| `git commit --no-verify` | 修复 hook 报错再提交 |
| 修改测试断言让自己通过 | 修代码不修测试 |
| AGENTS.md 加新规则 | 加到 `harness/*` 或升级到 hook |
| sub-agent 间 SendMessage | 文件交接 |
| 提交 `node_modules/` / `main.js` / `dist/` | `.gitignore` 已挡 |
| 在 mark 标签里放 `data-*` 属性 | DOMPurify 会剥离；用 `class` / `id` |
| 在 `node.text` 里塞 metadata（HTML 注释） | 用 `node.canvasMargin = { anc }` 顶层字段 |
| 信任 `docs/design-spec.md` 等过时文档 | 以 `src/` 代码为准（DECISIONS.md「真相源优先级」） |

## Patterns（决策表）

| 场景 | 选择 | 参考 |
|------|------|------|
| 改 mark 标签格式 | 兼容旧 `class="anc-..."` 格式 | [obsidian-api.md](harness/obsidian-api.md) §mark-tag |
| 写入 Canvas 节点 | `createTextNode({text})` 然后 `node.setData({...node.getData(), canvasMargin: {anc}})` | [obsidian-api.md](harness/obsidian-api.md) §metadata |
| 设置项变更 | 走 `data.json`，加迁移 | [obsidian-api.md](harness/obsidian-api.md) §settings |
| 文档画图 | Mermaid 优先 | - |

## Index（详细规约）

| 规约 | 文件 |
|------|------|
| 编码规范（TS / 命名 / import） | [coding-style.md](harness/coding-style.md) |
| 测试（单测 + Obsidian 手测） | [testing.md](harness/testing.md) |
| 术语表（anc / mark / canvasMargin / 模块责任） | [glossary.md](harness/glossary.md) |
| 踩坑记录 | [failures.md](harness/failures.md) |
| 开发流程（PGE / 短会话） | [development.md](harness/development.md) |
| Obsidian / Canvas API 接触面 | [obsidian-api.md](harness/obsidian-api.md) |
| 部署（manifest / release） | [deployment.md](harness/deployment.md) |
| Code Review | [code-review.md](harness/code-review.md) |

## State Files（机器可读 + 冷启动友好）

| 文件 | 内容 | 改动者 |
|------|------|--------|
| [PROGRESS.md](PROGRESS.md) | 已完成 / 进行中（WIP=1）/ 阻塞 | AI 每会话尾更新 |
| [DECISIONS.md](DECISIONS.md) | 关键决策的"为什么" | AI + 人 |
| `.harness/metrics.tsv` | hook 写入的度量趋势 | hook |
| `.pge/spec.md` | sprint contract（PGE 档 2/3，按需） | Planner |

## Hooks（git 钩子）

> ⚠️ 仓库主路径已设置全局 `core.hooksPath`。**不自动安装到 `.git/hooks/`**——避免与全局 hook 冲突。

启用方式（任选其一）：
- 手动跑：`bash scripts/pre_commit_check.sh` 在每次 commit 前
- 项目级覆盖：`git config --local core.hooksPath scripts/githooks` 后软链 `pre-commit` 等
- 详见 `scripts/README.md`

无论是否安装 hook，规约本身（≤200 行 / WIP=1 / test-guard）都是 AI 的硬约束。

---

> 本文件由 [td-harness-init](https://github.com/...) skill 生成于 2026-06-02 (v0.1)。
> 修改本文件等于修改硬约束——只增不减需团队评审。
