import os
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph= PasswordHasher()

def hash_password(password: str)-> str:
    return ph.hash(password)
def verify_password(password: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except VerifyMismatchError:
        return False
def create_access_token(user_id:int):
    expire= datetime.now(timezone.utc)+ timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES")))

    payload={"user_id": user_id, "exp" : expire}

    token= jwt.encode(payload, os.getenv("JWT_SECRET_KEY"), algorithm= os.getenv("JWT_ALGORITHM"))

    return token


