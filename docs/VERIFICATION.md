# Verification record — 1 November 2026

## Passed

- `npm run check`: ESLint, TypeScript, 7 Node regression tests and production Vite build.
- `.venv/bin/python -m unittest discover -s tests -v`: 41 tests covering domain validation, extraction, duplicate ordering, receipt cancellation in totals, HTTP flow, CSP nonce response generation and mocked OCR failure/fallback/cleanup.
- `.venv/bin/python scripts/doctor.py`: exact Python package versions, built page/assets through FastAPI TestClient, and actual text extraction endpoint.
- `.venv/bin/python scripts/evaluate.py docs/evaluation.json`: 22 curated synthetic text cases match their labels. Eight non-null fields are suggested correctly; 15 fields are correctly left unknown. The illustrative first-quantity baseline emits 14 unsafe suggestions. “Unsafe” means a non-null quantity contrary to the fixture label.
- Sample data schema validation, null/zero distinctions, invalid dates and quantities, request cancellation/version guards, and omission of browser-only fields from API payloads.
- Chart chunk is absent from initial HTML modulepreloads after removing the shared chart vendor chunk; approximately 100.6 KB gzip is deferred until opening Chart, according to the local build. This is a build artifact measurement, not a browser performance benchmark.

## Failed or not established

| Check | Observed result | Required next verification |
| --- | --- | --- |
| Actual image extraction | `doctor.py --ocr` returns HTTP 503. Apple Vision adapter compiles but invocation fails. Tesseract absent. | Run on normal demo device; diagnose Vision or install a working local Tesseract reader. Do not replace OCR results with fixture text. |
| Local listener | `scripts/run.sh` reaches app startup, then bind to `127.0.0.1:8765` fails with `operation not permitted`. | Run in the Mac's normal Terminal. |
| Browser integration | Playwright package exists, matching Chromium headless executable missing in latest attempt. Earlier Chromium launch also failed with managed-process permissions. | Install/match the browser outside this restricted session and run `scripts/browser_check.cjs` with server running. |
| UI review | No successful browser session or new screenshots. | Verify 320/390/768px layouts, light/dark contrast, focus, mobile drawer, chart, print and runtime CSP. The smoke script checks these flows but is not a substitute for visual review. |
| Fresh install | Existing pinned environment checked; network-backed fresh install not repeated. | Run `scripts/setup.sh` in a fresh checkout with registry access. |
| Real-world impact | No beneficiary data or interviews collected. | Consented, redacted receipts and user interviews. |

## Evaluation methodology

`tests/fixtures/extraction-cases.json` is a small, developer-authored synthetic regression set. Labels say which quantities can safely be suggested without guessing. It covers explicit kg/g values, Hindi text digits, unknown units, shared commodity labels, entitlement/balance labels, signs, repeated lines and unsupported precision/ranges.

The baseline deliberately selects the first explicit unit-bearing number per commodity line. It is an explanatory reference implementation in `scripts/evaluate.py`, not a claimed result for any competing model or product. Case counts and per-case outputs are recorded in `evaluation.json`. The fixture set was used during development, so the results cannot be generalized to unseen receipts. Neither evaluator uses image OCR.

The suite distinguishes test doubles from real processing: OCR subprocess tests are mocked; text extraction and reconciliation in API tests run the actual application code in-process. Browser and image failures are not counted as passes.
