from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from . import models
from .database import engine, SessionLocal
from .seed import run_seed
from .routers import auth_routes, instruments, tests, reports, dashboard

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    run_seed(db)
finally:
    db.close()

app = FastAPI(
    title="NAWI Test Report System",
    description="Generates OIML R-76 test reports for Non-Automatic Weighing Instruments (SIH 2026, PS 26035).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth_routes.router)
app.include_router(instruments.router)
app.include_router(tests.router)
app.include_router(reports.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "nawi-test-report-system"}
