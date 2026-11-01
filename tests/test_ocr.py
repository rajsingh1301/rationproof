"""Adapter behavior tests. Mocked processes do not measure OCR accuracy."""
import io
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

from PIL import Image
from app import extraction


class OcrAdapterTests(unittest.TestCase):
    def setUp(self):
        self.previous = dict(extraction._runtime)
        stream = io.BytesIO()
        Image.new('RGB', (32, 32), 'white').save(stream, format='PNG')
        self.content = stream.getvalue()

    def tearDown(self):
        extraction._runtime.update(self.previous)

    @patch('app.extraction.ocr_backends', return_value=['apple_vision', 'tesseract'])
    def test_failed_reader_falls_back_and_removes_temporary_image(self, _):
        paths = []
        def run(command, **kwargs):
            paths.append(Path(command[1]))
            self.assertTrue(paths[-1].exists())
            if command[0] != 'tesseract':
                raise subprocess.CalledProcessError(1, command)
            return subprocess.CompletedProcess(command, 0, stdout='Rice: 25 kg')
        with patch('app.extraction.subprocess.run', side_effect=run):
            result = extraction.extract_image(self.content)
        self.assertEqual(result['engine'], 'tesseract')
        self.assertFalse(result['confirmed'])
        self.assertEqual(extraction.ocr_runtime()['state'], 'ready')
        self.assertTrue(all(not path.exists() for path in paths))

    @patch('app.extraction.ocr_backends', return_value=['apple_vision'])
    def test_all_failed_readers_report_failure_without_fabricated_fields(self, _):
        with patch('app.extraction.subprocess.run', side_effect=OSError('unavailable')):
            with self.assertRaisesRegex(RuntimeError, 'Paste the receipt text'):
                extraction.extract_image(self.content)
        self.assertEqual(extraction.ocr_runtime()['state'], 'failed')

    @patch('app.extraction.ocr_backends', return_value=[])
    def test_not_installed_is_distinct_from_unverified(self, _):
        self.assertEqual(extraction.ocr_runtime()['state'], 'not_installed')
        with self.assertRaisesRegex(RuntimeError, 'not installed'):
            extraction.extract_image(self.content)
