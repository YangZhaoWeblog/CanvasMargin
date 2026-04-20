# Canvas Annotator — Design Spec

## 背景

学习工作流：原文 md（learn-deep 产出）→ Canvas 空间组织 → Anki 导出。缺的一环是 md ↔ Canvas 的双向关联，类似 MarginNote 的高亮→脑图联动。

本插件独立于 canvas2anki，通过共享 `<!--card:{JSON}-->` metadata 协议协作。

## 范围

**做：** md 高亮摘录 → Canvas 节点创建 + 双向跳转。
**不做：** Anki 导出（canvas2anki 负责）、自动同步文本变更、删除联动（见下方产品决策）。

---

## 产品决策

### 核心工作流

两个阶段，彻底解耦：

| 阶段 | 操作 | 需要 Canvas 打开？ |
|------|------|-------------------|
| 阅读/标记 | 选中文字 → 快捷键 → md 写入 `<mark>` 标记 | 不需要 |
| 组织/同步 | 打开 Canvas → 执行同步命令 → 批量创建节点 | 需要 |

设计理由：阅读时不应被迫打开 Canvas，摘录是注意力的物化，要尽量不打断心流。

### 摘录模式

只有沉浸模式，没有 toolbar。Less is more——摘录时不做组织决策（选颜色、选位置等）。

- 快捷键选中即摘，默认蓝色
- 颜色在设置里配，摘录过程中不选择
- 想改颜色，去 Canvas 里改——那是组织阶段的事

### 创建后独立

摘录建立的是一次性桥梁。md 标记和 Canvas 节点创建后各自独立：

| 场景 | 行为 |
|------|------|
| 用户删了 md 高亮 | Canvas 节点不动（上面可能有箭头、编辑、已导出 Anki） |
| 用户删了 Canvas 节点 | md 高亮不动（高亮是阅读痕迹，价值独立） |
| 用户改了 md 高亮文本 | Canvas 节点不变（创建时快照） |
| 跳转时发现对端已删 | toast 提示"对端已不存在"，不做修改 |

锚点只用于跳转路由，不用于同步。

### 孤儿检测

同步命令执行时附带报告：
- "发现 N 个新摘录，已创建节点"
- "发现 M 个孤儿锚点（md 有 anc 但 Canvas 无对应节点）"

只提示，不操作。

---

## 数据模型

### md 端标记

```html
<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">文本</mark>
```

- `c5`：颜色，N=1-6 对齐 Canvas 预设色
- `anc-{nanoid}`：锚点 ID，编码在 class 中（因为 Obsidian DOMPurify 会剥离 `data-*` 和 `style` 属性，只有 `class` 被保留）
- nanoid 21 位，默认字母表（`A-Za-z0-9_-`）
- 插件注入 CSS（styles.css）：

```css
mark.c1 { background: var(--color-red); }
mark.c2 { background: var(--color-orange); }
mark.c3 { background: var(--color-yellow); }
mark.c4 { background: var(--color-green); }
mark.c5 { background: var(--color-cyan); }
mark.c6 { background: var(--color-purple); }
```

JS 侧提取锚点：`el.className.match(/anc-([A-Za-z0-9_-]{21})/)?.[1]`

三端一致：md 高亮色 = Canvas 节点色 = 主题色。换主题全部跟随。

### Canvas 端节点

```json
{
  "id": "auto-generated",
  "type": "text",
  "text": "摘录的文本\n<!--card:{\"anc\":\"V1StGXR8_Z5jdHi6B-myT\"}-->",
  "color": "5",
  "x": 0, "y": 200,
  "width": 300, "height": 100
}
```

### Metadata 协议（与 canvas2anki 共享）

`<!--card:{JSON}-->` 格式，字段可叠加：

| 场景 | metadata |
|------|----------|
| 纯摘录节点 | `{"anc":"nanoid"}` |
| 摘录后导出 Anki | `{"anc":"nanoid","id":12345}` |
| 纯 Anki 卡片（无摘录） | `{"id":12345}` |

**关键约束：canvas2anki 的 writeback 必须合并写入，不能覆写已有字段。** 当前实现会丢失 `anc`，需要修复。

### 多文件关系

- 多个 md → 同一个 Canvas ✓（nanoid 全局唯一，无冲突）
- 一个 md → 多个 Canvas ✓（不同时间分别同步）
- 但每次同步操作严格 1:1（当前可见的 md → 当前可见的 canvas）
- 同一个 anc 全局唯一，不会出现在多个 canvas 中

---

## 同步机制

### 触发方式

显式命令：`Canvas Annotator: Sync annotations`。不自动同步——写入 Canvas 是有副作用的操作，用户应有控制权。

### 目标 Canvas

当前 split 中可见的 Canvas（`leaf.view.containerEl.isShown()`），不是 `leaves[0]`。详见上方同步范围。

### 同步范围（2026-04-20 圆桌决议）

**规则：1 个可见 md ↔ 1 个可见 canvas，严格一一对应。**

"可见" = split 面板中正在显示的 leaf，不是 tab 栏里打开但被遮挡的。判断方式：`leaf.view.containerEl.isShown()`（Obsidian 在 HTMLElement 上暴露的公开方法）。

