from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas, auth, r76_engine
from ..database import get_db

router = APIRouter(prefix="/api/tests", tags=["tests"])

EDITOR_ROLES = ("admin", "lab_manager", "testing_officer")


def _next_report_number(db: Session) -> str:
    year = date.today().year
    prefix = f"NAWI/{year}/"
    count = db.query(models.TestReport).filter(models.TestReport.report_number.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:04d}"


def _get_report_or_404(db: Session, test_id: int) -> models.TestReport:
    report = db.get(models.TestReport, test_id)
    if not report:
        raise HTTPException(status_code=404, detail="Test report not found")
    return report


@router.post("", response_model=schemas.TestReportOut)
def create_test(
    payload: schemas.TestReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(*EDITOR_ROLES)),
):
    instrument = db.get(models.Instrument, payload.instrument_id)
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    if payload.test_stage not in r76_engine.VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"test_stage must be one of {r76_engine.VALID_STAGES}")

    report = models.TestReport(
        report_number=_next_report_number(db),
        instrument_id=payload.instrument_id,
        lab_name=payload.lab_name,
        lab_temperature_c=payload.lab_temperature_c,
        lab_humidity_pct=payload.lab_humidity_pct,
        atmospheric_pressure_hpa=payload.atmospheric_pressure_hpa,
        test_stage=payload.test_stage,
        test_date=payload.test_date or date.today(),
        tested_by=current_user.id,
        status="in_progress",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=list[schemas.TestReportListItem])
def list_tests(
    q: Optional[str] = None,
    status_filter: Optional[str] = None,
    result_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.TestReport).join(models.Instrument)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            models.TestReport.report_number.ilike(like),
            models.Instrument.manufacturer_name.ilike(like),
            models.Instrument.model_name.ilike(like),
            models.Instrument.serial_number.ilike(like),
        ))
    if status_filter:
        query = query.filter(models.TestReport.status == status_filter)
    if result_filter:
        query = query.filter(models.TestReport.overall_result == result_filter)

    reports = query.order_by(models.TestReport.created_at.desc()).all()
    items = []
    for r in reports:
        item = schemas.TestReportListItem.model_validate(r)
        item.manufacturer_name = r.instrument.manufacturer_name
        item.model_name = r.instrument.model_name
        item.serial_number = r.instrument.serial_number
        items.append(item)
    return items


@router.get("/{test_id}", response_model=schemas.TestFullResult)
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    report = _get_report_or_404(db, test_id)
    return schemas.TestFullResult(
        test_report=schemas.TestReportOut.model_validate(report),
        instrument=schemas.InstrumentOut.model_validate(report.instrument),
        weighing_observations=[schemas.WeighingObservationOut.model_validate(w) for w in report.weighing_observations],
        repeatability_tests=[schemas.RepeatabilityTestOut.model_validate(r) for r in report.repeatability_tests],
        eccentricity_observations=[schemas.EccentricityObservationOut.model_validate(e) for e in report.eccentricity_observations],
    )


@router.post("/{test_id}/weighing", response_model=list[schemas.WeighingObservationOut])
def set_weighing_observations(
    test_id: int,
    payload: schemas.WeighingObservationsPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(*EDITOR_ROLES)),
):
    report = _get_report_or_404(db, test_id)
    instrument = report.instrument

    # Replace existing observations with the newly submitted set
    db.query(models.WeighingObservation).filter(models.WeighingObservation.test_report_id == test_id).delete()

    results = []
    for i, obs in enumerate(payload.observations):
        try:
            calc = r76_engine.evaluate_weighing_point(
                obs.test_load, obs.indicated_value,
                instrument.accuracy_class, instrument.e_value, report.test_stage,
            )
        except r76_engine.R76Error as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        row = models.WeighingObservation(
            test_report_id=test_id, sequence=i,
            test_load=obs.test_load, indicated_value=obs.indicated_value,
            error=calc["error"], mpe=calc["mpe"],
            verification_intervals=calc["verification_intervals"], result=calc["result"],
        )
        db.add(row)
        results.append(row)

    report.status = "in_progress"
    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.post("/{test_id}/repeatability", response_model=list[schemas.RepeatabilityTestOut])
