import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import requests
import asyncio
#from utils.sock_utils import decode_image, detect_hand 
from utils.problem import concepts, solutions, ocrs

route = APIRouter()

connections = {}
performing_ocr = False

@route.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # connections.append(websocket)
    connection_key = None
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            image = message['payload']
            device = message['device']
            type = message['type']
            u_id = message['u_id']

            connection_key = f'{u_id}_{device}'
            connections[connection_key] = websocket
            # print("current connections: ", connections.keys())

            if type == 'ocr':
                await handle_ws_ocr(image, websocket)
            elif type == 'rtc':
                await handle_ws_rtc(image, websocket, u_id, device)
            else:
                response = {'type': 'error', 'message': 'Invalid message type'}
                await websocket.send_json(response)
                
    except WebSocketDisconnect:
        # connections.remove(websocket)
        # print("connection_key: ", connection_key)
        if connection_key in connections:
            connections.pop(connection_key, None)
        # else:
        #     print("connection_key not found in connections")

async def handle_ws_ocr(frame_data, websocket): 
    global performing_ocr
    if performing_ocr:
        response = {'type': 'ocr-result', 'text': 'OCR in progress, please wait'}
        await websocket.send_json(response)
        return
    
    message = json.loads(frame_data)
    image_url = message['payload']
    
    #
    with open("example.txt", "r") as file:
        frame_data = file.read()
    message = json.loads(frame_data)
    image_url = message['image']
    # 
    
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

async def handle_ws_rtc(frame_data, websocket, u_id, device):
    
    # if device == 'mobile':
    #     # print("You are using mobile")
    #     response = {'type': 'error', 'message': 'Mobile device not supported'}
    #     await websocket.send_json(response)
    #     return

    # print("Handling RTC")
    pc_key = f'{u_id}_pc'

    if pc_key in connections:
        # print("pc_key found in connections(socket)")
        pc_websocket = connections[pc_key]
        response = {'type': 'rtc-frame', 'payload': frame_data}
        await pc_websocket.send_json(response)
    else:
        # print("pc_key not found in connections(socket)")
        response = {'type': 'error', 'message': 'Peer connection not found'}
        await websocket.send_json(response)

async def perform_ocr(frame_data):
    # print("Performing OCR")
    # url = "http://llm.hunian.site/problems_ocr"
    # payload = {'image_base64': frame_data}
    # print(payload)
    # headers = {'Content-Type': 'application/json'}  # JSON 형식임을 명시
    # response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)  # JSON 형식으로 전송
    # return response.text
    return "Dummy OCR result"
