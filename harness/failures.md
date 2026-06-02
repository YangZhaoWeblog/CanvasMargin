# 踩坑记录（failures）

> **walkinglabs L08**：原语不能被绕过。本文件就是反馈循环的"信息原语"。
> 每条踩坑既是教训也是规约种子——出现 ≥3 次的同类踩坑应升级为 hook 或 harness 规则。

## 触发条件（AGENTS.md Workflow §最后一步）

满足任一即必须记录：
- 排查 > 10 分钟的非显然 bug
- 生成代码被人工纠正（说明 AI 认知有误）
- Obsidian DOMPurify / CodeMirror 行为偏离预期
- Canvas API 内部变化导致 break
- revert 之前的提交
- 同一区域代码反复修改

## 记录格式

倒序追加：

```
### YYYY-MM-DD：[一句话现象]

- **上下文**：[何时何地、何种操作触发]
- **根因**：[真正的原因，非表象]
- **临时绕过**：[当时怎么解决]
- **根治方案**：[长期方案 / PR 链接]
- **沉淀去向**：[是否升级到 harness/* 或 hook —— 关键字段]
- **同类计数**：[第几次遇到同类问题，≥3 触发升级]
- **关联**：[Issue / PR / 文档]
```

## 升级机制

每完成一个里程碑扫描本文件，统计 `同类计数` 字段：
- 计数 ≥3 → 升级为 `harness/*.md` 规则
- 升级后清空对应记录，留指针：`→ 已升级到 harness/coding-style.md §xxx`
- 每次升级在 DECISIONS.md 落一条

## 反模式

- ❌ 不记录、忘记记录、用"太简单"为由跳过
- ❌ 只记现象不记根因
- ❌ 只写"修了"不写"怎么修"
- ❌ 计数 ≥3 还不升级（重复造轮子）

## 已知踩坑记录（倒序）

### 2026-06-02：td-harness 初始化时整套 harness 写错——基于落后 worktree 的旧代码

- **上下文**：在 `quilted-bongo` worktree 跑 `/td-harness-init`。此 worktree 从 `5a92f5a` 切出，落后 main 3 个 commit；**最关键的 `4d50de5 "change the data store logic"`（把 `<!--card:-->` HTML 注释整套换成 `canvasMargin` 顶层字段）不在 worktree 里**。AI 读到的 `models.ts` / `syncer.ts` / `jumper.ts` 都是旧版本——再加上读了同样过时的 docs/design-spec.md 旧 CLAUDE.md，自信地把"`<!--card:-->` 共享协议"写进 `harness/obsidian-api.md` / `harness/glossary.md` / `DECISIONS.md`，作为"红线铁律"
- **根因**：
  1. **worktree 落后 main 而无人察觉**——AI 把 worktree 的 HEAD 当成项目现状，没运行 `git log main..HEAD` 或 `git rev-list --left-right --count main...HEAD` 这种"分歧度"检查
  2. **没用代码做最终核对**——即便读了 `src/models.ts`，也没追问"这是不是 main 上最新的？"
  3. **过时文档放大了错误**——`docs/design-spec.md` 自己也还在说"共享 `<!--card:-->`"，给了 AI 错误的二次确认
- **临时绕过**：用户察觉异常 → AI rebase 到 main → 重写 6 个 harness 文件
- **根治方案**：
  - **短期**：DECISIONS.md「真相源优先级」（src > tests > harness > AGENTS.md > 旧文档）已落，本文件这条记录提供"故事化"的反例
  - **中期**：`/td-harness-init` skill 在 step 2「Probe environment」里加 git 分歧度检查——`git rev-list --left-right --count <main>...HEAD`，落后 main 即报警；并提示用户：在落后分支上 init 是否真的合理
  - **长期**：harness 模板里加一段"**禁止把 docs/ 当事实**——读 docs/ 时先 `git log -1 --format=%cd <doc>` 看修改时间与最新源代码差多少天"
- **沉淀去向**：→ td-harness-init skill v0.2 的 step 2 加 git 分歧检查；→ DECISIONS.md 2026-06-02 「真相源优先级」
- **同类计数**：1（"AI 信文档/旧分支不信代码"类，**预计会再出现**——计数到 3 触发升级到 hook 或 skill 内部检查）
- **关联**：rebase 提交 `0eebdb7`；spec `docs/superpowers/specs/2026-04-22-toplevel-field-migration.md`；旧 commit `5a92f5a`（worktree 起点） vs `4d50de5`（main 上的迁移）

### Obsidian DOMPurify 剥 `data-*` 属性（早期）

- **上下文**：早期版本试图用 `data-anc="..."` 在 mark 标签上携带 anchor ID
- **根因**：Obsidian 渲染 markdown 经过 DOMPurify 清洗，`data-*` 自定义属性被剥离
- **临时绕过**：改用 `class="... anc-..."`
- **根治方案**：现在统一用 `id="anc-..."`（语义更清晰），保留对 `class="anc-..."` 旧格式的解析兼容
- **沉淀去向**：→ 已沉淀到 `harness/obsidian-api.md §1 mark-tag` 与 `harness/coding-style.md §非破坏性修改原则`
- **同类计数**：1（DOMPurify 类）
- **关联**：`src/models.ts:ANC_CLASS_RE_GLOBAL`（旧格式仍解析）

## 记录

<!-- 倒序追加新踩坑 -->
