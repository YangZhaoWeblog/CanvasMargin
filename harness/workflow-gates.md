> status: active
> owner: workflow
> layer: universal
> 本文件负责任务开始、验证、收尾和 circuit breaker；不负责具体领域规则。

# Workflow Gates

## Start Gate

编辑前：

- 说明 concrete goal。
- 列出 unresolved questions，或写 `无待澄清`。
- 读取相关 owner modules 和 tests。
- 查看 `harness/failures.md` 是否有相同 pitfall。
- 查看当前 git status，并保护 unrelated work。

## Coding Start Check

开始实现前明确：

- behavior 的 truth source；
- change 的 owner module；
- verification command；
- 是否存在 user-data risk；
- 是否需要 manual Obsidian verification。

## Verification Gate

- Docs-only：实际检查 links/rendering；一般不需要 build，除非 docs 引用了 generated facts。
- Pure helper change：targeted Vitest + `npm run build`。
- Cross-module source change：相关 Vitest files、`npm test`、`npm run build`。
- Obsidian integration change：automated gates + `testing.md` 的 manual vault checklist。

## Circuit Breaker

同一个 interface 或 behavior 连续三轮 implementation/test/review 失败时：

1. 停止继续硬改。
2. 重读 code、tests 和 API owner docs。
3. 写下 mismatched assumption。
4. 继续前先询问用户，或写一个小 design note。

## Close Gate

Final response 必须包含：

- changed files 的有用概览；
- commands run 和 pass/fail status；
- 相关时说明 manual verification status；
- remaining TODOs 或 risks。
