> status: active
> owner: release
> layer: profile
> 本文件负责 plugin packaging、release artifacts 和 compatibility 提醒；不负责功能实现。

# Deployment

## Current Facts

- Release artifact set: `main.js`, `manifest.json`, `styles.css`。
- Community metadata set: `README.md`, `LICENSE`, `manifest.json`, `versions.json`。
- Bundle entry: `src/main.ts`。
- Bundle format: Obsidian 使用的 CommonJS。
- Manifest id: `canvas-annotator`。
- Manifest display name: `Canvas Annotator`。
- Product/readme name: `CanvasMargin`。
- Desktop only: `isDesktopOnly: true`。
- Release automation: unknown。

## Pre-Release Gate

运行：

```bash
npm run lint
npm run build
npm test
npm audit
```

然后在 Obsidian test vault 手动验证：

- plugin 能从 test vault plugin folder 加载；
- highlight insertion and removal；
- manual sync to Canvas；
- note-to-Canvas jump；
- Canvas-to-note double-click jump；
- settings reload 后仍持久化。

## Artifact Rules

- 不手改 generated `main.js`。
- 不提交 `dist/` 或 `node_modules/`。
- 发布时 GitHub release tag 必须等于 `manifest.json` version。
- Release assets 上传 `main.js`, `manifest.json`, `styles.css`。
- 更新 `versions.json`，保持 plugin version 到最低 Obsidian version 的映射。
- Manifest id change 视为 breaking；已有安装和社区引用可能依赖它。

## Known Release TODOs

- 确认 GitHub release / BRAT workflow 后，记录真实 release process。
- 用真实 API usage 复核最低 Obsidian version；manifest 当前是 `1.5.0`。
