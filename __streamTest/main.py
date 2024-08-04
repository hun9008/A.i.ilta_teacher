import sys
import os
import pytesseract
import cv2
import numpy as np
import base64
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

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
    frame = decode_frame(frame_data)
    text = perform_ocr(frame)
    print("Detected Text:", text)
    response = {'type': 'ocr-result', 'text': text}
    await websocket.send_json(response)

def decode_frame(frame_data):
    try:
        img_data = base64.b64decode(frame_data)
        np_arr = np.frombuffer(img_data, dtype=np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Decoded frame is None")
        return frame
    except Exception as e:
        print(f"Error decoding frame: {e}")
        return None

def perform_ocr(frame):
    if frame is None:
        return ""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_string(gray)
    if not text.strip():
        return ""
    return text