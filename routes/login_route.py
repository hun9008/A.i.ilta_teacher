from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

# database에서 table 가져오기 
from config.database import users_collection
from models.user import User, UserInDB, LoginRequest
from utils.login_utils import get_password_hash, verify_password

route = APIRouter()

@route.post("/Register") 
async def register(user: User):
    user_in_db = await users_collection.find_one({"email": user.email})
    # DB에 user가 있는데 register 시도하는 경우 
    if user_in_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    await users_collection.insert_one(user_in_db.dict())
    return user

@route.post("/Login")
async def login(login: LoginRequest):
    # table(user들의 모음)에서 이메일이 input으로 들어온 이메일인걸 찾기 
    user_in_db = await users_collection.find_one({"email": login.email})
    # user DB 안에 정보가 없는데 Login 시도하는 경우
    if not user_in_db:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not verify_password(login.password, user_in_db["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {"message" : "Login successful"}