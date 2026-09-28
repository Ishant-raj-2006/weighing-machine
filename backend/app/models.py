from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    # one of: admin, lab_manager, testing_officer, reviewer
    role = Column(String(30), nullable=False, default="testing_officer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    manufacturer_name = Column(String(150), nullable=False)
    manufacturer_address = Column(String(255), nullable=True)
    model_name = Column(String(100), nullable=False)
    instrument_type = Column(String(80), default="Digital Body Scale")
    serial_number = Column(String(100), unique=True, index=True, nullable=False)

    max_capacity = Column(Float, nullable=False)   # Max
    min_capacity = Column(Float, nullable=False)   # Min
    e_value = Column(Float, nullable=False)         # verification scale interval (e)
    d_value = Column(Float, nullable=True)          # actual scale interval (d), often = e
    unit = Column(String(10), default="kg")
    accuracy_class = Column(String(10), nullable=False)  # I, II, III, IIII

    photo_path = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    test_reports = relationship("TestReport", back_populates="instrument")
    attachments = relationship("Attachment", back_populates="instrument")

    @property
    def verification_intervals(self):
        """n = Max / e — how many verification scale intervals the instrument spans."""
        if self.e_value:
            return round(self.max_capacity / self.e_value, 2)
        return None


class TestReport(Base):
    __tablename__ = "test_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)

    lab_name = Column(String(150), nullable=False)
    lab_temperature_c = Column(Float, nullable=True)
    lab_humidity_pct = Column(Float, nullable=True)
    atmospheric_pressure_hpa = Column(Float, nullable=True)

    # "initial_verification" (MPE as-is) or "in_service" (MPE x2, OIML R76)
    test_stage = Column(String(30), default="initial_verification")
    test_date = Column(Date, default=date.today)

    tested_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # draft -> in_progress -> completed
    status = Column(String(20), default="in_progress")
    overall_result = Column(String(10), nullable=True)  # PASS / FAIL
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    instrument = relationship("Instrument", back_populates="test_reports")
    weighing_observations = relationship(
        "WeighingObservation", back_populates="test_report",
        cascade="all, delete-orphan", order_by="WeighingObservation.sequence"
    )
    repeatability_tests = relationship(
        "RepeatabilityTest", back_populates="test_report", cascade="all, delete-orphan"
    )
    eccentricity_observations = relationship(
        "EccentricityObservation", back_populates="test_report", cascade="all, delete-orphan"
    )
    attachments = relationship("Attachment", back_populates="test_report")


class WeighingObservation(Base):
    """Accuracy / weighing test: apply a known test load, record the indication."""
    __tablename__ = "weighing_observations"

    id = Column(Integer, primary_key=True, index=True)
    test_report_id = Column(Integer, ForeignKey("test_reports.id"), nullable=False)
    sequence = Column(Integer, default=0)

    test_load = Column(Float, nullable=False)
    indicated_value = Column(Float, nullable=False)

    error = Column(Float, nullable=True)
    mpe = Column(Float, nullable=True)
    verification_intervals = Column(Float, nullable=True)
    result = Column(String(10), nullable=True)

    test_report = relationship("TestReport", back_populates="weighing_observations")


class RepeatabilityTest(Base):
    """Repeated weighings at the same load; range of readings must stay within MPE."""
    __tablename__ = "repeatability_tests"

    id = Column(Integer, primary_key=True, index=True)
    test_report_id = Column(Integer, ForeignKey("test_reports.id"), nullable=False)

    test_load = Column(Float, nullable=False)
    readings = Column(JSON, nullable=False)  # list[float]

    mean_value = Column(Float, nullable=True)
    range_value = Column(Float, nullable=True)
    mpe = Column(Float, nullable=True)
    result = Column(String(10), nullable=True)

    test_report = relationship("TestReport", back_populates="repeatability_tests")


class EccentricityObservation(Base):
    """Corner / off-centre load test."""
    __tablename__ = "eccentricity_observations"

    id = Column(Integer, primary_key=True, index=True)
    test_report_id = Column(Integer, ForeignKey("test_reports.id"), nullable=False)

    position = Column(String(30), nullable=False)  # Center, Front-Left, Front-Right, Rear-Left, Rear-Right
    test_load = Column(Float, nullable=False)
    indicated_value = Column(Float, nullable=False)

    error = Column(Float, nullable=True)
    mpe = Column(Float, nullable=True)
    result = Column(String(10), nullable=True)

    test_report = relationship("TestReport", back_populates="eccentricity_observations")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=True)
    test_report_id = Column(Integer, ForeignKey("test_reports.id"), nullable=True)

    filename = Column(String(255), nullable=False)
    filepath = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    instrument = relationship("Instrument", back_populates="attachments")
    test_report = relationship("TestReport", back_populates="attachments")
