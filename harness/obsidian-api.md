# Obsidian / Canvas API 接触面（obsidian-api）

> 本插件的"API 表面"——既是输入约束（什么能被信任），也是输出契约（什么不能被覆盖）。
> 任何修改触及本文件覆盖的接口前，必须先读对应章节。
>
> 真相源优先级：`src/` 代码 > 本文件。本文件描述的是当前代码的**已知约束**，
> 若代码改动而本文件未跟进，**以代码为准**——并立即修本文件。

## 1. mark-tag（写入 markdown 的 HTML 标签）

```html
<mark class="cN" id="anc-{nanoid21}">selected text</mark>
```

### 不变量（写入端 = `models.ts:buildMarkTag`）

- `class` 必须形如 `c1`–`c6`（映射 Obsidian 主题色变量 `--color-red` ~ `--color-purple`）
- `id` 必须形如 `anc-` + 21 字符 nanoid
- 不使用 `data-*` 属性——会被 Obsidian 内部 DOMPurify 剥离（见 failures.md）

### 不变量（解析端）

- `models.ts` 的两条 regex 同时支持新旧格式：
  - 新：`<mark ... id="anc-{21}" ...>` (`ANC_ID_RE` / `_GLOBAL`)
  - 旧：`<mark class="...anc-{21}...">` (`ANC_CLASS_RE` / `_GLOBAL`)
- `extractAncFromId(idStr)` 用于已经有 id 字符串的场景；`extractAncFromClass` 标记 `@deprecated` 但保留
- 解析允许 `<mark>` 上有其他属性混入——只关心 `class` 和 `id`
- `annotator.ts` 内的 `shouldSkipAnnotation` / `removeAnnotation` / `toolbar.ts:getToolbarAction` 都用 `<mark\s[^>]*>` + 找配对 `</mark>` 的方式扫描，与上述两条 regex 解耦——**不要**把扫描换成单一 regex，会丢覆盖

### 变更协议

- 引入新格式时，**先**让解析端识别新格式，**再**让写入端切换
- 永远不要在写入端立即抛弃旧格式——已写入用户 vault 的旧标签仍需解析
- 在 DECISIONS.md 落决策

## 2. canvas-api（Obsidian 未文档化的内部 API）

### 类型来源

