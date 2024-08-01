from fastapi import APIRouter, Depends, HTTPSException, status
from pydantic import EmailStr

# database에서 table 가져오기 
from config.database import users_collection
from models import User, UserInDB
from utils import get_password_hash, verify_password

router = APIRouter()

@route.post("/Register", response_model=User) #프론트에서 post 요청을 보내는 주소(원래 주소 + reg)
async def register(user: User): #-> dict: # return을 dict로 하겠다고 명시(dict가 아니면 error) 
    user_in_db = await users_collection.find_one({"email": user.email})
    # DB에 user가 있는데 register 시도하는 경우 
    if user_in_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    await users_collection.insert_one(user_in_db.dict())
    return user

@route.post("/Login")
async def login(email: EmailStr, password: str):
    # table(user들의 모음)에서 이메일이 input으로 들어온 이메일인걸 찾기 
    user_in_db = await users_collection.find_one({"email": email})
    # user DB 안에 정보가 없는데 Login 시도하는 경우
    if not user_in_db:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not verify_password(password, user_in_db["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {"message" : "Login successful"}