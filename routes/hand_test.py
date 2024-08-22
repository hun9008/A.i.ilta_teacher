import os
import glob
import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse # API response를 JSON 형식으로 반환
from openai import OpenAI
from dotenv import load_dotenv

# from utils.problem import concepts_storage, solutions_storage, ocrs_storage, origin_image_storage
# from utils.chat_utils import prompt_delay, prompt_wrong
from fastapi import WebSocket, WebSocketDisconnect
# from config import user_vars
from hand_test_example import origin_image
import base64
import requests
import re

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import io

sleep_time = 1

hand_detect_dummy = {
  "prob_area": [
    [
      47,
      40,
      496,
      428
    ],
    [
      45,
      471,
      498,
      474
    ],
    [
      47,
      948,
      499,
      401
    ],
    [
      595,
      35,
      494,
      486
    ],
    [
      599,
      524,
      490,
      429
    ],
    [
      602,
      956,
      490,
      393
    ]
  ],
  "prob_num": 1
}

decode_image = base64.b64decode(origin_image[0])

image = Image.open(io.BytesIO(decode_image))

if image.mode == 'RGBA':
    image = image.convert('RGB')

image_array = np.array(image)

index = 0
target_area = hand_detect_dummy["prob_area"][index]
x, y, w, h = target_area

crop_image = image_array[y:y+h, x:x+w]

print("crop image type : ", type(crop_image))

plt.imshow(image_array)
plt.axis('off')
plt.show()

plt.imshow(crop_image)
plt.axis('off')
plt.show()


# crop_image_c_contiguous = np.ascontiguousarray(crop_image)
# print("crop image c contiguous type : ", type(crop_image_c_contiguous))

pil_img = Image.fromarray(crop_image)
buffered = io.BytesIO()
pil_img.save(buffered, format="JPEG")
img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

# crop_encode = base64.b64encode().decode('utf-8')

# hand_test.txt에 {'image': crop_encode} 저장
with open('./hand_test.txt', 'w') as f:
    f.write(json.dumps({'image': img_str}))


