# Architecture

本文给从后端分层模型切入的人一个项目骨架。CanvasMargin 不是后端服务，没有 `proto -> service -> biz -> repo` 的网络边界和数据库层；它是 Obsidian desktop plugin，主要边界是 Obsidian runtime、Markdown 文本、Canvas JSON 和少量纯函数。

## Backend Layer Analogy

```text
后端常见模型                         CanvasMargin 对应层
────────────────────────────────     ─────────────────────────────────────
proto / API contract                  models.ts + canvas.d.ts + manifest.json
service / application orchestration    main.ts
biz / domain logic                     annotator.ts + syncer.ts + jumper.ts + toolbar.ts
repo / persistence adapter             Obsidian vault / Canvas JSON / plugin data
tests                                  tests/*.test.ts
```

这只是阅读类比，不是要求仓库拆成这些目录。当前代码更适合保持小模块，而不是为分层本身制造抽象。

## Runtime Boundary

`main.ts` 是插件和 Obsidian 的边界层，职责类似 application service：

1. 在 `onload()` 注册 ribbon、commands、Markdown post-processor、settings tab 和 DOM events。
2. 从 Obsidian `MarkdownView` / workspace leaves / vault 读取当前状态。
3. 调用纯函数模块完成 mark、sync diff、jump lookup。
4. 把结果写回 editor、Canvas node data 或 plugin settings。
5. 通过 `Notice` 给用户反馈。

凡是依赖 Obsidian、CodeMirror、DOM 或 Canvas 内部 API 的逻辑，优先放在 `main.ts` 或对应 UI adapter 里；能纯函数化的行为再下沉到 `src/*.ts` helper。

## Contract Layer

`models.ts` 和 `canvas.d.ts` 是最接近 proto/contract 的层：

1. `models.ts` 定义 mark regex、settings shape、CanvasMargin metadata helper 和默认常量。
2. `canvas.d.ts` 声明本插件实际使用到的 Obsidian Canvas internal API。
3. `manifest.json` 定义插件 id、name、版本、最低 Obsidian 版本和 desktop-only 约束。

最重要的数据契约：

```text
Markdown mark:
<mark class="cN" id="anc-{nanoid}">text</mark>

Canvas node metadata:
canvasMargin: { anc: string }
```

新写入只使用 `id="anc-..."`；读取时继续兼容旧 `class="... anc-..."`。

## Domain Logic Layer

这些模块相当于 biz/domain helper，基本不直接依赖 Obsidian runtime，因此最适合从这里开始读：

1. `annotator.ts`
   负责把 Markdown 选区变成 mark、判断是否应该跳过已有 mark、移除 mark 外壳。

2. `syncer.ts`
   负责扫描 Markdown anchor、扫描 Canvas metadata、计算同步差异、计算新节点位置、创建 Canvas text node。

3. `jumper.ts`
   负责根据 anchor 在 Canvas JSON 或 Markdown 文本中查找目标位置。

4. `toolbar.ts`
   一半是纯函数 `getToolbarAction()`，判断当前选区应该显示“摘录”还是“取消”；一半是浮动 toolbar DOM adapter。

## Persistence Layer

本项目没有传统 repo 类，但有三类持久化来源：

1. Markdown 文件
   用户摘录直接写入笔记正文里的 `<mark>` 标签。

2. `.canvas` 文件
   Canvas node 的顶层 `canvasMargin` metadata 存储 note mark 和 Canvas node 的关联。

3. Obsidian plugin data
   `loadData()` / `saveData()` 保存 `PluginSettings`，并与 `DEFAULT_SETTINGS` merge。

目前没有数据库、HTTP API、migration framework，也没有独立 repository abstraction。

## Read Order

如果你想快速建立骨架，建议按这个顺序读：

1. `src/models.ts`
   先理解 anchor、mark 格式、Canvas metadata 和 settings。

2. `src/annotator.ts`
   看清楚“选中文本 -> Markdown mark”的最小闭环。

3. `src/syncer.ts`
   看清楚“Markdown mark -> Canvas node”的同步模型。

4. `src/jumper.ts`
   看清楚双向跳转如何通过同一个 `anc` 查找。

5. `src/toolbar.ts`
   看用户选区如何决定 UI action。

6. `src/main.ts`
   最后读 Obsidian runtime 编排，因为这里混合了 workspace、vault、editor、DOM 和 Canvas 内部 API。

7. `tests/*.test.ts`
   对照每个纯函数模块确认当前行为。

## Test Architecture

当前自动测试主要覆盖 domain/helper 层：

```text
tests/models.test.ts      contract helpers
tests/annotator.test.ts   Markdown mark insertion/removal
tests/syncer.test.ts      scan/diff/placement
tests/jumper.test.ts      lookup helpers
tests/toolbar.test.ts     toolbar action decision
```

自动测试没有完整覆盖 Obsidian runtime integration。触碰 `main.ts`、settings UI、workspace events、Canvas creation 或 jump behavior 时，需要按 `harness/testing.md` 做 manual vault verification。

## Where To Change Things

常见任务入口：

```text
改 mark 格式或 metadata       models.ts + annotator.ts/syncer.ts + tests
改摘录插入/删除行为           annotator.ts + tests/annotator.test.ts
改同步创建规则                syncer.ts + tests/syncer.test.ts
改 note/Canvas 查找规则       jumper.ts + tests/jumper.test.ts
改 toolbar action             toolbar.ts + tests/toolbar.test.ts
改 Obsidian 命令或 workspace   main.ts + manual vault verification
改设置项                      models.ts + settings.ts + main.ts + manual vault verification
```

优先把可测试逻辑放进纯函数模块；`main.ts` 保持为 Obsidian adapter 和 orchestration。