def set_repeatability_tests(
    test_id: int,
    payload: schemas.RepeatabilityPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(*EDITOR_ROLES)),
):
    report = _get_report_or_404(db, test_id)
    instrument = report.instrument

    db.query(models.RepeatabilityTest).filter(models.RepeatabilityTest.test_report_id == test_id).delete()

    results = []
    for t in payload.tests:
        try:
            calc = r76_engine.evaluate_repeatability(
                t.test_load, t.readings, instrument.accuracy_class, instrument.e_value, report.test_stage,
            )
        except r76_engine.R76Error as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        row = models.RepeatabilityTest(
            test_report_id=test_id, test_load=t.test_load, readings=t.readings,
            mean_value=calc["mean_value"], range_value=calc["range_value"],
            mpe=calc["mpe"], result=calc["result"],
        )
        db.add(row)
        results.append(row)

    report.status = "in_progress"
    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.post("/{test_id}/eccentricity", response_model=list[schemas.EccentricityObservationOut])
def set_eccentricity_observations(
    test_id: int,
    payload: schemas.EccentricityPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(*EDITOR_ROLES)),
):
    report = _get_report_or_404(db, test_id)
    instrument = report.instrument

    db.query(models.EccentricityObservation).filter(models.EccentricityObservation.test_report_id == test_id).delete()

    results = []
    for obs in payload.observations:
        try:
            calc = r76_engine.evaluate_eccentricity(
                obs.test_load, obs.indicated_value, instrument.accuracy_class, instrument.e_value, report.test_stage,
            )
        except r76_engine.R76Error as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        row = models.EccentricityObservation(
            test_report_id=test_id, position=obs.position,
            test_load=obs.test_load, indicated_value=obs.indicated_value,
            error=calc["error"], mpe=calc["mpe"], result=calc["result"],
        )
        db.add(row)
        results.append(row)

    report.status = "in_progress"
    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.post("/{test_id}/finalize", response_model=schemas.TestReportOut)
def finalize_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(*EDITOR_ROLES)),
):
    report = _get_report_or_404(db, test_id)
    if not report.weighing_observations:
        raise HTTPException(status_code=400, detail="Add at least one accuracy (weighing) test observation before finalizing")

    all_results = (
        [w.result for w in report.weighing_observations]
        + [r.result for r in report.repeatability_tests]
        + [e.result for e in report.eccentricity_observations]
    )
    report.overall_result = "FAIL" if "FAIL" in all_results else "PASS"
    report.status = "completed"
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return report


@router.post("/{test_id}/review", response_model=schemas.TestReportOut)
def review_test(
    test_id: int,
    remarks: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("reviewer", "admin", "lab_manager")),
):
    report = _get_report_or_404(db, test_id)
    if report.status != "completed":
        raise HTTPException(status_code=400, detail="Only a completed report can be reviewed")
    report.reviewed_by = current_user.id
    if remarks:
        report.remarks = remarks
    db.commit()
    db.refresh(report)
    return report

@router.put("/{test_id}", response_model=schemas.TestReportOut)
def update_test(
    test_id: int,
    payload: schemas.TestReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(*EDITOR_ROLES)),
):
    report = _get_report_or_404(db, test_id)
    instrument = db.get(models.Instrument, payload.instrument_id)
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    if payload.test_stage not in r76_engine.VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"test_stage must be one of {r76_engine.VALID_STAGES}")

    report.instrument_id = payload.instrument_id
    report.lab_name = payload.lab_name
    report.lab_temperature_c = payload.lab_temperature_c
    report.lab_humidity_pct = payload.lab_humidity_pct
    report.atmospheric_pressure_hpa = payload.atmospheric_pressure_hpa
    report.test_stage = payload.test_stage
    report.test_date = payload.test_date or report.test_date

    db.commit()
    db.refresh(report)
    return report

@router.delete("/{test_id}")
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "lab_manager")),
):
    report = _get_report_or_404(db, test_id)
    db.delete(report)
    db.commit()
    return {"detail": "Test report deleted"}

@router.patch("/{test_id}/status", response_model=schemas.TestReportOut)
def update_test_status(
    test_id: int,
    payload: schemas.TestReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("testing_officer", "admin")),
):
    report = _get_report_or_404(db, test_id)
    report.status = payload.status
    if payload.overall_result is not None:
        report.overall_result = payload.overall_result
    if payload.remarks is not None:
        report.remarks = payload.remarks
    db.commit()
    db.refresh(report)
    return report
