from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi import Request
import uvicorn
import json
from pathlib import Path
from datetime import datetime
import shutil
import subprocess
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "data.json"
IMAGES_DIR = BASE_DIR / "images"

app = FastAPI(title="Medicine Editor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
app.mount("/static", StaticFiles(directory=str(Path(__file__).parent / "static")), name="static")

IMAGES_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    if not DATA_PATH.exists():
        return {"boxes": [], "meds": [], "meta": {}}
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data: dict):
    data.setdefault("meta", {})
    data["meta"]["updated_at"] = datetime.utcnow().isoformat() + "Z"
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.get("/editor", response_class=HTMLResponse)
async def editor_page(request: Request):
    return templates.TemplateResponse("editor.html", {"request": request})

@app.get("/api/data")
async def get_data():
    return load_data()

@app.post("/api/save")
async def save_all(data: dict):
    save_data(data)
    return {"ok": True}

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    filename = file.filename
    # simple sanitizing
    filename = os.path.basename(filename)
    target = IMAGES_DIR / filename
    with target.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"ok": True, "filename": filename, "url": f"images/{filename}"}

@app.post("/api/publish")
async def publish_to_git(message: str = Form("Update data")):
    """
    Пытаемся сделать git add/commit/push.
    Требует, чтобы git был настроен и репозиторий уже существовал.
    """
    try:
        subprocess.check_call(["git", "add", "data", "images"], cwd=BASE_DIR)
        subprocess.check_call(["git", "commit", "-m", message], cwd=BASE_DIR)
        subprocess.check_call(["git", "push"], cwd=BASE_DIR)
        return {"ok": True}
    except subprocess.CalledProcessError as e:
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})

if __name__ == "__main__":
    uvicorn.run("editor_app:app", host="127.0.0.1", port=7000, reload=True)
