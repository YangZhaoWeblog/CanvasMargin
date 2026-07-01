> status: active
> owner: verification
> layer: profile
> 本文件负责测试策略和验收证据；不负责实现方案。

# Testing

## Automated Gates

代码改动后运行：

```bash
npm run build
npm test
```

迭代时使用 targeted Vitest：

```bash
npx vitest run tests/annotator.test.ts
npx vitest run -t "scanCanvasJsonAncs"
```

## Unit Test Ownership

- `tests/models.test.ts`: regex、mark builder、metadata helpers、defaults。
- `tests/annotator.test.ts`: mark insertion、skip detection、removal。
- `tests/syncer.test.ts`: Markdown scan、Canvas scan、diff、placement。
- `tests/jumper.test.ts`: Canvas 和 Markdown lookup helpers。
- `tests/toolbar.test.ts`: toolbar action decision。

## Manual Obsidian Verification

触碰 `main.ts`、UI、settings、workspace events、Canvas creation 或 jump behavior 时必须手测。

Checklist:

- plugin 能在 test vault 加载；
- selection 创建 new-format mark；
- existing old-format mark 能被识别；
- removal 恢复 plain text；
- sync 创建带顶层 `canvasMargin` 的 Canvas text node；
- global Canvas dedup 不重复创建节点；
- note mark click 能打开/选择 Canvas node；
- Canvas node double-click 能跳回 note；
- settings reload 后仍持久化。

如果无法 manual verify，final answer 必须说明，并指出 affected risk。

## Test Guard

- 不删除或削弱 assertions 来适配实现。
- 如果 product behavior 改变，先记录 decision，再新增 tests 或更新 expected behavior。
- Bug fix 优先补 focused regression tests。
