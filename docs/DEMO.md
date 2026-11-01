# Demo script — about 2 minutes 30 seconds

## Rehearsal

1. From a normal Terminal run `bash scripts/run.sh`; keep the window open. Run `scripts/doctor.py` and the browser smoke test beforehand.
2. Use a clean browser tab at `http://127.0.0.1:8765`. Confirm the UI renders and Sample cases loads a report through the server.
3. Only demonstrate image recognition if `.venv/bin/python scripts/doctor.py --ocr` succeeds on that device. Image OCR currently fails in the managed development environment.
4. Use the labelled synthetic fixtures only. Do not insert a real household's identifiers into a public recording.

## 0:00–0:25 — problem

“Ek monthly total poori kahani nahi batata. Receipt mein kitna likha hai, ghar par kitna measure hua, aur allowance ka kitna balance hai—ye teen alag cheezein hain. RationProof inhe ek reviewable record mein dikhata hai.”

Explain that received weight and entitlement are entered by the user; the app is not a weighing device or a government entitlement service.

## 0:25–0:55 — the 30-second moment

Open **Sample cases → Load offsetting case**.

“Yahan receipts ka total 20 kg hai. Reported collection bhi 20 kg. Sirf total compare karein to sab theek lagega. Lekin pehli receipt mein 5 kg kam aur doosri mein 5 kg zyada entered hai. RationProof dono differences ko visible rakhta hai.”

Point to **Totals match. Individual receipts don’t.** Expand the two receipt evidence entries. State that this is a fictional case, not a fraud allegation or observed household incident.

## 0:55–1:30 — honest input and review

Clear the sample with **Clear this record → Clear monthly record**. Click **Paste text** and paste `static/demo-receipt.txt`, or upload that text file.

“This is the text entry path. The image reader is a separate local OCR component; it must pass on the demo device before we claim it works. Suggestions are unconfirmed, and received quantity stays blank.”

Enter 20 in **You received (kg)**, check **I checked this receipt**, set November 2026 and rice entitlement 25, then check all receipts included and **Compare records**. Show the 5 kg difference. Editing a quantity removes confirmation and invalidates the old report.

If image reading has actually passed rehearsal, upload `demo-receipt.png` instead and name the real engine shown by the local diagnostic. Do not run a text fallback while calling it image AI.

## 1:30–2:00 — avoid misleading alerts

Use **Sample cases → Load balance case → Load sample**. Explain that 15 kg recorded and received against 25 kg entered entitlement means a 10 kg balance to check, not automatically a delivery shortage.

Load **incomplete case** the same way. A blank measurement remains unknown; the application does not assume zero or invent a difference.

## 2:00–2:30 — evidence and next step

Download JSON. Show `reviewed_inputs`, source text, per-receipt evidence and the synthetic flag. Print is available after browser rehearsal. Explain local processing, explicit export and refresh clearing.

“We have tested the comparison rules and conservative text parser. Real receipt accuracy and household impact are not yet measured. Next is a consented pilot on one state's receipt format, measuring correction effort and false alerts.”

Close with the scope of actual event-period work. Disclose that this prototype started on 1 November before the announced build window.

## If something fails live

- Server unavailable: show the Terminal error and restart; sample cases depend on the real API. There is no fake offline success screen.
- Image recognition fails: say so and switch explicitly to text/manual mode. Do not claim the image feature passed.
- No browser access: show the recorded test/evaluation commands and source as engineering evidence, not as a live product demonstration.
- A pre-recorded demo can be a backup only after a real successful browser run. No recording or screenshot has been fabricated for this repository.
