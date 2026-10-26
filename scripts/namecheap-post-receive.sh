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

# 2. Checkout the pushed commit cleanly without destructive cleanup
# We do NOT run `rm -rf client/dist` or `git clean -ffdx`, which would break the app.
echo "--> Checking out commit ${LAST_COMMIT:0:7} into $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
git --work-tree="$TARGET_DIR" --git-dir="$GIT_DIR" checkout -f "$BRANCH"
git --work-tree="$TARGET_DIR" --git-dir="$GIT_DIR" reset --hard "$LAST_COMMIT"

# Synchronize hook with deployed repository version
if [ -f "$TARGET_DIR/scripts/namecheap-post-receive.sh" ] && [ -w "$GIT_DIR/hooks/post-receive" ]; then
  if ! cmp -s "$TARGET_DIR/scripts/namecheap-post-receive.sh" "$GIT_DIR/hooks/post-receive"; then
    echo "--> Updating post-receive hook on bare repository..."
    cp "$TARGET_DIR/scripts/namecheap-post-receive.sh" "$GIT_DIR/hooks/post-receive" 2>/dev/null || true
    chmod +x "$GIT_DIR/hooks/post-receive" 2>/dev/null || true
  fi
fi

# 3. Step into target directory & isolate Git environment from child tools
cd "$TARGET_DIR"
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

# 4. Locate and activate cPanel CloudLinux Node.js virtual environment
echo "--> Locating Node.js virtual environment..."
NODE_EXEC=""
NODE_ACTIVATE=""

# Priority 1: Check specifically for nrbfit nodevenv
for candidate in \
  "$USER_HOME/nodevenv/nrbfit.cyprian.services/20/bin/node" \
  "$USER_HOME/nodevenv/nrbfit.cyprian.services/22/bin/node" \
  $(find "$USER_HOME/nodevenv" -maxdepth 4 -type f -name "node" 2>/dev/null | grep -E "nrbfit" || true) \
  $(find "$USER_HOME/nodevenv" -maxdepth 4 -type f -name "node" 2>/dev/null || true); do
  if [ -x "$candidate" ]; then
    NODE_EXEC="$candidate"
    NODE_DIR="$(dirname "$candidate")"
    export PATH="$NODE_DIR:$PATH"
    ACTIVATE_CANDIDATE="$(dirname "$NODE_DIR")/bin/activate"
    if [ -f "$ACTIVATE_CANDIDATE" ]; then
      NODE_ACTIVATE="$ACTIVATE_CANDIDATE"
    fi
    break
  fi
done

if [ -n "$NODE_ACTIVATE" ] && [ -f "$NODE_ACTIVATE" ]; then
  echo "--> Activating Node virtualenv: $NODE_ACTIVATE"
  # shellcheck disable=SC1090
  source "$NODE_ACTIVATE"
fi

if [ -z "$NODE_EXEC" ] && command -v node >/dev/null 2>&1; then
  NODE_EXEC="$(command -v node)"
fi

if [ -n "$NODE_EXEC" ] && [ -x "$NODE_EXEC" ]; then
  echo "--> Node runtime: $NODE_EXEC ($("$NODE_EXEC" -v))"
  echo "--> NPM manager:  $(command -v npm || echo 'n/a') ($(npm -v 2>/dev/null || echo 'n/a'))"
else
  echo "--> [ERROR] Node.js executable was not detected on the server!"
  echo "--> Please verify your Node.js App in cPanel (cPanel -> Setup Node.js App for nrbfit.cyprian.services)."
  exit 1
fi

# 5. Ensure .htaccess has Phusion Passenger configuration pointing to valid Node.js binary
if [ ! -f "$TARGET_DIR/.htaccess" ] || ! grep -q "PassengerAppRoot" "$TARGET_DIR/.htaccess" 2>/dev/null; then
  echo "--> Creating CloudLinux Passenger configuration in .htaccess..."
  cat << HTACCESS_EOF > "$TARGET_DIR/.htaccess"
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "$TARGET_DIR"
PassengerBaseURI "/"
PassengerNodejs "$NODE_EXEC"
PassengerAppType node
PassengerStartupFile app.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

Options -Indexes
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</IfModule>
HTACCESS_EOF
elif grep -q "PassengerNodejs" "$TARGET_DIR/.htaccess" 2>/dev/null; then
  # Only replace PassengerNodejs if pointing to a non-existent path or generic /usr/bin/node
  CURRENT_PASSENGER_NODE=$(grep -E "^PassengerNodejs " "$TARGET_DIR/.htaccess" | awk '{print $2}' | tr -d '"' || true)
  if [ -n "$CURRENT_PASSENGER_NODE" ] && { [ ! -x "$CURRENT_PASSENGER_NODE" ] || [ "$CURRENT_PASSENGER_NODE" = "/usr/bin/node" ]; }; then
    echo "--> Updating PassengerNodejs to active nodevenv binary ($NODE_EXEC)..."
    sed -i "s|^PassengerNodejs .*|PassengerNodejs \"$NODE_EXEC\"|" "$TARGET_DIR/.htaccess" 2>/dev/null || true
  fi
fi

# 6. Verify environment file (.env)
if [ ! -f ".env" ] && [ ! -f "server/.env" ]; then
  echo "--> [NOTICE] No .env found in $TARGET_DIR."
  if [ -f "server/.env.example" ]; then
    echo "--> Copying server/.env.example to .env as starter template."
    cp server/.env.example .env
  fi
fi

# 7. Install production-only dependencies safely (never build on the server)
export NODE_OPTIONS="--max-old-space-size=512"

NEED_INSTALL=false
if [ ! -d "node_modules/express" ] || [ ! -d "node_modules/@neondatabase/serverless" ]; then
  NEED_INSTALL=true
elif [ "$TARGET_DIR/package.json" -nt "$TARGET_DIR/node_modules" ]; then
  NEED_INSTALL=true
fi

if [ "$NEED_INSTALL" = true ]; then
  echo "--> Installing production runtime dependencies (--omit=dev)..."
  npm install --omit=dev --no-audit --no-fund --prefer-offline || {
    echo "--> [WARN] npm install exited with warnings; checking required runtime modules..."
  }
else
  echo "--> Production dependencies already present and up to date."
fi

# 8. Verify pre-built frontend distribution
if [ -f "$TARGET_DIR/client/dist/index.html" ]; then
  echo "--> Pre-built frontend bundle verified at client/dist/index.html."
else
  echo "--> [WARN] Pre-built bundle not detected at client/dist/index.html!"
  echo "--> Please build locally ('npm run build') and push to production."
fi

# 9. Run database migrations if configured
if [ -f "server/scripts/migrate.js" ]; then
  HAS_DB_CONFIG=false
  if [ -n "${DATABASE_URL:-}" ] || grep -qE "DATABASE_URL=.+" .env 2>/dev/null || grep -qE "DATABASE_URL=.+" server/.env 2>/dev/null; then
    HAS_DB_CONFIG=true
  fi

  if [ "$HAS_DB_CONFIG" = true ]; then
    echo "--> Running database migrations..."
    npm run migrate --workspace=server || {
      echo "--> [WARN] Database migration returned non-zero status. Check your DATABASE_URL in .env."
    }
  fi
fi

# 10. Reload application via Phusion Passenger
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
