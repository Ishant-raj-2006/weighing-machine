import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

def update_users():
    db = SessionLocal()
    
    # Delete 'admin' and 'labmanager'
    users_to_delete = db.query(User).filter(User.username.in_(["admin", "labmanager"])).all()
    for u in users_to_delete:
        db.delete(u)
        print(f"Deleted user: {u.username}")
    
    # Add Sudhanshu Kumar
    new_user = User(
        username="Sudhanshu_Kumar",
        full_name="Sudhanshu Kumar",
        hashed_password=hash_password("Sudhanshu_Kumar123"),
        role="admin",
        is_active=True
    )
    db.add(new_user)
    print("Added user: Sudhanshu_Kumar")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    update_users()
