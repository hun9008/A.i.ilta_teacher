import os
import glob
import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse # API response를 JSON 형식으로 반환
from openai import OpenAI
from dotenv import load_dotenv
from models.chat import ChatRequest

from utils.problem import concepts_storage, solutions_storage, ocrs_storage, origin_image_storage
from utils.chat_utils import prompt_delay, prompt_wrong
from fastapi import WebSocket, WebSocketDisconnect
from config import user_vars
import base64
import requests
import re

from PIL import Image
import io
import numpy as np
# import matplotlib.pyplot as plt

route = APIRouter()

# 환경 변수 로드
load_dotenv()

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# websocket 연결 관리 
connections = []

sleep_time = 1

# (assume) define user_status
user_vars.user_status = "doing"
user_context = {}  # 사용자의 상태와 관련된 데이터를 저장
step_elements = []
user_step_cnt = 0

wrong_block_list = []
delay_block_list = []
user_look = {}
solve_problem = []

async def decide_user_wrong(websocket: WebSocket, user_id: str):
    try:
        while True:
            await asyncio.sleep(sleep_time)  
            # 디버그 로그 추가
            print("Running decide_user_wrong loop")

            # 여기서 에러가 발생할 가능성이 있는 모든 코드를 try-except로 감싸서 에러 로그 확인
            try:
                # 여기에 현재 실행하고 있는 코드들
                # 문제 발생 가능성 있는 부분을 전부 감싸기
                if len(solutions_storage) != 0 and len(ocrs_storage) != 0 and len(origin_image_storage) != 0:
                    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
                    storage_dir = os.path.join(root_dir, "local_storage/mobile")

                    file_list = glob.glob(os.path.join(storage_dir, "*"))
                    if not file_list:
                        print("@@@@@@@@@@@@@@@@@@@@@@@@@")
                        print("@ warning: no mobile image @")
                        print("@@@@@@@@@@@@@@@@@@@@@@@@@")
                        continue  # 혹시 이미지가 없는 경우

                    latest_img = max(file_list, key=os.path.getctime)

                    latest_img_name = latest_img.split("/")[-1]
                    print("latest_img_name : ", latest_img_name)
                    
                    with open(latest_img, "rb") as target_img:
                        include_hand = base64.b64encode(target_img.read()).decode('utf-8')
                    
                    problem_detect_json = {
                        "origin_image" : origin_image_storage[0],
                        "hand_image" : include_hand
                    }

                    url = "http://model.maitutor.site/hand_determinant"

                    headers = {'Content-Type': 'application/json'}
                    response = await asyncio.to_thread(requests.post, url, json=problem_detect_json, headers=headers)

                    if isinstance(response, requests.models.Response):
                        try:
                            response_json = response.json()
                            prob_num = response_json.get("handwrite_num")
                            print("I deal with prob_position : ", prob_num)
                            user_look[user_id] = prob_num
                        except json.JSONDecodeError:
                            print("warning: JSON decoding failed")
                            prob_num = -1
                    else:
                        print("warning (unexpected type) :", type(response))
                        prob_num = -1

                    if prob_num == -1:
                        user_vars.user_status = "doing"
                    else:
                        hand_write_image = response_json.get("user_handwrite_image")
                        if hand_write_image is None:
                            print("Warning: hand_write is None")
                            continue
                        solution = solutions_storage[0][prob_num]

                        print("solution : ", solution)

                        hand_response = await perform_handwrite_ocr(hand_write_image, solution)

                        if hand_response.status_code == 200:
                            if (user_id not in delay_block_list) and (user_id not in wrong_block_list):
                                user_vars.user_status = hand_response.json().get("determinants")
                            else:
                                print("This time is Locked")
                        else:
                            user_vars.user_status = "doing"

            except Exception as e:
                print(f"Error in decide_user_wrong loop: {str(e)}")
        
    except Exception as e:
        print(f"Critical error in decide_user_wrong: {str(e)}")
        
async def perform_handwrite_ocr(hand_write_image, solution):
    
    print("test) Decide user status by handwrite OCR")
    
    url = "http://model.maitutor.site/hand_ocr"
    
    payload = {
        "hand_write_image": hand_write_image,
        "solution": solution 
    }
    headers = {'Content-Type': 'application/json'} 
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)
    return response
     
