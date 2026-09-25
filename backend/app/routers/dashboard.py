from collections import OrderedDict
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    total_instruments = db.query(models.Instrument).count()
    total_reports = db.query(models.TestReport).count()
    completed_reports = db.query(models.TestReport).filter(models.TestReport.status == "completed").count()
    pending_reports = total_reports - completed_reports
    pass_count = db.query(models.TestReport).filter(models.TestReport.overall_result == "PASS").count()
    fail_count = db.query(models.TestReport).filter(models.TestReport.overall_result == "FAIL").count()

    # Last 6 months, oldest -> newest
    months = OrderedDict()
    today = date.today()
    y, m = today.year, today.month
    for _ in range(6):
        months[f"{y}-{m:02d}"] = 0
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    months = OrderedDict(reversed(list(months.items())))

    reports = db.query(models.TestReport.test_date).all()
    for (d,) in reports:
        key = f"{d.year}-{d.month:02d}"
        if key in months:
            months[key] += 1

    reports_per_month = [{"month": k, "count": v} for k, v in months.items()]

    return schemas.DashboardStats(
        total_instruments=total_instruments,
        total_reports=total_reports,
        completed_reports=completed_reports,
        pending_reports=pending_reports,
        pass_count=pass_count,
        fail_count=fail_count,
        reports_per_month=reports_per_month,
    )
