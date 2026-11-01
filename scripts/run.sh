#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -x .venv/bin/python ]; then
  printf 'Run bash scripts/setup.sh first.\n'
  exit 1
fi
if [ ! -f static/index.html ] || [ ! -d static/assets ]; then
  printf 'Build the frontend first: npm ci && npm run build (or bash scripts/setup.sh).\n' >&2
  exit 1
fi
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8765
