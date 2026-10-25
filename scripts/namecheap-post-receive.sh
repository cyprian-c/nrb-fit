#!/usr/bin/env bash
# ==============================================================================
# Namecheap cPanel Git Deployment Hook (post-receive)
# Server IP:        198.54.126.157
# SSH Port:         21098
# User:             dreaifwi
# App Directory:    /home/dreaifwi/nrbfit.cyprian.services
# Bare Repo Path:   /home/dreaifwi/repo/nrb-fit.git
# Hook Location:    /home/dreaifwi/repo/nrb-fit.git/hooks/post-receive
# Permissions:      chmod +x /home/dreaifwi/repo/nrb-fit.git/hooks/post-receive
# ==============================================================================

set -euo pipefail

# 1. Server Configuration & Target Paths
CPANEL_USER="dreaifwi"
USER_HOME="${HOME:-/home/$CPANEL_USER}"
TARGET_DIR="${TARGET_DIR:-$USER_HOME/nrbfit.cyprian.services}"
GIT_DIR="${GIT_DIR:-$(pwd)}"
BRANCH="${DEPLOY_BRANCH:-main}"

echo ""
echo "============================================================"
echo " [DEPLOY] NRBFIT cPanel Deployment Triggered"
echo " Server IP:        198.54.126.157"
echo " cPanel User:      $CPANEL_USER"
echo " Target Directory: $TARGET_DIR"
echo " Target Branch:    $BRANCH"
echo "============================================================"

# Read standard input for pushed refs (oldrev newrev refname)
PUSHED_BRANCH=""
LAST_COMMIT=""
if [ ! -t 0 ]; then
  while read -r oldrev newrev refname; do
    BRANCH_NAME="${refname#refs/heads/}"
    if [ "$BRANCH_NAME" = "$BRANCH" ]; then
      PUSHED_BRANCH="$BRANCH_NAME"
      LAST_COMMIT="$newrev"
      echo "--> Pushed commit: ${newrev:0:7} to branch '$BRANCH_NAME'"
    fi
  done
fi

# Fallback for manual CLI execution or when stdin didn't contain target branch
if [ -z "$LAST_COMMIT" ] || [ "$LAST_COMMIT" = "0000000000000000000000000000000000000000" ]; then
  LAST_COMMIT=$(git --git-dir="$GIT_DIR" rev-parse "refs/heads/$BRANCH" 2>/dev/null || echo "$BRANCH")
  echo "--> Using latest commit from '$BRANCH': ${LAST_COMMIT:0:7}"
fi

# 2. Clean up target directory and purge previous deployment leftovers
echo "--> Cleaning up target directory and removing old deployment leftovers..."
mkdir -p "$TARGET_DIR"

# Remove old frontend builds, vite caches, and temporary files
rm -rf \
  "$TARGET_DIR/client/dist" \
  "$TARGET_DIR/dist" \
  "$TARGET_DIR/client/.vite" \
  "$TARGET_DIR/.vite" \
  "$TARGET_DIR/tmp/restart.txt"

# Force checkout target branch and reset hard to target commit
echo "--> Checking out commit ${LAST_COMMIT:0:7} into $TARGET_DIR..."
git --work-tree="$TARGET_DIR" --git-dir="$GIT_DIR" checkout -f "$BRANCH"
git --work-tree="$TARGET_DIR" --git-dir="$GIT_DIR" reset --hard "$LAST_COMMIT"

# Clean out any leftover or orphaned files from prior deployments while preserving .env configuration
echo "--> Cleaning untracked leftovers from working tree..."
git --work-tree="$TARGET_DIR" --git-dir="$GIT_DIR" clean -ffdx \
  -e .env \
  -e .env.* \
  -e server/.env \
  -e server/.env.* \
  -e node_modules \
  -e client/node_modules \
  -e server/node_modules \
  2>/dev/null || true

# 3. Step into target directory & isolate Git environment from child tools
cd "$TARGET_DIR"
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

# 4. Locate and activate cPanel CloudLinux Node.js virtual environment
echo "--> Locating and activating Node.js virtual environment..."
NODE_ACTIVATE=$(find "$USER_HOME/nodevenv" -type f -name "activate" 2>/dev/null | grep -E "nrbfit" | head -n 1 || true)
if [ -z "$NODE_ACTIVATE" ]; then
  NODE_ACTIVATE=$(find "$USER_HOME/nodevenv" -type f -name "activate" 2>/dev/null | head -n 1 || true)
fi

if [ -n "$NODE_ACTIVATE" ] && [ -f "$NODE_ACTIVATE" ]; then
  echo "--> Activating Node virtualenv: $NODE_ACTIVATE"
  # shellcheck disable=SC1090
  source "$NODE_ACTIVATE"
fi

# Fallback: check alternative node binaries if node is not yet in PATH
if ! command -v node >/dev/null 2>&1; then
  for candidate in \
    $(find "$USER_HOME/nodevenv" -type f -name "node" 2>/dev/null) \
    /opt/alt/alt-nodejs22/root/usr/bin/node \
    /opt/alt/alt-nodejs20/root/usr/bin/node \
    /usr/local/bin/node \
    /usr/bin/node; do
    if [ -x "$candidate" ]; then
      export PATH="$(dirname "$candidate"):$PATH"
      break
    fi
  done
fi

if command -v node >/dev/null 2>&1; then
  echo "--> Node runtime: $(command -v node) ($(node -v))"
  echo "--> NPM package manager: $(command -v npm) ($(npm -v))"
else
  echo "--> [ERROR] Node.js executable was not detected on the server!"
  echo "--> Please verify your Node.js App in cPanel (cPanel -> Setup Node.js App for nrbfit.cyprian.services)."
  exit 1
fi

# Bound memory allocation to prevent CloudLinux LVE limits from killing the build
export NODE_OPTIONS="--max-old-space-size=512"

# 5. Check production environment file (.env)
if [ ! -f ".env" ] && [ ! -f "server/.env" ]; then
  echo "--> [NOTICE] No .env found in $TARGET_DIR."
  if [ -f "server/.env.example" ]; then
    echo "--> Copying server/.env.example to .env. Please configure your DATABASE_URL and secrets."
    cp server/.env.example .env
  fi
fi

# 6. Install workspace dependencies
echo "--> Installing npm dependencies (root & workspaces)..."
npm install --no-audit --no-fund --prefer-offline

# 7. Build Vite production client
echo "--> Building production frontend client..."
npm run build:client

# 8. Run database migrations if configured
if [ -f "server/scripts/migrate.js" ]; then
  echo "--> Running database migrations..."
  npm run migrate --workspace=server || {
    echo "--> [WARN] Database migration returned non-zero status. Check your DATABASE_URL in .env."
  }
fi

# 9. Reload application via Phusion Passenger
echo "--> Signaling Phusion Passenger to reload application..."
mkdir -p "$TARGET_DIR/tmp"
touch "$TARGET_DIR/tmp/restart.txt"

echo ""
echo "============================================================"
echo " [SUCCESS] NRBFIT deployment completed successfully!"
echo " Server:   198.54.126.157"
echo " Host:     nrbfit.cyprian.services"
echo " App Root: $TARGET_DIR"
echo " Live URL: https://nrbfit.cyprian.services"
echo " Health:   https://nrbfit.cyprian.services/api/health"
echo "============================================================"
echo ""
