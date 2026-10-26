#!/usr/bin/env bash
# ==============================================================================
# NRBFIT Git Pre-Push Hook
# Ensures that pushing to 'production' always pushes a clean, pre-built app.
# ==============================================================================

set -euo pipefail

REMOTE="${1:-}"
URL="${2:-}"

# Check if target remote is 'production' or matches the cPanel host
if [ "$REMOTE" = "production" ] || [[ "$URL" == *"dreaifwi"* ]] || [[ "$URL" == *"198.54.126.157"* ]]; then
  echo ""
  echo "============================================================"
  echo " [PRE-PUSH] Verifying pre-built production bundle for NRBFIT"
  echo " Target Remote: $REMOTE ($URL)"
  echo "============================================================"

  # 1. Build the production client assets locally
  echo "--> Compiling production frontend bundle (npm run build)..."
  npm run build

  # 2. Check if client/dist generated any new or modified files
  if [ -n "$(git status --porcelain client/dist)" ]; then
    echo ""
    echo "--> [NOTICE] New or updated production build assets detected in client/dist."
    echo "--> Automatically staging and committing updated production bundle..."
    git add client/dist
    git commit -m "chore(build): update production build distribution before push"
    echo ""
    echo "============================================================"
    echo " [ACTION REQUIRED] Production bundle built and committed!"
    echo " Please re-run: git push production main"
    echo "============================================================"
    echo ""
    exit 1
  fi

  # 3. Verify that index.html exists in client/dist
  if [ ! -f "client/dist/index.html" ]; then
    echo "--> [ERROR] client/dist/index.html was not found after build!"
    echo "--> Aborting push to prevent broken deployment on production."
    exit 1
  fi

  echo "--> Production bundle verified and ready in client/dist."
  echo "--> Proceeding with push to production..."
  echo ""
fi

exit 0
