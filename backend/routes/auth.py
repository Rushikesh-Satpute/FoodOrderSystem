from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import hashlib

from database import db

router = APIRouter(prefix="/auth", tags=["auth"])

users_collection = db["users"]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


class UserRegister(BaseModel):
    username: str
    password: str
    role: str = "user"  # "user" or "admin"


class UserLogin(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(data: UserRegister):
    # check if username already exists
    existing = await users_collection.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # validate role
    if data.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    user = {
        "username": data.username,
        "password": hash_password(data.password),
        "role": data.role,
    }
    await users_collection.insert_one(user)

    return {"username": data.username, "role": data.role}


@router.post("/login")
async def login(data: UserLogin):
    user = await users_collection.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user["password"] != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"username": user["username"], "role": user["role"]}
