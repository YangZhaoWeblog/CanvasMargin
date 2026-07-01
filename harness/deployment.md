> status: active
> owner: release
> layer: profile
> 本文件负责 plugin packaging、release artifacts 和 compatibility 提醒；不负责功能实现。

# Deployment

## Current Facts

- Release artifact set: `main.js`, `manifest.json`, `styles.css`。
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
npm run build
npm test
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
- 发布时保持 `manifest.json` version 与 release notes 对齐。
- Manifest id change 视为 breaking；已有安装和社区引用可能依赖它。

## Known Release TODOs

- 确认 GitHub release / BRAT workflow 后，记录真实 release process。
- 用真实 API usage 复核最低 Obsidian version；manifest 当前是 `1.5.0`。
