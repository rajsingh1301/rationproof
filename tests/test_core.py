import copy
from decimal import Decimal
import unittest

from pydantic import ValidationError

from app.domain import Ledger, reconcile
from app.extraction import parse_receipt


def sample(issued="25", received="20"):
    return {"month":"2026-11", "entitlement":{"rice":"25", "wheat":None},
            "month_complete":True,"demo":True,"entitlement_source":"Synthetic example",
            "receipts":[{"document_id":"doc-1","receipt_id":"DEMO-1","date":"2026-11-03",
                         "confirmed":True,"items":[{"commodity":"rice","issued_kg":issued,"received_kg":received}],
                         "source_text":"SYNTHETIC RECEIPT\nRice: 25 kg"}]}


class LedgerTests(unittest.TestCase):
    def report(self, data):
        return reconcile(Ledger.model_validate(data))

    def test_difference(self):
        report=self.report(sample())
        self.assertEqual(report["status"],"needs_review")
        self.assertEqual(report["rows"][0]["difference_kg"],Decimal("5"))

    def test_partial_collection_is_balance_not_shortage(self):
        report=self.report(sample("15","15"))
        self.assertEqual(report["status"],"balance_remaining")
        self.assertEqual(report["rows"][0]["remaining_kg"],Decimal("10"))
        self.assertEqual(report["rows"][0]["difference_kg"],0)

    def test_missing_received_does_not_become_zero(self):
        report=self.report(sample(received=None))
        self.assertEqual(report["status"],"incomplete")
        self.assertIsNone(report["rows"][0]["difference_kg"])
        self.assertIsNone(report["rows"][0]["received_kg"])

    def test_explicit_zero_received_is_valid(self):
        report=self.report(sample(received="0"))
        self.assertEqual(report["rows"][0]["difference_kg"],25)

    def test_unconfirmed_receipt_excluded(self):
        data=sample();data["receipts"][0]["confirmed"]=False
        report=self.report(data)
        self.assertEqual(report["accepted_receipts"],0)
        self.assertEqual(report["status"],"incomplete")

    def test_previous_month_not_counted(self):
        data=sample();data["receipts"][0]["date"]="2026-10-31"
        report=self.report(data)
        self.assertEqual(report["accepted_receipts"],0)
        self.assertEqual(report["issues"][0]["kind"],"other_month")

    def test_duplicate_transaction_from_another_photo_excluded(self):
        data=sample();other=copy.deepcopy(data["receipts"][0]);other["document_id"]="another-photo"
        data["receipts"].append(other)
        report=self.report(data)
        self.assertEqual(report["accepted_receipts"],1)
        self.assertEqual(report["rows"][0]["issued_kg"],25)
        self.assertEqual(report["issues"][0]["kind"],"duplicate")

    def test_conflicting_duplicate_requires_review(self):
        data=sample();other=copy.deepcopy(data["receipts"][0]);other["items"][0]["received_kg"]="25"
        data["receipts"].append(other)
        report=self.report(data)
        self.assertEqual(report["status"],"incomplete")
        self.assertEqual(report["issues"][0]["kind"],"conflicting_duplicate")

    def test_reordered_commodity_lines_are_same_transaction(self):
        data = sample()
        data['receipts'][0]['items'].append({'commodity': 'wheat', 'issued_kg': '5', 'received_kg': '5'})
        other = copy.deepcopy(data['receipts'][0])
        other['document_id'] = 'another-photo'
        other['items'].reverse()
        data['receipts'].append(other)
        report = self.report(data)
        self.assertEqual(report['accepted_receipts'], 1)
        self.assertEqual(report['issues'][0]['kind'], 'duplicate')

    def test_opposite_differences_do_not_cancel_alert(self):
        data=sample("10","5");other=copy.deepcopy(data["receipts"][0])
        other.update(document_id="doc-2",receipt_id="DEMO-2")
        other["items"][0]["received_kg"]="15";data["receipts"].append(other)
        report=self.report(data)
        self.assertEqual(report["rows"][0]["difference_kg"],0)
        self.assertEqual(report["status"],"needs_review")
        self.assertTrue(report["rows"][0]["has_differences"])

    def test_unknown_entitlement_does_not_invent_balance(self):
        data=sample("20","20");data["entitlement"]={}
        report=self.report(data)
        self.assertEqual(report["status"],"records_agree")
        self.assertIsNone(report["rows"][0]["remaining_kg"])

    def test_unused_zero_commodity_does_not_make_report_incomplete(self):
        data=sample("25","25");data["entitlement"]["wheat"]="0"
        self.assertEqual(self.report(data)["status"],"records_agree")

    def test_arithmetic_is_decimal(self):
        report=self.report(sample("0.3","0.1"))
        self.assertEqual(report["rows"][0]["difference_kg"],Decimal("0.2"))

    def test_receipts_not_marked_complete(self):
        data=sample("25","25");data["month_complete"]=False
        self.assertEqual(self.report(data)["status"],"incomplete")

    def test_excess_receipt_total_requires_entitlement_review(self):
        self.assertEqual(self.report(sample("30","30"))["status"],"needs_review")

    def test_invalid_quantities_rejected(self):
        for amount in ["-1","NaN","Infinity","10001","1.2345"]:
            with self.subTest(amount=amount), self.assertRaises(ValidationError):
                Ledger.model_validate(sample(received=amount))

    def test_duplicate_commodity_rejected(self):
        data=sample();data["receipts"][0]["items"]*=2
        with self.assertRaises(ValidationError):Ledger.model_validate(data)

    def test_invalid_date_and_month_rejected(self):
        data=sample();data["receipts"][0]["date"]="2026-02-31"
        with self.assertRaises(ValidationError):Ledger.model_validate(data)
        data=sample();data["month"]="2026-13"
        with self.assertRaises(ValidationError):Ledger.model_validate(data)


