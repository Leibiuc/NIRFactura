#!/bin/bash
set -e

# TypeScript type checking command for nirfactura
# Usage: /typecheck or bash .claude/commands/typecheck.sh

PROJECT_ROOT="/Users/darius.leibiuc/NIRFactura/.claude/worktrees/sleepy-tereshkova-25ed09"
cd "$PROJECT_ROOT"

echo "🔍 TypeScript type check..."
echo ""

# Check if TypeScript is installed
if [ ! -d "node_modules/typescript" ]; then
    echo "❌ TypeScript not installed. Run: npm install"
    exit 1
fi

# Run type check with noEmit (don't generate files, just check)
if npx tsc --noEmit 2>&1; then
    echo ""
    echo "✅ Type check passed — no errors"
    exit 0
else
    echo ""
    echo "❌ Type check failed — see errors above"
    exit 1
fi
