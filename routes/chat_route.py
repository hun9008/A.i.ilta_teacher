import os
import json
from fastapi import APIRouter
from fastapi.responses import JSONResponse # API response를 JSON 형식으로 반환
from openai import OpenAI
from dotenv import load_dotenv
from models.chat import ChatRequest

from utils.problem import concepts, solutions, ocrs
from utils.chat_utils import prompt_delay, prompt_wrong
from fastapi import WebSocket, WebSocketDisconnect

route = APIRouter()

# 환경 변수 로드
load_dotenv()

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# websocket 연결 관리 
connections = []

# (assume) define user_status
user_status = "solve_delay"
user_context = {}  # 사용자의 상태와 관련된 데이터를 저장

@route.websocket("/ws/chat")
# front에서 status를 open으로 주면 websocket 열어줌
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # ChatRequest로 변환
            chat_request = ChatRequest(**message)
            
            # status가 "open"일 경우에만 웹소켓을 열어 연결 목록에 추가
            if chat_request.status == "open":
                connections.append(websocket)
                await websocket.send_text("WebSocket connection opened.")
            else: #chat_request.status == "chat":
                print("test) WebSocket connection not opened or already open")
            # 메시지 처리
            response = await process_message(chat_request)
            
            # 사용자에게 응답 전송
            await websocket.send_text(response)
                
    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)
        # await websocket.close()
        
# 메시지 처리 로직
async def process_message(chat: ChatRequest):
    
    print("test) Now start process_message function")
    
    user_text = chat.text
    user_id = chat.u_id
    
    # (assume) 지금 어떤 문제 풀고 있는지 알아내기
    problem_index = 0
    
    # 해당 인덱스에 해당하는 문제(ocr 결과), concept, solution 가져오기
    ocr = ocrs[problem_index]
    
    if user_id not in user_context:
        user_context[user_id] = {"prev_chat": ""}
        
    prev_chat = user_context[user_id].get("prev_chat", "")
    
    print("test) OCR : "+ ocr)
    print("test) PREV_CHAT : "+ prev_chat)
    
    if user_status == "solve_delay":
        
        print("test) user_status is always solve_delay in test.")
        
        # init: 질문 전송
        if not user_context[user_id].get("solve_delay"):
            user_context[user_id] = {"solve_delay": True, "prev_chat": ""}
            return "어디가 이해가 안돼?"
        
        # 사용자의 응답을 받은 경우, OpenAI API로 전송
        concept = concepts[problem_index]
        prompt = prompt_delay(ocr, concept, user_text, prev_chat)
        print("test) Sucessfully generate prompt. \nprompt : "+ prompt)

        json_response = await call_openai_api(prompt)
        response_content = await json_response.json()

        # 텍스트 추출해 문자열로 변환
        response = response_content["message"]
        
        print("test) Sucessfully get response. \nresponse : "+ response)
        
        user_context[user_id]["solve_delay"] = False
        user_context[user_id]["prev_chat"] = prompt+"\n"+response
            
    elif user_status == "solve":
        response = "Your solution has been saved."

    elif user_status == "wrong":
        # init: 질문 전송
        if not user_context[user_id].get("wrong"):
            user_context[user_id] = {"wrong": True, "prev_chat": ""}
            return "방금 풀이에서 틀린 부분 없는지 체크해볼래?"
        
        # 사용자의 응답을 받은 경우, OpenAI API로 전송
        solution = solutions[problem_index]
        prompt = prompt_wrong(ocr, solution, user_text, prev_chat)
        response = await call_openai_api(prompt)
        
        user_context[user_id]["wrong"] = False
        user_context[user_id]["prev_chat"] = prompt+"\n"+response

    elif user_status == "doing":
        response = "The user is continuing their work."
        
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
        
        print("test) Get response from call_open_api func. response : "+response)
        
        # JSON 형식으로 return 
        return JSONResponse(content=response.choices[0].message.content)
    
    except Exception as e:
        return f"OpenAI API error: {str(e)}"