| split 中可见 md | split 中可见 canvas | 行为 |
|---|---|---|
| 1 | 1 | 同步该 md → 该 canvas |
| 0 | any | Notice："请先打开笔记文件" |
| any | 0 | Notice："请先打开 Canvas" |
| >1 | any | Notice："无法确定同步哪个笔记，请只保留一个可见" |
| any | >1 | Notice："无法确定同步到哪个 Canvas，请只保留一个可见" |

**去重：全局。** 同一个 anc 只能存在于一个 canvas。同步时扫描全库 `.canvas` 文件做去重，如果该 anc 已存在于其他 canvas 则跳过。

### 同步逻辑

```
1. 检查可见 leaf：恰好 1 md + 1 canvas，否则报错
2. 读取可见 md 的所有 anc: file_ancs
3. 扫描全库 .canvas 文件的所有 anc: global_canvas_ancs（全局去重）
4. 差集: new_ancs = file_ancs - global_canvas_ancs
5. 创建节点到可见 canvas
6. 报告: "N 个新节点, M 个孤儿"
```

### Canvas 写入

通过 Canvas 内部 API（非公开但社区稳定使用）：

```typescript
// 获取 Canvas 对象
const view = app.workspace.getActiveViewOfType(ItemView);
if (view?.getViewType() !== 'canvas') return;
const canvas = (view as any).canvas;

// 创建节点
canvas.createTextNode({
  pos: { x, y },
  size: { width: 300, height: 100 },
  text: "摘录文本\n<!--card:{\"anc\":\"nanoid\"}-->",
});
canvas.requestSave();

// Pan 到节点
canvas.zoomToBbox(node.getBBox());
```

类型定义参考 [obsidian-advanced-canvas](https://github.com/Developer-Mike/obsidian-advanced-canvas) 的 `Canvas.d.ts`。

### 节点排列

- 垂直顺序排列，新节点在最后一个同步节点下方
- 间距：20px
- 宽度：默认 300px
- 高度：自适应文本长度

---

## 双向跳转

### 触发方式

V1：快捷键 / 命令面板。一个快捷键双向（根据当前上下文自动判断方向）。

不嵌入额外链接到 md 源码——保持 md 可移植性。

### md → Canvas

1. 读取光标处 `<mark>` class 中的 `anc-xxx`
2. 搜索 vault 中所有 `.canvas` 文件的 JSON，找到含此 `anc` 的节点
3. 打开该 Canvas → `canvas.zoomToBbox(node.getBBox())` 定位到节点

### Canvas → md

1. 读取选中节点的 `<!--card:{"anc":"xxx"}-->` 中的 `anc`
2. 搜索 vault 中所有 md，找到含 `anc-xxx` 的文件和位置
3. 打开该 md → 滚动到对应位置

### 性能

几百个 md 文件：逐文件 `cachedRead` + regex，几百毫秒内。
如果 vault 很大（千级以上），考虑预建 anc 索引（V2）。

---

## 设置项

| 项目 | 输入方式 | 默认值 | 说明 |
|------|----------|--------|------|
| 默认摘录颜色 | 色块点选 1-6 | 5（蓝/青） | 新摘录的 mark class 和 Canvas 节点 color |
| 节点间距 | 数字 | 20 | 垂直排列间距(px) |

### 硬编码项

| 项目 | 值 | 理由 |
|------|-----|------|
| nanoid 长度 | 21 | 默认字母表 21 位，碰撞概率可忽略 |
| 节点宽度 | 300 | 合理默认，用户可在 Canvas 里手动调 |
| metadata 格式 | `<!--card:{JSON}-->` | 与 canvas2anki 共享协议 |

---

## 插件架构（初步）

```
canvas-annotator/
├── src/
│   ├── main.ts          ← 插件入口，注册命令/快捷键
│   ├── settings.ts      ← 设置页，色块选择
│   ├── annotator.ts     ← 摘录核心：选中文本 → 写入 <mark>
│   ├── syncer.ts        ← 同步核心：diff anc → 创建 Canvas 节点
│   ├── jumper.ts        ← 跳转核心：anc 匹配 → 定位
│   └── models.ts        ← 常量、接口
├── styles.css           ← c1-c6 颜色样式
├── tests/
├── manifest.json
└── package.json
```

---

## 与 canvas2anki 的协作

| 关注点 | 处理 |
|--------|------|
| metadata 格式 | 共享 `<!--card:{JSON}-->`，字段可叠加 |
| writeback 兼容 | canvas2anki 必须合并写入，保留 `anc` 字段 |
| 颜色语义 | 完全独立。摘录默认蓝，导出色由 canvas2anki 管 |
| 安装依赖 | 互不依赖，可单独使用 |

---

## V1 不做

- Toolbar 选色模式（砍掉，less is more）
- 自动同步 / 文件监听
- 摘录删除联动（创建后独立，2026-04-20 圆桌确认不实现，见产品决策）
- 文本变更同步
- 嵌入式跳转链接（URI scheme）
- CodeMirror decoration 点击跳转（V2）
- anc 索引缓存（V2，大 vault 优化）

---

## 调研结论

- [x] **Canvas API**：非公开但社区稳定使用。`createTextNode()`、`zoomToBbox()`、`nodes` Map 均可用。类型定义参考 obsidian-advanced-canvas。
- [x] **HTML sanitizer**：DOMPurify 剥离 `data-*` 和 `style`，只保留 `class`。锚点 ID 必须编码在 class 中（`anc-xxx`）。
- [x] **`<mark class="cN">` 渲染**：Reading mode 和 Live Preview 均保留 class，插件 styles.css 可正常生效。
