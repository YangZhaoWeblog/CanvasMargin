#!/usr/bin/env bash
# pre_push_check.sh — push 前的最终 source gate

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

cd "$REPO_ROOT"

echo "→ npm run lint"
npm run lint

echo "→ npm run build"
npm run build

echo "→ npm test"
npm test

if [[ -n "$(git status --porcelain)" ]]; then
    cat >&2 <<'EOF'
[BLOCK] clean-state | reason: 工作区不干净
fix: commit 或 stash 后再 push
EOF
    git status --short >&2
    exit 1
fi

echo "✓ pre-push gate passed"
