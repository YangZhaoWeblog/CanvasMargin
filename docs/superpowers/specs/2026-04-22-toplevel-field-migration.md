# Canvas Annotator（CanvasMargin）：元数据迁移至顶层字段

> 状态：Draft  
> 日期：2026-04-22  
> 关联插件：canvas2anki、canvas-annotator（canvasMargin）

## 背景

当前摘录锚点 ID 以 HTML 注释 `<!--card:{"anc":"nanoid21chars"}-->` 的形式嵌入在 Canvas `node.text` 末尾。这种方式：

- 用户编辑节点时可能误删元数据
- 需要 regex 扫描 text 内容，解析不直观
- 与 canvas2anki 共用同一个 `<!--card:...-->` key，两个插件的元数据耦合

## 目标

将 `<!--card:{"anc":"..."}-->` 迁移为 canvas JSON 中的**节点顶层字段**，与 Advanced Canvas 的 `styleAttributes`、`zIndex` 等自定义字段采用相同模式。

## 新数据格式

### Before

```json
{
  "id": "nodeId",
  "type": "text",
  "text": "摘录的文本内容\n<!--card:{\"anc\":\"abcdef1234567890ABCDE\"}-->",
  "x": 0, "y": 0, "width": 300, "height": 100, "color": "5"
}
```

### After

```json
{
  "id": "nodeId",
  "type": "text",
  "text": "摘录的文本内容",
  "x": 0, "y": 0, "width": 300, "height": 100, "color": "5",
  "canvasMargin": {
    "anc": "abcdef1234567890ABCDE"
  }
}
```

**命名约定：**
- 顶层 key 为插件品牌名（小驼峰）：`canvasMargin`
- 值为对象，当前只有 `anc`（string，nanoid 21 位），未来可扩展

## 改动范围

### models.ts

| 改动 | 说明 |
|------|------|
| 删除 | `CARD_META_RE` 常量 |
| 删除 | `extractAncFromMeta()` 函数 |
| 删除 | `buildNodeText()` 函数 |
| 新增 | `CanvasMarginMeta` 接口 `{ anc: string }` |
| 新增 | `readMarginMeta(node): string \| null` — 读取 `node.canvasMargin?.anc` |
| 新增 | `writeMarginMeta(node, ancId): node` — 返回带 `canvasMargin` 字段的新 node 对象 |

接口设计（纯函数，操作 plain object，不依赖 Obsidian API）：

```typescript
export interface CanvasMarginMeta {
  anc: string;
}

export interface RawNode {
  text?: string;
  canvasMargin?: CanvasMarginMeta;
  [key: string]: unknown;
}

/** 读取节点的锚点 ID，无则返回 null */
export function readMarginMeta(node: RawNode): string | null {
  const meta = node.canvasMargin;
  if (!meta || typeof meta.anc !== "string") return null;
  return meta.anc;
}

/** 返回附加了 canvasMargin 字段的新节点对象 */
export function writeMarginMeta(node: RawNode, ancId: string): RawNode {
  return { ...node, canvasMargin: { anc: ancId } };
}
```

### syncer.ts

| 改动 | 说明 |
|------|------|
| 修改 | `scanCanvasAncs()` — 改为读 `node.canvasMargin?.anc`，不再调用 `extractAncFromMeta` |
| 修改 | `scanCanvasJsonAncs()` — 同上，从 JSON 解析后读顶层字段 |
| 修改 | `createNodes()` — 不再调用 `buildNodeText()`；创建时 `text` 为纯文本，创建后通过 `node.setData()` 写入 `canvasMargin` 字段 |

`createNodes` 改动详情：

```typescript
// Before:
const text = buildNodeText(anc.text, anc.ancId);
canvas.createTextNode({ pos, size, text, color });

// After:
const node = canvas.createTextNode({ pos, size, text: anc.text, color });
node.setData({ ...node.getData(), canvasMargin: { anc: anc.ancId } });
```

### jumper.ts

| 改动 | 说明 |
|------|------|
| 修改 | `findAncInCanvasJson()` — 改为读 `node.canvasMargin?.anc`，不再调用 `extractAncFromMeta` |

### main.ts

| 改动 | 说明 |
|------|------|
| 修改 | `jumpCanvasToMd()` — `extractAncFromMeta(node.getData().text)` 改为 `readMarginMeta(node.getData())` |
| 修改 | `bindCanvasDblClick()` 中同上 |
| 修改 | `syncAnnotations()` immediate 路径 — 创建节点后用 `node.setData()` 写入 `canvasMargin` |
| 删除 | `import { extractAncFromMeta, buildNodeText }` |
| 新增 | `import { readMarginMeta, writeMarginMeta }` |

### canvas.d.ts

| 改动 | 说明 |
|------|------|
| 修改 | `CanvasNodeData` 增加 `canvasMargin?: { anc: string }` 可选字段 |

### annotator.ts

无改动（只操作 md 文件中的 `<mark>` 标签，不涉及 canvas 节点数据）。

### toolbar.ts

无改动。

### settings.ts

无改动。

## 测试改动

### models.test.ts

| 改动 | 说明 |
|------|------|
| 删除 | `CARD_META_RE` 匹配测试 |
| 删除 | `extractAncFromMeta()` 测试 |
| 删除 | `buildNodeText()` 测试 |
| 新增 | `readMarginMeta()` 测试：有 meta、无 meta、类型错误、meta 对象为空 |
| 新增 | `writeMarginMeta()` 测试：写入新 meta、覆盖已有 meta |

### syncer.test.ts

| 改动 | 说明 |
|------|------|
| 修改 | 所有测试 fixture：节点不再含 `<!--card:...-->`，锚点放入 `canvasMargin` 字段 |
| 修改 | `scanCanvasAncs` 测试输入格式 |
| 修改 | `scanCanvasJsonAncs` 测试输入 JSON |
| 修改 | `createNodes` 测试：验证返回节点的 `canvasMargin` 字段而非 `text` 中的注释 |

### jumper.test.ts

| 改动 | 说明 |
|------|------|
| 修改 | `findAncInCanvasJson` 测试 fixture：锚点放入 `canvasMargin` 字段 |

### annotator.test.ts

无改动。

### toolbar.test.ts

无改动。

## 不做

- **历史数据迁移脚本**：两个插件的迁移脚本统一在最后写，不在本 spec 范围内
- **兼容旧格式读取**：不做向后兼容。迁移脚本一次性处理，代码只认新格式
- **canvas2anki 联动**：canvas2anki 有独立的 spec，各自改各自的
- **md 文件中的 `<mark>` 标签格式**：不改，只改 canvas 节点侧的数据存储

## 验收标准

1. `npm run test` 全量通过
2. `npm run build` 零报错
3. 同步后 `.canvas` 文件中 `node.text` 不含 `<!--card:...-->`
4. `canvasMargin` 字段正确写入节点顶层
5. 双向跳转功能正常（md → canvas、canvas → md）
