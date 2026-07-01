# 进度（PROGRESS.md）

## 进行中

## 已完成

- [x] 2026-07-01 接入 PGE Generator / Evaluator baseline：新增 `.codex/agents` 与 `docs/pge` 模板，升级 PGE 协议
- [x] 2026-07-01 对齐 Obsidian plugin 规范 gate：补 LICENSE/versions.json，加入 lint/build/test/audit 验证，清理 debug log 和 DOM listener lifecycle
- [x] 2026-07-01 清理文档漂移：删除旧 implementation plans/specs，重写 current design doc，对齐 README、BRAT、hook scripts
- [x] 2026-07-01 重建 AGENTS.md 与 harness baseline，采用中文主干 + precise English terms
- [x] 2026-06-03 对齐 toplevel-field migration docs；main.ts 支持 reading-mode jump 和 active-leaf-change 双击绑定
- [x] 2026-06-02 初始化 td-harness

## 下一步候选

- [ ] 用 Obsidian test vault 手测 highlight/sync/jump/settings 全链路
- [ ] 收敛 Canvas/internal API 的 `any` 类型债
- [ ] 评估 `main.ts` integration 层拆分和 `editor.setValue` range-edit 重构
- [ ] 决定是否启用 git hook
