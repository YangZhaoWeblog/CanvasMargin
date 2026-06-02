# 部署（deployment）

> Obsidian 社区插件的发布流程。

## 工件

发布 = 三个文件被打到一个 GitHub Release 里：

| 文件 | 来源 | 说明 |
|---|---|---|
| `manifest.json` | 仓库根目录（提交版） | 版本号、最低 Obsidian 版本 |
| `main.js` | `npm run build` 产出 | esbuild bundle，**不**进 git（在 `.gitignore`） |
| `styles.css` | 仓库根目录 | 静态 |

## 版本号

- `manifest.json` 中的 `version` 与 `package.json` 中的 `version` **必须一致**
- 用 SemVer：`MAJOR.MINOR.PATCH`
- 当前：`0.1.0`（pre-release，breaking 改动可不递主版）

## 命名 / 安装路径

| 字段 | 值 | 备注 |
|---|---|---|
| `manifest.json:id` | `canvas-annotator` | 历史 id，决定插件目录名 |
| `manifest.json:name` | `Canvas Annotator` | Obsidian 设置面板里看到的名字 |
| 用户 README 提示的安装路径 | `.obsidian/plugins/canvas-margin/` | 与 manifest id 不一致——已知问题 |
| 产品对外品牌 | **CanvasMargin** | 见 glossary.md |

> ⚠️ README 里写 `.obsidian/plugins/canvas-margin/` 而 `manifest.json:id` 是 `canvas-annotator`——
> 用户实际目录通常**应该**和 manifest id 保持一致。改名属于 breaking change：
> - 已安装用户的设置（`data.json`）路径会失效
> - BRAT 用户需手动迁移
> - 社区插件目录提交后改 id 几乎不可能
>
> 在 DECISIONS.md 记录任何改名决策。

## 版本号

- `manifest.json` 中的 `version` 与 `package.json` 中的 `version` **必须一致**
- 当前：`0.1.0`（pre-release）

## 发布步骤

```bash
# 1. 确认在 main 分支且干净
git status
git checkout main
git pull

# 2. 跑完整门禁
npm install
npm run build           # tsc -noEmit + esbuild
npm test                # vitest

# 3. 在真实 Obsidian Vault 手测核心场景（见 testing.md §Obsidian 内手测）

# 4. 同步版本号（package.json + manifest.json）
# 编辑后：
git add package.json manifest.json
git commit -m "chore(release): bump to vX.Y.Z"

# 5. 打 tag（社区插件强约定：tag 名 = 纯版本号，不带 v 前缀）
git tag X.Y.Z
git push && git push --tags

# 6. 在 GitHub Release 上传 manifest.json / main.js / styles.css
```

## Obsidian 社区插件提交规则

- **tag 名 = 版本号**，不带 `v` 前缀（社区插件审查脚本要求）
- Release 页面必须直接挂 `manifest.json` / `main.js` / `styles.css`（不要只放压缩包）
- `manifest.json` 里 `minAppVersion` 要诚实——只声明真正测过的最低版本

## 历史数据迁移

任何改 Canvas 节点 / mark 协议的 breaking 改动，都要参考 `docs/superpowers/specs/2026-04-22-toplevel-field-migration.md` 的做法：

- 不在代码里做"双格式兼容"留长尾（`canvasMargin` 迁移就明确不做向后兼容）
- 写一次性迁移脚本（独立 npm script 或文档化的 jq 命令）
- 迁移逻辑先在测试 vault 跑一遍 → 用户文档里给一键命令

mark 标签格式是例外——**仍**做向后兼容（旧 `class="anc-..."` 写入了用户 vault，无法迁移）。

## 回滚

- GitHub Release 设为 pre-release / 删除该 release
- 用户已下载的版本不能远程撤回——必须发新版本修复
- 在 DECISIONS.md 记录回滚原因

## 反模式

- ❌ tag 加 `v` 前缀（社区插件目录解析失败）
- ❌ `package.json` 与 `manifest.json` 版本号不一致
- ❌ 把 `main.js` 提交进 git（污染仓库历史）
- ❌ 跳过手测发布（pure 单测没法覆盖 Obsidian 行为）
- ❌ 把 `node_modules/` 一起打包

## CI（未来）

当前无 CI。可能引入：
- GitHub Actions：push tag 自动 build + 创建 Release
- 自动化版本号同步检查
- 但任何 CI **不能取代**真实 Vault 手测

## 关联

- AGENTS.md Rules §4（main 分支不直接改）
- [testing.md](testing.md) §Obsidian 内手测
