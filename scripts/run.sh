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
.venv/bin/python - <<'PY'
from pathlib import Path
import re
import sys
html = Path('static/index.html').read_text()
assets = re.findall(r'(?:src|href)="(/static/assets/[^\"]+)"', html)
if not assets or any(not Path(asset.lstrip('/')).is_file() for asset in assets):
    print('Frontend assets do not match the page. Run npm ci && npm run build.', file=sys.stderr)
    raise SystemExit(1)
PY
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8765
