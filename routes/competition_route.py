from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
import json
from models.competition import DifficultyRequest, AnswerResponse, SubmitCompetition, TierRequest
import re

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
    
    print("answer_set type : ", type(json.loads(competition['answer_set_json'])))
    print("answer_set : ", json.loads(competition['answer_set_json']))


    return {
        "c_id": competition['c_id'],
        "problem_set": json.loads(competition['problem_set_json']),
        "answer_set": json.loads(competition['answer_set_json'])
    }

@route.post("/submit_competition")
async def submit_competition(user_submit: SubmitCompetition):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    query = """
        SELECT * FROM competition
        WHERE c_id = %s
    """
    cursor.execute(query, (user_submit.c_id,))
    competition = cursor.fetchone()

    score = 0

    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found.")
    else:
        answer_set = json.loads(competition['answer_set_json'])
        problem_set = json.loads(competition['problem_set_json'])
        success_rate_list = [problem['question_success_rate'] for problem in problem_set]
        problem_weights = [1 / success_rate for success_rate in success_rate_list]

        def normalize_answer(answer):
            answer = re.sub(r'\\\(|\\\)|\$|\\', '', answer)
            answer = answer.replace(' ', '')
            return answer.strip().lower()

        questions = len(answer_set)
        for i in range(questions):
            correct_answer = normalize_answer(answer_set[i]['answer'])
            user_answer = normalize_answer(user_submit.answers[i]['user_answer'])
            
            if correct_answer == user_answer:
                score += problem_weights[i] * 10
        
    score_set_query = """
        UPDATE user
        SET score = score + %s
        WHERE u_id = %s;
    """
    cursor.execute(score_set_query, (score, user_submit.u_id))
    connection.commit()

    cursor.close()
    connection.close()

    return {"message": "Competition submitted successfully", "score": score}

@route.get("/get_user_tier")
async def get_user_tier(request: TierRequest):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
        SELECT score FROM user
        WHERE u_id = '%s'
    """
    cursor.execute(query, (request.u_id,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    score = user['score']

    tier = "Bronze"
    if score >= 1000:
        tier = "Silver"
    if score >= 5000:
        tier = "Gold"
    if score >= 10000:
        tier = "Platinum"
    if score >= 15000:
        tier = "Diamond"
        
    cursor.close()
    connection.close()

    return {"message": "User tier retrieved successfully", "tier": tier}
    
