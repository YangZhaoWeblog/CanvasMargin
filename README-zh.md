# CanvasMargin

**在笔记中高亮文字，将摘录同步为 Obsidian Canvas 节点，并支持双向跳转。**

> AI agents 和 contributors：改代码前先读 [AGENTS.md](AGENTS.md)。English documentation: [README.md](README.md)

---

## 它做什么

CanvasMargin 把阅读笔记和 Obsidian Canvas 连起来。你高亮一段文字，把它同步成 Canvas text node，然后可以在 note mark 和 Canvas node 之间双向跳转。

```text
阅读笔记                         Canvas
──────────────────               ──────────────────────────
...正文...                       ┌─────────────────────┐
<mark>这个洞见</mark>  ──同步──►  │ 这个洞见            │
...更多正文...                   │ canvasMargin:{anc:…}│
                                 └─────────────────────┘
              ◄── 双击节点跳回笔记
```

## 功能

| 功能 | 触发方式 |
|---|---|
| 高亮选区 | 选中文字 → 浮动工具栏 → **✎ 摘录** |
| 取消高亮 | 点击高亮内 → 浮动工具栏 → **✂ 取消** |
| 同步到 Canvas | Ribbon 图标或 command palette |
| 跳转：笔记 → Canvas | Reading/Live Preview 模式点击高亮 |
| 跳转：Canvas → 笔记 | 双击 CanvasMargin 节点 |
| 沉浸摘录模式 | Settings → **Immersive mode** |
| 摘录后自动同步 | Settings → **Auto sync** |

## 安装

### 手动安装

1. 从最新 release 下载 `main.js`、`manifest.json`、`styles.css`。
2. 复制到 `.obsidian/plugins/canvas-annotator/`。
3. 在 **Settings → Community Plugins** 中启用插件。

### BRAT

在 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 中添加 `YangZhaoWeblog/CanvasMargin`。

## 使用方法

### 高亮文字

1. 在 Live Preview 或 Editing mode 打开 Markdown 笔记。
2. 选中文字。
3. 在浮动工具栏点击 **✎ 摘录**。

也可以开启 **Immersive mode**：鼠标松开时如果有选区，就立即创建 mark。

### 同步到 Canvas

打开一个 Canvas 文件，然后点击 **↻** ribbon icon，或在 command palette 运行 `Canvas Annotator: Sync annotations`。

开启 **Auto sync** 后，如果当前正好有一个可见 note 和一个可见 Canvas，摘录后会立即创建 Canvas node。

### 双向跳转

- **笔记 → Canvas**：在 Reading mode 或 rendered Live Preview 中点击高亮。
- **Canvas → 笔记**：双击 CanvasMargin 节点。

### 取消高亮

点击高亮内任意位置，然后在浮动工具栏点击 **✂ 取消**。插件会移除 `<mark>` 标签，保留原文。

## 设置项

| 设置 | 默认 | 说明 |
|---|---|---|
| Highlight color | Cyan (5) | 新 mark 和 Canvas node 的颜色 |
| Node gap | 20 px | 自动排列 Canvas node 的纵向间距 |
| Immersive mode | Off | 鼠标松开有选区时立即创建 mark |
| Auto sync | Off | split pair 有效时，摘录后立即创建 Canvas node |

## 实现原理

- 高亮直接写入 Markdown：`<mark class="cN" id="anc-{nanoid}">文字</mark>`。
- 旧格式 `class="cN anc-xxx"` 仍可读取，用于兼容已有笔记。
- Canvas node 的链接元数据存在顶层 JSON 字段：`"canvasMargin": { "anc": "..." }`。
- 同步会扫描 vault 中所有 `.canvas` 文件，避免同一个 anchor 重复创建节点。

## 兼容性

- Obsidian 1.5.0+
- Desktop only

## 给 Contributors

- [AGENTS.md](AGENTS.md) — agent 入口和 project map
- [harness/](harness/) — operational rules
- [docs/design-spec.md](docs/design-spec.md) — current design summary
- [PROGRESS.md](PROGRESS.md) / [DECISIONS.md](DECISIONS.md) — 当前状态和关键原因

## License

MIT
