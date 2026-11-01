from datetime import datetime, timezone
from pathlib import Path
import secrets

from fastapi import FastAPI, File, HTTPException, UploadFile, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import Field
from starlette.concurrency import run_in_threadpool

from .domain import Ledger, StrictModel, reconcile
from .extraction import extract_image, ocr_backend, ocr_runtime, parse_receipt

ROOT = Path(__file__).resolve().parent.parent
app = FastAPI(title="RationProof", version="0.1.0", docs_url="/api/docs")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


@app.middleware("http")
async def local_headers(request, call_next):
    request.state.csp_nonce = secrets.token_urlsafe(24)
    if request.url.path == '/static/index.html':
        return RedirectResponse('/')
    if request.method == "POST":
        origin = request.headers.get("origin")
        allowed = {"http://127.0.0.1:8765", "http://localhost:8765"}
        if origin and origin not in allowed:
            return JSONResponse({"detail": "Use the local RationProof page to submit documents."}, status_code=403)
        try:
            if int(request.headers.get("content-length", 0)) > 9 * 1024 * 1024:
                return JSONResponse({"detail": "Upload a file smaller than 8 MB."}, status_code=413)
        except ValueError:
            return JSONResponse({"detail": "Invalid request size."}, status_code=400)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    nonce = request.state.csp_nonce
    response.headers["Content-Security-Policy"] = f"default-src 'self'; img-src 'self' blob:; script-src 'self' 'nonce-{nonce}'; style-src 'self' 'nonce-{nonce}'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    return response


@app.get("/")
def index(request: Request):
    html = (ROOT / 'static' / 'index.html').read_text().replace('__RATIONPROOF_NONCE__', request.state.csp_nonce)
    return HTMLResponse(html)


@app.get("/api/health")
def health():
    return {"status": "ok", "ocr": ocr_backend(), "ocr_runtime": ocr_runtime(), "storage": "ephemeral", "version": "0.2.0"}


class TextInput(StrictModel):
    text: str = Field(min_length=1, max_length=20000)


@app.post("/api/extract-text")
def extract_text(body: TextInput):
    return {**parse_receipt(body.text), "engine": "text_parser", "blocks": []}


@app.post("/api/extract")
async def extract(file: UploadFile = File(...)):
    try:
        content = await file.read(8 * 1024 * 1024 + 1)
    finally:
        await file.close()
    if not content or len(content) > 8 * 1024 * 1024:
        raise HTTPException(413, "Upload a non-empty file smaller than 8 MB.")
    if (file.filename or "").lower().endswith(".txt"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(422, "Text files must use UTF-8 encoding.")
        if len(text) > 20000:
            raise HTTPException(413, "Receipt text must be under 20,000 characters.")
        return {**parse_receipt(text), "engine": "text_parser", "blocks": []}
    try:
        return await run_in_threadpool(extract_image, content)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))


@app.post("/api/reconcile")
def check(body: Ledger):
    report = reconcile(body)
    report["created_at"] = datetime.now(timezone.utc).isoformat()
    return jsonable_encoder(report)
