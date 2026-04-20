# CanvasMargin

**在笔记中高亮文字，将摘录同步为 Obsidian Canvas 节点，双向跳转。**

> English documentation: [README.md](README.md)

---

## 它做什么

CanvasMargin 把你的阅读笔记和 Obsidian Canvas 连通。高亮一段文字 → 变成 Canvas 上的一个关联节点。双击节点 → 跳回笔记中对应的那一行。

```
阅读笔记                         Canvas
──────────────────               ──────────────────────────
...正文...                       ┌─────────────────────┐
<mark>这个洞见</mark>  ──同步──►  │ 这个洞见            │
...更多正文...                   │ <!--card:{anc:...}-->│
                                 └─────────────────────┘
              ◄── 双击节点跳回笔记
```

---

## 功能一览

| 功能 | 触发方式 |
|------|---------|
| 高亮选区 | 选中文字 → 浮动工具栏 → **✎ 摘录** |
| 取消高亮 | 点击高亮内 → 浮动工具栏 → **✂ 取消** |
| 同步到 Canvas | Ribbon 图标，或编辑器顶部同步按钮 |
| 跳转：笔记 → Canvas | 阅读/Live Preview 模式点击高亮 |
| 跳转：Canvas → 笔记 | 双击 Canvas 节点 |
| 沉浸摘录模式 | 设置 → **沉浸摘录模式**：鼠标松开有选区即自动摘录 |
| 摘录后自动同步 | 设置 → **摘录后自动同步**：摘录后立即创建 Canvas 节点 |

---

## 安装

### 手动安装（当前）

1. 从最新 Release 下载 `main.js`、`manifest.json`、`styles.css`。
2. 复制到 `.obsidian/plugins/canvas-margin/`。
3. 在 **设置 → 第三方插件** 中启用。

### BRAT（测试版）

在 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 中添加 `your-github-username/canvas-annotator`。

---

## 使用方法

### 高亮文字

1. 在 Live Preview 或编辑模式下打开 Markdown 笔记。
2. 选中任意文字。
3. 浮动工具栏出现后点击 **✎ 摘录**。

或在设置中开启**沉浸摘录模式**：鼠标松开有选区时自动摘录，无需点击工具栏。

### 同步到 Canvas

打开一个 Canvas 文件，点击 **↻** Ribbon 图标（或笔记顶部的同步按钮）。新摘录会以文本节点的形式纵向排列在 Canvas 上。

开启**摘录后自动同步**后，每次摘录完毕会立即在当前 Canvas 创建节点，无需手动同步。

### 双向跳转

- **笔记 → Canvas**：在阅读模式或 Live Preview 的已渲染行中点击高亮文字。
- **Canvas → 笔记**：双击 CanvasMargin 节点。

### 取消高亮

点击高亮区域内的任意位置，工具栏会显示 **✂ 取消**，点击后 `<mark>` 标签被移除，恢复纯文本。

---

## 设置项

| 设置 | 默认 | 说明 |
|------|------|------|
| 摘录颜色 | 青色 (5) | 新摘录的高亮颜色和 Canvas 节点颜色 |
| 节点间距 | 20 px | Canvas 中自动排列节点的垂直间距 |
| 沉浸摘录模式 | 关 | 鼠标松开有选区 → 立即摘录 |
| 摘录后自动同步 | 关 | 摘录后若有打开的 Canvas 则立即同步 |

---

## 实现原理（给好奇的人）

- 高亮以 `<mark class="cN" id="anc-{nanoid}">文字</mark>` 形式直接写入 Markdown 源码——不需要单独数据库，不污染 frontmatter。
- Canvas 节点内嵌 `<!--card:{"anc":"..."}-->` 注释，与源高亮双向关联。
- 同步时扫描 vault 中**所有** `.canvas` 文件，防止同一摘录在多个 Canvas 间重复创建节点。
- 浮动工具栏通过 `mousedown` 事件在 CodeMirror 折叠 decoration 之前捕获 mark 元素位置，确保 Live Preview 模式下工具栏稳定出现。

---

## 兼容性

- Obsidian 1.1+
- 旧格式高亮（`class="cN anc-xxx"`）完全兼容，无需迁移。

---

## License

MIT
