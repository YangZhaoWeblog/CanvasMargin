> status: active
> owner: local-development
> layer: profile
> 本文件负责本地开发事实、commands 和扫描顺序；不负责代码风格细节。

# Development

## Project Facts

- Package: `canvas-annotator`，private npm package，ESM config。
- Runtime: Obsidian desktop plugin。
- Source: `src/**/*.ts`。
- Tests: `tests/*.test.ts`。
- Build output: `main.js`。
- Lint: `eslint-plugin-obsidianmd` recommended config plus local TypeScript overrides。

## Commands

```bash
npm run dev              # esbuild watch
npm run lint             # ESLint + Obsidian plugin rules
npm run build            # tsc -noEmit -skipLibCheck + production bundle
npm test                 # vitest run
npm run test:watch       # vitest watch
npx vitest run tests/models.test.ts
npx vitest run -t "readMarginMeta"
bash scripts/pre_commit_check.sh
bash scripts/pre_push_check.sh
```

Script hooks 已存在，但可能没有接入 git。手动运行仍算 local gate。

## Context Scan Order

1. `package.json`, `manifest.json`, `tsconfig.json`, `esbuild.config.mjs`。
2. 相关 `src/` owner module 及其 tests。
3. 已知 code facts 后，再读 `README.md` / `README-zh.md` / `docs/design-spec.md`。
4. `harness/failures.md` 用于避免重复踩坑。

## Scope Classification

- **Small**: 单 owner module 或 docs-only，低 user-data risk。
- **Medium**: 多 source modules，或触碰 settings、mark format、sync、jump、Canvas metadata。
- **Large**: 跨会话、architecture change、release migration、user-data migration。

Medium / large work 应使用 `pge-protocol.md`，除非用户明确要求小范围直接修改。

## Local Safety

- Preserve dirty user work。
- 不为了适配 broken code 修改 tests。
- 搜索仓库优先用 `rg` / `rg --files`。
