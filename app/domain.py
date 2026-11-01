"""User-confirmed records only. Quantities are kg; no policy or fraud inference."""
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Commodity = Literal["rice", "wheat"]
Quantity = Annotated[Decimal, Field(ge=0, le=10000, max_digits=8, decimal_places=3, allow_inf_nan=False)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Item(StrictModel):
    commodity: Commodity
    issued_kg: Quantity | None = None
    received_kg: Quantity | None = None


class Receipt(StrictModel):
    document_id: str = Field(min_length=1, max_length=100)
    receipt_id: str = Field(min_length=1, max_length=80)
    date: date
    confirmed: bool = False
    items: list[Item] = Field(min_length=1, max_length=2)
    source_text: str = Field(default="", max_length=20000)

    @model_validator(mode="after")
    def unique_commodities(self):
        if len({item.commodity for item in self.items}) != len(self.items):
            raise ValueError("A receipt can have only one reviewed total per commodity.")
        return self


class Ledger(StrictModel):
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    entitlement: dict[Commodity, Quantity | None] = Field(default_factory=dict)
    entitlement_source: str = Field(default="", max_length=500)
    month_complete: bool = False
    demo: bool = False
    receipts: list[Receipt] = Field(min_length=1, max_length=50)


def reconcile(ledger: Ledger) -> dict:
    """Keep missing, unreviewed, duplicate and out-of-month records out of totals."""
    issues, accepted = [], []
    documents, transactions = {}, {}
    incomplete = False
    for receipt in ledger.receipts:
        transaction = (receipt.receipt_id.casefold(), receipt.date.isoformat())
        signature = [(i.commodity, i.issued_kg, i.received_kg) for i in receipt.items]
        previous = documents.get(receipt.document_id) or transactions.get(transaction)
        if previous is not None:
            same = previous == (transaction, signature)
            issues.append({"kind": "duplicate" if same else "conflicting_duplicate",
                           "receipt_id": receipt.receipt_id,
                           "message": "Duplicate receipt excluded." if same else
                           "Two versions of this receipt disagree. Remove one and verify the original."})
            incomplete |= not same
            continue
        if not receipt.confirmed:
            incomplete = True
            issues.append({"kind": "unreviewed", "receipt_id": receipt.receipt_id,
                           "message": "Review and confirm the extracted fields before including this receipt."})
            continue
        if receipt.date.strftime("%Y-%m") != ledger.month:
            issues.append({"kind": "other_month", "receipt_id": receipt.receipt_id,
                           "message": "Receipt excluded: its date is outside the selected month."})
            continue
        documents[receipt.document_id] = (transaction, signature)
        transactions[transaction] = (transaction, signature)
        accepted.append(receipt)

    rows = []
    names = {name for name, amount in ledger.entitlement.items() if amount is not None and amount > 0} | {i.commodity for r in accepted for i in r.items}
    for name in sorted(names):
        entries = [(r, i) for r in accepted for i in r.items if i.commodity == name]
        missing_issued = any(i.issued_kg is None for _, i in entries)
        missing_received = any(i.received_kg is None for _, i in entries)
        issued = sum((i.issued_kg for _, i in entries if i.issued_kg is not None), Decimal(0))
        received = sum((i.received_kg for _, i in entries if i.received_kg is not None), Decimal(0))
        evidence = []
        # Compare each receipt: opposite differences must never cancel each other out.
        for receipt, item in entries:
            delta = None if item.issued_kg is None or item.received_kg is None else item.issued_kg - item.received_kg
            evidence.append({"receipt_id": receipt.receipt_id, "date": str(receipt.date),
                             "issued_kg": item.issued_kg, "received_kg": item.received_kg,
                             "difference_kg": delta, "source_text": receipt.source_text})
        differences = [e for e in evidence if e["difference_kg"] is not None and e["difference_kg"] != 0]
        expected = ledger.entitlement.get(name)
        balance = expected - issued if expected is not None and not missing_issued else None
        if not entries or missing_issued or missing_received:
            status = "incomplete"
        elif differences:
            status = "difference"
        elif balance is not None and balance < 0:
            status = "check_entitlement"
        elif balance is not None and balance > 0:
            status = "balance_remaining"
        else:
            status = "records_agree"
        rows.append({"commodity": name, "entitlement_kg": expected,
                     "issued_kg": None if missing_issued or not entries else issued,
                     "received_kg": None if missing_received or not entries else received,
                     "difference_kg": None if missing_received or missing_issued or not entries else issued - received,
                     "remaining_kg": balance, "status": status, "evidence": evidence,
                     "has_differences": bool(differences)})

    incomplete |= not accepted or not ledger.month_complete or any(row["status"] == "incomplete" for row in rows)
    if incomplete:
        status = "incomplete"
    elif any(row["has_differences"] or row["status"] == "check_entitlement" for row in rows):
        status = "needs_review"
    elif any(row["status"] == "balance_remaining" for row in rows):
        status = "balance_remaining"
    else:
        status = "records_agree"
    return {"month": ledger.month, "demo": ledger.demo, "status": status,
            "accepted_receipts": len(accepted), "submitted_receipts": len(ledger.receipts),
            "month_complete": ledger.month_complete, "entitlement_source": ledger.entitlement_source,
            "rows": rows, "issues": issues,
            "note": "Comparison of uploaded records and user-reported quantities. Not proof of delivery, fraud, or official entitlement."}
