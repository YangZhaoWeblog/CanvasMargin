# scripts/

本目录保留 project-owned local gates 与可选 Git hook entrypoint；不自动写入 `.git/hooks/`，也不使用 hook 代替 Harness/PGE/review 的语义判断。

## 当前状态：未自动接入 Git

为避免覆盖用户全局 `core.hooksPath` 或污染其他 worktree，本仓不自动安装 hook。这个选择见 `DECISIONS.md` 的 2026-06-02 记录。

## 可选启用方式

仅在用户明确希望本仓启用时，创建本地 wrapper 并设置 local config：

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

## Manual Gates

```bash
bash scripts/pre_commit_check.sh
bash scripts/pre_push_check.sh
```

| Script | Purpose | Typical trigger |
|---|---|---|
| `check_commit_msg.sh` | Conventional Commits header | commit-msg hook |
| `pre_commit_check.sh` | `npm run lint` + `npm run build` | pre-commit / manual |
| `pre_push_check.sh` | `npm run lint` + `npm run build` + `npm test` + clean state | pre-push / manual |

Harness size, test intent, Contract quality 与 documentation drift 由 normal review/PGE Evaluator 判断，不由 custom checker 强制。
