#!/usr/bin/env bash
#
# KR Fuels deploy script for the Greentree VPS (jailed `krfuels` user, no sudo).
# Run it from an SSH session after the one-time setup in deploy/README.md is done.
#
#   ./deploy/deploy.sh
#
# It pulls the latest branch, installs deps, builds all three Next.js apps, and
# hot-reloads the PM2 processes. .env.local files persist on the server (they are
# gitignored) and are NOT touched here.

set -euo pipefail

cd "$(dirname "$0")/.."   # repo root
echo "==> Repo: $(pwd)"

echo "==> Pulling latest ..."
git pull --ff-only

echo "==> Installing dependencies (frozen lockfile) ..."
pnpm install --frozen-lockfile

echo "==> Building all apps ..."
pnpm build
# If the 8 GB box runs out of memory building three apps in parallel, build them
# one at a time instead by replacing the line above with:
#   pnpm exec turbo run build --concurrency=1

echo "==> Reloading PM2 processes ..."
pm2 startOrReload deploy/ecosystem.config.js --update-env
pm2 save

echo "==> Done. Status:"
pm2 status
