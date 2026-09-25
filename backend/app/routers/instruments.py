import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/instruments", tags=["instruments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_CLASSES = ("I", "II", "III", "IIII")


@router.post("", response_model=schemas.InstrumentOut)
def create_instrument(
    payload: schemas.InstrumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "lab_manager", "testing_officer")),
):
    if payload.accuracy_class.upper() not in VALID_CLASSES:
        raise HTTPException(status_code=400, detail=f"accuracy_class must be one of {VALID_CLASSES}")
    if payload.max_capacity <= payload.min_capacity:
        raise HTTPException(status_code=400, detail="max_capacity must be greater than min_capacity")
    if payload.e_value <= 0:
        raise HTTPException(status_code=400, detail="e_value must be positive")
    if db.query(models.Instrument).filter(models.Instrument.serial_number == payload.serial_number).first():
        raise HTTPException(status_code=400, detail="An instrument with this serial number already exists")

    inst = models.Instrument(**payload.model_dump(), created_by=current_user.id)
    inst.accuracy_class = inst.accuracy_class.upper()
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


@router.get("", response_model=list[schemas.InstrumentOut])
def list_instruments(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Instrument)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            models.Instrument.manufacturer_name.ilike(like),
            models.Instrument.model_name.ilike(like),
            models.Instrument.serial_number.ilike(like),
        ))
    return query.order_by(models.Instrument.created_at.desc()).all()


@router.get("/{instrument_id}", response_model=schemas.InstrumentOut)
def get_instrument(
    instrument_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    inst = db.get(models.Instrument, instrument_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return inst


@router.post("/{instrument_id}/photo", response_model=schemas.InstrumentOut)
def upload_photo(
    instrument_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "lab_manager", "testing_officer")),
):
    inst = db.get(models.Instrument, instrument_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    safe_name = f"instrument_{instrument_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    inst.photo_path = safe_name
    db.add(models.Attachment(instrument_id=instrument_id, filename=file.filename, filepath=safe_name))
    db.commit()
    db.refresh(inst)
    return inst