@route.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # background_task = asyncio.create_task(decide_user_wrong(websocket))

    try:
        data = await websocket.receive_text()
        message = json.loads(data)
        
        # ChatRequest로 변환
        chat_request = ChatRequest(**message)
        
        # status가 "open"일 경우에만 웹소켓을 열어 연결 목록에 추가
        print("chat_request : ", chat_request)
        if chat_request.status == "open":
            connections.append(websocket)

            background_task = asyncio.create_task(decide_user_wrong(websocket, chat_request.u_id))

            await websocket.send_text("문제를 풀어보자! 내가 잘못된 부분이 있으면 알려줄게.")
            await websocket.send_text("status : " + user_vars.user_status)
            solve_problem.clear()
            # response = await process_message(chat_request)
            # await websocket.send_text(response)
            
            for solution in solutions_storage[0]:
                if type(solution) == list:
                    print("right solution type : list")
                    net_solution = solution[0]
                    steps = re.split(r'\*\*Step \d+:\*\*|\*\*Answer:\*\*', net_solution)
                    steps_array = [step.strip() for step in steps[1:] if step.strip()]

                    if len(steps_array) > 0:
                        steps_array[-1] = f"Answer: {steps_array[-1]}"
                    
                    step_elements.append(steps_array)
                    print("step_elements : ", step_elements)
                    print("len(step_elements) : ", len(step_elements))

                elif type(solution) == str:
                    print("right solution type : str")
                    net_solution = solution
                    print("net_solution : ", net_solution)
                    steps = re.split(r'\*\*Step \d+:\*\*|\*\*Answer:\*\*', net_solution)
                    steps_array = [step.strip() for step in steps[1:] if step.strip()]

                    if len(steps_array) > 0:
                        steps_array[-1] = f"Answer: {steps_array[-1]}"
                    
                    step_elements.append(steps_array)
                    print("step_elements : ", step_elements)
                    print("len(step_elements) : ", len(step_elements))

                else:
                    # print("I deal with solution!")
                    print("Unexpected solution")
                    # steps = re.split(r'\*\*Step \d+:\*\*|\*\*Answer:\*\*', solution)
                    # steps_array = [step.strip() for step in steps[1:] if step.strip()]

                    # if len(steps_array) > 0:
                    #     steps_array[-1] = f"Answer: {steps_array[-1]}"

                    # # for i, step in enumerate(steps_array):
                    # #     print(f"Step {i+1}: {step}")

                    # step_elements.append(steps_array)
        else:
            print("test) WebSocket connection not opened or already open")
        
        while True:
            try:
                # 유저 메시지를 수신하고 바로 처리
                data = await asyncio.wait_for(websocket.receive_text(), timeout=sleep_time)
                message = json.loads(data)
                chat_request = ChatRequest(**message)
                print("chat_request : ", chat_request)

                response = await process_message(chat_request)

                if response:
                    await websocket.send_text(response)
                    await websocket.send_text("status : " + user_vars.user_status)

            except asyncio.TimeoutError:
                # sleep_time 동안 메시지가 없으면 다음 스텝 진행
                chat_request.text = ""
                response = await process_message(chat_request)
                if response:
                    if response == 'Invalid state.':
                        break
                    elif "문제를 해결했어! 다른문제를 풀어볼까?" in response:
                        if user_look.get(chat_request.u_id, 0) in solve_problem:
                            print("Already solved problem")
                        else:
                            await websocket.send_text(response)
                            await websocket.send_text("status : " + user_vars.user_status)
                        # break
                    else:
                        await websocket.send_text(response)
                        await websocket.send_text("status : " + user_vars.user_status)

            except WebSocketDisconnect:
                print("WebSocket disconnected")
                break
        
        
                
    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)
        
