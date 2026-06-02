# Code Review（code-review）

> 即便单人开发，AI 协作场景下的"review" 也存在——AI 写、人检；或两个 AI 会话互检。

## 触发场景

- AI 生成代码后，人工 review 才合并
- 跨会话回看：上一会话的 PR 在新会话里要先被 review
- 重大改动（影响 mark 标签 / canvasMargin 元数据）

## Review 优先级（从高到低）

### 1. 协议与不变量（红线）

- [ ] `models.ts` 的 regex / builder 是否破坏了既有 mark 兼容（旧 `class="anc-..."` 必须仍能解析）？
- [ ] Canvas 节点写入是否走 `node.setData({ ...node.getData(), canvasMargin: { anc } })` 模式（不是直接覆盖、不塞回 `node.text`）？
- [ ] `canvas.d.ts` 里是否新增方法但 `obsidian-api.md` 没更新？
- [ ] 是否复活了 `<!--card:-->` 注释或旧的 `extractAncFromMeta` / `buildNodeText`？这些已在 `4d50de5` 删除，不接受回退

### 2. 完成定义

- [ ] `npm run build` 通过（type-check + bundle）？
- [ ] `npm test` 全绿？
- [ ] PR 描述列出了**已手测的 Obsidian 场景**（不能没有）？
- [ ] `data.json` 字段变更带迁移（依赖 `Object.assign(DEFAULT_SETTINGS, data)` 兜底）？

### 3. 编码规范

- [ ] 跨模块共享的"事实"是否进了 `models.ts`（不是各处重复定义）？
- [ ] 是否有 `console.log` 残留？
- [ ] 错误是否走 `Notice` 而非只 `console.error`？
- [ ] 类型是否避免了 `any`（`canvas.d.ts` 内部 API 例外，但调用侧要收口）？
- [ ] Canvas / Markdown post-processor 的事件绑定有没有重复绑定守卫（`dataset.ancBound` / `boundCanvasLeaves` WeakSet）？

### 4. 测试质量

- [ ] 修改了 `models.ts` / `syncer.ts` / `jumper.ts` / `annotator.ts` / `toolbar.ts:getToolbarAction` 是否新增/更新了对应单测？
- [ ] 测试是否实质验证行为而非"trivially-true"？
- [ ] 测试断言**没**被改弱（test-guard 触发的提交要在 DECISIONS.md 留痕）？
- [ ] 仍在用 `<!--card:-->` 字符串做 fixture？应改为 `canvasMargin` 顶层字段

### 5. 状态文件

- [ ] PROGRESS.md 当前任务标记 `[x]`？
- [ ] 有踩坑或非显然决策时 DECISIONS.md / failures.md 已更新？

## Review 反模式

- ❌ "看起来对" → 实际没跑过 build / test
- ❌ "AI 写的应该没问题" → AI 在 Obsidian 行为上经常错（DOMPurify、CM 事务、Canvas 内部 API、capture 顺序）
- ❌ 只看 diff 不看上下文 → 模块边界破坏看不出
- ❌ 跳过手测 → 单测覆盖不到的行为出 bug
- ❌ "文档是这样写的"——以代码为准（DECISIONS.md「真相源优先级」）

## Review 与 PGE

- PGE 档 1（单会话）：自检即可，但 commit 前必须独立跑一次 `npm run build && npm test`
- PGE 档 2/3：必须有独立 Evaluator 角色（即便是同一人换会话）按本清单走一遍
