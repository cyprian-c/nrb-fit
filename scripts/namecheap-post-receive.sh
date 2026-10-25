#!/usr/bin/env bash
# ==============================================================================
# Namecheap Git Deployment Hook (post-receive)
# Path on server: ~/repo/nrb-fit.git/hooks/post-receive
# Permissions: chmod +x ~/repo/nrb-fit.git/hooks/post-receive
# ==============================================================================

set -euo pipefail

# 1. Deployment paths (adjust if your cPanel app root differs)
TARGET_DIR="${TARGET_DIR:-$HOME/nrfit.cyprian.services}"
GIT_DIR="${GIT_DIR:-$HOME/repo/nrb-fit.git}"
BRANCH="${DEPLOY_BRANCH:-main}"

echo ""
echo "============================================================"
echo " [DEPLOY] NRBFIT Deployment to Namecheap triggered"
echo " Target Directory: $TARGET_DIR"
echo "============================================================"

# Read standard input for pushed refs
PUSHED_BRANCH=""
while read -r oldrev newrev refname; do
  BRANCH_NAME=$(echo "$refname" | sed 's/refs\/heads\///')
  if [ "$BRANCH_NAME" = "$BRANCH" ]; then
    PUSHED_BRANCH="$BRANCH_NAME"
    echo "--> Pushed to $BRANCH_NAME (commit: ${newrev:0:7})"
  fi
done

if [ -z "$PUSHED_BRANCH" ]; then
  echo "--> Notice: Push did not target '$BRANCH'. Performing deploy for '$BRANCH' anyway..."
fi

# 2. Checkout latest code into working directory
echo "--> Checking out latest code from branch '$BRANCH'..."
mkdir -p "$TARGET_DIR"
git --work-tree="$TARGET_DIR" --git-dir="$GIT_DIR" checkout -f "$BRANCH"

cd "$TARGET_DIR"

# 3. Locate and activate cPanel CloudLinux Node.js virtual environment
echo "--> Configuring Node.js runtime..."
NODE_ACTIVATE=$(find "$HOME/nodevenv" -type f -name "activate" 2>/dev/null | grep "nrfit" | head -n 1 || true)
if [ -z "$NODE_ACTIVATE" ]; then
  NODE_ACTIVATE=$(find "$HOME/nodevenv" -type f -name "activate" 2>/dev/null | head -n 1 || true)
fi

if [ -n "$NODE_ACTIVATE" ]; then
  echo "--> Sourcing Node environment from $NODE_ACTIVATE"
  # shellcheck disable=SC1090
  source "$NODE_ACTIVATE"
fi

# Fallback: Check if node is in PATH or find it in nodevenv
if ! command -v node >/dev/null 2>&1; then
  NODE_BIN=$(find "$HOME/nodevenv" -type f -name "node" 2>/dev/null | head -n 1 || true)
  if [ -n "$NODE_BIN" ]; then
    export PATH="$(dirname "$NODE_BIN"):$PATH"
  fi
fi

if command -v node >/dev/null 2>&1; then
  echo "--> Node version: $(node -v)"
  echo "--> NPM version:  $(npm -v)"
else
  echo "--> [ERROR] Node.js was not detected on the server!"
  echo "--> Please set up the Node.js App in cPanel first (cPanel -> Setup Node.js App)."
  exit 1
fi

# Keep memory usage controlled within CloudLinux LVE limits (max 512MB RAM for node processes)
export NODE_OPTIONS="--max-old-space-size=512"

# 4. Check for production environment configuration
if [ ! -f ".env" ] && [ ! -f "server/.env" ]; then
  echo "--> [NOTICE] No .env file found in $TARGET_DIR."
  if [ -f "server/.env.example" ]; then
    echo "--> Copying server/.env.example to .env. Please configure your DATABASE_URL in cPanel or $TARGET_DIR/.env"
    cp server/.env.example .env
  fi
fi

# 5. Install dependencies
echo "--> Installing dependencies (using workspace root)..."
npm install --no-audit --no-fund --prefer-offline

# 6. Build the Vite client
echo "--> Building production frontend client..."
npm run build:client

# 7. Run database migrations
echo "--> Running database migrations..."
if [ -f "server/scripts/migrate.js" ]; then
  npm run migrate --workspace=server || {
    echo "--> [WARN] Database migration script exited with an error. Check DATABASE_URL connection."
  }
fi

# 8. Restart Phusion Passenger Node.js app
echo "--> Signaling Phusion Passenger to reload application..."
mkdir -p "$TARGET_DIR/tmp"
touch "$TARGET_DIR/tmp/restart.txt"

echo ""
echo "============================================================"
echo " [SUCCESS] NRBFIT deployment completed successfully!"
echo " Live URL: https://nrfit.cyprian.services"
echo " Health:   https://nrfit.cyprian.services/api/health"
echo "============================================================"
echo ""
