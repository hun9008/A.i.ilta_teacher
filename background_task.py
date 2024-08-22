import mysql.connector
import json
import random
import time
import threading
import string
from decimal import Decimal
import requests
import os
import base64
from datetime import datetime

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

    # local_storage/pc의 가장 최근 사진을 model.maitutor.site/face_tracker로 전송
    timer_running = False
    start_time = None
    focus_time_threshold = 60

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

    while True:

        image_path = os.path.join(root_dir, "local_storage/pc")
        all_pc_images = os.listdir(image_path)

        if len(all_pc_images) > 0:
            recent_pc_image = all_pc_images[-1]

            with open(f"{image_path}/{recent_pc_image}", "rb") as f:
                image_data = f.read()

            encoding_image = base64.b64encode(image_data).decode('utf-8')

            response = requests.post("model.maitutor.site/face_tracker", json={"image": encoding_image})

            if stop_thread_flag:
                break
            elif response.status_code != 200:
                print("Face tracker model request failed.")
            else:
                is_focus = response["is_focus"]
                if is_focus != 1:
                    if not timer_running:
                        start_time = datetime.now()
                        timer_running = True
                        print("User is not focusing.")
                else:
                    if timer_running:
                        end_time = datetime.now()
                        elapsed_time = (end_time - start_time).total_seconds()

                        if elapsed_time >= focus_time_threshold:
                            
                            connection = get_db_connection()
                            cursor = connection.cursor()

                            insert_query = "INSERT INTO not_focusing_time (u_id, s_id, not_f_time_s, not_f_time_e, not_f_time_t) VALUES (%s, %s, %s, %s, %s)"
                            cursor.execute(insert_query, (u_id, s_id, start_time, end_time, elapsed_time))
                            connection.commit()

                            cursor.close()
                            connection.close()
                            
                            print(f"Unfocused time recorded: {elapsed_time} seconds.")

                        timer_running = False

            time.sleep(60)
        else:
            time.sleep(120)


    

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

def start_focusing_level_task(u_id, s_id):
    global focusing_thread
    focusing_thread = threading.Thread(target=user_focusing_level_calculation, args=(u_id, s_id), daemon=True)
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

