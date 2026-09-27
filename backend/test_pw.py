from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_str = "$2b$12$0nYmKt1/T07BigFZ.NiUP.92y6qLoccGkJ3.2x9eAtlaUED7HLCJO"
print("Verify:", pwd_context.verify("Admin!Secured@2026", hash_str))
