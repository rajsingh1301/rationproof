"""Apple Vision text recognition called from Python via PyObjC (macOS only).

Runs on-device with Apple's pretrained model; nothing is sent over the network.
Invoked as a subprocess (`python -m app.vision_ocr <image>`) so the caller can
apply a timeout and survive a native crash. Prints {"lines": [...]} as JSON.
Python owns validation and parsing; this module only returns recognised text.
"""
import importlib.util
import json
import sys

LINE_TOLERANCE = 0.012


def available() -> bool:
    return sys.platform == "darwin" and importlib.util.find_spec("Vision") is not None


def recognize(path: str) -> list[dict]:
    import Vision
    from Foundation import NSURL

    request = Vision.VNRecognizeTextRequest.alloc().init()
    request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    request.setUsesLanguageCorrection_(False)
    request.setRecognitionLanguages_(["en-US"])
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(path), {})
    ok, error = handler.performRequests_error_([request], None)
    if not ok:
        raise RuntimeError(f"Local text recognition failed: {error}")
    lines = []
    for observation in request.results() or []:
        candidates = observation.topCandidates_(1)
        if not candidates:
            continue
        candidate = candidates[0]
        box = observation.boundingBox()
        lines.append({
            "text": str(candidate.string()),
            "confidence": float(candidate.confidence()),
            # Vision uses a bottom-left origin; convert to top-left like the UI expects.
            "box": {"x": box.origin.x, "y": 1 - (box.origin.y + box.size.height),
                    "width": box.size.width, "height": box.size.height},
        })
    return sort_reading_order(lines)


def sort_reading_order(lines: list[dict]) -> list[dict]:
    """Top-to-bottom rows, then left-to-right, tolerating slight vertical jitter."""
    def mid_y(line):
        return line["box"]["y"] + line["box"]["height"] / 2

    ordered = sorted(lines, key=mid_y)
    rows: list[list[dict]] = []
    for line in ordered:
        if rows and abs(mid_y(line) - mid_y(rows[-1][0])) <= LINE_TOLERANCE:
            rows[-1].append(line)
        else:
            rows.append([line])
    return [line for row in rows for line in sorted(row, key=lambda item: item["box"]["x"])]


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: python -m app.vision_ocr <image>", file=sys.stderr)
        return 2
    try:
        lines = recognize(argv[1])
    except Exception as exc:  # report to the caller, which falls back to the next reader
        print(f"Local text recognition failed: {exc}", file=sys.stderr)
        return 1
    sys.stdout.write(json.dumps({"lines": lines}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
