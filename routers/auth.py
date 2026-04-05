from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from auth import hash_password, verify_password, create_access_token
import schemas
from utils import fix_id

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db = Depends(get_db)):
    # check duplicate email
    existing = db["users"].find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user.role not in ("admin", "teacher", "student"):
        raise HTTPException(status_code=400, detail="Role must be admin, teacher, or student")

    db_user = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "role": user.role,
    }
    result = db["users"].insert_one(db_user)
    db_user["_id"] = result.inserted_id
    return fix_id(db_user)


@router.post("/login", response_model=schemas.Token)
def login(creds: schemas.UserLogin, db = Depends(get_db)):
    user = db["users"].find_one({"email": creds.email})
    if not user or not verify_password(creds.password, user.get("hashed_password")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = fix_id(user)
    token = create_access_token({"sub": str(user["id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": str(user["id"]),
        "name": user["name"],
    }
