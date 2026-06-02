# 编码规范（coding-style）

> 本文件是 AGENTS.md 的展开。AI 修改代码前必读对应章节。

## 命名

- 文件名：小写中划线（`syncer.ts` 而非 `Syncer.ts` / `sync_er.ts`）
- 类型 / 接口：`PascalCase`（`SyncDiff`, `MarkTag`, `RawNode`）
- 函数 / 变量：`camelCase`（`computeSyncDiff`, `vaultAncs`, `readMarginMeta`）
- 常量：`SCREAMING_SNAKE_CASE` 仅用于真正的全局常量（如 regex 字面量、`NODE_WIDTH`）
- 测试文件：`<module>.test.ts`，与被测模块同目录或 `tests/` 镜像

## TypeScript

- `strict: true` 是底线（`tsc -noEmit` 在 `npm run build` 中执行）
- 禁止 `any`；用 `unknown` + 类型守卫（参考 `models.ts:readMarginMeta` 的 typeof 守卫写法）
  - 例外：`canvas.d.ts` 里的某些 Obsidian 内部 API 接受 `any`（无法精确建模），调用侧依然要做收口
- 公共导出函数必须有显式返回类型（不依赖推断）
- 解构 props 时一律用类型注解：`function f({ a, b }: { a: string; b: number })`
- 优先 `type` 别名而非 `interface`，除非需要 declaration merging（`canvas.d.ts` 用 interface 是为了和 obsidian-advanced-canvas 风格一致，OK）

## Import 顺序

1. Obsidian / Electron / `@codemirror/*`（externalized 由宿主提供）
2. 第三方依赖（`nanoid` 等）
3. 项目内（按字典序）

每组之间一空行。

## 错误处理

```ts
// ✅ 用户可见错误走 Notice
if (!file) { new Notice("未找到对应的 md 标记"); return; }

// ✅ 静默吞 JSON 解析错误（恶意 / 损坏 .canvas 文件）— scanCanvasJsonAncs / findAncInCanvasJson 已是这种模式
try { ... } catch { /* return null / empty */ }

// ❌ 让 JSON.parse 抛到上面（会崩 sync 流程）
```

- 用户可见错误必须走 `Notice`（Obsidian API），不要只 `console.error`
- 解析外部数据（vault 文件 / canvas json）必须容错
- 异步 API（`vault.read` / `vault.cachedRead`）必须 `await`，禁止裸 Promise 链
- 性能敏感读取优先 `vault.cachedRead`（参考 `main.ts:syncAnnotations`）

## 日志

- `console.debug` 仅开发期保留；提交前清理
- `console.warn` / `console.error` 用于**用户操作不会停止但需要排查**的场景
- 关键路径（sync / jump）建议 prefix `[canvas-annotator]` 或 `[CanvasMargin]` 便于在 Obsidian devtools 过滤

## 注释

- 公共导出函数必须有 TSDoc，首段一句话总结
- `// why:` 注释解释**为什么**这样写（约束 / 历史 / DOMPurify 行为等）
- `// TODO`：必须带 issue 号或人名，否则 review 时移除

## DOM / CodeMirror 操作

- 直接操作 DOM 限定在 `toolbar.ts`（FloatingToolbar 类）
- markdown 字符串变换走 `annotator.ts` 纯函数
- mark 元素的 click 绑定走 `main.ts:registerMarkdownPostProcessor`（用 `dataset.ancBound = "1"` 防重复绑）
- Canvas 容器 dblclick 绑定走 `main.ts:bindCanvasDblClick`（用 `boundCanvasLeaves` WeakSet 防重复绑）
- 跨模块共享的"事实"放 `models.ts`（regex / 类型 / builder）

## 非破坏性修改原则（针对 mark 标签格式）

- 解析必须兼容旧格式（`class="anc-..."`）
- 写入只用新格式（`id="anc-..."`）
- 任何对 mark 格式的改动 → 先看 [obsidian-api.md](obsidian-api.md) §1 mark-tag

## Canvas 节点元数据写入

- **铁律**：用 `node.setData({ ...node.getData(), canvasMargin: { anc } })`——展开 `getData()` 是为了不丢 Obsidian 内部填的字段
- 不接受把 metadata 塞进 `node.text` 里；详见 [obsidian-api.md](obsidian-api.md) §3 metadata

---

> 项目特定规则在此文件追加；通用规则参考 TS Handbook / Obsidian Plugin Dev Guide。
