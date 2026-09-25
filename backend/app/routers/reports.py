import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, auth, report_pdf, report_docx
from ..database import get_db

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _build_context(db: Session, test_id: int) -> dict:
    report = db.get(models.TestReport, test_id)
    if not report:
        raise HTTPException(status_code=404, detail="Test report not found")
    instrument = report.instrument
    tested_by = db.get(models.User, report.tested_by) if report.tested_by else None
    reviewed_by = db.get(models.User, report.reviewed_by) if report.reviewed_by else None

    return {
        "report": {
            "report_number": report.report_number,
            "test_date": report.test_date,
            "lab_name": report.lab_name,
            "test_stage": report.test_stage,
            "lab_temperature_c": report.lab_temperature_c,
            "lab_humidity_pct": report.lab_humidity_pct,
            "atmospheric_pressure_hpa": report.atmospheric_pressure_hpa,
            "status": report.status,
            "overall_result": report.overall_result,
            "remarks": report.remarks,
        },
        "instrument": {
            "manufacturer_name": instrument.manufacturer_name,
            "model_name": instrument.model_name,
            "serial_number": instrument.serial_number,
            "instrument_type": instrument.instrument_type,
            "max_capacity": instrument.max_capacity,
            "min_capacity": instrument.min_capacity,
            "e_value": instrument.e_value,
            "unit": instrument.unit,
            "accuracy_class": instrument.accuracy_class,
        },
        "weighing": [{
            "test_load": w.test_load, "indicated_value": w.indicated_value,
            "error": w.error, "mpe": w.mpe, "verification_intervals": w.verification_intervals,
            "result": w.result,
        } for w in report.weighing_observations],
        "repeatability": [{
            "test_load": r.test_load, "readings": r.readings,
            "mean_value": r.mean_value, "range_value": r.range_value,
            "mpe": r.mpe, "result": r.result,
        } for r in report.repeatability_tests],
        "eccentricity": [{
            "position": e.position, "test_load": e.test_load, "indicated_value": e.indicated_value,
            "error": e.error, "mpe": e.mpe, "result": e.result,
        } for e in report.eccentricity_observations],
        "tested_by_name": tested_by.full_name if tested_by else None,
        "reviewed_by_name": reviewed_by.full_name if reviewed_by else None,
    }


@router.get("/{test_id}/pdf")
def download_pdf(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    context = _build_context(db, test_id)
    pdf_bytes = report_pdf.build_pdf(context)
    filename = f'{context["report"]["report_number"].replace("/", "-")}.pdf'
    return StreamingResponse(
        io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{test_id}/docx")
def download_docx(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    context = _build_context(db, test_id)
    docx_bytes = report_docx.build_docx(context)
    filename = f'{context["report"]["report_number"].replace("/", "-")}.docx'
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
