"""Check the installed local app without binding a port or storing documents."""
import argparse
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dependencies-only', action='store_true')
    parser.add_argument('--ocr', action='store_true', help='Actually read the labelled synthetic sample image')
    args = parser.parse_args()
    failures = []
    for requirement in (ROOT / 'requirements.txt').read_text().splitlines():
        if not requirement.strip() or requirement.startswith('#'):
            continue
        name, expected = requirement.split('==')
        try:
            installed = version(name)
        except PackageNotFoundError:
            installed = 'missing'
        if installed != expected:
            failures.append(f'{name}: expected {expected}, found {installed}')
    if failures:
        print('\n'.join(failures))
        print('Run .venv/bin/python -m pip install -r requirements.txt')
        return 1
    print('PASS: pinned Python dependencies')
    if args.dependencies_only:
        return 0
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    html = (ROOT / 'static' / 'index.html').read_text()
    assets = re.findall(r'(?:src|href)="(/static/assets/[^\"]+)"', html)
    missing = [asset for asset in assets if not (ROOT / asset.lstrip('/')).is_file()]
    if not assets or missing or '__RATIONPROOF_NONCE__' not in html:
        print('FAIL: frontend build missing or stale. Run npm ci && npm run build.')
        return 1
    page = client.get('/')
    assert page.status_code == 200 and '__RATIONPROOF_NONCE__' not in page.text
    assert all(client.get(asset).status_code == 200 for asset in assets)
    print(f'PASS: page and {len(assets)} frontend assets (in-process HTTP)')
    health = client.get('/api/health').json()
    print(f'OCR candidate: {health["ocr"] or "not installed"}; runtime: {health["ocr_runtime"]["state"]}')
    result = client.post('/api/extract-text', json={'text': (ROOT / 'static' / 'demo-receipt.txt').read_text()})
    assert result.status_code == 200 and result.json()['items'][0]['issued_kg'] == '25'
    print('PASS: actual text extraction endpoint; suggestions remain unconfirmed')
    if args.ocr:
        image = (ROOT / 'static' / 'demo-receipt.png').read_bytes()
        result = client.post('/api/extract', files={'file': ('demo-receipt.png', image, 'image/png')})
        if result.status_code != 200:
            print(f'FAIL: actual image OCR returned HTTP {result.status_code}: {result.json()["detail"]}')
            return 1
        items = result.json()['items']
        if not any(item['commodity'] == 'rice' and item['issued_kg'] == '25' for item in items):
            print('FAIL: image read completed but did not suggest the expected 25 kg rice field. Review OCR output locally.')
            return 1
        print(f'PASS: actual synthetic image OCR via {result.json()["engine"]}. Real receipt accuracy is unmeasured.')
    print('This check does not verify browser rendering or permission to bind localhost. Start scripts/run.sh next.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
