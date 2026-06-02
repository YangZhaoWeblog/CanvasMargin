# 进度（PROGRESS.md）

> **WIP=1 强制约束**：同时只允许一个 `- [~]` 标记的任务。多个则 hook BLOCK。
> 每会话尾更新；下一会话开始时读取作为冷启动入口。

## 进行中（最多 1 项）

<!-- 例：- [~] 把 jumper 的 vault 扫描换成倒排索引（开始：2026-06-02） -->

## 已完成（倒序，最近 10 条）

- [x] 2026-06-02 td-harness 初始化（rebase 到 main，重写 harness 对齐 `canvasMargin` 顶层字段协议；AGENTS.md / harness/* / state files / scripts）

## 阻塞 / 待澄清

<!-- - [ ] {描述 + 阻塞原因 + 等谁解决} -->

## 下一步候选（待决策）

- [ ] 决定是否启用 git hook（当前因 worktree + 全局 hooksPath 暂未自动安装；启用方式见 scripts/README.md）
- [ ] 评估 manifest id `canvas-annotator` 与 README 安装路径 `canvas-margin/` 不一致——改名是 breaking，需决策（见 harness/deployment.md）
- [ ] `docs/design-spec.md` 自身已过时（仍说"共享 `<!--card:-->` 协议"），下次集中改设计文档时一并刷新
- [ ] `/td-harness-init` skill 增强：在 probe 环境时检查 worktree 是否落后于 main，避免再次踩 failures.md 2026-06-02 第 1 条的坑

---

## 冷启动指引（给下一会话的你）

如果你是新会话：
1. 先读 [AGENTS.md](AGENTS.md)
2. 再读 [DECISIONS.md](DECISIONS.md) 了解为什么这样做（特别是「真相源优先级」）
3. 看本文件「进行中」即可知道当前要继续什么
4. 看 git log 与 [failures.md](harness/failures.md) 了解最近踩坑
5. 文档与代码冲突时——**以 src/ 代码为准**（DECISIONS.md 2026-06-02 第 1 条）
