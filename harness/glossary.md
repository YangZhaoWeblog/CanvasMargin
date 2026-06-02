# 术语表（glossary）

> 业务领域名词的统一定义。所有 AI 与人共用——避免"同名异义"和"异名同义"。

## 定义格式

```
### {术语}（英文 / 缩写）

- **定义**：[一句话精确定义]
- **同义词 / 别名**：[业内常见的其他叫法，标注是否在本项目避用]
- **反义 / 易混**：[容易搞混的相邻概念]
- **示例**：[一个最小例子]
```

## 触发记录的场景

- AI 第一次用某业务名词时（命名歧义会贯穿整个项目）
- 代码 review 中发现命名不一致
- 新人 onboarding 提问

## 记录

### CanvasMargin（产品名）vs canvas-annotator（仓库 id）

- **定义**：用户层产品名是 **CanvasMargin**；package 名 / `manifest.json:id` 是 `canvas-annotator`（历史命名，README 说装到 `.obsidian/plugins/canvas-margin/`，用户实际目录与 manifest id 之间存在已知不一致）
- **同义词 / 别名**：marginalia / margin notes（描述性同义）
- **反义 / 易混**：`canvasMargin`（顶层字段名 / 命名空间，**不是**产品名直译；见下条）
- **示例**：`<!-- 任何用户可见 UI 都用 "CanvasMargin"；代码引用包名时用 "canvas-annotator" -->`

### canvasMargin（Canvas 节点元数据 namespace）

- **定义**：Canvas 节点 JSON 顶层加的自定义 key，作为本插件的命名空间；当前只含一个子字段 `anc`（string）
- **同义词 / 别名**：margin metadata / 节点边注（描述性）
- **反义 / 易混**：旧实现的 `<!--card:{...}-->` HTML 注释——已在 `4d50de5` 整段废弃；不做向后兼容（spec 2026-04-22 明确）
- **示例**：
  ```jsonc
  { "id": "nodeXXX", "type": "text", "text": "纯文本",
    "canvasMargin": { "anc": "V1StGXR8_Z5jdHi6B-myT" } }
  ```

### Anchor ID（anc）

- **定义**：21 字符 nanoid，markdown mark 标签与 Canvas 节点之间的主键链接
- **同义词 / 别名**：anchor / anchor-id / mark-id（**避用**：易混）
- **反义 / 易混**：Canvas 节点自身的 `id`（Obsidian 生成的节点主键，与 anc 无关）；canvas2anki 的卡片 ID（独立插件，不再共享协议）
- **示例**：`V1StGXR8_Z5jdHi6B-myT`，出现在 `<mark id="anc-V1StGXR8_Z5jdHi6B-myT">` 与 `node.canvasMargin.anc`

### Mark 标签（mark）

- **定义**：写入 markdown 源码的 HTML 高亮标签 `<mark class="cN" id="anc-...">...</mark>`
- **同义词 / 别名**：annotation / highlight / 摘录（中文 UI 用"摘录"）
- **反义 / 易混**：markdown 自带的 `==高亮==` 语法——本插件**不**用，因为无法承载 anc ID
- **示例**：`<mark class="c5" id="anc-V1StGXR8_Z5jdHi6B-myT">selected text</mark>`

### Vault scan（同步扫描）

- **定义**：执行同步命令时，扫描可见的 md 文件提取 marks，并扫描 vault 内**所有** `.canvas` 文件提取已存在的 ancs，求差集后批量创建节点
- **同义词 / 别名**：sync-diff
- **反义 / 易混**：autoSync **fast path**——`autoSync=true` 且 Canvas 已可见时跳过完整扫描，直接拿新生成的 anc + 文本走 `createNodes`（实现：`main.ts:syncAnnotations(immediate)`）
- **示例**：`computeSyncDiff(vaultAncs, canvasAncs)` 返回 `{toCreate: VaultAnc[], orphanCount: number}`

### Orphan（孤儿锚点）

- **定义**：Canvas 节点上的 anc 在所有 md 文件里都找不到对应 mark
- **同义词 / 别名**：dangling node / stale node
- **反义 / 易混**：unsynced（mark 在但 Canvas 没节点——会自动创建）vs orphan（Canvas 有节点但 mark 没了——只 toast 报告，**不**自动删；见 design-spec.md「创建后独立」）
- **示例**：用户在 markdown 里删了 `<mark>` 后，对应 Canvas 节点变 orphan；下次同步时 Notice 提示

### 沉浸模式（autoAnnotate）

- **定义**：选区松开（mouseup）时立刻打 mark，不弹工具条；目的是让摘录尽量不打断阅读心流
- **同义词 / 别名**：immersive mode（英文 UI）；auto-excerpt
- **反义 / 易混**：默认模式——选区松开 → 弹浮动工具条 → 用户点 ✎ 摘录
- **示例**：设置 `autoAnnotate=true`

### autoSync（摘录后自动同步）

- **定义**：每次打 mark 后，若分屏中可见恰好 1 个 md leaf + 1 个 canvas leaf，立即把新 anc 同步成节点
- **同义词 / 别名**：auto-sync
- **反义 / 易混**：完整同步（命令 / ribbon 触发，扫所有 md + 所有 canvas）；与 `autoAnnotate` **正交**
- **示例**：设置 `autoSync=true`，写作时打 mark → Canvas 立刻多一个节点

### 模块责任（src/）

| 模块 | 责任边界（一句话） |
|------|----|
| `main.ts` | 注册命令、绑定 Obsidian 事件、编排所有模块；唯一调 Obsidian Plugin/MarkdownView/Workspace API 的地方 |
| `annotator.ts` | 唯一允许在 markdown 文档字符串上插入/移除 `<mark>` 的地方（纯函数：`annotateSelection` / `removeAnnotation` / `shouldSkipAnnotation`） |
| `syncer.ts` | 唯一允许调 Canvas 写入 API（`createTextNode` + `node.setData`）的地方；以及 sync diff 计算 |
| `jumper.ts` | 双向跳转的纯函数：`findAncInCanvasJson` / `findAncInMdContent` |
| `toolbar.ts` | 选区浮动工具条 DOM + `getToolbarAction` 纯函数（决定显示"摘录"还是"取消"） |
| `settings.ts` | 设置 UI（Obsidian PluginSettingTab） + 颜色 swatch 映射 |
| `models.ts` | 共享核心：regex / 类型 / `buildMarkTag` / `readMarginMeta` / `writeMarginMeta` / `extractAncFromId`(/`Class` deprecated) / `DEFAULT_SETTINGS`——**任何跨模块共享的"事实"必须放这里** |
| `canvas.d.ts` | Obsidian 内部 Canvas API 的类型声明（来源：obsidian-advanced-canvas，已扩展 `canvasMargin?` 字段） |

> 早期存在过的 `panel.ts`（CodeMirror 顶部 Sync 按钮）已在 `4d50de5` 删除——同步入口现在只有 ribbon icon。

### Settings keys

- `annotationColor`（"1"–"6"，默认 "5" cyan）：mark 的 `class` 数字段，映射到 Obsidian 主题色
- `nodeGap`（默认 20）：Canvas 节点之间的纵向间距（px）
- `autoAnnotate`（默认 false）：选区松开后跳过 toolbar 直接打 mark
- `autoSync`（默认 false）：打 mark 后若分屏中有可见 Canvas 则即时建节点
