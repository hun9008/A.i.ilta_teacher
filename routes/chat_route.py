import os
import json
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse # API response를 JSON 형식으로 반환
from openai import OpenAI
from dotenv import load_dotenv
from models.chat import ChatRequest

route = APIRouter()

# 환경 변수 로드
load_dotenv()

# OpenAI 클라이언트 초기화
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@route.post("/chat")
# 메시지 처리 로직
async def process_message(chat: ChatRequest):
    
    user_status = chat.status
    user_text = chat.text # user가 물어보는 내용
    
    # 개념을 순차적으로 질문하는 로직 (OpenAI API 호출)
    if user_status == "solve_delay":
        ## concept = ""
        prompt = user_text
        response = await call_openai_api(prompt) # OpenAI API 호출
            
    elif user_status == "solve":
        # 푼 문제를 저장하고 종료
        response = {"content": "Your solution has been saved."}
        ## DB에 저장 ; user schema의 end_state를 저장
    # solution을 순차적으로 제공 (OpenAI API 호출)
    elif user_status == "wrong":
        ## solution = ""
        prompt = user_text
        response = await call_openai_api(prompt) # OpenAI API 호출

    elif user_status == "doing":
        # doing 상태에서는 할게 없음
        response = {"content": "The user is continuing their work."}
        
    else:
        response = {"content": "Invalid state."}

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