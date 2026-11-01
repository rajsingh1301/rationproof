# Development log

## 2026-11-01 — pre-event prototype

User requested a local project folder, written instructions, and implementation. Created `~/developer/rationproof`. Initial code predates Neural Storm's announced build period and must be disclosed.

Implemented the Python FastAPI backend, local OCR adapter, conservative receipt parser, validated decimal reconciliation, responsive browser interface, synthetic demo flows, human field review, JSON report export and printable comparison.

AI assistance: OpenAI Codex. No hackathon registration or external publication performed.

Verification on 1 November:

- **32 Python tests passed**: quantity validation, Hindi text digits/units, partial collection, unknown values, duplicate/conflicting receipts, month filtering, receipt-level differences, API validation and upload limits.
- JavaScript syntax checks passed for the app and browser smoke script.
- Python environment created; macOS Swift OCR adapter compiled successfully; synthetic sample receipt generated.
- **Image OCR runtime is not verified**: the local Vision invocation on the synthetic image failed with `Foundation._GenericObjCError` code 0. The cause is unresolved. The UI says the reader is installed, not that successful recognition is guaranteed; text/manual entry remains available.
- **Browser/end-to-end verification is pending**: this managed execution environment denied binding `127.0.0.1:8765` (`operation not permitted`) and denied Chromium's Mach port registration. No live preview or screenshots were produced. The saved browser smoke script can be run from a normal local terminal after the server and OCR are working. No server is left running.
- No user interviews or real-beneficiary dataset evaluation have been performed. The synthetic fixture does not establish real receipt accuracy.

Next: validate on consented/redacted receipts from one state, support allocation month and PDF/entitlement extraction, and resolve pre-event eligibility with organizers before making a submission claim.

## 2026-11-01 — local startup follow-up

User reported that the page would not load. Confirmed no listener on port 8765 and a refused HTTP connection. Retrying the run script reached application startup, then this managed environment rejected the loopback bind with `operation not permitted`. This is a server-startup restriction; no live page was available.

Added an executable `Start RationProof.command` for Finder/normal Terminal. It starts the existing run script, waits for a matching healthy API/page before opening the browser, and keeps startup errors visible. README now explicitly states that the Terminal window must stay open. Shell syntax and the embedded Python helper were checked; live server/browser startup remains unverified here. No background service was installed.

## 2026-11-01 — audit and authorized reliability/demo work (pre-event)

After the Phase 1 findings, the user explicitly authorized fixes without further permission. Preserved the original code history and pre-event disclosure. No new dependency was added during this reliability pass.

Phase 2 changes:

- Conservative parser now abstains on shared commodity labels, entitlement/balance roles, Unicode/signed quantities, repeated lines and unsupported precision/ranges.
- Duplicate matching ignores commodity line order. Upload and comparison requests have separate cancellation/version guards; resets/edits cannot reapply a stale result. Sample replacement asks before deleting an existing record.
- Nonce-based CSP supports pinned Sonner/Vaul styles, theme and Radix scroll-lock without adding `unsafe-inline`. Theme preference failures no longer abort bootstrap. Text dialog submit stops propagation to the parent form.
- OCR runtime health distinguishes unverified, ready, failed and not-installed. Available readers are tried in sequence, with cleanup/failure tests; no fixture text is used as an OCR fallback. Actual Vision still fails here.
- Report-only print styling, focusable unique headings, desktop side context panel, render failure fallback, and lazily downloaded chart. Reader/sample labels avoid unsupported success claims.
- Setup validates pinned Python versions, supports text/manual mode after optional OCR compilation failure, and includes an in-process diagnostic plus optional actual OCR check. Browser smoke test rewritten for the current React UI.

Phase 3 changes:

- A fourth, labelled synthetic case demonstrates two receipt differences cancelling to a matching monthly total. The UI exposes the backend's existing per-receipt evidence; no invented report or alternate arithmetic engine.
- Added sample TXT download, sharp README, Mermaid architecture, honest verification record, 22-case synthetic text evaluation, 2–3 minute demo script and five-slide pitch outline.
- Meaningful tests pass: 41 Python tests and 7 frontend tests; lint/typecheck/build pass. Synthetic parser evaluation: 8 correct suggestions, 15 correct abstentions; naive first-quantity baseline emits 14 unsafe suggestions on this developer-authored set. This is not held-out OCR accuracy or real-world validation.

Remaining verification:

- `bash scripts/run.sh` still fails at localhost bind with `operation not permitted`; no server left running.
- Latest browser attempt cannot find the matching Playwright Chromium headless executable. Prior managed Chromium startup also failed. No new screenshots or browser-pass claim.
- Actual `doctor.py --ocr` returns HTTP 503. Tesseract is absent. Need a normal-device OCR and browser run, genuine demo capture, and organizer clarification on eligibility/Swift bridge.
- Existing dependency versions were checked. A fresh network-backed setup and real beneficiary pilot have not been completed.

The GitHub origin is configured. New work is being recorded as separate logical local commits; publication status is reported separately, not assumed from the presence of a remote.
