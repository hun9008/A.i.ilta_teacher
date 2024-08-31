import cv2
import numpy as np
import base64
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connections = []
performing_ocr = False

def decode_image(base64_str):
    try:
        img_data = base64.b64decode(base64_str)
        np_arr = np.frombuffer(img_data, np.uint8)
        
        if np_arr.size == 0:
            raise ValueError("Decoded buffer is empty")
        
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Image decoding failed")
        
        return image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

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
        if cv2.contourArea(max_contour) > 10:  # 최소 면적 조건
            # print("Hand detected")
            return True
    # print("No hand detected")
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
    global performing_ocr
    if performing_ocr:
        response = {'type': 'ocr-result', 'text': 'OCR in progress, please wait'}
        await websocket.send_json(response)
        return
    
    frame = decode_image(frame_data)
    if frame is not None and detect_hand(frame):
        performing_ocr = True
        output = await perform_ocr(frame_data)
        performing_ocr = False
        response = {'type': 'ocr-result', 'text': output}
        await websocket.send_json(response)
    else:
        response = {'type': 'ocr-result', 'text': 'No hand detected or failed to decode image'}
        await websocket.send_json(response)

async def perform_ocr(frame_data):
    print("Performing OCR")
    url = "http://llm.hunian.site/api/solution"
    payload = {'image_base64': frame_data}
    print(payload)
    headers = {'Content-Type': 'application/json'}  # JSON 형식임을 명시
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)  # JSON 형식으로 전송
    return response.text

if __name__ == "__main__":
    uvicorn.run(app)