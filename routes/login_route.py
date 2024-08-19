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
import json

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
    INSERT INTO user (u_id, name, nickname, email, parent_email, phone_num, birthday, password, school) 
    VALUES ('{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}');
    """.format(
        u_id,
        user.name, 
        user.nickname, 
        user.email, 
        user.parent_email, 
        user.phone_num, 
        user.birthday, 
        hashed_password,
        user.school
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
    u_id = user_in_db[0][0]

    load_progress_unit = "SELECT conceptname, my_acc, top_acc, solved_num from progress_unit where u_id = '{}';".format(u_id)
    progress_unit = read_query(connection, load_progress_unit)

    load_z_log = "SELECT date, z_score FROM z_log WHERE u_id = '{}';".format(u_id)
    z_log = read_query(connection, load_z_log)

    load_weekly_reports = "SELECT solved_prob_this_week, solved_prob_last_week, study_time_this_week, study_time_last_week FROM weekly_reports WHERE u_id = '{}';".format(u_id)
    weekly_reports = read_query(connection, load_weekly_reports)

    load_badges = "SELECT b_id FROM user WHERE u_id = '{}';".format(u_id)
    badges = read_query(connection, load_badges)
    print(badges)

    if badges and badges[0][0]:
        b_id_json = badges[0][0]
        b_id_list = json.loads(b_id_json)
        badges_tuple = tuple(b_id_list)
        
        # badges 테이블에서 해당하는 뱃지 정보 조회
        if len(badges_tuple) == 1:
            badges_tuple = (badges_tuple[0],)  # 단일 요소 튜플 처리
        
        load_badge_details = "SELECT * FROM badges WHERE b_id IN {};".format(badges_tuple)
        response = read_query(connection, load_badge_details)
        response_with_encoded_images = []
        for row in response:
            row_list = list(row) 
            if row_list[1]: 
                try:
                    row_list[1] = base64.b64encode(row_list[1]).decode('utf-8')
                except Exception as e:
                    print(f"Encoding error: {e}") 
                    row_list[1] = None  
            response_with_encoded_images.append(tuple(row_list))  
        badge_details = response_with_encoded_images
    else:
        badge_details = []


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
    
    return {"message" : "Login successful", "u_id": str(user_in_db[0][0]),
            "name" : user_in_db[0][1],
            "nickname" : user_in_db[0][2],
            "email" : user_in_db[0][3],
            "parent_email" : user_in_db[0][4],
            "phone_num" : user_in_db[0][5],
            "birthday" : user_in_db[0][6],
            "avg_focusing_level" : user_in_db[0][8],
            "school" : user_in_db[0][9],
            "progress_unit" : progress_unit,
            "z_log" : z_log,
            "weekly_reports" : weekly_reports,
            "badge_details" : badge_details
            } # 형식 변경 필요

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