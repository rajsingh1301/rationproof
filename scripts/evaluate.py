"""Reproduce a small synthetic parser evaluation, not image OCR accuracy."""
from datetime import datetime, timezone
from decimal import Decimal
import json
from pathlib import Path
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from app.extraction import ALIASES, parse_receipt


def first_quantity_baseline(text):
    """Illustrative naive baseline: first explicit quantity per commodity line."""
    normalized = unicodedata.normalize('NFKC', text)
    normalized = ''.join(str(unicodedata.digit(c)) if c.isdecimal() else c for c in normalized)
    result = {}
    for line in normalized.splitlines():
        match = re.search(r'(\d+(?:\.\d+)?)\s*(kgs?|किलो|किग्रा|grams?|g)(?!\w)', line, re.I)
        for commodity, aliases in ALIASES.items():
            if not re.search(rf'(?<!\w)(?:{aliases})(?!\w)', line, re.I):
                continue
            result[commodity] = None
            if match:
                qty = Decimal(match[1]) / (1000 if match[2].lower() in ('g','gram','grams') else 1)
                result[commodity] = str(qty)
    return result


def same(a, b):
    return a is b if a is None or b is None else Decimal(a) == Decimal(b)


def evaluate(cases, parser):
    summary = {'cases': len(cases), 'cases_matching_labels': 0, 'labelled_fields': 0,
               'correct_suggestions': 0, 'unsafe_suggestions': 0, 'correct_abstentions': 0, 'unnecessary_abstentions': 0}
    results = []
    for case in cases:
        actual, expected = parser(case['text']), case['expected']
        matched = actual.keys() == expected.keys() and all(same(actual[key], value) for key, value in expected.items())
        summary['cases_matching_labels'] += matched
        for key in expected.keys() | actual.keys():
            summary['labelled_fields'] += 1
            value, label = actual.get(key), expected.get(key)
            if value is None:
                summary['correct_abstentions' if label is None else 'unnecessary_abstentions'] += 1
            else:
                summary['correct_suggestions' if same(value, label) else 'unsafe_suggestions'] += 1
        results.append({'id': case['id'], 'matches_label': matched, 'suggestions': actual})
    return {'summary': summary, 'cases': results}


def main():
    cases = json.loads((ROOT / 'tests/fixtures/extraction-cases.json').read_text())
    result = {
        'evaluated_at': datetime.now(timezone.utc).isoformat(),
        'scope': 'Curated synthetic TEXT parser regression cases. No held-out data, real receipts, or image OCR accuracy measured.',
        'baseline_definition': 'First explicit unit-bearing quantity on each commodity line. An illustrative naive baseline, not a competing product or model.',
        'conservative_parser': evaluate(cases, lambda text: {item['commodity']: item['issued_kg'] for item in parse_receipt(text)['items']}),
        'first_quantity_baseline': evaluate(cases, first_quantity_baseline),
    }
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'artifacts/evaluation.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    for name in ('conservative_parser', 'first_quantity_baseline'):
        print(name, json.dumps(result[name]['summary']))
    print(f'Wrote {target}')
    return 0 if result['conservative_parser']['summary']['cases_matching_labels'] == len(cases) else 1


if __name__ == '__main__':
    raise SystemExit(main())
