from openai import OpenAI
import os
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi import File, UploadFile, Form
from fastapi.responses import JSONResponse

router = APIRouter()

load_dotenv(os.path.join(os.getcwd(), ".env"))

def upload_to_s3(file_name, bucket, object_name=None):

    s3_client = boto3.client(
        's3',
        aws_access_key_id= os.getenv('AWS_ACCESS_KEY_ID'),
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
    
@router.post("/api/upload")
async def process_request(
    text: str = Form(...), 
    file: UploadFile = File(None)
):
    if file:
        file_path = f"/tmp/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        image_url = upload_to_s3(file_path, 'flyai', file.filename)
        if not image_url:
            return JSONResponse(content={"error": "Image upload failed"}, status_code=500)
        
        messages = [
            {"role": "user", "content": [
                {"type": "text", "text": text},
                {"type": "image_url", "image_url": {"url": image_url, "detail": "high"}}
            ]}
        ]
    else:
        print("error")
    
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1000,
    )
    
    return JSONResponse(content=response.choices[0].message.content)

@router.post("/api/text")
async def process_text_request(
    text: str = Form(...)
):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": [{"type": "text", "text": text}]}
        ],
        max_tokens=300,
    )

    return JSONResponse(content=response.choices[0].message.content)