#!/usr/bin/env bash
# pre_commit_check.sh — source local gate

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

cd "$REPO_ROOT"

echo "→ npm run lint"
npm run lint

echo "→ npm run build"
npm run build

echo "✓ pre-commit gate passed"
