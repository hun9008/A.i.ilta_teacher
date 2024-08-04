from openai import OpenAI
import os
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

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

local_file_path = './img/img1.png'
local_file_name = os.path.basename(local_file_path)
bucket_name = 'flyai'
object_name = local_file_name
print("obj name : ", object_name)

image_url = upload_to_s3(local_file_path, bucket_name, object_name)
print("업로드된 이미지 URL:", image_url)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),   
)

response = client.chat.completions.create(
  model="gpt-4o-mini",
  messages=[
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "What’s in this image? say korean."},
        {
          "type": "image_url",
          "image_url": {
            "url": image_url,
            "detail": "high"
          },
        },
      ],
    }
  ],
  max_tokens=300,
)

print(response.choices[0].message.content)
