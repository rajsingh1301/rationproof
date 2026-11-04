# RationProof hackathon audit — 1 November 2026

Phase 1 reviewed the existing code and ran baseline checks before fixes. The user then explicitly authorized implementation. This document records the original findings, their priorities and subsequent disposition; it does not imply the unresolved runtime checks passed.

**Project:** local ration receipt / entitlement / measured collection comparison.
**Event:** Neural Storm, proposed Human Impact custom problem. Published criteria/eligibility must be confirmed with the organizer; there is no private judging rubric in this repository.
**Stack:** Python/FastAPI/Pydantic/Pillow, Apple Vision via PyObjC (local Swift adapter until 4 November) or Tesseract; React/TypeScript/Vite/Tailwind/Radix.
**Timing:** work dated 1 November, before the recorded 2 November 20:00 IST start and 4 November 20:00 IST deadline. Do not represent this as eligible event-period work.

## Product/code inventory

One product route (`/`), plus developer documentation (`/api/docs`) and health, extraction and reconciliation endpoints.

| Area | Components / files reviewed |
| --- | --- |
| Startup and theme | `main.tsx`, `theme-init.ts`, `styles.css`, `vite.config.ts`, root HTML |
| Workspace | `workspace-app.tsx`, `workspace-shell.tsx`; desktop navigation, mobile drawer, command palette, help/reset dialogs |
| Inputs | `receipt-upload.tsx`, `receipt-editor.tsx`, `monthly-context.tsx`; image/TXT upload, text dialog, human review |
| Results | `comparison.tsx`, `comparison-chart.tsx`; table, mobile rows, status, evidence, chart, JSON and print |
| Demo | `sample-dialog.tsx`, `lib/form.ts`, `static/demo-receipt.png` |
| UI primitives | Button, Input/Select/Textarea/Field, Checkbox, Card, Badge, Dialog, Table, EmptyState, ErrorState, Skeleton |
| Client logic | `lib/contracts.ts`, `lib/api.ts`, `lib/form.ts`, `lib/utils.ts` |
| Backend | `app/main.py`, `app/extraction.py`, `app/domain.py` |
| Tooling | setup/run/Finder launcher, Swift OCR, sample generator, old browser test, Python tests, package locks and vendor packages |
| Documentation | README, project instructions, development log, original UI audit |

## Priorities, effort and disposition

Estimates are engineering ranges, not promises. External runtime/access and organizer response time are excluded.

