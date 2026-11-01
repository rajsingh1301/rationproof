# RationProof UI audit

## Inventory before the redesign

One application page, `/`, rendered from `static/index.html`. `/api/docs` is a developer API surface and is outside this visual redesign. No additional product routes exist.

| Existing component | Source | Finding / replacement |
| --- | --- | --- |
| Header, wordmark, prototype badge | `static/index.html` | Several competing badges; simplify to a wordmark and workspace navigation. |
| Hero and promotional aside | `static/index.html` | Oversized serif headline and vague copy consume the first viewport; replace with a task heading. |
| Three-step anchor navigation | `static/index.html` | Duplicates numbered headings; replace with compact workspace navigation. |
| Demo selector and banner | HTML / `static/app.js` | Fictional records are correctly labelled, but sample controls dominate; keep them behind an explicit sample dialog. |
| Upload/drop zone, reader status, text entry | HTML / JS | Text glyph icons, small alternate actions, unstructured error/status messages; use Lucide, clear labels and dedicated pending/error states. |
| Receipt editor and commodity lines | `static/app.js` | Template-string markup, inconsistent controls, browser-only validation; componentize with inline field errors. |
| Original evidence and confirmation | `static/app.js` | Small disclosure target and dense text; preserve mandatory review with accessible evidence detail. |
| Monthly entitlement/context form | HTML / JS | Mixed font sizes and padding; create reusable fields with consistent focus/error treatment. |
| Comparison status and metric cards | `static/app.js` | Repeated cards and symbolic status icons; use a readable comparison table and receipt evidence. |
| Report download / print | `static/app.js` | Small pill targets; use shared buttons and preserve export content. |
| Footer / clear record | `static/index.html` | Decorative tagline and immediate destructive clear; replace with quiet privacy text and a reset confirmation. |

## Cross-cutting issues

- CSS uses many arbitrary sizes, radii (3–30px), font weights and 9–11px text.
- Unicode arrows/checkmarks/document symbols act as icons. There are no gradient blobs, fake testimonials or invented customer statistics to remove.
- The oversized hero, excessive step labels and promotional copy obscure the receipt workflow.
- Loading states rely on a generic message/opacity rather than skeletons. Errors are detached from the fields that caused them.
- Several controls are below 40px; reduced motion, dark theme and a coherent focus system are missing.
- No frontend typecheck/lint/build pipeline or reusable component boundary.

## Design system, defined before screen work

- Zinc neutral scale, one terracotta accent; distinct success/warning/danger colors only for state.
- Light and dark tokens; Geist (or one locally available distinctive sans family), weights 400 and 600.
- Type: 12, 14, 16, 20, 24, 32px. Spacing: multiples of 4px. Corner radius: 8px. One shadow, reserved for overlays. The npm registry is blocked in this environment and Geist was unavailable in cache, so Lexend 400/600 is the single local font family.
- Shared Button, Input, Card, Badge, Dialog, Table, EmptyState, Skeleton and form-field primitives.
- One primary workspace action: compare records. Secondary upload/edit/export actions remain neutral.
- 200ms ease-out feedback; honor reduced motion. Focus visibility, labelled controls, keyboard-operable dialogs, responsive tables and minimum 40px touch targets.
- Samples remain opt-in and explicitly synthetic. No receipt persistence; only the theme preference may persist.

## Redesign status

Implemented with React, TypeScript, Vite and Tailwind v4. Shared shadcn-style Radix primitives are configured in `components.json` and `frontend/components/ui/`. The `shadcn init` CLI could not fetch its preset from the blocked registry; the documented manual Vite installation is reflected in the existing code rather than pulling an unverified preset. Frontend lint, typecheck and production build pass; the existing 32 API/domain tests pass. Browser-based review is unavailable in this managed local environment because loopback and browser process startup are denied. See `DEVELOPMENT_LOG.md`.

## Scope guard

Preserve `app/domain.py`, `app/extraction.py` and API route contracts. Keep receipt confirmation, duplicate checks, null quantities, partial collection, report data and demo semantics. Changes are frontend presentation, client-side validation, tooling and documentation only.
