import mysql.connector
import json
import random
import time
import threading
import string
from decimal import Decimal

stop_thread_flag = False
focusing_thread = None

# MySQL 연결 설정
def get_db_connection():
    return mysql.connector.connect(
        host='118.34.163.142',
        user='root',
        password='231943',
        database='maitutor_0815',
        charset='utf8mb4',
        collation='utf8mb4_unicode_ci'
    )

def generate_random_competition(difficulty, term):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM question_data WHERE question_difficulty = %s ORDER BY RAND() LIMIT 10", (difficulty,))
    questions = cursor.fetchall()

    problem_set = []
    answer_set = []

    for question in questions:
        problem_set.append({
            'q_id': question['q_id'],
            'question_text': question['question_text'],
            'question_difficulty': question['question_difficulty'],
            'question_success_rate': float(question['question_success_rate']) if isinstance(question['question_success_rate'], Decimal) else question['question_success_rate'],
        })
        answer_set.append({
            'q_id': question['q_id'],
            'answer_text': question['answer_text'],
            'answer': question['answer']
        })

    c_id = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=30))
    problem_set_json = json.dumps(problem_set, ensure_ascii=False)
    answer_set_json = json.dumps(answer_set, ensure_ascii=False)

    insert_query = "INSERT INTO competition (c_id, problem_set_json, answer_set_json, difficulty, term) VALUES (%s, %s, %s, %s, %s)"
    cursor.execute(insert_query, (c_id, problem_set_json, answer_set_json, difficulty, term))
    connection.commit()

    cursor.close()
    connection.close()

    print(f"New competition generated for difficulty {difficulty}, term {term} and saved to the database.")

def user_focusing_level_calculation(u_id, s_id):

    pass

def start_background_task():
    while True:
        current_time = time.strftime("%H:%M")
        if current_time == "17:30":
            print("Generating new competition sets...")
            
            for difficulty in [1, 2, 3]:
                for term in [1, 2, 3]:
                    generate_random_competition(difficulty, term)
            
            print("New competitions generated.")
            time.sleep(60) 
        
        time.sleep(30)

# def start_background_task():
#     while True:
#         print("Generating new competition sets...")
        
#         for difficulty in [1, 2, 3]:
#             for term in [1, 2, 3]:
#                 generate_random_competition(difficulty, term)
        
#         print("New competitions generated.")
#         time.sleep(60)

def start_focusing_level_task():
    global focusing_thread
    focusing_thread = threading.Thread(target=user_focusing_level_calculation, daemon=True)
    focusing_thread.start()


def end_focusing_level_task():
    global stop_thread_flag
    global focusing_thread

    stop_thread_flag = True

    if focusing_thread is not None:
        focusing_thread.join()
        print("Focusing level calculation task stopped.")

def start_task():
    threading.Thread(target=start_background_task, daemon=True).start()

