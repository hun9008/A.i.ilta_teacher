import sys
import os
import pytesseract
import cv2
import numpy as np
import base64
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message['type'] == 'video-frame':
                await handle_video_frame(message['payload'], websocket)
    except WebSocketDisconnect:
        connections.remove(websocket)

async def handle_video_frame(frame_data, websocket):
    output = perform_ocr(frame_data)
    response = {'type': 'ocr-result', 'text': output}
    await websocket.send_json(response)

def perform_ocr(frame_data):

    url = "http://llm.hunian.site"
    payload = {'image_base64': frame_data}
    response = requests.post(url, data=payload)

    return response.text

if __name__ == "__main__":
    uvicorn.run(app)