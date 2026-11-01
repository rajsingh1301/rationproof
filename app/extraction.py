"""Local image OCR with conservative, evidence-preserving receipt parsing."""
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unicodedata
import warnings
from decimal import Decimal

from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent.parent
Image.MAX_IMAGE_PIXELS = 16_000_000
ALIASES = {"rice": r"rice|chawal|चावल", "wheat": r"wheat|gehun|गेहूं|गेहूँ"}


def parse_receipt(text: str, document_id: str | None = None) -> dict:
    text = unicodedata.normalize("NFKC", text)
    # Devanagari digits can be entered in the text path, too.
    normalized = "".join(str(unicodedata.digit(c)) if c.isdecimal() else c for c in text)
    # Normalize signs before matching: Unicode minus must not become positive.
    normalized = normalized.translate(str.maketrans({"−": "-", "–": "-", "—": "-"}))
    id_match = re.search(r"(?:receipt|transaction|txn)(?:\s*(?:id|no\.?|number))?\s*[:#-]\s*([\w/-]+)", normalized, re.I)
    date_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", normalized)
    found, issues = {}, []
    for line in normalized.splitlines():
        commodities = [name for name, aliases in ALIASES.items()
                       if re.search(rf"(?<!\w)(?:{aliases})(?!\w)", line, re.I)]
        # Allocation/balance/price lines cannot establish an issued quantity.
        ambiguous_role = re.search(r"entitlement|allocation|balance|remaining|rate|price|पात्रता|शेष", line, re.I)
        unsafe_number = re.search(r"[-+]\s*\d|[\d]\s*[,/]\s*[\d]|\(\s*\d", line)
        matches = re.findall(r"(?<![\w.,+-])(\d+(?:\.\d+)?)\s*(kgs?|किलो|किग्रा|grams?|g)(?![\w\u0900-\u097f])", line, re.I)
        for commodity in commodities:
            qty = None
            if len(commodities) == 1 and len(matches) == 1 and not ambiguous_role and not unsafe_number and commodity not in found:
                number, unit = matches[0]
                candidate = Decimal(number) / (1000 if unit.lower() in ("g", "gram", "grams") else 1) if len(number) <= 18 else Decimal(10001)
                if candidate <= 10000 and candidate == candidate.quantize(Decimal("0.001")):
                    qty = str(candidate)
            found[commodity] = {"commodity": commodity, "issued_kg": qty,
                                "received_kg": None, "evidence": line}
            if qty is None:
                issues.append(f"Check the {commodity} quantity manually: ambiguous commodity, role, quantity, or unsupported precision.")
    items = list(found.values())
    if not items:
        issues.append("No supported commodity and quantity pair found. Add the values from the original manually.")
    if not id_match:
        issues.append("Receipt number needs manual entry.")
    if not date_match:
        issues.append("Receipt date needs manual entry (YYYY-MM-DD).")
    return {"document_id": document_id or hashlib.sha256(text.encode()).hexdigest(),
            "receipt_id": id_match[1] if id_match else "", "date": date_match[1] if date_match else "",
            "items": items, "source_text": text, "warnings": issues,
            "confirmed": False, "review_required": True}


def ocr_backend() -> str | None:
    if (ROOT / ".cache" / "vision-ocr").is_file():
        return "apple_vision"
    if shutil.which("tesseract"):
        return "tesseract"
    return None


def extract_image(content: bytes) -> dict:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(content)) as original:
                if original.format not in ("PNG", "JPEG", "WEBP"):
                    raise ValueError("Upload a PNG, JPEG or WebP image.")
                original.load()
                image = ImageOps.exif_transpose(original).convert("RGB")
                image.thumbnail((3000, 3000))
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValueError("This image cannot be read or is too large. Use an image below 16 megapixels.") from exc
    backend = ocr_backend()
    if not backend:
        raise RuntimeError("Image reading is not installed yet. Use the text or manual entry option; see README for local OCR setup.")
    with tempfile.TemporaryDirectory(prefix="rationproof-") as directory:
        path = Path(directory) / "receipt.png"
        image.save(path)
        command = [str(ROOT / ".cache" / "vision-ocr"), str(path)] if backend == "apple_vision" else ["tesseract", str(path), "stdout", "-l", "eng", "--psm", "6"]
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=30, check=True)
            if backend == "apple_vision":
                blocks = json.loads(result.stdout)["lines"]
                text = "\n".join(block["text"] for block in blocks)
            else:
                text, blocks = result.stdout, []
        except (subprocess.SubprocessError, ValueError, KeyError) as exc:
            raise RuntimeError("The local image reader could not run or read this image. Use pasted text or manual entry; image reading may need setup on your device.") from exc
    extracted = parse_receipt(text, hashlib.sha256(content).hexdigest())
    extracted.update({"engine": backend, "blocks": blocks})
    if not text.strip():
        extracted["warnings"].append("No readable text found. Retake the photo or enter the details manually.")
    return extracted
