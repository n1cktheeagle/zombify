#!/usr/bin/env bash
set -euo pipefail

# Ensure we run from repo root
cd "$(dirname "$0")/.."

# Kill anything on 3000 (both IPv4/IPv6)
if command -v lsof >/dev/null 2>&1; then
  lsof -ti tcp:3000 -sTCP:LISTEN | xargs -r kill -9 || true
fi

# Clear Next cache
rm -rf .next

# Export stable host binding to avoid ::1 issues
HOSTNAME=127.0.0.1
PORT=3000

# Start Next.js dev server
exec pnpm exec next dev --port "$PORT" --hostname "$HOSTNAME" 