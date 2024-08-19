from fastapi import APIRouter, HTTPException
from pydantic import EmailStr

# from config.database import users_collection
from config.database import create_connection, execute_query, read_query
from models.user import SignUpRequest, UserInDB, LoginRequest
from utils.login_utils import get_password_hash, verify_password, generate_random_u_id

import re
from datetime import datetime

import os
import base64

route = APIRouter()

@route.post("/register") 
async def register(user: SignUpRequest):
    # DB 연결
    print("DB connected in /register\n")
    connection = create_connection()
    
    # user_in_db = await users_collection.find_one({"email": user.email})
    load_user = "SELECT * FROM user WHERE email = '{}';".format(user.email)
    user_in_db = read_query(connection, load_user)

    if user_in_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    
     # email constraint
    if "@" not in user.email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # phone_num constraint
    phone_pattern = re.compile(r"^010-\d{4}-\d{4}$")
    if not phone_pattern.match(user.phone_num):
        raise HTTPException(status_code=400, detail="Phone number must be in the format 010-XXXX-XXXX")
    
    # u_id 생성
    current = datetime.now().strftime("%Y%m%d%H%M%S")
    u_id = generate_random_u_id(current)
    
    # user_in_db = UserInDB(**user.dict(), hashed_password=hashed_password)
    # await users_collection.insert_one(user_in_db.dict())
    insert_user = """
    INSERT INTO user (u_id, name, nickname, email, parent_email, phone_num, birthday, password) 
    VALUES ('{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}');
    """.format(
        u_id,
        user.name, 
        user.nickname, 
        user.email, 
        user.parent_email, 
        user.phone_num, 
        user.birthday, 
        hashed_password
    )
    
    user_in_db = execute_query(connection, insert_user)
    
    # DB 연결 닫기 
    print("DB closed in /register\n")
    connection.close()
    
    # return user
    return {"message": "Register successfully"}

@route.post("/login")
async def login(login: LoginRequest):
    # DB 연결 생성
    print("DB connected in /login\n")
    connection = create_connection()

    # user_in_db = await users_collection.find_one({"u_email": login.email})
    load_user = "SELECT * FROM user WHERE email = '{}';".format(login.email)
    user_in_db = read_query(connection, load_user)
    
    # print("user_in_db :", user_in_db)
    # print('len : ' , len(user_in_db))
    # print('my : ', user_in_db[0][7])
    u_hashed_password = user_in_db[0][7]
    
    if user_in_db:
        print("user_in_db 테이블 데이터:")
        for user in user_in_db:
            print(user)

    if not user_in_db:
        raise HTTPException(status_code=400, detail="Invalid email")
    if not verify_password(login.password, u_hashed_password):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    print("DB closed in /login\n")
    connection.close()
    
    return {"message" : "Login successful", "u_id": str(user_in_db[0])} # 형식 변경 필요

@route.get("/user_all")
async def get_all_users():
    # DB 연결 생성
    print("DB connected in /user_all\n")
    connection = create_connection()
    
    # users = []
    # async for user in users_collection.find():
    #     user['_id'] = str(user['_id'])
    #     users.append(user)
    users = read_query(connection, "SELECT * FROM user;")
    
    if users:
        for user in users:
            # convert u_id format to string
            user = list(user)
            user[0] = str(user[0]) # 형식 변경 필요성 ?
        
    print("DB closed in /user_all\n")
    connection.close()
    
    return users

@route.delete("/user_delete")
async def delete_user(email: EmailStr):
    # DB 연결 생성
    print("DB connected in /user_delete\n")
    connection = create_connection()

    # user_in_db = await users_collection.find_one({"email": email})
    load_user = "SELECT * FROM user WHERE email = '{}';".format(email)
    user_in_db = read_query(connection, load_user)
    
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # await users_collection.delete_one({"email":email})
    delete_user = "DELETE FROM users WHERE email = '{}';".format(email)
    execute_query(connection, delete_user)
    
    print("DB closed in /user_delete\n")
    connection.close()
    
    return {"message": "User deleted successfully"}

@route.get("/info")
async def get_info():
    connection = create_connection()

@route.get("/all_badges")
async def get_all_badges():
    connection = create_connection()

    sql = """ SELECT * FROM badges where b_id = 'badge01';
"""
    response = read_query(connection, sql)

    response_with_encoded_images = []
    for row in response:
        row_list = list(row)  # 튜플을 리스트로 변환
        if row_list[1]:  # badge_logo 컬럼이 존재할 때만 처리
            try:
                # Base64 인코딩 시도를 안전하게 수행
                row_list[1] = base64.b64encode(row_list[1]).decode('utf-8')
            except Exception as e:
                print(f"Encoding error: {e}")  # 에러 로그 출력
                row_list[1] = None  # 문제가 있을 경우 None으로 설정
        response_with_encoded_images.append(tuple(row_list))
    
    # print(response)
    connection.close()

    return {"message": "All badges returned successfully", "data": response_with_encoded_images}

@route.post('/save_badge')
async def save_badge():
    
    connection = create_connection()
    cursor = connection.cursor()

    file_path = os.path.join(os.path.dirname(__file__), 'badges/badge01.webp')
    binary_data = open(file_path, 'rb').read()

    sql_update_query = """
        UPDATE badges
        SET badge_logo = %s
        WHERE b_id = %s
    """
    badge_data = (binary_data, 'badge01')

    # 데이터 업데이트 실행
    response = cursor.execute(sql_update_query, badge_data)
    connection.commit()

    cursor.close()
    connection.close()

    return {"message": "Badge saved successfully"}