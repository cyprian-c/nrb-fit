#!/usr/bin/env bash
# ==============================================================================
# Setup Namecheap Git Remote and Deployment Automation
# Run locally: ./scripts/setup-namecheap-remote.sh
# ==============================================================================

set -euo pipefail

DEFAULT_USER="dreaifwi"
DEFAULT_HOST="198.54.126.157"
DEFAULT_PORT="21098"
DEFAULT_SUBDOMAIN="nrbfit.cyprian.services"

echo "============================================================"
echo " NRBFIT Namecheap Deployment Automation Setup"
echo "============================================================"
echo ""
echo "This script automates setting up the Git bare repository and"
echo "post-receive hook on your Namecheap cPanel shared hosting server,"
echo "and registers the 'production' git remote locally."
echo ""

# 1. Gather configuration
read -r -p "Enter your Namecheap cPanel username [$DEFAULT_USER]: " CPANEL_USER
CPANEL_USER="${CPANEL_USER:-$DEFAULT_USER}"

read -r -p "Enter your server hostname or IP [$DEFAULT_HOST]: " SERVER_HOST
SERVER_HOST="${SERVER_HOST:-$DEFAULT_HOST}"

read -r -p "Enter your SSH port (Namecheap uses 21098) [$DEFAULT_PORT]: " SSH_PORT
SSH_PORT="${SSH_PORT:-$DEFAULT_PORT}"

APP_ROOT="~/nrbfit.cyprian.services"
REMOTE_REPO="~/repo/nrb-fit.git"
REMOTE_GIT_URL="ssh://${CPANEL_USER}@${SERVER_HOST}:${SSH_PORT}/home/${CPANEL_USER}/repo/nrb-fit.git"

echo ""
echo "------------------------------------------------------------"
echo "Target Configuration:"
echo "  cPanel User:    $CPANEL_USER"
echo "  Server:         $SERVER_HOST:$SSH_PORT"
echo "  App Directory:  $APP_ROOT"
echo "  Bare Repo:      $REMOTE_REPO"
echo "  Remote Git URL: $REMOTE_GIT_URL"
echo "------------------------------------------------------------"
echo ""

# 2. Check SSH connection
echo "--> Testing SSH connection to ${CPANEL_USER}@${SERVER_HOST}:${SSH_PORT}..."
SSH_OPTS="-p ${SSH_PORT} -o BatchMode=yes -o ConnectTimeout=8"

CAN_SSH=false
if ssh ${SSH_OPTS} "${CPANEL_USER}@${SERVER_HOST}" "echo connected" >/dev/null 2>&1; then
  CAN_SSH=true
  echo "--> SSH connection successful!"
else
  echo "--> Direct non-interactive SSH test failed or password/key prompt required."
fi

# 3. Remote provisioning
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_FILE="${SCRIPT_DIR}/namecheap-post-receive.sh"

if [ "$CAN_SSH" = true ]; then
  echo "--> Creating remote bare git repository at ${REMOTE_REPO}..."
  ssh -p "${SSH_PORT}" "${CPANEL_USER}@${SERVER_HOST}" "mkdir -p ~/repo/nrb-fit.git/hooks && cd ~/repo/nrb-fit.git && git init --bare"

  echo "--> Uploading post-receive hook..."
  scp -P "${SSH_PORT}" "${HOOK_FILE}" "${CPANEL_USER}@${SERVER_HOST}:/home/${CPANEL_USER}/repo/nrb-fit.git/hooks/post-receive"
  ssh -p "${SSH_PORT}" "${CPANEL_USER}@${SERVER_HOST}" "chmod +x /home/${CPANEL_USER}/repo/nrb-fit.git/hooks/post-receive"
  echo "--> Post-receive hook installed and made executable!"
else
  echo ""
  echo "============================================================"
  echo " MANUAL 1-STEP SERVER SETUP (via cPanel Terminal or SSH):"
  echo "============================================================"
  echo "Log into cPanel -> Open 'Terminal' (or SSH manually), then run:"
  echo ""
  cat <<EOF
mkdir -p ~/repo/nrb-fit.git/hooks
cd ~/repo/nrb-fit.git && git init --bare
cat << 'HOOK_EOF' > ~/repo/nrb-fit.git/hooks/post-receive
$(cat "${HOOK_FILE}")
HOOK_EOF
chmod +x ~/repo/nrb-fit.git/hooks/post-receive
EOF
  echo ""
  echo "============================================================"
  echo ""
fi

# 4. Configure local git remote
echo "--> Configuring local git remote 'production'..."
if git remote | grep -q "^production$"; then
  echo "--> Remote 'production' already exists. Updating URL..."
  git remote set-url production "${REMOTE_GIT_URL}"
else
  git remote add production "${REMOTE_GIT_URL}"
fi

echo "--> Verified local git remotes:"
git remote -v

echo ""
echo "============================================================"
echo " Setup complete!"
echo "============================================================"
echo "Next steps:"
echo "1. Verify in cPanel -> 'Setup Node.js App' that:"
echo "   - App root is: nrfit.cyprian.services"
echo "   - App URL is:  nrfit.cyprian.services"
echo "   - Startup is:  app.js"
echo "   - Node version is: 20.x or 22.x"
echo "2. Add your production .env in cPanel or at ~/nrfit.cyprian.services/.env"
echo "3. Deploy anytime with:"
echo "   git push production main"
echo "============================================================"
