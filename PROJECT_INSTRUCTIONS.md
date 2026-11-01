# RationProof — project instructions

Owner brief (1 November 2026): create this project under `~/developer`, document its instructions, and start implementing it autonomously. The intended hackathon is Neural Storm. Keep work local unless publishing is subsequently requested.

## Purpose

Help a household or a trusted community volunteer compare three records: the household's entered monthly entitlement, quantities recorded on ration receipts, and quantities the user says they actually measured. Produce an understandable, evidence-linked discrepancy report. A report is a question for verification, not a fraud accusation, entitlement certification, or proof of physical delivery.

Working pitch: **Aapke ration ka saaf hisaab — jo milna tha, jo receipt mein hai, jo ghar aaya.**

## Hackathon fit and provenance

- Proposed track: **Human Impact**, with a custom problem. The published Devpost rules permit a specific problem within a track. Acceptance of this exact idea has not been confirmed by organizers.
- The previously researched build/submission window is **2 November 2026, 20:00 IST to 4 November 2026, 20:00 IST**. Registration closes 2 November at 20:00 IST.
- **This repository's initial implementation was started on 1 November, before that window, at the user's request.** Preserve that history. Do not represent this code as created entirely during the event, backdate commits, or claim eligibility without checking organizers' treatment of pre-event work. Record actual new contributions made during the event separately in `DEVELOPMENT_LOG.md`.
- Python is required for AI/ML components. This prototype uses Python to orchestrate local OCR, parse and validate fields, and compute the report; on macOS a small Swift adapter invokes Apple's pretrained Vision OCR. Whether this adapter meets organizers' interpretation should be checked before submission. A Python-native OCR integration can replace it without changing the report engine.
- Public GitHub source, README, screenshots/GIF and meaningful results are required by the listing. AI coding tools must be disclosed. Live demo is recommended. One submission per team; team size 1–3.
- Devpost and Unstop both list the event. Do not assume both submissions are required. Resolve the route through the registered platform's instructions. Results dates differ between sources (7 versus 9 November).
- Novelty is **not proven**. The proposed contribution is receipt-level comparison, duplicate handling, incomplete evidence handling, and understandable export for the household. Mera Ration and Anna Sahayata already provide adjacent services. Do not claim “world first”.

## MVP acceptance criteria

1. A user can run the app locally with documented commands.
2. A PNG/JPG/WebP receipt can be read through local OCR; text and manual entry work independently of OCR.
3. Every extraction is explicitly unconfirmed. The user reviews date, transaction number, commodity and recorded quantity before inclusion in totals.
4. “Received” is manually entered from a real measurement; never infer weight from a bag photo or copy the receipt's quantity into this field.
5. Unknown values remain unknown. A blank received amount is not zero.
6. Re-uploaded documents and repeated transactions do not inflate totals. Conflicting duplicates trigger review.
7. Receipts outside the selected month are excluded and explained. Version 0.1 uses **transaction date**, not allocation month; arrears/backdated allocations need manual review and are not supported automatically.
8. Partial collection leaves a monthly balance. It is not automatically called a shortage.
9. Receipt-level differences remain visible even when positive and negative differences cancel in the monthly total.
10. The report includes the source text, user inputs, month, timestamp and a synthetic-data label when applicable. Download as JSON and print/save PDF.

## Scope and UX

- Local desktop/mobile browser interface served by FastAPI. No authentication, analytics, remote fonts or remote document API.
- Initial commodities: rice and wheat; quantities in kg with up to three decimal places.
- Initial automatic receipt extraction: English printed receipts with explicit ISO date and a single unit-bearing quantity per commodity line. Hindi commodity aliases/Devanagari digits work in the text parser; **Hindi image OCR is not verified**. Never advertise full Hindi image support yet.
- The parser is deterministic. The actual ML feature is the pretrained OCR engine. Do not label string matching as a newly trained model.
- Multi-column receipts, unsupported commodities, blurred scans and unknown units require manual review. PDF ingestion and automatic entitlement screenshot extraction are follow-up work.
- Entitlement is entered by the user from their official monthly record; **no current policy is inferred** from household size/category. Zero and unknown are distinct.
- No personally identifying household information is needed for the demo. Use synthetic fixtures, or consented and redacted documents for later evaluation. Do not commit real beneficiary records.
- Temporary images must be removed after OCR. No persistent server ledger, browser localStorage, or hidden uploads. Reloading clears work; the explicit report download preserves it.
- Keep language approachable: Hindi in Latin script plus clear English labels. Treat partial collection, unknown evidence, and user-reported measurements accurately.

## Technical map

- `app/domain.py`: validated inputs and deterministic decimal arithmetic.
- `app/extraction.py`: local OCR adapter and conservative field suggestions.
- `app/main.py`: FastAPI routes and local web serving.
- `scripts/vision_ocr.swift`: macOS pretrained OCR adapter; build output ignored under `.cache/`.
- `static/`: the compiled browser app and sample receipt served by FastAPI.
- `frontend/`: TypeScript + React redesign, Tailwind design tokens, reusable Radix/shadcn-style primitives, forms and report components. `npm run build` emits the app under `static/` for FastAPI to serve.
- `tests/`: domain, extraction and HTTP regression tests using Python unittest.
- `scripts/browser_check.cjs`: browser flow verification using an available Playwright installation.

## Development order

1. Working local upload → review → comparison → export flow. **Text/manual path implemented; image runtime acceptance is still pending.**
2. Regression coverage for missing quantities, month filtering, duplicates and partial collection. **Implemented.**
3. Validate actual local image extraction and browser flow. **Pending:** OCR adapter compiles, but the sample image call fails in the current environment; local server/browser startup is restricted. See the development log. Text/manual backend checks pass.
4. Collect 3–5 consented interviews with cardholders/community volunteers. Validate whether receipts are available, whether users can weigh grain, and whether this workflow helps them. Do not claim user validation beforehand.
5. Add a chosen state's real receipt format using redacted examples, allocation-month support, and entitlement document extraction.
6. Evaluate 30–50 labelled clear/noisy/ambiguous receipts; separate synthetic and real results. Report field accuracy, false discrepancy alerts, abstentions and latency. Compare with an OCR-only baseline.
7. Add deployment only after selecting hosting and an appropriate document-retention model; the current loopback-only server is a development prototype.

## Sources checked during planning

- https://neuralstorm.devpost.com/rules
- https://neuralstorm.devpost.com/resources
- https://neuralstorm.devpost.com/details/dates
- https://neuralstorm.dev/
- https://unstop.com/hackathons/neural-storm-jawaharlal-nehru-technological-university-jntuh-hyderabad-1769404/amp
- https://dfpd.gov.in/distribution-of-food-grains/en — Mera Ration's adjacent features.
- https://sansad.in/getFile/loksabhaquestions/annex/187/AU5456_9otP3f.pdf?source=pqals — government description of Mera Ration / Anna Sahayata.
- https://developer.apple.com/documentation/vision/recognizing-text-in-images
- https://fastapi.tiangolo.com/tutorial/request-files/

Published event details may change. Preserve the distinction between observed facts, our proposed product behavior and measured implementation results.
