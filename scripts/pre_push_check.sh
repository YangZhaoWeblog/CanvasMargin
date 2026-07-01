#!/usr/bin/env bash
# pre_push_check.sh — push 前的最终门禁
# 比 pre-commit 更严：必须过 lint/build/test + clean state

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

cd "$REPO_ROOT"

echo "→ npm run lint"
npm run lint

echo "→ npm run build"
npm run build

echo "→ npm test"
npm test

# 干净状态检查（lecture-12）
DIRTY=$(git status --porcelain | grep -v -E '\.(harness|pge)/' || true)
if [[ -n "$DIRTY" ]]; then
    cat >&2 <<EOF
[BLOCK] clean-state | reason: 工作区不干净
fix: commit 或 stash 后再 push
ref: walkinglabs lecture-12
EOF
    echo "$DIRTY" >&2
    exit 1
fi

echo "✓ pre-push gate passed"
