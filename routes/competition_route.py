from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
import json
from models.competition import DifficultyRequest

def get_db_connection():
    return mysql.connector.connect(
        host='118.34.163.142',
        user='root',
        password='231943',
        database='maitutor_0815',
        charset='utf8mb4',
        collation='utf8mb4_unicode_ci'
    )

route = APIRouter()

@route.post("/get_latest_competition")
async def get_latest_competition(request: DifficultyRequest):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    query = """
        SELECT * FROM competition
        WHERE JSON_UNQUOTE(JSON_EXTRACT(problem_set_json, '$[0].question_difficulty')) = %s
        ORDER BY created_at DESC
        LIMIT 1
    """
    cursor.execute(query, (request.difficulty,))
    competition = cursor.fetchone()
    
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found for the given difficulty.")
    
    cursor.close()
    connection.close()
    
    return {
        "c_id": competition['c_id'],
        "problem_set": json.loads(competition['problem_set_json']),
        "answer_set": json.loads(competition['answer_set_json'])
    }