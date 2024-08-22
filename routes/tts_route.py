from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.tts_chat import TextChat
from openai import OpenAI

import json
import os

route = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@route.post("/tts/chat")
async def process_text(textchat: TextChat):
    
    user_text = textchat.text
    user_id = textchat.u_id
    
    response = await call_tts_api(user_text)
    
    return json.dumps({
        "u_id": user_id,
        "speech": response
    })
    
    
async def call_tts_api(user_text):
    try:
        response = client.audio.speech.create(
            model = "tts-1",
            voice="nova",
            input = user_text
        )
        
        output_file = "output.mp3"
        
        with open(output_file, "wb") as audio_file:
            audio_file.write(response.content)
        
        return output_file
    
    except Exception as e:
        return f"OpenAI API error: {str(e)}"
