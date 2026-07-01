# CanvasMargin (`canvas-annotator`)

> AI Agent 入口。保持短小；细则放在 `harness/*.md`。
> 当前 harness 于 2026-07-01 基于真实仓库状态重建。旧 docs 可能漂移；使用前先用代码和测试校验。

## Identity

- **Product**: CanvasMargin
- **Package / manifest id**: `canvas-annotator`
- **Purpose**: Obsidian desktop plugin；在 Markdown 笔记里标记摘录，同步成 Canvas text node，并支持 note mark 与 Canvas node 双向跳转。
- **Repo type**: single-package plugin。
- **AI role**: 本仓库的 senior engineer；保护用户改动，遵守 local gates，交付前做 verification。

## Stack

- **Language**: TypeScript strict, ES2020。
- **Runtime**: Obsidian desktop / Electron；CodeMirror 6 由 Obsidian 提供。
- **Build**: esbuild 将 `src/main.ts` bundle 成 CommonJS `main.js`。
- **Tests**: Vitest pure-function unit tests。
- **Runtime dependency**: `nanoid`。
- **Plugin files**: `manifest.json`, `main.js`, `styles.css`。

## Commands

```bash
npm run dev
npm run build
npm test
npm run test:watch
npx vitest run tests/syncer.test.ts
npx vitest run -t "computeSyncDiff"
bash scripts/pre_commit_check.sh
bash scripts/pre_push_check.sh
```

`npm run build` 是主要 local gate：`tsc -noEmit -skipLibCheck` + production esbuild。

## Structure

```text
src/
  main.ts        plugin entry, commands, Obsidian workspace orchestration
  annotator.ts   pure Markdown mark insertion/removal
  syncer.ts      mark scan, Canvas metadata scan, diff, node creation
  jumper.ts      pure lookup helpers for note/Canvas jumps
  toolbar.ts     selection action helper and floating toolbar DOM
  settings.ts    Obsidian setting tab
  models.ts      shared regex, settings, constants, canvasMargin helpers
  canvas.d.ts    local declarations for internal Canvas APIs
tests/           Vitest coverage for pure functions
scripts/         optional local gates and hook helpers
docs/            current design summary only; old implementation plans were removed
harness/         operational rules for agents and contributors
```

## Hard Rules

1. 改动前读取本文件、相关 `harness/*.md`、目标源码、测试，以及 `harness/failures.md`。
2. Truth source 顺序：`src/` 实际行为 > `tests/` > `package.json` / `manifest.json` > 当前 README / `docs/design-spec.md`。
3. 保护已有 local changes；不要 revert 无关用户改动。
4. `AGENTS.md` 保持 200 行以内；细节下沉到 `harness/`。
5. 不得为了让实现通过而修改 test assertions。行为确实变化时，先记录 decision。
6. 新 mark 使用 `<mark class="cN" id="anc-{nanoid}">text</mark>`；继续读取旧 `class="... anc-..."` 格式。
7. Canvas metadata 放在 node 顶层 `canvasMargin: { anc }`；不要藏进 `node.text` HTML comment。
8. 交付前移除临时 `console.*` diagnostics，除非用户明确要求保留。
9. 代码改动后运行 scoped tests 和 `npm run build`；无法运行时说明原因。
10. 触碰用户可见 Obsidian 行为时需要 manual vault verification；未手测必须记录风险。
11. 用户要求 commit 时，commit message 使用 Conventional Commits：`type(scope): message`。

## Task Routing

| Scenario | Read |
|---|---|
| 任意 implementation | [development.md](harness/development.md), [workflow-gates.md](harness/workflow-gates.md), [coding-style.md](harness/coding-style.md) |
| Mark format, Canvas metadata, Obsidian workspace, settings | [api-standards.md](harness/api-standards.md), [dependency-map.md](harness/dependency-map.md) |
| 多模块或高风险行为 | [pge-protocol.md](harness/pge-protocol.md) |
| Tests 或 manual QA | [testing.md](harness/testing.md) |
| Review request | [code-review.md](harness/code-review.md) |
| Harness edits | [instruction-governance.md](harness/instruction-governance.md) |
| Release/package questions | [deployment.md](harness/deployment.md) |
| Terms | [glossary.md](harness/glossary.md) |
| 重复踩坑 | [failures.md](harness/failures.md) |

## Workflow

1. 先说明 concrete goal，并写清是否 `无待澄清`。
2. 先从真实 code/config 收集 context；docs 只当 historical input。
3. 做 scope classification：small / medium / large；medium+ risky work 才进入 PGE。
4. 行为改动优先 TDD：补或定位 failing test，再做 minimal fix，然后 verify。
5. 保持 narrow edits，尊重现有 module ownership。
6. 跑合适 gates，并报告通过/未运行的 exact commands。
7. 只有当任务改变项目状态、决策或失败经验时，才更新 state/history files。

## Index

| File | Purpose |
|---|---|
| [development.md](harness/development.md) | local setup, commands, repo facts |
| [workflow-gates.md](harness/workflow-gates.md) | start, verify, close, circuit breaker |
| [instruction-governance.md](harness/instruction-governance.md) | rule evolution |
| [coding-style.md](harness/coding-style.md) | TypeScript 与 module ownership |
| [testing.md](harness/testing.md) | unit tests 与 manual Obsidian verification |
| [code-review.md](harness/code-review.md) | review stance 与 checklist |
| [pge-protocol.md](harness/pge-protocol.md) | large-work protocol |
| [api-standards.md](harness/api-standards.md) | Obsidian, Canvas, mark, settings contracts |
| [dependency-map.md](harness/dependency-map.md) | internal/external dependency boundaries |
| [database.md](harness/database.md) | database status stub |
| [deployment.md](harness/deployment.md) | package/release rules |
| [glossary.md](harness/glossary.md) | project vocabulary |
| [failures.md](harness/failures.md) | incidents and learned rules |
