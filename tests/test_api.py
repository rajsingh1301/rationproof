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


if __name__=='__main__':unittest.main()
