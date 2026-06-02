# 测试规范（testing）

> **walkinglabs L10**：E2E 不只是验证手段，会反向重塑 AI 编码行为。
> AI 知道要过 E2E 时会写出本质更好的代码。

## 项目特例：纯函数 + 手工 E2E

本项目是 Obsidian 插件，**没有传统 CI 可跑的 E2E**——单测覆盖纯函数，Obsidian 相关行为必须在真实 Vault 里手测。

## 测试金字塔（本项目落地）

```
        Obsidian 内手测       ← 完成定义（无自动化）
        ↑
        vitest 单元测试      ← 纯函数边界
```

## 单元测试：vitest

- 位置：`tests/<module>.test.ts`
- 已覆盖模块：`annotator` / `jumper` / `models` / `syncer` / `toolbar`
- 运行：
  - 全部：`npm test`
  - 单文件：`npx vitest run tests/syncer.test.ts`
  - 单测试名：`npx vitest run -t "should compute sync diff"`
- 监听：`npm run test:watch`

### 单测可以覆盖的

- regex 匹配 / 解析（`models.ts`）
- mark 标签 builder（`buildMarkTag`）
- `readMarginMeta` / `writeMarginMeta`（不变性 / 类型守卫）
- sync diff 计算（`syncer.ts:computeSyncDiff`）
- 从 .canvas JSON 字符串扫 ancs（`scanCanvasJsonAncs` / `findAncInCanvasJson`）——可用 fixture
- jumper 在 md 字符串里找 anc 偏移（`findAncInMdContent`）
- toolbar 选区动作判定（`getToolbarAction`）
- annotator 的字符串变换（`annotateSelection` / `removeAnnotation` / `shouldSkipAnnotation`）

### 单测**不**能覆盖的

- 命令注册 / Obsidian 事件绑定（`main.ts`）
- vault.read / vault.cachedRead / vault.modify（I/O）
- Canvas API 调用（`createTextNode` / `node.setData` / `zoomToBbox`）
- DOM / CodeMirror 渲染、mark 元素的 click 绑定时机
- Canvas 容器 dblclick 在 capture 阶段抢先 Canvas 内部 handler
- DOMPurify 实际行为
- 分屏可见性判定（`getVisibleSplitPair` 用 `containerEl.isShown()`）

## Obsidian 内手测：完成定义

修改任何**非纯函数**模块后，必须在真实 Vault 里跑通以下场景：

| 场景 | 步骤 | 期望 |
|---|---|---|
| 基础 annotate（默认模式） | 选文本 → 浮动工具条 ✎ 摘录 | md 写入 `<mark id="anc-...">`，颜色随当前设置（默认 cyan/c5） |
| 沉浸模式 | 设置开 autoAnnotate → 选文本松鼠标 | 立即写入，无工具条 |
| 取消摘录 | 光标在 mark 内 / 选区跨 mark → 工具条 ✂ 取消 | mark 标签被剥离，原文恢复 |
| 基础 sync（分屏内 1 md + 1 canvas） | ribbon ↻ 同步图标 | 节点在 canvas 出现，**不**含 `<!--card:-->`；保存后 .canvas 文件里看到 `"canvasMargin": {"anc": "..."}` 顶层字段 |
| autoSync 快路径 | 设置开 autoSync 且分屏满足 → annotate | 节点立即出现，无完整 vault scan |
| 跨 canvas 去重 | 同 anc 在另一 .canvas 文件已存在 | 当前 canvas 不重复创建（globalCanvasAncs 命中） |
| md → canvas 跳转 | Reading/Live Preview 模式点击 mark | 跳到对应 canvas 节点并 zoom + selectOnly |
| canvas → md 跳转 | dblclick canvas 节点 | 跳到对应 md 文件并 setCursor + scrollIntoView |
| 旧格式兼容 | 手写 `<mark class="c3 anc-XXX">...</mark>` | jumper / syncer 都能识别（`scanFileAncs` / mark click handler） |
| orphan 检测 | 删 md 中某 mark，再同步 | Notice 提示 "发现 N 个孤儿锚点"，**不**自动删节点 |
| 设置 / 颜色切换 | 设置中切色 swatch | 新建 mark 与节点颜色跟随 |

> 没过手测就不算完成。即使单测全绿。

## 完成定义（本项目）

满足以下全部才算完成：
1. `npm run build` 退出码 0（含 `tsc -noEmit`）
2. `npm test` 退出码 0
3. 受影响场景在真实 Obsidian Vault 中手测通过
4. PROGRESS.md 标记 `[x]`
5. failures.md 沉淀（如有踩坑）

## 重构场景：黄金样本（输入-输出快照）

`syncer.ts` / `models.ts` / `jumper.ts` 的解析 / diff / 搜索逻辑适合做快照：

```
tests/golden/
├── case-vault-with-mixed-formats/
│   ├── input/*.md            # 含新旧格式 mark 的 markdown 输入
│   └── expected-ancs.json    # 期望提取出的 anc 列表
└── case-canvas-with-margin-meta/
    ├── input.canvas          # 节点带 canvasMargin 顶层字段
    └── expected-ancs.json
```

重构时所有黄金样本必须通过；不通过即说明行为变了。

## 反模式

- ❌ 只跑单元测试就声称完成（lecture-10 的"组件边界盲视"）
- ❌ AI 修改测试断言让自己通过（pre-commit hook 应阻断）
- ❌ "我跑过单测了所以肯定能在 Obsidian 里运行"——大量行为单测覆盖不到（特别是 dblclick capture 顺序、layout-change 时机）
- ❌ 黄金样本在重构后才生成（已被污染）
- ❌ 测 `<!--card:-->` 注释的 fixture——已废弃，改用 `canvasMargin` 顶层字段

## 关联

- AGENTS.md Rules §3、§7、§8
- [failures.md](failures.md) ←→ 测试覆盖盲区会反映在踩坑里
- [obsidian-api.md](obsidian-api.md) ←→ 哪些 API 不能 mock
