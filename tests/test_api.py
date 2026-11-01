import unittest
from fastapi.testclient import TestClient
from app.main import app
from test_core import sample


class ApiTests(unittest.TestCase):
    def setUp(self):self.client=TestClient(app)
    def test_page_and_health(self):
        self.assertEqual(self.client.get('/').status_code,200)
        self.assertEqual(self.client.get('/api/health').json()['storage'],'ephemeral')
    def test_text_upload(self):
        response=self.client.post('/api/extract',files={'file':('receipt.txt',b'Receipt ID: X-1\nDate: 2026-11-03\nRice: 25 kg','text/plain')})
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['items'][0]['issued_kg'],'25')
    def test_wrong_image_returns_useful_error(self):
        response=self.client.post('/api/extract',files={'file':('receipt.png',b'not a picture','image/png')})
        self.assertEqual(response.status_code,422)
    def test_oversized_file_rejected(self):
        response=self.client.post('/api/extract',files={'file':('receipt.png',b'a'*(8*1024*1024+1),'image/png')})
        self.assertEqual(response.status_code,413)
    def test_actual_report_route(self):
        response=self.client.post('/api/reconcile',json=sample())
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['status'],'needs_review')
        self.assertIn('created_at',response.json())
    def test_bad_quantity_is_not_computed(self):
        response=self.client.post('/api/reconcile',json=sample(received='-2'))
        self.assertEqual(response.status_code,422)
    def test_cross_site_document_upload_rejected(self):
        response=self.client.post('/api/extract-text',headers={'Origin':'https://example.com'},json={'text':'Rice: 25 kg'})
        self.assertEqual(response.status_code,403)
    def test_no_store(self):
        self.assertEqual(self.client.get('/api/health').headers['cache-control'],'no-store')

    def test_document_nonce_matches_policy_and_changes_each_request(self):
        import re
        first, second = self.client.get('/'), self.client.get('/')
        nonce = re.search(r"'nonce-([^']+)'", first.headers['content-security-policy'])[1]
        self.assertIn(f'nonce="{nonce}"', first.text)
        self.assertNotIn('__RATIONPROOF_NONCE__', first.text)
        self.assertNotIn('unsafe-inline', first.headers['content-security-policy'])
        self.assertNotIn(nonce, second.headers['content-security-policy'])
        self.assertEqual(self.client.get('/static/index.html', follow_redirects=False).status_code, 307)

    def test_text_review_comparison_flow(self):
        extraction = self.client.post('/api/extract-text', json={'text': 'Receipt ID: FLOW-1\nDate: 2026-11-03\nRice: 25 kg'}).json()
        self.assertFalse(extraction['confirmed'])
        self.assertIsNone(extraction['items'][0]['received_kg'])
        data = sample()
        data['receipts'][0] = {key: extraction[key] for key in ('document_id', 'receipt_id', 'date', 'confirmed', 'source_text')}
        data['receipts'][0]['items'] = [{key: item[key] for key in ('commodity', 'issued_kg', 'received_kg')} for item in extraction['items']]
        self.assertEqual(self.client.post('/api/reconcile', json=data).json()['accepted_receipts'], 0)
        data['receipts'][0]['confirmed'] = True
        missing = self.client.post('/api/reconcile', json=data).json()
        self.assertEqual(missing['status'], 'incomplete')
        self.assertIsNone(missing['rows'][0]['difference_kg'])
        data['receipts'][0]['items'][0]['received_kg'] = '20'
        reviewed = self.client.post('/api/reconcile', json=data).json()
        self.assertEqual(reviewed['status'], 'needs_review')
        self.assertEqual(float(reviewed['rows'][0]['difference_kg']), 5)
        self.assertEqual(reviewed['rows'][0]['evidence'][0]['source_text'], extraction['source_text'])

    def test_invalid_utf8_upload(self):
        self.assertEqual(self.client.post('/api/extract', files={'file': ('receipt.txt', b'\xff\xfe', 'text/plain')}).status_code, 422)


if __name__=='__main__':unittest.main()
