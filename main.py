from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import EmailStr

from motor.motor_asyncio import AsyncIOMotorClient
from models import User, UserInDB
from utils import get_password_hash, verify_password

app = FastAPI()

# config 

## specify host and port or conn URLs
client = AsyncIOMotorClient("mongodb://localhost:27017")
## dot notation으로 DB reference
db = client.myproject
users_collection = db.users #table

# 라우트 get post -> app말고 라우터로 따로  => main에다 Include해주기 
@app.post("/register", response_model=User) #프론트에서 post 요청을 보내는 주소(원래 주소 + reg)
async def register(user: User): #-> dict: # return을 dict로 하겠다고 명시(dict가 아니면 error) 
    user_in_db = await users_collection.find_one({"email": user.email})
    if user_in_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    await users_collection.insert_one(user_in_db.dict())
    return user

@app.post("/login")
async def login(email: EmailStr, password: str):
    # user들의 모음에서 이메일이 input으로 들어온 이메일인걸 찾기 
    user_in_db = await users_collection.find_one({"email": email})
    # user DB 안에 정보가 없는 경우
    if not user_in_db: 
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not verify_password(password, user_in_db["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {"message" : "Login successful"}
