# scripts/

本目录放 local gates 和可选 git hook 入口脚本。

## 当前状态：未自动接入 git

本仓库曾是 git worktree，且用户全局可能已有 `core.hooksPath`。为避免覆盖用户全局 hook，脚本不会自动写入 `.git/hooks/`。

详见 `DECISIONS.md`：`2026-06-02：不在 worktree 内自动安装 git hook`。

## 启用方式

### 方式 A：仅本仓启用

```bash
mkdir -p scripts/githooks

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
git config --local core.hooksPath scripts/githooks
```

恢复全局 hook：

```bash
git config --local --unset core.hooksPath
```

### 方式 B：手动跑

```bash
bash scripts/pre_commit_check.sh
bash scripts/pre_push_check.sh
```

## 脚本说明

| Script | Purpose | Typical trigger |
|---|---|---|
| `check_razor_block.sh` | `AGENTS.md` <= 200 lines | pre-commit |
| `check_wip.sh` | `PROGRESS.md` WIP count <= 1 | pre-commit |
| `check_test_guard.sh` | 防止 AI 删除/削弱测试断言 | pre-commit |
| `check_commit_msg.sh` | Conventional Commits 格式 | commit-msg |
| `pre_commit_check.sh` | razor + WIP + test-guard + `npm run lint` + `npm run build` | pre-commit / manual |
| `pre_push_check.sh` | `npm run lint` + `npm run build` + `npm test` + clean-state check | pre-push / manual |

## 注意

- `pre_push_check.sh` 会要求工作区 clean；在有未提交变更时按设计失败。
- 本项目没有 Makefile；所有 project gates 以 `package.json` scripts 为准。
