# Working on RationProof

Read `PROJECT_INSTRUCTIONS.md` and `DEVELOPMENT_LOG.md` first. The user authorized starting and developing this project locally without repeated confirmation.

- Preserve pre-event provenance. Never claim all code was written within the hackathon window.
- Use Python for validation, OCR orchestration and arithmetic. Do not use LLM-generated numbers for report totals.
- Missing is not zero. A monthly balance is not a proven shortage. User-reported measurements are not independent evidence of delivery.
- Preserve per-receipt differences and distinguish duplicate/conflicting/out-of-month/unreviewed records.
- Keep actual uploads out of Git, logs and persistent storage. Synthetic examples must be labelled.
- Keep the app usable without external credentials. Do not silently send documents to a cloud provider.
- Test changes to extraction, duplicate handling and comparison rules with `python -m unittest discover -s tests -v`.
- For UI changes, run the browser smoke test when Playwright is available; record verification limits honestly.
- Update the implementation status and next steps. Do not claim user research or OCR accuracy that has not been measured.
