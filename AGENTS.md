# CanvasMargin (`canvas-annotator`)

> AI Agent 入口。当前事实以 code/tests/config 为准；细则按 owner 放在 `harness/`。

## Identity

- **Product**: CanvasMargin
- **Package / manifest id**: `canvas-annotator`
- **Purpose**: Obsidian desktop plugin；在 Markdown 笔记中标记摘录、同步为 Canvas text node，并支持 note/Canvas 双向跳转。
- **Repo type**: single-package plugin。
- **AI role**: 本仓 senior engineer；保护用户改动，遵守 local gates，交付可核验结果。

## Stack

- **Language**: TypeScript strict, ES2020。
- **Runtime**: Obsidian desktop / Electron；CodeMirror 6 由 Obsidian 提供。
- **Build**: esbuild 将 `src/main.ts` bundle 为 CommonJS `main.js`。
- **Tests**: Vitest pure-function unit tests。
- **Runtime dependency**: `nanoid`。
- **Plugin files**: `manifest.json`, `main.js`, `styles.css`。

## Commands

```bash
npm run dev
npm run lint
npm run build
npm test
npm run test:watch
npx vitest run tests/syncer.test.ts
npx vitest run -t "computeSyncDiff"
bash scripts/pre_commit_check.sh
bash scripts/pre_push_check.sh
```

代码改动的主要 local gate：`npm run lint` + `npm run build` + `npm test`。

## Hard Rules

1. 编辑前读取相关 Harness owner、目标源码、邻近测试和 `harness/failures.md`。
2. Truth source：`src/` 实际行为 > `tests/` > `package.json` / `manifest.json` > README / current docs。
3. 保护 unrelated work；不使用 destructive Git 操作。
4. `AGENTS.md` 保持 200 行以内；细节归最小 owner。
5. 不为通过实现而删除、放宽或改写测试 assertions；行为变化先有明确 decision。
6. 新 mark 写作 `<mark class="cN" id="anc-{nanoid}">text</mark>`，继续读取旧 `class="... anc-..."` 格式。
7. Canvas metadata 存 node 顶层 `canvasMargin: { anc }`；不写进 `node.text` HTML comment。
8. 交付前移除临时 `console.*` diagnostics，除非用户明确要求保留。
9. 代码改动后运行 scoped tests、`npm run lint`、`npm run build`；跨模块改动还运行 `npm test`。
10. 触碰 Obsidian 可见行为时，按 `harness/api-standards.md` 做 manual vault verification；未手测必须写明风险。
11. PGE 只用于满足条件的**代码行为**改动；Harness、文档和其他非代码更新不因规模进入 PGE，但非平凡工作仍要做独立 review。
12. 用户要求 commit 时使用 Conventional Commits：`type(scope): message`。

## Task Routing

| Scenario | Read |
|---|---|
| 任意 implementation | [workflow-gates.md](harness/workflow-gates.md), [coding-style.md](harness/coding-style.md) 与目标模块/测试 |
| Mark、Canvas metadata、Obsidian workspace、settings | [api-standards.md](harness/api-standards.md) |
| 项目特有 code shape | [code-shape.md](harness/code-shape.md) |
| medium+ code behavior / critical flow | `$pge-workflow` 与 [pge-protocol.md](harness/pge-protocol.md) |
| Review | [code-review.md](harness/code-review.md) |
| Harness、文档、静态 config | [instruction-governance.md](harness/instruction-governance.md), [workflow-gates.md](harness/workflow-gates.md)；不进入 PGE |
| Release/package | [deployment.md](harness/deployment.md) |
| Hooks/local gates | [hooks-governance.md](harness/hooks-governance.md) |
| Terms | [glossary.md](harness/glossary.md) |
| 重复踩坑 | [failures.md](harness/failures.md) |

## Workflow

1. Intake：写清 concrete goal、acceptance、non-goals 和 `硬阻塞澄清：无硬阻塞`（或唯一的 blocker）。
2. Context：先读真实 code/config、当前 branch/worktree、相关 owners 与 failures。
3. Size & Risk：先分代码行为与非代码；只有合格代码行为进入 PGE。
4. Implement：行为代码用 `$tdd`；非行为工作做最小针对性验证。
5. Verify：先跑最小相关命令，再按风险扩大验证。
6. Evaluate：非平凡工作取得独立 review；PGE 使用独立 Evaluator。
7. Close：报告证据、残余风险、文档同步和 human-review handoff。

## Index

- `harness/workflow-gates.md`: execution、verification、commit gates。
- `harness/instruction-governance.md`: rule ownership 与 Harness evolution。
- `harness/coding-style.md`: universal code decisions 和 detected facts。
- `harness/code-shape.md`: evidence-backed project schemas。
- `harness/code-review.md`: review order、severity、conclusion。
- `harness/pge-protocol.md`: code-behavior PGE state machine。
- `harness/api-standards.md`: Obsidian、Canvas、Markdown、settings contracts。
- `harness/deployment.md`: package/release profile。
- `harness/hooks-governance.md`: hook boundaries。
- `harness/failures.md`: real failures and lessons。
- `harness/glossary.md`: project terminology。
- `.codex/agents/`: PGE Generator / Evaluator prompts。
- `docs/pge/`: Sprint Contract / Evaluator templates。
