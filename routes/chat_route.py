import os
import json
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse # API response를 JSON 형식으로 반환
from openai import OpenAI
from dotenv import load_dotenv
from models.chat import ChatRequest
from fastapi import WebSocket, WebSocketDisconnect
# import request #?

route = APIRouter()

# 환경 변수 로드
load_dotenv()

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# websocket 연결 관리 
connections = []

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
            else:
                await websocket.send_text("WebSocket connection not opened due to status.")
                
    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)
        await websocket.close()
        
# 메시지 처리 로직
async def process_message(chat: ChatRequest):
    
    user_status = chat.status
    user_text = chat.text # user가 물어보는 내용
    
    if user_status == "solve_delay":
        ## concept = ""
        prompt = user_text
        response = await call_openai_api(prompt) # OpenAI API 호출
            
    elif user_status == "solve":
        response = "Your solution has been saved."
        ## DB에 저장

    elif user_status == "wrong":
        ## solution = ""
        prompt = user_text
        response = await call_openai_api(prompt) # OpenAI API 호출

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
            max_tokens=300,
        )
        
        # JSON 형식으로 return 
        return JSONResponse(content=response.choices[0].message.content)
    
    except Exception as e:
        return f"OpenAI API error: {str(e)}"