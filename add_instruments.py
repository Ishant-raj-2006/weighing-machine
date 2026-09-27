import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
try:
    from app import models
    from app.database import engine, SessionLocal
except ImportError:
    pass

CATEGORIES = [
  {
    "category": "Home & Health Care Scales",
    "types": ["Digital Body Scale", "Analog Spring Scale", "Smart Body Composition Scale", "Baby Weighing Scale", "Kitchen / Food Scale"]
  },
  {
    "category": "Commercial & Retail Scales",
    "types": ["Price Computing Scale", "Counter / Bench Scale", "Hanging / Luggage Scale", "POS Billing Scale"]
  },
  {
    "category": "Scientific & Precision Scales",
    "types": ["Analytical Balance", "Jewelry Scale", "Counting Scale"]
  },
  {
    "category": "Heavy Industrial & Logistics Scales",
    "types": ["Platform / Floor Scale", "Crane Scale", "Forklift Scale", "Conveyor Scale", "Tank & Silo Scale"]
  },
  {
    "category": "Transport & Heavy Vehicle Scales",
    "types": ["Weighbridge / Truck Scale", "Axle Scale"]
  }
]

def add_missing_instruments():
    from backend.app import models
    from backend.app.database import SessionLocal
    db = SessionLocal()
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    admin_id = admin.id if admin else None

    # Check which ones are already there by model_name
    existing = {i.model_name for i in db.query(models.Instrument).all()}

    count = 1
    for group in CATEGORIES:
        for t in group["types"]:
            if t not in existing:
                prefix = "".join([w[0].upper() for w in t.split() if w.isalpha()]) or "INST"
                if len(prefix) < 2: prefix = t[:3].upper()
                
                inst = models.Instrument(
                    manufacturer_name=group["category"],
                    manufacturer_address="Sample Address",
                    model_name=t,
                    instrument_type=t,
                    serial_number=f"{prefix}-2026-{count:04d}",
                    max_capacity=100.0,
                    min_capacity=1.0,
                    e_value=0.1,
                    d_value=0.1,
                    unit="kg",
                    accuracy_class="III",
                    created_by=admin_id,
                )
                db.add(inst)
            count += 1
    db.commit()
    db.close()

if __name__ == "__main__":
    add_missing_instruments()
    print("Instruments added successfully!")
