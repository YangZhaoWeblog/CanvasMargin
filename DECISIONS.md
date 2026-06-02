# 决策记录（DECISIONS.md）

> **L05 反共识**：压缩会话只保留"是什么"，丢掉"为什么"。
> 关键决策必须落到本文件——为下一会话保留判断依据。

## 决策格式

每条决策追加到「记录」区，倒序：

```
### YYYY-MM-DD：[一句话决策]

- **背景**：[何时何地、面对什么问题]
- **候选方案**：[A / B / C 各自的代价与收益]
- **选择**：[选了哪个]
- **理由**：[为什么——这是对未来你最有用的部分]
- **代价**：[这个选择放弃了什么]
- **回滚条件**：[什么信号出现时应当推翻此决策]
- **关联**：[Issue / PR / 文档链接]
```

## 触发条件（满足任一即必须记录）

- 选择了一个非显然的技术方案
- 拒绝了一个看起来合理的方案
- 引入新的外部依赖 / 第三方服务
- 修改了硬约束（AGENTS.md Rules）
- 经过 ≥3 人讨论后的结果

## 记录

### 2026-06-02：真相源优先级——代码 > 测试 > harness/* > 旧文档

- **背景**：td-harness 初始化时基于落后 main 3 个 commit 的 worktree 写 harness/*；AI 读了同样过时的 `docs/design-spec.md` 与旧 CLAUDE.md，把已经废弃的 `<!--card:-->` 协议写成 harness 红线（详见 failures.md 同日第 1 条）
- **候选方案**：(A) 立即改正 + 加规约 / (B) 不改正、留指针 / (C) 不改也不记
- **选择**：A（rebase 到 main 后整套重写）+ 加本决策作为规约
- **理由**：harness 必须能容忍"文档与代码漂移"，但前提是规约本身先成立。优先级在第一次踩坑时立即固化，比让它在多份文件里隐含传递更可靠。
- **真相源优先级**（今后冲突时按此判）：
  1. `src/` 下的可运行代码（实际行为）
  2. `tests/` 下的断言（行为契约）
  3. `harness/*.md`（规约 / 历史 / 风险）
  4. `AGENTS.md`（顶层硬约束 + 索引）
  5. 旧 `docs/`（含 design-spec、specs/）—— **会过时**，参考价值仅作为历史
  6. 旧 README / 旧 CLAUDE.md —— 同样会过时
- **配套机制**：
  - failures.md 已记录"AI 信文档不信代码"踩坑（计数 1）
  - 计数 ≥3 时升级为 `/td-harness-init` skill 的内置检查（probe 阶段做 git 分歧度）
- **代价**：每次冲突都要"读代码"一道，AI 不能偷懒只读文档
- **回滚条件**：项目结构发生根本变化（例如 src/ 不再是事实源）—— 当前不预期
- **关联**：harness/failures.md 2026-06-02 第 1 条；rebase 提交 `0eebdb7`

### 2026-06-02：Canvas 节点元数据用 `canvasMargin` 顶层字段，不再用 `<!--card:-->` HTML 注释

- **背景**：早期实现把锚点 ID 嵌在 `node.text` 末尾的 `<!--card:{"anc":"..."}-->` HTML 注释里；多个问题：(a) 用户编辑节点时容易误删 (b) 需要 regex 扫 text，解析不直观 (c) 与 canvas2anki 共用同一个 key，两插件元数据耦合
- **候选方案**：(A) 维持 HTML 注释 / (B) 移到节点顶层 JSON 字段（与 Advanced Canvas 的 `styleAttributes` / `zIndex` 一致风格） / (C) 单独的 sidecar 文件
- **选择**：B
- **理由**：顶层字段是 Canvas 自定义元数据的"主流"做法，序列化进 .canvas JSON 自然，用户编辑文本不会误碰，与其他插件解耦
- **命名**：`canvasMargin`（小驼峰，匹配产品品牌 CanvasMargin）；值为对象 `{ anc: string }`，未来可扩展
- **代价**：
  - **不**做向后兼容——旧 `<!--card:-->` 数据需一次性迁移脚本（spec 里明确）
  - 与 canvas2anki 不再共享 key，两插件需各自迁移自己的数据
- **回滚条件**：Obsidian Canvas 改变了顶层自定义字段的支持方式（例如要求统一进 `styleAttributes`）
- **关联**：spec `docs/superpowers/specs/2026-04-22-toplevel-field-migration.md`；commit `4d50de5`；harness/obsidian-api.md §3

### 2026-06-02：用 `id="anc-..."` 而不是 `data-anc="..."`

- **背景**：mark 标签需要携带稳定 ID 以与 Canvas 节点关联
- **候选方案**：(A) `data-anc="..."` 自定义属性 / (B) `class="anc-..."` 一并塞进 class / (C) `id="anc-..."`
- **选择**：C（同时兼容旧的 B 解析）
- **理由**：Obsidian 内部用 DOMPurify 清洗 HTML，会剥离 `data-*` 属性。`class` 与 `id` 是少数能存活的属性载体；`id` 比 class 语义更清楚（"主键"），且 nanoid 21 字符碰撞概率可忽略。
- **代价**：失去 HTML 标准 `id` 唯一性约束（DOM 里同 id 多次出现），但 Obsidian 渲染单文件时不构成实际问题。
- **回滚条件**：Obsidian 改 DOMPurify 配置允许 `data-*`，且 `id` 唯一性变成实际渲染问题。
- **关联**：harness/failures.md「DOMPurify 剥 `data-*` 属性」；harness/obsidian-api.md §1 mark-tag

### 2026-06-02：不在 worktree 内自动安装 git hook

- **背景**：当前在 git worktree（`.git` 是文件），且用户全局 `core.hooksPath = ~/.git-hooks` 已生效
- **候选方案**：(A) 强行写入 worktree 的 git common-dir / (B) 写入 `core.hooksPath` 当前路径 / (C) 仅复制脚本到 `scripts/` 不接到 git
- **选择**：C
- **理由**：方案 A 会污染主仓的全局 hook；方案 B 会覆盖用户的全局 hook 体系。规约本身对 AI 仍是硬约束（AGENTS.md Rules），hook 只是物理强制——可后续按需启用。
- **代价**：违规不会被 git 拒绝；只能靠 AI 自律 + 人工把关
- **回滚条件**：用户决定专门为本仓启用，可手动 `git config --local core.hooksPath scripts/githooks`
- **关联**：AGENTS.md §Hooks；scripts/README.md
