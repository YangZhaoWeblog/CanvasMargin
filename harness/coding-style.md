> status: active
> owner: code-quality
> layer: profile
> 本文件负责 TypeScript、module boundaries 和代码形态；不负责产品决策或 release。

# Coding Style

## TypeScript

- 保持 `strict`、`noImplicitAny`、`isolatedModules` 通过。
- Shared data shapes 优先用显式 exported interfaces。
- 只用于类型的位置使用 `type` imports。
- 避免 broad `any`；Obsidian internal API 必须用时，把 cast 控制在局部。
- Comments 要短且有信息量，不解释显而易见的 assignment。

## Module Ownership

- `models.ts`: shared regex、constants、settings shape、metadata helpers。
- `annotator.ts`: pure Markdown mark insertion/removal。
- `syncer.ts`: pure scan/diff helpers 和 Canvas node creation。
- `jumper.ts`: pure lookup helpers。
- `toolbar.ts`: pure toolbar action helper + toolbar DOM。
- `settings.ts`: Obsidian settings UI only。
- `main.ts`: plugin lifecycle、commands、workspace orchestration、notices。
- `canvas.d.ts`: local type declarations for internal Canvas APIs。

## Data Contracts

- New mark format: `<mark class="cN" id="anc-{21-char-nanoid}">text</mark>`。
- Backward-compatible read format: `class="... anc-{21-char-nanoid} ..."`。
- Canvas node metadata: top-level `canvasMargin: { anc: string }`。
- Settings 通过 Obsidian plugin data 保存，并与 `DEFAULT_SETTINGS` merge。

## Implementation Rules

- 能在 pure helper module 解决的，不先膨胀 `main.ts`。
- 行为改动靠近 owning module，并补 focused tests。
- 未获用户同意或没有必要，不新增 runtime dependency。
- 不留临时 `console.*`、commented-out code、generated noise。
- 不提交 generated `main.js`、`dist/`、`node_modules/`。

## Docs

User-facing plugin text 使用邻近文件已有语言。Docs 与代码冲突时，先用 `src/` 和 tests 确认行为，再更新 docs。
