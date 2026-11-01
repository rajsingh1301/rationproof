#!/bin/bash
# Double-click in Finder to run in the user's normal Terminal session.
set -u
cd "$(dirname "$0")" || exit 1

if [ ! -x .venv/bin/python ]; then
  if ! bash scripts/setup.sh; then
    printf '\nSetup failed. The error is shown above.\n'
    read -r -p 'Press Enter to close… ' _
    exit 1
  fi
fi

if [ ! -f static/index.html ] || [ ! -d static/assets ]; then
  printf 'Building the frontend…\n'
  npm ci --no-audit --no-fund && npm run build || { printf '\nFrontend setup failed. Check the error above.\n'; read -r -p 'Press Enter to close… ' _; exit 1; }
fi
printf '\nStarting RationProof at http://127.0.0.1:8765\n'
printf 'Keep this Terminal window open. Press Ctrl+C to stop the app.\n\n'

# Open the browser only after this project's API and page are responding.
# This helper is stopped when the server exits; no background service is installed.
.venv/bin/python - <<'PY' &
import json
import time
import urllib.request
import webbrowser

base = 'http://127.0.0.1:8765'
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
for _ in range(40):
    try:
        with opener.open(base + '/api/health', timeout=1) as response:
            health = json.load(response)
        with opener.open(base, timeout=1) as response:
            page = response.read(4096)
        if health.get('status') == 'ok' and b'<title>RationProof' in page:
            webbrowser.open(base)
            break
    except (OSError, ValueError):
        pass
    time.sleep(0.5)
PY
RATIONPROOF_WATCHER_PID=$!
trap 'kill "$RATIONPROOF_WATCHER_PID" 2>/dev/null || true' EXIT

bash scripts/run.sh
RATIONPROOF_EXIT_STATUS=$?
kill "$RATIONPROOF_WATCHER_PID" 2>/dev/null || true
wait "$RATIONPROOF_WATCHER_PID" 2>/dev/null || true
trap - EXIT

if [ "$RATIONPROOF_EXIT_STATUS" -ne 0 ] && [ "$RATIONPROOF_EXIT_STATUS" -ne 130 ]; then
  printf '\nThe server did not start. Check the error above.\n'
  printf 'If the address is already in use, an existing app may be running on port 8765.\n'
  printf 'If you see operation not permitted, run this file directly from Finder or Terminal.\n'
  read -r -p 'Press Enter to close… ' _
fi
exit "$RATIONPROOF_EXIT_STATUS"
