"""Adapter behavior tests. Mocked processes do not measure OCR accuracy."""
import io
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

from PIL import Image
from app import extraction, vision_ocr


class OcrAdapterTests(unittest.TestCase):
    @staticmethod
    def blank_png():
        stream = io.BytesIO()
        Image.new('RGB', (32, 32), 'white').save(stream, format='PNG')
        return stream.getvalue()

    def setUp(self):
        self.previous = dict(extraction._runtime)
        self.content = self.blank_png()

    def tearDown(self):
        extraction._runtime.update(self.previous)

    @patch('app.extraction.ocr_backends', return_value=['apple_vision', 'tesseract'])
    def test_failed_reader_falls_back_and_removes_temporary_image(self, _):
        paths = []
        def run(command, **kwargs):
            paths.append(Path(command[-1] if command[0] != 'tesseract' else command[1]))
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


class VisionModuleTests(unittest.TestCase):
    def test_apple_vision_runs_through_python_not_a_compiled_binary(self):
        with patch('app.extraction.ocr_backends', return_value=['apple_vision']), \
             patch('app.extraction.subprocess.run', return_value=subprocess.CompletedProcess([], 0, stdout='{"lines": []}')) as run:
            extraction.extract_image(OcrAdapterTests.blank_png())
        command = run.call_args.args[0]
        self.assertEqual(command[:3], [sys.executable, '-m', 'app.vision_ocr'])

    def test_reading_order_is_rows_then_left_to_right(self):
        def line(text, x, y):
            return {'text': text, 'box': {'x': x, 'y': y, 'width': 0.1, 'height': 0.02}}
        ordered = vision_ocr.sort_reading_order([
            line('25 kg', 0.6, 0.305), line('Wheat', 0.1, 0.4), line('Rice', 0.1, 0.3)])
        self.assertEqual([item['text'] for item in ordered], ['Rice', '25 kg', 'Wheat'])

    def test_unavailable_off_macos(self):
        with patch('app.vision_ocr.sys.platform', 'linux'):
            self.assertFalse(vision_ocr.available())
