from fastapi import APIRouter, HTTPException
from pydantic import EmailStr

# database에서 table 가져오기 
from config.database import users_collection
from models.user import User, UserInDB, LoginRequest
from utils.login_utils import get_password_hash, verify_password

route = APIRouter()

@route.post("/register") 
async def register(user: User):
    user_in_db = await users_collection.find_one({"email": user.email})
    # DB에 user가 있는데 register 시도하는 경우 
    if user_in_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    await users_collection.insert_one(user_in_db.dict())
    return user

@route.post("/login")
async def login(login: LoginRequest):
    # table(user들의 모음)에서 이메일이 input으로 들어온 이메일인걸 찾기 
    user_in_db = await users_collection.find_one({"u_email": login.email})
    # user DB 안에 정보가 없는데 Login 시도하는 경우
    if not user_in_db:
        raise HTTPException(status_code=400, detail="Invalid email")
    if not verify_password(login.password, user_in_db["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    return {"message" : "Login successful"}

@route.get("/user_all")
async def get_all_users():
    users = []
    async for user in users_collection.find():
        user['_id'] = str(user['_id'])
        users.append(user)
    return users

@route.delete("/user_delete")
async def delete_user(email: EmailStr):
    # 이메일로 user 찾기
    user_in_db = await users_collection.find_one({"email": email})
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # user 삭제
    await users_collection.delete_one({"email":email})
    return {"message": "User deleted successfully"}