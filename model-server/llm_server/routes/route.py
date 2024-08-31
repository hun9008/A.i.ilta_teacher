from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
from openai import OpenAI
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import boto3
from botocore.exceptions import NoCredentialsError
from models.solution import SolutionRequest
import time

router = APIRouter()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def decode_image(base64_str):
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def save_image(image, file_path):
    cv2.imwrite(file_path, image)

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

@router.post("/api/solution")
async def process_solution_request(request: SolutionRequest):
    start_time = time.time()  # Start time

    try:
        image = decode_image(request.image_base64)
        file_name = str(int(time.time())) + ".jpg"
        file_path = f"/tmp/{file_name}"
        save_image(image, file_path)
        
        image_url = upload_to_s3(file_path, 'flyai', file_name)
        if not image_url:
            raise HTTPException(status_code=500, detail="Image upload failed")

        messages = [
            {
                "role": "user", "content" : [
                    {"type": "text", "text": "What is the answer to this math problem?"},
                    {"type": "image_url", "image_url": {"url": image_url, "detail": "high"}}
                ]
            }
        ]

        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
        )

        end_time = time.time() 
        processing_time = end_time - start_time

        return JSONResponse(content={
            "response": response.choices[0].message.content,
            "processing_time": processing_time
        })

    except Exception as ex:
        end_time = time.time() 
        processing_time = end_time - start_time 
        raise HTTPException(status_code=500, detail={
            "error": str(ex),
            "processing_time": processing_time
        })