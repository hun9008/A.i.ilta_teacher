import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import requests
import asyncio
#from utils.sock_utils import decode_image, detect_hand 
from utils.problem import concepts, solutions, ocrs

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
            message = json.loads(data)

            if 'image_url' in message:
                await handle_image_url(message, websocket)
                
    except WebSocketDisconnect:
        connections.remove(websocket)
        
# (프론트에서 버튼이 눌리면) # 모델에 img 전달
async def handle_image_url(message, websocket):
    global performing_ocr
    if performing_ocr:
        response = {'type': 'ocr-result', 'text': 'OCR in progress, please wait'}
        await websocket.send_json(response)
        return
    
    image_url = message['image_url']
    
    # 이미지 URL로부터 OCR 수행
    performing_ocr = True
    ocr_result = await perform_ocr(image_url)
    performing_ocr = False
    
    # concepts, solutions, ocrs 모두 저장
    concepts.extend(ocr_result.get("concepts", []))
    solutions.extend(ocr_result.get("solutions", []))
    ocrs.extend(ocr_result.get("ocrs", []))
    
    # 프론트에는 ocr 결과만 전송 
    response = {'type': 'ocr-result', 'ocrs': ocr_result.get('ocrs')}
    await websocket.send_json(response)

async def perform_ocr(image_url):
    print("Performing OCR")
    url = "http://llm.hunian.site/problem_ocr"
    payload = {'image_url': image_url}
    headers = {'Content-Type': 'application/json'}
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)
    result = response.json()
    return result