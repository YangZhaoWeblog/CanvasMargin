# Deployment

> status: active
> owner: deployment
> layer: profile
> 本文件负责 plugin packaging、release artifact、compatibility 与 rollback/runbook facts；不负责功能实现或 local development。

## Current Facts

- Release artifact set: `main.js`, `manifest.json`, `styles.css`。
- Community metadata: `README.md`, `LICENSE`, `manifest.json`, `versions.json`。
- Bundle entry: `src/main.ts`；format: Obsidian 使用的 CommonJS。
- Manifest id: `canvas-annotator`；display name: `Canvas Annotator`；product/readme name: `CanvasMargin`。
- Desktop only: `isDesktopOnly: true`；minimum Obsidian version: `1.5.0`。
- CI/CD、release automation、rollback runbook：unknown。

## Pre-Release Gate

```bash
npm run lint
npm run build
npm test
npm audit
```

随后在 Obsidian test vault 手测：plugin load、highlight insertion/removal、manual sync、note-to-Canvas jump、Canvas-to-note double-click jump、settings persistence。

## Artifact Rules

- 不手改 generated `main.js`。
- 不提交 `dist/` 或 `node_modules/`。
- 发布时 GitHub release tag 等于 `manifest.json` version。
- Release assets 上传 `main.js`、`manifest.json`、`styles.css`。
- 更新 `versions.json`，保持 plugin version 到最低 Obsidian version 的映射。
- Manifest id change 是 breaking；existing install/community reference 可能依赖它。
- secrets 不进入 repository；真实 CI/CD、deployment environment、rollback 与 observability 建立后在本文件记录。

## Known Release TODOs

- 确认 GitHub release / BRAT workflow 后，记录真实 release process。
- 用真实 API usage 复核最低 Obsidian version。
