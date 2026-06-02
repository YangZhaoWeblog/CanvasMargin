# scripts/

td-harness 的 hook 脚本——从 `td-harness-init` skill 复制而来。

## ⚠️ 当前状态：未自动接入 git

本仓库是 git **worktree**，且全局已设置 `core.hooksPath = ~/.git-hooks`。
为避免污染上游主仓和覆盖全局 hook 体系，hook 脚本**没有**自动写入 `.git/hooks/`。

详见 DECISIONS.md `2026-06-02：不在 worktree 内自动安装 git hook`。

## 启用方式（择一）

### 方式 A：仅本仓启用（推荐）

```bash
# 1. 在 scripts/ 下建一份 git hook 风格的小脚本目录
mkdir -p scripts/githooks

# 2. 写 hook 入口
cat > scripts/githooks/pre-commit <<'EOF'
#!/usr/bin/env bash
exec bash "$(git rev-parse --show-toplevel)/scripts/pre_commit_check.sh" "$@"
EOF
cat > scripts/githooks/commit-msg <<'EOF'
#!/usr/bin/env bash
exec bash "$(git rev-parse --show-toplevel)/scripts/check_commit_msg.sh" "$@"
EOF
cat > scripts/githooks/pre-push <<'EOF'
#!/usr/bin/env bash
exec bash "$(git rev-parse --show-toplevel)/scripts/pre_push_check.sh" "$@"
EOF
chmod +x scripts/githooks/*

# 3. 仅在本仓库启用（不影响全局）
git config --local core.hooksPath scripts/githooks
```

恢复全局 hook：`git config --local --unset core.hooksPath`

### 方式 B：手动跑

每次 commit / push 前手动：

```bash
bash scripts/pre_commit_check.sh
bash scripts/pre_push_check.sh
```

## 各脚本说明

| 脚本 | 作用 | 触发点 |
|---|---|---|
| `check_razor_block.sh` | AGENTS.md ≤200 行 | pre-commit |
| `check_wip.sh` | PROGRESS.md WIP=1 | pre-commit |
| `check_test_guard.sh` | 防止 AI 改测试断言 | pre-commit |
| `check_commit_msg.sh` | Conventional Commits 格式 | commit-msg |
| `pre_commit_check.sh` | 串联 razor + wip + test-guard，并跑 `npm run build` | pre-commit |
| `pre_push_check.sh` | `npm test` + 干净状态 | pre-push |

## 项目调整

`pre_commit_check.sh` / `pre_push_check.sh` 模板里跑 `make check` / `make e2e`，
本项目没有 Makefile——它们会跳过。如果想在 pre-commit 中跑 `npm run build`，可以编辑
`pre_commit_check.sh` 末尾追加：

```bash
echo "→ npm run build"
cd "$REPO_ROOT" && npm run build
```

不过 `npm run build` 较慢（~3s+），建议放在 pre-push 而非 pre-commit。
