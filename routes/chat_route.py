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

sleep_time = 5

# (assume) define user_status
user_vars.user_status = "doing"
user_context = {}  # 사용자의 상태와 관련된 데이터를 저장
step_elements = []
user_step_cnt = 0

hand_detect_dummy = {
  "prob_area": [
    [
      47,
      40,
      496,
      428
    ],
    [
      45,
      471,
      498,
      474
    ],
    [
      47,
      948,
      499,
      401
    ],
    [
      595,
      35,
      494,
      486
    ],
    [
      599,
      524,
      490,
      429
    ],
    [
      602,
      956,
      490,
      393
    ]
  ],
  "prob_num": 1
}

async def decide_user_wrong(websocket: WebSocket):
    while True:
        
        await asyncio.sleep(sleep_time)  
        
        # print("len(concepts) : ", len(concepts_storage))
        # print("len(solutions) : ", len(solutions_storage))
        # print("len(ocrs) : ", len(ocrs_storage))
        # print("len(origin_image) : ", len(origin_image_storage))
        # print("type of origin_image : ", type(origin_image_storage))
        if len(solutions_storage) != 0 and len(ocrs_storage) != 0 and len(origin_image_storage) != 0:
            # directory path
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
            storage_dir = os.path.join(root_dir, "local_storage/mobile")
            
            file_list = glob.glob(os.path.join(storage_dir, "*"))
            if not file_list:
                print("@@@@@@@@@@@@@@@@@@@@@@@@@")
                print("@ warning: no mobile image @")
                print("@@@@@@@@@@@@@@@@@@@@@@@@@")
                continue  # 혹시 이미지가 없는 경우

            latest_img = max(file_list, key=os.path.getctime)
            
            # # encoding 
            with open(latest_img, "rb") as target_img:
                include_hand = base64.b64encode(target_img.read()).decode('utf-8')
            
            problem_detect_json = {
                "image_clean" : origin_image_storage[0],
                "image_hand" : include_hand
            }

            url = "http://model.maitutor.site/prob_areas_which_prob"

            headers = {'Content-Type': 'application/json'}
            response = await asyncio.to_thread(requests.post, url, json=problem_detect_json, headers=headers)
            
            # response = hand_detect_dummy
            # print("hand response : ", response)
            decode_image = base64.b64decode(include_hand)
            image = Image.open(io.BytesIO(decode_image))
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            image_array = np.array(image)

            # # (assume) 지금 어떤 문제 풀고 있는지 알아내기
            # prob_num = response.get("prob_num")
            if type(response) == json:
                prob_num = response.get("prob_num")
            elif type(response) == dict:
                prob_num = response["prob_num"]
            elif isinstance(response, requests.models.Response):
                try:
                    response_json = response.json()  # JSON 응답을 파싱
                    prob_num = response_json.get("prob_num")
                    print("I deal with prob_position : ", prob_num)
                except json.JSONDecodeError:
                    print("warning: JSON decoding failed")
                    prob_num = -1
            else:
                print("warning (unexpected type) :", type(response))
                prob_num = -1
            
            problem_index = 0
            if prob_num != -1:
                problem_index = prob_num
                prob_area = response.json().get("prob_area")
                this_prob_area = prob_area[problem_index]
                ## 전체 이미지에서 this_prob_area에 해당하는 부분만 crop
                x, y, w, h = this_prob_area

                crop_image = image_array[y:y+h, x:x+w]
                pil_img = Image.fromarray(crop_image)
                buffered = io.BytesIO()
                pil_img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                

                # problem_index = 0
                solution = solutions_storage[problem_index]

                print("@@@ type check | img_str : ", type(img_str))
                print("@@@ type check | solution : ", type(solution))
                hand_ocr = await perform_handwrite_ocr(img_str, solution)

                print("hand_ocr_reslut : ", hand_ocr.json().get("ocr_result"))
                print("hand_ocr_determinants : ", hand_ocr.json().get("determinants"))

                user_vars.user_status = hand_ocr.json().get("determinants")
            else:
                print("@@@ warning : prob_num is -1")
                hand_ocr = {
                    "determinants": "solve_delay"
                }
            
                user_vars.user_status = hand_ocr.get("determinants")
            # print("user_status : ", user_vars.user_status)
        
async def perform_handwrite_ocr(frame_data, solution):
    
    print("test) Decide user status by handwrite OCR")
    
    url = "http://model.maitutor.site/hand_ocr"
    
    payload = {
        "image": frame_data,
        "solution": solution 
    }
    headers = {'Content-Type': 'application/json'} 
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)
    return response
     
@route.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    background_task = asyncio.create_task(decide_user_wrong(websocket))

    try:
        data = await websocket.receive_text()
        message = json.loads(data)
        
        # ChatRequest로 변환
        chat_request = ChatRequest(**message)
        
        # status가 "open"일 경우에만 웹소켓을 열어 연결 목록에 추가
        print("chat_request : ", chat_request)
        if chat_request.status == "open":
            connections.append(websocket)

            await websocket.send_text("문제를 풀어보자! 내가 잘못된 부분이 있으면 알려줄게.")
            await websocket.send_text("status : " + user_vars.user_status)
            # response = await process_message(chat_request)
            # await websocket.send_text(response)
            
            for solution in solutions_storage:
                if type(solution) == list:
                    print("warning : solution is list")
                else:
                    print("I deal with solution!")
                    steps = re.split(r'\*\*Step \d+:\*\*|\*\*Answer:\*\*', solution)
                    steps_array = [step.strip() for step in steps[1:] if step.strip()]

                    if len(steps_array) > 0:
                        steps_array[-1] = f"Answer: {steps_array[-1]}"

                    # for i, step in enumerate(steps_array):
                    #     print(f"Step {i+1}: {step}")

                    step_elements.append(steps_array)
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
                    elif response == '문제를 해결했어! 다른 문제를 풀어볼까?':
                        await websocket.send_text(response)
                        await websocket.send_text("status : " + user_vars.user_status)
                        break
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
    
    # print("test) OCR : "+ ocr)
    # print("test) PREV_CHAT : "+ prev_chat)
    
    # user_vars.user_status = ""
    if user_vars.user_status == "solve_delay":

        if not user_context[user_id].get("solve_delay"):
            user_context[user_id] = {"solve_delay": True, "prev_chat": ""}
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
                return ''
            else:
                response = "모든 단계를 설명했어. 다른 질문이 있으면 물어봐."
                user_step_cnt += 1

    elif user_vars.user_status == "solve":
        user_context[user_id]["solve_delay"] = False 
        user_context[user_id]["wrong"] = False
        
        #한 문제 풀었으면 prev_chat init
        user_context[user_id] = {"prev_chat": ""} 
        
        ## DB에 state 저장
        response = "문제를 해결했어! 다른 문제를 풀어볼까?"
        
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