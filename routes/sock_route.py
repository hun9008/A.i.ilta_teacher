import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import requests
import asyncio
from utils.sock_utils import decode_image, detect_hand

route = APIRouter()

connections = []
performing_ocr = False

@route.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            
            # decoding(JSON format to Python object)
            message = json.loads(data)
            
            # 비디오 프레임일 경우 
            if message['type'] == 'video-frame':
                # 현재의 payload를 handle_video_frame()에 넣어서 처리
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
    
    # 손이 detect 되는 경우
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