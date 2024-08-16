import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import requests
import asyncio
#from utils.sock_utils import decode_image, detect_hand 
from utils.problem import concepts, solutions, ocrs
import os
from datetime import datetime
import base64

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

            if type == 'video':
                await handle_ws_video(image, websocket, u_id, device)
                if device == 'mobile':
                    await handle_ws_rtc(image, websocket, u_id, device)
            elif type == 'all':
                await handle_ws_video(image, websocket, u_id, device)
                if device == 'mobile':
                    await handle_ws_rtc(image, websocket, u_id, device)
                    await handle_ws_ocr(image, websocket, u_id, device)
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

async def handle_ws_ocr(frame_data, websocket, u_id, device): 
    
    # performing_ocr = True
    ocr_result = await perform_ocr(frame_data)
    # performing_ocr = False
    
    concepts.extend(ocr_result.get("concepts", []))
    solutions.extend(ocr_result.get("solutions", []))
    ocrs.extend(ocr_result.get("ocrs", []))
    
    pc_key = f'{u_id}_pc'
    if pc_key in connections:
        pc_websocket = connections[pc_key]
        response = {'type': 'ocr-request', 'payload': frame_data}
        await pc_websocket.send_json(response)
    else:
        response = {'type': 'error', 'message': 'Peer connection not found'}
        await websocket.send_json(response)

    # response = {'type': 'ocr-result', 'ocrs': ocr_result.get('ocrs')}
    # await websocket.send_json(response)

async def handle_ws_rtc(frame_data, websocket, u_id, device):
    
    # if device == 'mobile':
    #     # print("You are using mobile")
    #     response = {'type': 'error', 'message': 'Mobile device not supported'}
    #     await websocket.send_json(response)
    #     return

    print("Handling RTC")
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

async def handle_ws_video(frame_data, websocket, u_id, device):

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    
    if device == "pc":
        storage_dir = os.path.join(root_dir, "local_storage/pc")
    elif device == "mobile":
        storage_dir = os.path.join(root_dir, "local_storage/mobile")
    else:
        # error
        response = {'type': 'error', 'message': 'Invalid device type'}
        await websocket.send_json(response)

    os.makedirs(storage_dir, exist_ok=True)
    
    saved_images = []
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{u_id}.jpg"
    filepath = os.path.join(storage_dir, filename)
    
    byte_data = base64.b64decode(frame_data)

    with open(filepath, "wb") as f:
        f.write(byte_data)
    
    # Manage the saved images
    saved_images = sorted(
        [os.path.join(storage_dir, f) for f in os.listdir(storage_dir) if f.endswith(".jpg")],
        key=os.path.getctime
    )
    
    if len(saved_images) > 10:
        os.remove(saved_images[0])
    
    response = {'type': 'response', 'message': 'Image received'}
    await websocket.send_json(response)

async def perform_ocr(frame_data):
    print("Performing OCR")
    url = "http://model.maitutor.site//problems_ocr"
    payload = {'image_base64': frame_data}
    print(payload)
    headers = {'Content-Type': 'application/json'}  # JSON 형식임을 명시
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)  # JSON 형식으로 전송
    return response.json()
    # return "Dummy OCR result"
