from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import time
from models.cv_ocr import problem_crop
from models.ocr_input import OCRInput, Determinent
import boto3
from botocore.exceptions import NoCredentialsError
import requests
from openai import OpenAI
import asyncio
import anthropic
import difflib
# import deepl

router = APIRouter()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def decode_image(base64_str):
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def encode_image_to_binary(image):
    _, buffer = cv2.imencode('.jpg', image)
    binary_data = buffer.tobytes()
    return binary_data

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

def detect_hand_ocr_text(img):
    """Detects text in the file."""
    from google.cloud import vision

    client = vision.ImageAnnotatorClient()

    decoded_img = decode_image(img)
    content = encode_image_to_binary(decoded_img)

    image = vision.Image(content=content)

    response = client.text_detection(image=image)
    texts = response.text_annotations
    # print("Texts:")

    for text in texts:
        # print(f'\n"{text.description}"')

        vertices = [
            f"({vertex.x},{vertex.y})" for vertex in text.bounding_poly.vertices
        ]

        # print("bounds: {}".format(",".join(vertices)))

    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )
    
    # print('len : ', len(texts[0].description))

    return texts[0].description

async def fetch_openai(client, prompt_type):
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

    # print(response.content[0].text)

    return response.content[0].text

# async def fetch_ans_mistral(prompt_type: str):

#     return

# def calculate_similarity(solution, answer):
#     return difflib.SequenceMatcher(None, solution, answer).ratio()

# async def retry_solution(client, ocr, mistral_answer, retry_count=2):
#     for _ in range(retry_count):
#         prompt_with_mistral = (
#             f"정답은 '{mistral_answer}' 야. "
#             f"하지만, 이미지를 보고 이 수학문제의 풀이를 다시 한글로 알려줘. "
#             f"step 1 : , step2 : , ..., answer: 로 알려줘. 문제: {ocr}"
#         )
#         new_solution = await fetch_openai(client, prompt_with_mistral)
#         similarity = calculate_similarity(new_solution, mistral_answer)
#         if similarity >= 0.8:
#             return new_solution
#     return new_solution


@router.post("/problems_solver")
async def problems_ocr(input: OCRInput):
    start = time.time()
    encoded_imgs = []
    image = decode_image(input.image)
    problem_crop(image)
    
    image_path = './temp'
    file_name = str(int(time.time())) + ".jpg"
    image_urls = []

    for filename in os.listdir(image_path):
        if not filename.startswith('_'):
            encoded_imgs.append(base64.b64encode(open(os.path.join(image_path, filename), "rb").read()).decode())
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    ocr_tasks = [
        fetch_ocr_claude(claude_client, encoded_img, "이 이미지에서 OCR로 문제를 추출해 알려줘(부등호 구분에 주의). 문제 번호 앞뒤로 별표(*)를 붙여줘. 별표 외 다른 사족은 붙이지 말고 추출한 텍스트만 출력해줘.")
        for encoded_img in encoded_imgs
    ]

    ocrs = await asyncio.gather(*ocr_tasks)


    # if any('*' in ocr for ocr in ocrs):
    #     sorted_ocrs = sorted(ocrs, key=lambda x: int(x.split('*')[1]))
    #     print("sort ocrs")
    # else:
    #     sorted_ocrs = ocrs
    #     print("this is not problem set")
    sorted_ocrs = ocrs
    
    concept_tasks = [
        fetch_openai(client, f"이 이미지에를 보고 수학문제를 풀기위한 개념들을 단어로 알려줘. 단어들만 알려주면 돼. {ocr}")
        for ocr in sorted_ocrs
    ]
    solution_tasks = [
        fetch_openai(client, f"이미지를 보고 이 수학문제의 풀이를 한글로 알려주는데, step 1 : , step2 : , ..., answer: 로 알려줘. {ocr}")
        for ocr in sorted_ocrs
    ]

    # mistral_tasks = [
    #     fetch_ans_mistral(f"prompt {ocr}")
    #     for ocr in sorted_ocrs
    # ]

    concepts= await asyncio.gather(*concept_tasks)
    solutions= await asyncio.gather(*solution_tasks)
    # answers= await asyncio.gather(*mistral_tasks)

    # final_solutions = [None] * len(sorted_ocrs)  

    # for index, (solution, answer, ocr) in enumerate(zip(solutions, answers, sorted_ocrs)):
    #     similarity = calculate_similarity(solution, answer)
    #     if similarity < 0.8:
    #         # 유사도가 80% 미만이면 솔루션 재시도
    #         final_solution = await retry_solution(client, ocr, answer)
    #     else:
    #         final_solution = solution

    #     final_solutions[index] = final_solution

    # temp directory cleanup
    for filename in os.listdir(image_path):
        os.remove(os.path.join(image_path, filename))
    
    output_json = {
        "concepts": concepts,
        "solutions": solutions,
        "ocrs": sorted_ocrs,
    }

    return JSONResponse(content=output_json)

@router.post("/one_problem_ocr")
async def one_problem_ocr(input: OCRInput):
    start = time.time()
    image = decode_image(input.image)
    problem_crop(image)
    
    image_path = './temp'
    file_name = str(int(time.time())) + ".jpg"
    image_urls = []

    for filename in os.listdir(image_path):
        if not filename.startswith('_'):
            file_path = os.path.join(image_path, filename)
            image_url = upload_to_s3(file_path, 'flyai', filename)
            image_urls.append(image_url)
    
    claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    ocr_tasks = [
        fetch_ocr_claude(claude_client, image_url, "이 이미지에서 문제를 추출해 알려줘. (부등호에 주의해줘.)")
        for image_url in image_urls
    ]
    
    ocrs = await asyncio.gather(*ocr_tasks)

    # temp directory cleanup
    for filename in os.listdir(image_path):
        os.remove(os.path.join(image_path, filename))
    
    output_json = {
        "ocrs": ocrs,
    }

    return JSONResponse(content=output_json)

@router.post("/hand_ocr")
async def hand_ocr(input: Determinent):

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./keys/flyai-432701-9290e087cf34.json"

    ocr_result = detect_hand_ocr_text(input.image)

    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    solution = input.solution

    openai_result = await fetch_openai(client, f"// ocr_result : {ocr_result} // solution : {solution} // 앞의 ocr_result 와 실제 문제의 solution을 비교해보고 (정답이 일치함, 풀이가 틀림, 푸는 중임) 중 하나를 알려줘. 답이 맞으면 ##1##을 반환하고 풀이 방법 잘못됨이라면 ##2##을 반환하고 문제를 아직 푸는 중이라면 ##3##을 반환해줘.")

    determinent = "None"
    if "##1##" in openai_result:
        determinent = "solve"
    elif "##2##" in openai_result:
        determinent = "wrong"
    elif "##3##" in openai_result:
        determinent = "doing"
    else:
        determinent = "None"

    output_json = {
        "ocr_result": ocr_result,
        "determinants": determinent,
    }

    return JSONResponse(content=output_json)
    


