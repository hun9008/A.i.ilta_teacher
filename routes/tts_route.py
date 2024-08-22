from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from models.tts_chat import TextChat
from openai import OpenAI

import os
from fastapi.responses import FileResponse

route = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@route.post("/tts/chat")
async def process_text(textchat: TextChat):
    
    user_text = textchat.text
    user_id = textchat.u_id
    voice = textchat.voice
    
    output_file = await call_tts_api(user_text, voice)
    
    if not os.path.exists(output_file):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(output_file, media_type='audio/mpeg', filename="output.mp3")
    
    
async def call_tts_api(user_text, voice):
    try:
        response = client.audio.speech.create(
            model = "tts-1",
            voice = voice,
            input = user_text
        )
        
        output_file = "output.mp3"
        
        with open(output_file, "wb") as audio_file:
            audio_file.write(response.content)
        
        return output_file
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
