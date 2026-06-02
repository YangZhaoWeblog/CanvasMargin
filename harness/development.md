# 开发流程（development）

> 决定**怎么做**：PGE 档位 + Spec 重量 + 短会话原则。

## PGE 档位决策

接到任务先判断档位：

| 档 | 触发 | 形态 |
|---|------|------|
| 档 1 | ≤2h、单文件、单 harness 子规约 | 单会话角色切换 |
| 档 2 | ≥3 文件 / 多 harness 子规约 / 跨会话 / token>60% | feature branch + sub-agent + `.pge/spec.md` |
| 档 3 | 跨天 / `/loop` / 多 sprint contract | 档 2 + `.harness/campaign.json` |

升档触发任一即升，不可硬扛。

### 本项目档位提示

- "改 toolbar 颜色样式"——档 1
- "改 mark 标签格式"——档 2（连带 `models.ts` / `annotator.ts` / `jumper.ts` / `syncer.ts`，且要兼容旧格式）
- "把 jumper 的全 vault 扫描换成倒排索引"——档 2 起步，可能档 3
- "改 Canvas 节点元数据 namespace（`canvasMargin` → 别的 key）"——档 3（涉及历史数据迁移脚本，参考 spec 2026-04-22 的做法）
- "适配 Obsidian Mobile（去掉 isDesktopOnly）"——档 3

## Spec 重量决策

| 规模 | 工具 | 适用 | 产出位置 |
|------|------|------|---------|
| 大型 | SpecKit（specify→clarify→plan→tasks→implement）| 新模块、新 API 接触面、跨多模块重构 | `specs/<编号>-<名>/` |
| 中型 | OpenSpec（propose→apply→archive） / 项目自有 spec 风格（参考 `docs/superpowers/specs/2026-04-22-toplevel-field-migration.md`）| 现有模块新增/修改、行为调整 | `docs/superpowers/specs/<日期>-<名>.md` |
| 小型 | 直接做 + 小型变更脚手架 | Bug 修复、配置调整、1-3 文件 | PR 描述；bug 修复必带回归测试 |

PGE 档位与 Spec 重量**正交**——可叠加。本项目当前规模建议：
- Bug 修复 → 小型
- 新设置项 / 新命令 → 小型 ~ 中型
- 架构调整（例如改协议、改存储、改命名空间）→ 中型 ~ 大型；项目已有先例，参考 `docs/superpowers/specs/`

## 短会话原则

- 一次会话做 2-3 项 → commit → 退出
- token > 60% 即考虑 commit 退出，开新会话
- 每会话尾必须更新 PROGRESS.md / DECISIONS.md
- 上下文焦虑（接近 200K）会让 AI 跳过验证、选简单方案 → 提前 commit

## 干净状态

- 每会话结束时 `git status` 必须为空（除白名单文件）
- 临时文件 / 调试 console.log / TODO 必须清理
- "以后再清理" = 制度性放弃；熵增是默认状态

## TDD 应用到本项目

| 改动类型 | 是否 TDD | 节奏 |
|---|---|---|
| 修改 `models.ts` 的 regex / `buildMarkTag` / `readMarginMeta` / `writeMarginMeta` | **是**（强制） | 先写 test 红 → 实现绿 → 重构 |
| 修改 `syncer.ts` 的 diff / scan 逻辑 | **是** | 同上 |
| 修改 `jumper.ts` 的搜索 | **是** | 同上 |
| 修改 `annotator.ts` 的字符串变换 | **是**（边界条件多） | 同上 |
| 修改 `toolbar.ts:getToolbarAction` 纯函数 | **是** | 同上 |
| 修改 `toolbar.ts` 的 DOM 类 | 否 | 仅手测 |
| `main.ts` 命令 / 事件绑定 / dblclick 抢先 / split 检测 | 否 | 仅手测；TDD 在这里 ROI 低 |
| `settings.ts` UI | 否 | 仅手测 |

## 反模式

- ❌ 默认全开 PGE（小任务过度工程）
- ❌ 单会话塞满（token>80% 强行继续）
- ❌ 跨档位硬扛（档 1 任务硬做成跨天）
- ❌ commit 时留未清理的 console.log / 调试 mark
- ❌ 改了 `models.ts` 不写新测试（regex 与 metadata API 是项目核心 invariant）
- ❌ 改 Canvas 节点写入路径却没读 `obsidian-api.md` §3（容易把 metadata 写回 `node.text`）
