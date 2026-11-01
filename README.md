# RationProof

**Aapke ration ka saaf hisaab.** A local prototype for comparing ration receipts with user-entered entitlement and measured collection quantities.

## Run

Requires Python 3.11+; macOS image reading also needs the installed Xcode command line tools.

**On this Mac:** in Finder, double-click `Start RationProof.command`. It starts the server in Terminal and opens the browser after the app responds. Keep that Terminal window open while using the app. The localhost link works only while the server is running.

After the frontend redesign, first run `bash scripts/setup.sh`, then `bash scripts/run.sh`. Setup installs locked frontend dependencies and builds the app into `static/`. For frontend work, use a second terminal and run `npm run dev -- --open`; its `/api` calls proxy to the FastAPI server. The frontend uses React, TypeScript, Vite, Tailwind CSS v4 and Radix primitives; the FastAPI API and validated receipt calculations remain in place.

```sh
cd /Users/mayankraj/developer/rationproof
bash scripts/setup.sh
bash scripts/run.sh
```

Open **http://127.0.0.1:8765**. Stop with Ctrl+C.

If the page does not load, run the command above in the Mac's normal Terminal and check its output. This agent's managed execution environment currently blocks local server startup with `operation not permitted`; the server is not running automatically in the background.

The setup script creates `.venv` with access to installed system packages and installs missing requirements when necessary. For a fully isolated Python environment instead:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
bash scripts/setup.sh
```

On macOS, setup compiles a local Apple Vision OCR adapter. On other systems, installing `tesseract` with English language data enables the alternative OCR path. Without OCR, receipt text/manual entry and the comparison engine work normally. No API key is needed.

## Try it

Use one of the sample buttons:

- **5 kg difference:** a synthetic receipt records 25 kg; the user reports 20 kg.
- **Partial collection:** 15 kg recorded and received against a 25 kg entered entitlement. This leaves 10 kg to check/collect, with no reported delivery difference.
- **Missing details:** received quantity is absent, so the app asks for more evidence.

For actual image extraction, download the sample receipt from the upload card and upload it again. Check its fields, enter your measured amount, confirm the receipt and compare. Samples are fictional and explicitly labelled.

Add multiple receipts to a monthly record. Each receipt must be reviewed; changing an input revokes confirmation. Use the report buttons to download JSON or print/save PDF. Reloading the page clears entries; only an explicitly downloaded report is retained.

## Verification

Current result: **32 Python tests pass** and JavaScript syntax checks pass. Browser verification is pending because this managed session cannot start a local listening server or Chromium. The Apple Vision adapter compiles, but sample-image recognition returned a runtime error in this environment; image extraction has not yet passed an end-to-end check. Text/manual processing and comparison are covered by passing API tests. See `DEVELOPMENT_LOG.md` for the exact limits.

```sh
.venv/bin/python -m unittest discover -s tests -v
node --check static/app.js
```

Optional browser smoke test (server running, Playwright and Chromium installed):

```sh
node scripts/browser_check.cjs
```

For an already installed Playwright package, set `RATIONPROOF_PLAYWRIGHT` to its absolute directory. Screenshots and logs go to ignored `artifacts/`. No browser dependencies are needed to run the app.

## Implemented

- Responsive interface, local image OCR, pasted text and manual receipts.
- Mandatory human confirmation; missing and ambiguous values stay unknown.
- Decimal arithmetic; duplicate and date filtering; separate per-receipt and monthly comparisons.
- Evidence text and original-image preview, synthetic demos, report export and print.
- Local requests only, no persistent uploaded files or browser storage.

## Current limits

Version 0.1 is an initial prototype. Automatic parsing supports English single-line commodity/quantity records, ISO dates, rice/wheat and kg/g units. It deliberately abstains on multi-quantity lines. Multi-column tables may need full manual entry. Hindi image OCR, arbitrary receipt layouts, PDF input, automatic entitlement scanning, allocation-month/arrears handling, verified government integration and production hosting are not implemented. Exact transaction IDs and file hashes catch many duplicates; different images with absent/incorrect IDs may evade deduplication. Real-world receipt accuracy and user impact are unmeasured.

The comparison uses uploaded/user-reviewed data and user-reported weight. It cannot establish official entitlement, authenticate documents, independently measure grain, or prove fraud. The device's local OCR service may use temporary OS caches; the application removes its own temporary image after processing.

## Project instructions and event history

See [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) for the brief, assumptions, event sources, acceptance criteria and roadmap, and [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) for completed work.

Initial code was developed **1 November 2026**, before Neural Storm's published 2–4 November build window. Eligibility of pre-event work is unresolved; preserve and disclose this history. AI assistance: OpenAI Codex generated and reviewed the initial code, documentation and tests. Apple Vision is the pretrained image OCR engine on macOS; field parsing and arithmetic are deterministic Python.
