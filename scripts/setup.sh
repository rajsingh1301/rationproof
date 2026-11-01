#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -x .venv/bin/python ]; then
  python3 -m venv --system-site-packages .venv
fi
if ! .venv/bin/python -c 'import fastapi, uvicorn, PIL, multipart, httpx' >/dev/null 2>&1; then
  .venv/bin/python -m pip install -r requirements.txt
fi
if [ "$(uname -s)" = Darwin ] && command -v swiftc >/dev/null 2>&1; then
  mkdir -p .cache/swift
  swiftc -module-cache-path .cache/swift scripts/vision_ocr.swift -o .cache/vision-ocr
fi
if command -v npm >/dev/null 2>&1; then
  npm ci --no-audit --no-fund
  npm run build
else
  printf 'Node.js and npm are required for the redesigned frontend.\n' >&2
  exit 1
fi
printf 'Ready. Start with: bash scripts/run.sh\n'
