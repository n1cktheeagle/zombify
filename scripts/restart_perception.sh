#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pkill -f 'uvicorn.*perception.main:app' || true
if [[ -d .venv ]]; then
  source .venv/bin/activate
fi
GOOGLE_APPLICATION_CREDENTIALS="$HOME/.secrets/zombify/vision-key.json" \
OCR_BACKEND=google CACHE_DIR=.perception_cache \
python -m uvicorn perception.main:app --host 127.0.0.1 --port 8090 --log-level debug

#!/usr/bin/env bash
set -euo pipefail

# Defaults (override by exporting before calling)
UVICORN_HOST="${UVICORN_HOST:-127.0.0.1}"
UVICORN_PORT="${UVICORN_PORT:-8090}"
CACHE_DIR="${CACHE_DIR:-.perception_cache}"
OCR_BACKEND_ENV="${OCR_BACKEND:-google}"
GAC_DEFAULT_PATH="${HOME}/.secrets/zombify/vision-key.json"
GOOGLE_APPLICATION_CREDENTIALS_ENV="${GOOGLE_APPLICATION_CREDENTIALS:-$GAC_DEFAULT_PATH}"

echo "Restarting perception service..."
pkill -f 'uvicorn.*perception.main:app' || true

if [ -f .venv/bin/activate ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

mkdir -p "${CACHE_DIR}"

echo "GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS_ENV} (exists=$( [ -f "${GOOGLE_APPLICATION_CREDENTIALS_ENV}" ] && echo yes || echo no ))"
echo "OCR_BACKEND=${OCR_BACKEND_ENV}"

GOOGLE_APPLICATION_CREDENTIALS="${GOOGLE_APPLICATION_CREDENTIALS_ENV}" \
OCR_BACKEND="${OCR_BACKEND_ENV}" \
CACHE_DIR="${CACHE_DIR}" \
python -m uvicorn perception.main:app --host "${UVICORN_HOST}" --port "${UVICORN_PORT}" --log-level debug


