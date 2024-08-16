from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import time
from models.cv_ocr import problem_crop, ocr
from models.ocr_input import OCRInput
import boto3
from botocore.exceptions import NoCredentialsError
import requests
from openai import OpenAI
import asyncio
import anthropic

router = APIRouter()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def decode_image(base64_str):
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def upload_to_s3(file_name, bucket, object_name=None):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name='ap-northeast-2'
    )
    
    try:
        s3_client.upload_file(file_name, bucket, object_name or file_name)
        region = s3_client.get_bucket_location(Bucket=bucket)['LocationConstraint']
        file_url = f"https://{bucket}.s3.{region}.amazonaws.com/{object_name or file_name}"
        return file_url
    except FileNotFoundError:
        print("파일을 찾을 수 없습니다.")
        return None
    except NoCredentialsError:
        print("AWS 자격 증명을 찾을 수 없습니다.")
        return None

async def fetch_solution_or_concept(client, prompt_type):
    message = [{
        "role": "user", 
        "content": [
            {"type": "text", "text": prompt_type},
        ]
    }]
    
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4-turbo",
            messages=message,
            max_tokens=2000
        )
    )
    return response.choices[0].message.content

async def fetch_ocr_claude(client, encoded_img, prompt_type):

    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": encoded_img
                }
            },
            {
                "type": "text",
                "text": prompt_type
            }
        ]
    }]

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=1000,
        temperature=0,
        system="너는 ocr 기계야.",
        messages=messages
        )
    )

    print(response.content[0].text)

    return response.content[0].text

@router.post("/problems_solver")
async def problems_ocr(input: OCRInput):
    start = time.time()
    encoded_imgs = []
    image = decode_image(input.image)
    problem_crop(image)
    
    image_path = './temp'
    file_name = str(int(time.time())) + ".jpg"
    image_urls = []

    # for filename in os.listdir(image_path):
    #     if not filename.startswith('_'):
    #         file_path = os.path.join(image_path, filename)
    #         image_url = upload_to_s3(file_path, 'flyai', filename)
    #         image_urls.append(image_url)

    for filename in os.listdir(image_path):
        if not filename.startswith('_'):
            encoded_imgs.append(base64.b64encode(open(os.path.join(image_path, filename), "rb").read()).decode())
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    # solution_tasks = [
    #     fetch_solution_or_concept(client, image_url, "이미지를 보고 이 수학문제의 풀이를 한글로 알려주는데, step 1 : , step2 : , ..., answer: 로 알려줘.")
    #     for image_url in image_urls
    # ]
    
    # concept_tasks = [
    #     fetch_solution_or_concept(client, image_url, "이 이미지에를 보고 수학문제를 풀기위한 개념들을 단어로 알려줘. 단어들만 알려주면 돼.")
    #     for image_url in image_urls
    # ]

    ocr_tasks = [
        # fetch_solution_or_concept(client, image_url, "이 이미지에서 문제를 추출해 알려줘. (부등호에 주의해줘.)")
        # fetch_ocr_claude(claude_client, encoded_img, "이 이미지에서 문제를 추출해 알려줘. (부등호 구분에 주의) 그리고 OCR 결과로 나온 텍스트만 알려줘")
        fetch_ocr_claude(claude_client, encoded_img, "이 이미지에서 OCR로 문제를 추출해 알려줘(부등호 구분에 주의). 문제 번호 앞뒤로 별표(*)를 붙여줘. 별표 외 다른 사족은 붙이지 말고 추출한 텍스트만 출력해줘.")
        for encoded_img in encoded_imgs
    ]
    
    # solutions = await asyncio.gather(*solution_tasks)
    # concepts = await asyncio.gather(*concept_tasks)
    ocrs = await asyncio.gather(*ocr_tasks)

    # sorted_ocrs = [None]*len(ocrs)
    # for ocr in ocrs:
    #     sorted_ocrs[int(ocr[1])-1] = ocr
    sorted_ocrs = sorted(ocrs, key=lambda x: int(x.split('*')[1]))
    
    concept_tasks = [
        fetch_solution_or_concept(client, f"이 이미지에를 보고 수학문제를 풀기위한 개념들을 단어로 알려줘. 단어들만 알려주면 돼. {ocr}")
        for ocr in sorted_ocrs
    ]
    solution_tasks = [
        fetch_solution_or_concept(client, f"이미지를 보고 이 수학문제의 풀이를 한글로 알려주는데, step 1 : , step2 : , ..., answer: 로 알려줘. {ocr}")
        for ocr in sorted_ocrs
    ]

    concepts= await asyncio.gather(*concept_tasks)
    solutions= await asyncio.gather(*solution_tasks)

    # temp directory cleanup
    for filename in os.listdir(image_path):
        os.remove(os.path.join(image_path, filename))
    
    output_json = {
        "concepts": concepts,
        "solutions": solutions,
        "ocrs": sorted_ocrs,
    }

    return JSONResponse(content=output_json)