# 메시지 처리 로직
async def process_message(chat: ChatRequest):

    global user_step_cnt
    
    print("test) Now start process_message function. user_status : "+ user_vars.user_status + "\n")
    
    user_text = chat.text
    user_id = chat.u_id
    
    # (assume) 지금 어떤 문제 풀고 있는지 알아내기
    problem_index = 0
    # print("len(ocrs) : ", len(ocrs))
    ocr = ocrs_storage[problem_index]
    
    if user_id not in user_context:
        user_context[user_id] = {"prev_chat": ""}
        
    prev_chat = user_context[user_id].get("prev_chat", "")
    
    # delay_block_list에 u_id가 있다면
    if user_id in delay_block_list:
        print("$$$$$ delay block state $$$$$$")
        concept = concepts_storage[problem_index]

        if user_text:
            print("user text")
            prompt = prompt_delay(ocr, concept, user_text, prev_chat)
            response = await call_openai_api(prompt)
            user_context[user_id]["prev_chat"] = prompt + "\n" + "나의 답변 : " + response + "\n"
            delay_block_list.remove(user_id)
            print("$$$$$ end delay block $$$$$$")
            return response
        else:
            print("not exist user text")
            return ''
        
    if user_id in wrong_block_list:
        print("$$$$$ wrong block state $$$$$$")
        print("user_step_cnt : ", user_step_cnt)
        solution = step_elements[problem_index]

        if user_text:
            print("user text")
            all_solution = '\n'.join(solution)
            prompt = prompt_wrong(ocr, all_solution, user_text, prev_chat)
            response = await call_openai_api(prompt)
            user_context[user_id]["prev_chat"] = prompt + "\n" + "나의 답변 : " + response + "\n"
            return response
        else:
            print("not exist user text")
            print("len(solution) : ", len(solution))
            if user_step_cnt < len(solution) - 1:
                response = solution[user_step_cnt] + '\n이해했다면, 다음 단계를 설명해줄게.'
                user_step_cnt += 1
            elif user_step_cnt == len(solution) - 1:
                response = solution[user_step_cnt]
                user_step_cnt += 1
            elif user_step_cnt == len(solution) + 1:
                response = ''
            else:
                response = "모든 단계를 설명했어. 다른 질문이 있으면 물어봐."
                user_step_cnt += 1
                wrong_block_list.remove(user_id)
                print("$$$$$ end wrong block $$$$$$")
            return response
    else:

        if user_vars.user_status == "solve_delay":

            if not user_context[user_id].get("solve_delay"):
                user_context[user_id] = {"solve_delay": True, "prev_chat": ""}
                delay_block_list.append(user_id)
                print("$$$$$$ start delay block $$$$$$")
                return "문제에서 어디가 이해가 안돼?" 
            
            concept = concepts_storage[problem_index]

            if user_text:
                print("user text")
                prompt = prompt_delay(ocr, concept, user_text, prev_chat)
                response = await call_openai_api(prompt)
                user_context[user_id]["prev_chat"] = prompt + "\n" + "나의 답변 : " + response + "\n"
                return response
            else:
                print("not exist user text")
                return ''

        elif user_vars.user_status == "wrong":

            if not user_context[user_id].get("wrong"):
                user_context[user_id] = {"wrong": True, "prev_chat": ""}
                wrong_block_list.append(user_id)
                print("$$$$$$ start wrong block $$$$$$")
                return "방금 풀이에서 틀린 부분 없는지 체크해볼래?"

            solution = step_elements[problem_index]

            if user_text:
                print("user text")
                all_solution = '\n'.join(solution)
                prompt = prompt_wrong(ocr, all_solution, user_text, prev_chat)
                response = await call_openai_api(prompt)
                user_context[user_id]["prev_chat"] = prompt + "\n" + "나의 답변 : " + response + "\n"
                return response
            else:
                print("not exist user text")
                if user_step_cnt < len(solution) - 1:
                    response = solution[user_step_cnt] + '\n이해했다면, 다음 단계를 설명해줄게.'
                    user_step_cnt += 1
                elif user_step_cnt == len(solution) - 1:
                    response = solution[user_step_cnt]
                    user_step_cnt += 1
                elif user_step_cnt == len(solution) + 1:
                    response = ''
                else:
                    response = "모든 단계를 설명했어. 다른 질문이 있으면 물어봐."
                    user_step_cnt += 1
                return response

        elif user_vars.user_status == "solve":
            user_context[user_id]["solve_delay"] = False 
            user_context[user_id]["wrong"] = False
            
            #한 문제 풀었으면 prev_chat init
            user_context[user_id] = {"prev_chat": ""} 
            
            solve_problem.append(user_look[user_id])
            print("solve_problem : ", solve_problem)

            ## DB에 state 저장
            response = "{}번째 문제를 해결했어! 다른문제를 풀어볼까?".format(solve_problem)
            
        elif user_vars.user_status == "doing":
            # response = ''
            if user_text:
                response = await call_openai_api(user_text)
                user_context[user_id]["prev_chat"] = user_text + "\n" + "나의 답변 : " + response + "\n"
                return response
            else:
                return ''
            
        else:
            response = "Invalid state."
        
        return response

# OpenAI API 호출 함수
async def call_openai_api(prompt):
    try:
        # 답변 받아오기
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt}
            ],
            max_tokens=2000,
        )
        
        print("test) Get response from call_open_api func. response : ", response)
        
        # print(JSONResponse(content=response.choices[0].message.content))
        response_content = response.choices[0].message.content
        
        # string으로 return 
        return response_content

    except Exception as e:
        return f"OpenAI API error: {str(e)}"