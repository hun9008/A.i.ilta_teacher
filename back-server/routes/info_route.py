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

@route.get("/all_badges")
async def get_all_badges():
    connection = create_connection()

    sql = """ SELECT * FROM badges;
"""
    response = read_query(connection, sql)

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
    
    # print(response)
    connection.close()

    return {"message": "All badges returned successfully", "data": response_with_encoded_images}

@route.get("/all_badges_wo_logo")
async def get_all_badges():
    connection = create_connection()

    sql = """ SELECT b_id, name, description FROM badges;
"""
    response = read_query(connection, sql)
    
    # print(response)
    connection.close()

    return {"message": "All badges returned successfully", "data": response}

# @route.post('/save_badge')
# async def save_badge():
    
#     connection = create_connection()
#     cursor = connection.cursor()

#     file_path = os.path.join(os.path.dirname(__file__), 'badges/badge05.webp')
#     binary_data = open(file_path, 'rb').read()

#     sql_update_query = """
#         UPDATE badges
#         SET badge_logo = %s
#         WHERE b_id = %s
#     """
#     badge_data = (binary_data, 'badge05')

#     # 데이터 업데이트 실행
#     response = cursor.execute(sql_update_query, badge_data)
#     connection.commit()

#     cursor.close()
#     connection.close()

#     return {"message": "Badge saved successfully", "data": response}