> status: active
> owner: dependencies
> layer: profile
> 本文件负责 external dependencies、internal API 和 module dependency boundaries；不负责 package release。

# Dependency Map

## External Runtime

- `obsidian`: host API，bundle external。
- `electron`: externalized；除非必要，不直接 import。
- CodeMirror packages: 由 Obsidian 提供，esbuild externalized。
- `nanoid`: 唯一 runtime npm dependency，用于 anchor ids。

## Dev Tooling

- `typescript`: strict type gate。
- `esbuild`: production bundle 和 watch build。
- `vitest`: pure-function unit tests。
- `@types/node`: tooling types。

## Module Dependencies

- `main.ts` 可以 import 所有 project modules。
- Pure modules 不应 import `main.ts`。
- `annotator.ts`、`syncer.ts`、`jumper.ts`、`toolbar.ts` 要保持 pure functions testable。
- Obsidian DOM/workspace access 放在 `main.ts`、`settings.ts` 或 `FloatingToolbar`。

## Risky Dependencies

- Internal Canvas APIs 可能变化；`canvas.d.ts` 只声明本仓需要的 narrow subset。
- DOMPurify / Markdown rendering 可能改变 mark attributes；相关改动后要手测 rendered marks。
- Workspace leaf visibility 容易出错；用 explicit checks 和 user notices。

## Adding Dependencies

新增 runtime dependency 前：

- 说明为什么 local code 或 dev-only tooling 不够；
- 检查 bundle impact；
- 更新 `package.json`、lockfile 和本文件；
- 跑 `npm run build` 和 `npm test`。