class ExtractionTests(unittest.TestCase):
    def test_suggested_fields_require_review(self):
        result=parse_receipt("Receipt ID: RP-1\nDate: 2026-11-03\nRice: 25 kg\nWheat: 2.5 kg")
        self.assertEqual(result["receipt_id"],"RP-1")
        self.assertFalse(result["confirmed"])
        self.assertEqual(result["items"][0]["issued_kg"],"25")
        self.assertIsNone(result["items"][0]["received_kg"])

    def test_multiple_quantities_abstain(self):
        result=parse_receipt("Rice: entitlement 25 kg issued 15 kg balance 10 kg")
        self.assertIsNone(result["items"][0]["issued_kg"])
        self.assertTrue(result["warnings"])

    def test_grams_converted_explicitly(self):
        self.assertEqual(parse_receipt("Rice: 1500 g")["items"][0]["issued_kg"],"1.5")

    def test_hindi_digits_in_text(self):
        result=parse_receipt("चावल: २५ किलो")
        self.assertEqual(result["items"][0]["issued_kg"],"25")

    def test_unsupported_unit_not_guessed(self):
        result=parse_receipt("Rice: 2 bags")
        self.assertIsNone(result["items"][0]["issued_kg"])

    def test_negative_does_not_become_positive(self):
        result=parse_receipt("Rice: -25 kg")
        self.assertIsNone(result["items"][0]["issued_kg"])

    def test_receipt_id_label_does_not_read_across_lines(self):
        # Apple Vision output for static/demo-receipt.png: a heading ends in "RECEIPT"
        # and the next line is a dashed separator, which must not become the ID.
        text = ("SYNTHETIC DEMO RECEIPT\nNot a real ration transaction\n-----------.\n"
                "Receipt ID: DEMO-001\nDate: 2026-11-03\nRice: 25 kg")
        self.assertEqual(parse_receipt(text)["receipt_id"], "DEMO-001")

    def test_separator_only_is_not_a_receipt_id(self):
        result = parse_receipt("Receipt No: ----\nRice: 25 kg")
        self.assertEqual(result["receipt_id"], "")
        self.assertTrue(any("number" in w.lower() or "id" in w.lower() for w in result["warnings"]))

    def test_empty_receipt_abstains(self):
        result=parse_receipt("unclear scan")
        self.assertEqual(result["items"],[])
        self.assertTrue(result["review_required"])

    def test_ambiguous_or_signed_quantities_are_not_suggested(self):
        for text in ["Rice and Wheat: 25 kg", "Rice entitlement: 25 kg", "Rice balance 5 kg",
                     "Rice: −25 kg", "Rice: - 25 kg", "Rice: (25 kg)", "Rice: 1,200 kg",
                     "Rice: 0.5 g", "Rice: 10001 kg", "Rice: 1.2345 kg"]:
            with self.subTest(text=text):
                result = parse_receipt(text)
                self.assertTrue(result['items'])
                self.assertTrue(all(item['issued_kg'] is None for item in result['items']))
                self.assertTrue(result['warnings'])

    def test_repeated_commodity_stays_unknown(self):
        self.assertIsNone(parse_receipt("Rice: 5 kg\nRice: 6 kg\nRice: 7 kg")['items'][0]['issued_kg'])


if __name__=="__main__":unittest.main()
