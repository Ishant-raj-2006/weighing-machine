"""
Seeds the database with demo users (and one sample instrument) the first
time the app runs against an empty database. Safe to import/run multiple
times — it checks before inserting.
"""
from sqlalchemy.orm import Session
from . import models, auth


DEMO_USERS = [
    {"username": "admin", "password": "Admin123", "full_name": "Ishant ", "role": "admin"},
    {"username": "labmanager", "password": "LabManager123", "full_name": " Archna kumari", "role": "lab_manager"},
    {"username": "tester", "password": "Tester123", "full_name": "Aushaka ", "role": "testing_officer"},
    {"username": "reviewer", "password": "Reviewer123", "full_name": "Kajal ", "role": "reviewer"},
]


def run_seed(db: Session) -> None:
    if db.query(models.User).count() == 0:
        for u in DEMO_USERS:
            db.add(models.User(
                username=u["username"],
                hashed_password=auth.hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
            ))
        db.commit()
        print("[seed] Demo users created:", ", ".join(f'{u["username"]}/{u["password"]}' for u in DEMO_USERS))

    if db.query(models.Instrument).count() == 0:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        
        CATEGORIES = [
          {"category": "Home & Health Care Scales", "types": ["Digital Body Scale", "Analog Spring Scale", "Smart Body Composition Scale", "Baby Weighing Scale", "Kitchen / Food Scale"]},
          {"category": "Commercial & Retail Scales", "types": ["Price Computing Scale", "Counter / Bench Scale", "Hanging / Luggage Scale", "POS Billing Scale"]},
          {"category": "Scientific & Precision Scales", "types": ["Analytical Balance", "Jewelry Scale", "Counting Scale"]},
          {"category": "Heavy Industrial & Logistics Scales", "types": ["Platform / Floor Scale", "Crane Scale", "Forklift Scale", "Conveyor Scale", "Tank & Silo Scale"]},
          {"category": "Transport & Heavy Vehicle Scales", "types": ["Weighbridge / Truck Scale", "Axle Scale"]}
        ]
        
        count = 1
        for group in CATEGORIES:
            for t in group["types"]:
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
                    created_by=admin.id if admin else None,
                )
                db.add(inst)
                count += 1
        db.commit()
        print("[seed] Sample instruments created for all categories.")