| Priority | Finding and demo consequence | Estimate | Current disposition |
| --- | --- | --- | --- |
| Critical | Actual synthetic image OCR returns 503; the central image AI path cannot be claimed working. | 2–4 hours on an unrestricted demo device; longer if replacing engine | **Open.** Added truthful runtime status, real diagnostic, and tested fallback to an installed second engine. Vision still fails here; Tesseract absent. **4 Nov: resolved on the author's Mac.** Real Vision OCR passes `doctor.py --ocr` and the browser upload flow on the synthetic fixture. Real-receipt accuracy is unmeasured. |
| Critical | Pre-event work and Swift bridge may conflict with eligibility/Python AI requirements. | 20–30 min to document; organizer response unknown | Provenance preserved in README/log/pitch. **Organizer decision still needed** for pre-event work. **4 Nov: Swift bridge removed.** OCR is now called from Python via PyObjC. No external message sent. |
| High | Ambiguous commodity/entitlement lines and Unicode signs can suggest wrong positive quantities. | 1–2 hours | Fixed: abstain on shared labels, roles, signs, repeated lines, unsafe precision/ranges; regression tests and synthetic evaluation added. |
| High | Upload/comparison responses can arrive after reset or edits and restore stale data; input edits can clear a shared busy flag. | 2–3 hours | Separate cancellable request lanes, stale response guards and timeouts. Six initial client regression tests added. Full browser concurrency verification remains pending. |
| High | Samples overwrite a user's record immediately. | 30–45 min | Replacement dialog preserves existing entries until confirmed; reset cancels pending work and releases previews. |
| High | CSP blocks runtime styles from Sonner/Vaul/theme/scroll-lock integrations. | 1–2 hours | Per-response nonce, pinned-library style injection transform, theme/scroll-lock nonce integration. HTTP nonce tests pass. **Runtime browser CSP check pending.** |
| High | Old browser smoke test references removed HTML selectors and misses the current UI. | 1–2 hours | Rewritten for current components and real API flows, print, dark/mobile, export and optional real image OCR. Syntax passes; actual execution blocked. |
| High | Duplicate receipt commodity ordering produces a false conflict. | 20–30 min | Stable sorted signature; reordered commodity regression passes. |
| High | Text dialog submit can bubble to the parent ledger form; storage denial can crash theme bootstrap. | 30–45 min | Stop portal submit propagation; guard preference storage. Browser script includes both flows; runtime verification pending. |
| High | Setup only checks imports; stale versions could pass. README includes removed JS command and missing download UI. | 1 hour | Exact dependency checks, optional OCR compile, startup doctor, real sample downloads and rewritten setup steps. Fresh network install pending. |
| Nice-to-have | Chart dependency is fetched before chart use, despite lazy import. | 30 min | Chunking fixed; build defers roughly 100.6 KB gzip. Browser fetch assertion included but not run here. |
| Nice-to-have | Print includes editing form; duplicate heading IDs and unfocusable navigation targets; desktop compare action sits below all receipts. | 1–2 hours | Report-only print styles, unique focusable headings, side context panel, crash fallback. Visual and assistive-tech review pending. |
| Nice-to-have | Main product distinction is hard to demonstrate quickly. | 1 hour | New actual-API offsetting case and explicit report callout expose per-receipt differences even when the total is zero. |
| Nice-to-have | No measured results, architecture, rehearsal script or pitch outline. | 1–2 hours | Added labelled text evaluation, Mermaid diagram, verification record, 2–3 min script and five-slide outline. Actual screenshots remain pending. |

## UI slop and content findings

The existing redesign already removed the decorative hero and text-glyph icons. There were no fake testimonials, customer statistics, placeholder logos or gradient blobs to remove in the audited version. Real issues were dense vertical workflow, low-value duplicate headings, ambiguous reader status, an easily overlooked synthetic-data state before comparison, print clutter and overstated setup instructions. Those were addressed without inventing product claims. The zinc/terracotta tokens, local font and reusable primitives were retained.

## Security and data integrity

Common hardcoded key/token patterns did not reveal a credential in the inspected tracked application source. This is not a comprehensive secret-history audit. Upload size/type checks, unknown-vs-zero semantics, mandatory review, Decimal arithmetic, local origin checks and temporary cleanup already existed. Fixes preserve these behaviors. The server remains loopback-only; public exposure needs a separate deployment, retention, request-limit and authentication design.

No database or cloud service is required, so an `.env.example` containing unused credentials would be misleading. README explicitly documents that no `.env` file is needed. Theme preference may persist; receipt data does not.

## Judges' view

**Strongest:** a concrete household workflow, no weight guesses, evidence-linked receipt comparison, partial-collection handling, duplicate protection and a 30-second example where monthly totals hide differences.

**Weakest:** actual image reading is unresolved here; no real receipt dataset, consented user validation or measured impact; novelty is not established; current pre-event eligibility is uncertain. A polished UI alone will not close these gaps.

## Deadline scope / future work

First verify actual OCR and browser behavior on the intended demo machine, then capture genuine screenshots/video. Resolve organizer eligibility before submitting. During the allowed build window, record the actual new contributions separately.

Defer PDFs, automatic entitlement extraction, multiple state templates, allocation-month arrears, hosted accounts, a grievance submission integration and new ML training. Plan a consented one-state pilot before claiming accuracy or impact. No automatic complaint is submitted and no beneficiary information is sent to third parties.
