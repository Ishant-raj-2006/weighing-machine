"""
Seeds the database with demo users (and one sample instrument) the first
time the app runs against an empty database. Safe to import/run multiple
times — it checks before inserting.
"""
from sqlalchemy.orm import Session
from . import models, auth


DEMO_USERS = [
    {"username": "admin", "password": "admin123", "full_name": "System Administrator", "role": "admin"},
    {"username": "labmanager", "password": "lab123", "full_name": "Priya Sharma", "role": "lab_manager"},
    {"username": "tester", "password": "test123", "full_name": "Rohit Verma", "role": "testing_officer"},
    {"username": "reviewer", "password": "review123", "full_name": "Anjali Nair", "role": "reviewer"},
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
        sample = models.Instrument(
            manufacturer_name="Precision Weightech Pvt. Ltd.",
            manufacturer_address="Plot 14, Industrial Area, Patna, Bihar",
            model_name="PW-500E",
            instrument_type="Electronic Platform Scale",
            serial_number="PW500E-2026-0001",
            max_capacity=500,
            min_capacity=2,
            e_value=0.1,
            d_value=0.1,
            unit="kg",
            accuracy_class="III",
            created_by=admin.id if admin else None,
        )
        db.add(sample)
        db.commit()
        print("[seed] Sample instrument created: PW500E-2026-0001")
