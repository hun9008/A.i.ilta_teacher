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

def decode_image(base64_str):
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def detect_hand(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # 피부색 범위를 설정합니다 (HSV)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    
    # 피부색 범위에 해당하는 마스크 생성
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # 모폴로지 변환 적용 (노이즈 제거)
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.erode(mask, kernel, iterations=2)
    mask = cv2.dilate(mask, kernel, iterations=2)
    
    # 블러링을 통해 노이즈 제거
    mask = cv2.GaussianBlur(mask, (5, 5), 100)
    
    # 윤곽선 검출
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # 가장 큰 윤곽선을 선택
    if len(contours) > 0:
        max_contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(max_contour) > 1000:  # 최소 면적 조건
            return True
    return False

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
    frame = decode_image(frame_data)
    if detect_hand(frame):
        output = perform_ocr(frame_data)
        response = {'type': 'ocr-result', 'text': output}
        await websocket.send_json(response)
    else:
        response = {'type': 'ocr-result', 'text': 'No hand detected'}
        await websocket.send_json(response)

def perform_ocr(frame_data):
    url = "http://llm.hunian.site"
    payload = {'image_base64': frame_data}
    response = requests.post(url, data=payload)
    return response.text

if __name__ == "__main__":
    uvicorn.run(app)