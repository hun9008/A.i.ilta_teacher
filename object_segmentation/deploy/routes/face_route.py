from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import time
from models.cv_face_focus import is_focus
from models.input_face import FaceImg

face_router = APIRouter()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def decode_image(base64_str):
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def check_if_focus(encoded_img):
    
    image = decode_image(encoded_img)
    output = is_focus(image)

    return output

@face_router.post("/face_tracker")
async def face_tracker(input: FaceImg):    
    is_focus = check_if_focus(input.image)
    
    output = {
        "is_focus": is_focus,
    }
    
    return JSONResponse(content=output)