`src/canvas.d.ts` 来自 [obsidian-advanced-canvas](https://github.com/Developer-Mike/obsidian-advanced-canvas)，仅包含本插件用到的子集。**已扩展**：`CanvasNodeData` 加了 `canvasMargin?: { anc: string }` 自定义字段。

### 实际使用的方法

| 方法 | 用途 | 被谁调用 |
|---|---|---|
| `canvas.createTextNode({pos, size, text, color})` | 创建文本节点，**返回 CanvasNode** | `syncer.ts:createNodes` |
| `node.setData(data)` / `node.getData()` | 读写节点的全部 raw 数据（含 `canvasMargin`） | `syncer.ts`（写） / `main.ts`（读） |
| `node.getBBox()` | 拿到 bbox 用于 zoom | `main.ts:jumpToCanvasByAncId` |
| `canvas.zoomToBbox(bbox)` | 居中显示节点 | `main.ts:jumpToCanvasByAncId` |
| `canvas.selectOnly(node)` | 单选高亮 | `main.ts:jumpToCanvasByAncId` |
| `canvas.nodes.get(nodeId)` | nodeId → CanvasNode | `main.ts:jumpToCanvasByAncId` |
| `canvas.selection`（Set） | 当前选中节点集合 | `main.ts:jumpCanvasToMd`、`bindCanvasDblClick` |
| `canvas.getData()` | 当前 canvas 的全部节点数据 | `syncer.ts`、`main.ts` |
| `canvas.requestSave()` | 触发保存到 `.canvas` 文件 | `syncer.ts:createNodes` |

### 风险

- 这些是 **Obsidian 内部** API，没有版本稳定性承诺
- Obsidian 升级后可能 break
- 升级 Obsidian 后**必须手测**所有 sync / jump 场景（见 [testing.md](testing.md)）

### 加新方法的流程

1. 在 `obsidian-advanced-canvas` 项目里找到对应方法签名
2. 抄到 `canvas.d.ts`，注释来源 commit
3. 在 [failures.md](failures.md) 记录"新增依赖了 X 方法"——便于将来 Obsidian 升级时排查

## 3. metadata（Canvas 节点上的锚点存储）

> ⚠️ **当前协议（since `4d50de5` "change the data store logic"）**：锚点 ID 存在 Canvas
> 节点的**顶层 `canvasMargin` 字段**，不再用 `node.text` 里的 `<!--card:-->` HTML 注释。
> spec：`docs/superpowers/specs/2026-04-22-toplevel-field-migration.md`

### 数据形态

```jsonc
// .canvas 文件里某个节点
{
  "id": "nodeId",
  "type": "text",
  "text": "摘录的文本内容",                      // 纯文本，无注释
  "x": 0, "y": 0, "width": 300, "height": 100,
  "color": "5",
  "canvasMargin": { "anc": "V1StGXR8_Z5jdHi6B-myT" }  // ← 锚点在这里
}
```

### API（`models.ts`）

```ts
export interface CanvasMarginMeta { anc: string }

export interface RawNode {
  text?: string;
  canvasMargin?: CanvasMarginMeta;
  [key: string]: unknown;
}

readMarginMeta(node): string | null   // 读 node.canvasMargin?.anc，类型守卫
writeMarginMeta(node, ancId): RawNode // 返回带 canvasMargin 的新对象（不改入参）
```

### 写入流程（`syncer.ts:createNodes`）

```ts
const node = canvas.createTextNode({ pos, size, text: anc.text, color });
node.setData({ ...node.getData(), canvasMargin: { anc: anc.ancId } });
```

**两步**——createTextNode 不接受自定义字段，必须建后用 `setData` 加上 `canvasMargin`。展开 `node.getData()` 是为了不丢 Obsidian 内部填的字段（如 id、size、color）。

### 读取流程

| 调用方 | 操作 |
|---|---|
| `syncer.ts:scanCanvasAncs(nodes)` | 遍历 `node.canvasMargin?.anc`，构 `Map<ancId, info>` |
| `syncer.ts:scanCanvasJsonAncs(json)` | 直接从 `.canvas` 文件 JSON 字符串里读 `node.canvasMargin?.anc`，构 `Set<ancId>` |
| `jumper.ts:findAncInCanvasJson(json, ancId)` | 同上，但找特定 ancId |
| `main.ts:jumpCanvasToMd` / `bindCanvasDblClick` | 从选中的 CanvasNode 拿 `readMarginMeta(node.getData())` |

### 不变量

- `canvasMargin` 是顶层 key，不嵌在 `node.text` 里
- `canvasMargin.anc` 类型必须是 string（typeof 守卫在 `readMarginMeta` 里）
- `node.text` 是纯用户文本，**不**含 metadata
- 写入永远走 `node.setData({ ...node.getData(), canvasMargin: ... })` 的展开模式，不做完全替换
- canvas2anki 已与本插件解耦——不再共享同一个 `<!--card:-->` 注释；canvas2anki 自己用什么 key 与本插件无关

### 反模式

- ❌ `canvas.createTextNode({ text: textWithComment })` 把 metadata 塞进 text
- ❌ `node.setData({ canvasMargin: { anc } })` 完全覆盖（丢 Obsidian 内部字段）
- ❌ `<!--card:{...}-->` 注释——**已废弃**，spec 里明确不做向后兼容（迁移脚本一次性处理）

## 4. settings（`data.json`）

```json
{
  "annotationColor": "5",
  "nodeGap": 20,
  "autoAnnotate": false,
  "autoSync": false
}
```

### 字段约定（来源：`models.ts:DEFAULT_SETTINGS`）

- `annotationColor`：字符串 `"1"`–`"6"`（**不**是 number；写入 mark 的 class 时直接拼接为 `c5`）
- `nodeGap`：number，Canvas 节点纵向间距（px）
- `autoAnnotate` / `autoSync`：boolean，默认 `false`

### 颜色映射（`settings.ts:COLOR_CSS_VARS`）

| key | CSS var | 默认色调 |
|---|---|---|
| 1 | `--color-red` | 红 |
| 2 | `--color-orange` | 橙 |
| 3 | `--color-yellow` | 黄 |
| 4 | `--color-green` | 绿 |
| 5 | `--color-cyan` | 青（默认） |
| 6 | `--color-purple` | 紫 |

### 加字段流程

1. 在 `models.ts:PluginSettings` + `DEFAULT_SETTINGS` 加默认值
2. 在 `settings.ts:CanvasAnnotatorSettingTab.display()` 加 UI
3. `loadSettings()` 走 `Object.assign({}, DEFAULT_SETTINGS, data ?? {})` 自动补默认（已实现）
4. 在本文件追加字段约定
5. 写测试覆盖默认值 + 迁移逻辑

## 5. lifecycle（Obsidian Plugin 生命周期）

| 钩子 | 责任 |
|---|---|
| `onload()` | 注册命令、绑定 mouseup/scroll 监听、挂 toolbar、绑定 Canvas dblclick、注册 markdown post-processor、addSettingTab |
| `onunload()` | 移除 mouseup/scroll 监听、`toolbar.destroy()` |
| `loadSettings()` / `saveSettings()` | 走 Obsidian 标准 `loadData/saveData` |
| `registerEvent(workspace.on('layout-change'))` | 在新 Canvas 打开时增量绑 dblclick（`boundCanvasLeaves` 用 WeakSet 防重复绑） |

### 反模式

- ❌ 在 `onload` 里同步等待 vault 扫描完成（阻塞启动）
- ❌ 在 `onunload` 漏掉 toolbar DOM 移除（热重载后多个 toolbar 叠加）
- ❌ 在 `onload` 里假定 Canvas API 立即可用（用户可能没开任何 Canvas——所以走 `layout-change` 增量绑）
- ❌ 用同一个 leaf object 反复 addEventListener（用 `boundCanvasLeaves` WeakSet 守卫）

## 6. 风险等级（修改时的注意度）

| 区域 | 风险 | 修改前 |
|---|---|---|
| `models.ts` regex | 🔴 极高（影响所有用户既有数据） | 必须先扩展兼容解析、再切写入 |
| `models.ts` `readMarginMeta`/`writeMarginMeta` | 🔴 极高（决定 canvas 数据形态） | 改动前看 spec 2026-04-22 |
| `canvas-api` 内部调用 | 🟠 高（Obsidian 升级可能 break） | 升级 Obsidian 后必跑手测 |
| Canvas dblclick 绑定（capture 优先级） | 🟠 高（错过 capture 时机会被 Canvas 内部吃掉） | 改动前先在真实 Vault 复现 |
| `settings` 字段 | 🟡 中 | 必须加默认值兜底 |
| `lifecycle` | 🟡 中 | 严格 onload/onunload 配对 |
| `toolbar` 样式 | 🟢 低 | 改 styles.css 即可 |
