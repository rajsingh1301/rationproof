# Five-slide pitch outline

## 1. One monthly total can hide two receipt differences

Show the synthetic 10→5 kg and 10→15 kg example. Both totals equal 20 kg; both receipts need review. Label it synthetic. Describe the intended user: a household member or trusted volunteer who has receipts and a measured collection quantity. No claim of observed incidence or market validation.

## 2. A reviewable comparison, with missing values left unknown

Show the flow: add receipt → review suggested fields → enter measured weight and entitlement → inspect each difference. Show the distinction between a balance, a receipt difference and missing measurement. Use an actual screenshot after a successful browser run; screenshots remain pending today.

## 3. Local OCR assistance, deterministic decisions

Use the Mermaid diagram in README. Pretrained Vision/Tesseract provides text; conservative Python parsing produces unconfirmed suggestions; Pydantic and Decimal compute reviewed comparisons. Source text stays linked to each receipt. JSON export is explicit; no remote document API is required. Actual image runtime currently fails on the managed development device—report that if still unresolved.

## 4. What we have measured—and what we have not

Show 41 passing Python tests and 7 frontend tests. State the synthetic text evaluation precisely: 22 curated cases, 8 correct suggestions, 15 correct abstentions; no unsafe suggestions on that fixture set. These are development regression cases, not held-out OCR accuracy. Browser, real receipt evaluation and beneficiary impact remain unverified. Do not claim families served, money saved or accuracy percentages on real documents.

## 5. A focused pilot and next milestone

Propose—not claim completed—3–5 consented interviews and 30–50 redacted receipts from one state. Measure field corrections per receipt, completion time, false difference alerts and understanding of “balance” versus “difference.” Future work: actual-device OCR reliability, allocation-month handling and PDFs. Explain the initial/pre-event contribution and get organizer clarification on eligibility before submission.

## Positioning

The contribution is receipt-level reconciliation with evidence and conservative uncertainty handling. Adjacent government services already exist; do not call the product “world first.” Proposed Neural Storm track: Human Impact. Winning and eligibility are not guaranteed by this implementation.
