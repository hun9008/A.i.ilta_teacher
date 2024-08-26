import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import requests
import asyncio
#from utils.sock_utils import decode_image, detect_hand 
from utils.sock_utils import detect_motion
from utils.problem import concepts_storage, solutions_storage, ocrs_storage, origin_image_storage
from config import user_vars
import os
from datetime import datetime
import base64
import numpy as np
import cv2

route = APIRouter()

connections = {}
performing_ocr = False

user_position_pair_dict = {}

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
            position = message['position']
            ocrs = message['ocrs']

            connection_key = f'{u_id}_{device}'
            connections[connection_key] = websocket
            # print("current connections: ", connections.keys())

            if type == 'video':
                await handle_ws_video(image, websocket, u_id, device)
                if device == 'mobile':
                    await handle_ws_rtc(image, websocket, u_id, device)
            elif type == 'ocr':
                await handle_ws_video(image, websocket, u_id, device)
                if device == 'mobile':
                    await handle_ws_rtc(image, websocket, u_id, device)
                    await handle_ws_ocr(image, websocket, u_id, device)
                    await handle_ws_position(position, websocket, u_id, device)
            elif type == 'solution':
                await handle_ws_video(image, websocket, u_id, device)
                if device == 'mobile':
                    await handle_ws_rtc(image, websocket, u_id, device)
                    await handle_ws_solution(ocrs, websocket, u_id, device)
                    await handle_ws_position(position, websocket, u_id, device)
            elif type == 'hi':
                response = {'type': 'response', 'message': 'Hello!'}
                await websocket.send_json(response)
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

async def handle_ws_solution(user_ocrs, websocket, u_id, device):

    ocrs_storage.clear()
    ocrs_storage.append(user_ocrs)

    print("type of user_ocrs : ", type(user_ocrs))

    response = await perform_solution(user_ocrs)

    output_json = {
        "concepts": response.get("concepts", []),
        "solutions": response.get("solutions", [])
    }

    concepts_storage.clear()
    solutions_storage.clear()
    concepts_storage.append(output_json.get("concepts"))
    solutions_storage.append(output_json.get("solutions"))
    
    pc_key = f'{u_id}_pc'
    if pc_key in connections:
        pc_websocket = connections[pc_key]
        response = {'type': 'solution-request', 'payload': output_json}
        await pc_websocket.send_json(response)
    else:
        response = {'type': 'error', 'message': 'Peer connection not found'}
        await websocket.send_json(response)

async def handle_ws_position(position, websocket, u_id, device):
    
    mobile_key = f'{u_id}_mobile'

    user_position_pair_dict[u_id] = position

    if mobile_key in connections:
        mobile_websocket = connections[mobile_key]
        response = {'type': 'position', 'payload': position}
        await mobile_websocket.send_json(response)
    else:
        response = {'type': 'error', 'message': 'Mobile connection not found'}
        await websocket.send_json(response)

async def handle_ws_ocr(frame_data, websocket, u_id, device): 
    
    origin_image_storage.clear()
    origin_image_storage.append(frame_data)

    if user_position_pair_dict.get(u_id) is not None:
        print("position exists!")
        position = user_position_pair_dict[u_id]
        print("position : ", position)

        image_data = base64.b64decode(frame_data)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        x, y, w, h = position['x'], position['y'], position['w'], position['h']
        roi = img[y:y+h, x:x+w]  

        _, buffer = cv2.imencode('.jpg', roi)
        preprocess_data = base64.b64encode(buffer).decode('utf-8')

    else:
        print("position does not exist!")
        preprocess_data = frame_data


    ocr_result = await perform_ocr(preprocess_data)
    # performing_ocr = False
    
    # concepts.extend(ocr_result.get("concepts", []))
    # solutions.extend(ocr_result.get("solutions", []))
    # ocrs_storage.extend(ocr_result.get("ocrs", []))
    # print("ocrs_storage : ", ocrs_storage)

    print("type of ocrs_storage : ", type(ocrs_storage))

    output_json = {
        # "concepts": concepts,
        # "solutions": solutions,
        "ocrs": ocr_result.get("ocrs", [])
    }

    print("@@@@@@@@ net_ocrs len : ", len(output_json.get("ocrs")))

    ocrs_storage.clear()
    ocrs_storage.append(output_json.get("ocrs"))
    
    pc_key = f'{u_id}_pc'
    if pc_key in connections:
        pc_websocket = connections[pc_key]
        response = {'type': 'ocr-request', 'payload': output_json}
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
        
    if device == "mobile" and len(saved_images) == 10:
        print("test) Back decide user status by detecting motion in mobile camera.\n")
        user_vars.user_status = detect_motion(saved_images)
        print("test) user_status : " + user_vars.user_status + "\n")
    
    response = {'type': 'response', 'message': 'Image received'}
    await websocket.send_json(response)

async def perform_ocr(frame_data):
    print("Performing OCR")
    url = "http://model.maitutor.site/problems_ocr"
    
    # print("frame_data : ", frame_data)

    payload = {'image': frame_data}
    # print(payload)
    headers = {'Content-Type': 'application/json'}  # JSON 형식임을 명시
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)  # JSON 형식으로 전송
    # print("response : ", response)
    print("type : ", type(response))
    if response.status_code != 200:
        raise ValueError(f"Server returned status code {response.status_code}: {response.text}")
    
    try:
        return response.json()
    except requests.exceptions.JSONDecodeError:
        raise ValueError("Response is not in JSON format")
    # return "Dummy OCR result"

async def perform_solution(ocrs):
    print("Performing Solution")
    url = "http://model.maitutor.site/problems_solver"
    
    payload = {'ocrs': ocrs}
    headers = {'Content-Type': 'application/json'}  # JSON 형식임을 명시
    response = await asyncio.to_thread(requests.post, url, json=payload, headers=headers)  # JSON 형식으로 전송
    if response.status_code != 200:
        raise ValueError(f"Server returned status code {response.status_code}: {response.text}")
    
    try:
        return response.json()
    except requests.exceptions.JSONDecodeError:
        raise ValueError("Response is not in JSON format")
    # return "Dummy Solution result"