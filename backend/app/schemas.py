from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ---------- Auth ----------

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "testing_officer"


# ---------- Instrument ----------

class InstrumentCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    manufacturer_name: str
    manufacturer_address: Optional[str] = None
    model_name: str
    instrument_type: str = "Electronic Weighing Scale"
    serial_number: str
    max_capacity: float
    min_capacity: float
    e_value: float
    d_value: Optional[float] = None
    unit: str = "kg"
    accuracy_class: str


class InstrumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    id: int
    manufacturer_name: str
    manufacturer_address: Optional[str] = None
    model_name: str
    instrument_type: str
    serial_number: str
    max_capacity: float
    min_capacity: float
    e_value: float
    d_value: Optional[float] = None
    unit: str
    accuracy_class: str
    photo_path: Optional[str] = None
    created_at: datetime
    verification_intervals: Optional[float] = None


# ---------- Test Report ----------

class TestReportCreate(BaseModel):
    instrument_id: int
    lab_name: str
    lab_temperature_c: Optional[float] = None
    lab_humidity_pct: Optional[float] = None
    atmospheric_pressure_hpa: Optional[float] = None
    test_stage: str = "initial_verification"
    test_date: Optional[date] = None


class TestReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_number: str
    instrument_id: int
    lab_name: str
    lab_temperature_c: Optional[float] = None
    lab_humidity_pct: Optional[float] = None
    atmospheric_pressure_hpa: Optional[float] = None
    test_stage: str
    test_date: date
    status: str
    overall_result: Optional[str] = None
    remarks: Optional[str] = None
    tested_by: Optional[int] = None
    reviewed_by: Optional[int] = None
    created_at: datetime


class TestReportListItem(TestReportOut):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    manufacturer_name: str = ""
    model_name: str = ""
    serial_number: str = ""


# ---------- Weighing (accuracy) test ----------

class WeighingObservationIn(BaseModel):
    test_load: float
    indicated_value: float


class WeighingObservationsPayload(BaseModel):
    observations: List[WeighingObservationIn]


class WeighingObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sequence: int
    test_load: float
    indicated_value: float
    error: Optional[float] = None
    mpe: Optional[float] = None
    verification_intervals: Optional[float] = None
    result: Optional[str] = None


# ---------- Repeatability test ----------

class RepeatabilityTestIn(BaseModel):
    test_load: float
    readings: List[float]


class RepeatabilityPayload(BaseModel):
    tests: List[RepeatabilityTestIn]


class RepeatabilityTestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    test_load: float
    readings: List[float]
    mean_value: Optional[float] = None
    range_value: Optional[float] = None
    mpe: Optional[float] = None
    result: Optional[str] = None


# ---------- Eccentricity test ----------

class EccentricityObservationIn(BaseModel):
    position: str
    test_load: float
    indicated_value: float


class EccentricityPayload(BaseModel):
    observations: List[EccentricityObservationIn]


class EccentricityObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    position: str
    test_load: float
    indicated_value: float
    error: Optional[float] = None
    mpe: Optional[float] = None
    result: Optional[str] = None


# ---------- Full result ----------

class TestFullResult(BaseModel):
    test_report: TestReportOut
    instrument: InstrumentOut
    weighing_observations: List[WeighingObservationOut]
    repeatability_tests: List[RepeatabilityTestOut]
    eccentricity_observations: List[EccentricityObservationOut]


# ---------- Dashboard ----------

class DashboardStats(BaseModel):
    total_instruments: int
    total_reports: int
    completed_reports: int
    pending_reports: int
    pass_count: int
    fail_count: int
    reports_per_month: List[dict]
