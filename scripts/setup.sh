#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11 or later is required"'
if ! command -v npm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  printf 'Install Node.js 20+ and npm, then rerun setup.\n' >&2
  exit 1
fi
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.error("Node.js 20+ is required"); process.exit(1); }'
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi
if ! .venv/bin/python scripts/doctor.py --dependencies-only >/dev/null 2>&1; then
  .venv/bin/python -m pip install -r requirements.txt
fi
if [ "$(uname -s)" = Darwin ] && command -v swiftc >/dev/null 2>&1; then
  mkdir -p .cache/swift
  if ! swiftc -module-cache-path .cache/swift scripts/vision_ocr.swift -o .cache/vision-ocr; then
    printf 'Optional Apple Vision adapter did not compile. Text/manual entry remains available.\n' >&2
  fi
fi
npm ci --no-audit --no-fund
npm run build
.venv/bin/python scripts/doctor.py
printf 'Ready. Start with: bash scripts/run.sh\n'
