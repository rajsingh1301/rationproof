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
