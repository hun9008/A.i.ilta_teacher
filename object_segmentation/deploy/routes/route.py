from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import time
# from models.class_quest_cate import category_inference
from models.cv_ocr import problem_crop
from models.cv_prob_area import prob_loc_crop, visualize_problem_locations
from models.cv_hand_loc import hand_loc, visualize_hand_area
from models.input_ocr import OCRInput, Determinent
from models.input_hand import ProbAreas_HandImg
# from models.input_prob import ClassInput
import boto3
from botocore.exceptions import NoCredentialsError
import requests
from openai import OpenAI
import asyncio
import anthropic
import difflib
import subprocess
import json
import re
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

def area_loc2ratio(image_size, x, y, w, h):
    
    output_loc2rat = ((x*100)/image_size[1], (y*100)/image_size[0], (w*100)/image_size[1], (h*100)/image_size[0])
    
    return output_loc2rat

def query_model(question):
    result = subprocess.run(
        ["ollama", "run", "llama3.1", question],
        capture_output=True,
        text=True
    )

    output = result.stdout.strip()

    if not output:
        print("Warning: Model output is empty.")
        return "EMPTY_RESPONSE"  # 빈 응답에 대한 처리

    #print(f"Model output: {output}")  # 모델 출력 확인
    return output

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

async def fetch_ans_llama31(prompt_type: str):

    loop = asyncio.get_event_loop()

    result = await loop.run_in_executor(
        None,
        lambda: subprocess.run(
            ["ollama", "run", "llama3.1", prompt_type],
            capture_output=True,
            text=True
        )
    )
    
    output = result.stdout.strip()
    return output
    

def calculate_similarity(solution, answer):
    return difflib.SequenceMatcher(None, solution, answer).ratio()

async def retry_solution(client, ocr, mistral_answer, retry_count=2):
    print("retrying solution")
    for _ in range(retry_count):
        prompt_with_mistral = (
            f"정답은 '{mistral_answer}' 야. "
            f"하지만, 이미지를 보고 이 수학문제의 풀이를 다시 한글로 알려줘. "
            f"step 1 : , step2 : , ..., answer: 로 알려줘. 문제: {ocr}"
        )
        new_solution = await fetch_openai(client, prompt_with_mistral)
        similarity = calculate_similarity(new_solution, mistral_answer)
        if similarity >= 0.8:
            return new_solution
    return new_solution

@router.post("/problems_solver")
async def problems_ocr(input: OCRInput):
    start = time.time()
    encoded_imgs = []
    image = decode_image(input.image)
    problem_crop(image)
    
    image_path = './temp'
    # file_name = str(int(time.time())) + ".jpg"
    # image_urls = []

    def sort_key(filename):
        return int(''.join(filter(str.isdigit, filename)))
    
    filenames = sorted([f for f in os.listdir(image_path) if not f.startswith('_')], key=sort_key)

    for filename in filenames:
        with open(os.path.join(image_path, filename), "rb") as image_file:
            encoded_imgs.append(base64.b64encode(image_file.read()).decode())
    
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    ocr_tasks = [
        fetch_ocr_claude(claude_client, encoded_img, "이 이미지에서 OCR로 문제를 추출해 알려줘(부등호 구분에 주의). 문제 번호 앞뒤로 별표(*)를 붙여줘. 별표 외 다른 사족은 붙이지 말고 추출한 텍스트만 출력해줘.")
        for encoded_img in encoded_imgs
    ]

    ocrs = await asyncio.gather(*ocr_tasks)
    
    concept_tasks = [
        fetch_openai(client, f"이후 보내는 텍스트를 보고 수학문제를 풀기위한 개념들을 단어로 알려줘. 단어들만 알려주면 돼. {ocr}")
        for ocr in ocrs
    ]
    solution_tasks = [
        fetch_openai(client, f"아래 text를 보고 이 수학문제의 풀이를 한글로 알려주는데, step 1 : , step2 : , ... 그리고 마지막 문장에는 (정답: answer)을 적어줘. \n text : {ocr}")
        for ocr in ocrs
    ]

    llama_tasks = [
        fetch_ans_llama31(f"다음 문제를 풀고 정답만 (answer:정답)의 형태로 알려줘. {ocr}")
        for ocr in ocrs
    ]

    concepts= await asyncio.gather(*concept_tasks)
    solutions= await asyncio.gather(*solution_tasks)
    answers= await asyncio.gather(*llama_tasks)

    final_solutions = [None] * len(ocrs)  

    symbol_to_number = {
        '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
        '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10'
    }

    for index, (solution, answer, ocr) in enumerate(zip(solutions, answers, ocrs)):

        # 기호를 숫자로 변환
        for symbol, number in symbol_to_number.items():
            solution = solution.replace(symbol, number)
            answer = answer.replace(symbol, number)

        print("sol : ", solution)
        print("ans : ", answer)

        # solution에서 마지막 answer : 부분 추출
        sol_ans = ''
        if "정답:" in solution:
            print("일단 정답 존재.")
            try:
                # 마지막 "정답:" 이후의 텍스트를 추출
                last_answer_index = solution.rfind("정답:")
                answer_part = solution[last_answer_index + len("정답:"):].strip()
                answer_only = re.sub(r'\\\(|\\\)', '', answer_part.split(')')[0]).strip()
                sol_ans = answer_only
            except IndexError:
                print("정답이 포함된 부분을 찾지 못했습니다.")
        
        llama_ans = ''
        answer_parts = answer.split('answer:')
        if len(answer_parts) > 1 and answer_parts[1]:
            numbers = re.findall(r'\d+', answer_parts[1])
            if numbers:  # Ensure that numbers were found
                extracted_number = numbers[0]
                llama_ans = extracted_number
        if "answer:" in answer:
            # "answer:" 이후의 수식을 추출
            answer_part = answer.split('answer:')[1].strip()
            # \(와 \)를 제거한 뒤, 괄호, 공백 등 불필요한 문자 제거
            llama_ans = re.sub(r'\\\(|\\\)|[^\w\s><=\-+*/.]', '', answer_part).strip()
        else:
            llama_ans = answer


        print("sol ans : ", sol_ans)
        print("llama_answer : ", llama_ans)

        similarity = calculate_similarity(sol_ans, llama_ans)
        if similarity < 0.8:
            # 유사도가 80% 미만이면 솔루션 재시도
            print("retrying solution")
            # final_solution = await retry_solution(client, ocr, answer)
            final_solution = solution
        else:
            final_solution = solution

        final_solutions[index] = final_solution

    # temp directory cleanup
    for filename in os.listdir(image_path):
        os.remove(os.path.join(image_path, filename))
    
    output_json = {
        "concepts": concepts,
        "solutions": final_solutions,
        "ocrs": ocrs,
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
    print("ocr_result : ", ocr_result)
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
    print("output_json : ", output_json)

    return JSONResponse(content=output_json)

## which problem is user solving
@router.post("/prob_areas_which_prob")
async def define_prob_areas(input: ProbAreas_HandImg):
    image_clean = decode_image(input.image_clean)
    image_hand = decode_image(input.image_hand)
    
    prob_loc_l, prob_loc_r = prob_loc_crop(image_clean)
    
    image_show_clean = image_clean
    image_show_hand = image_hand
    
    prob_loc_l.sort(key=lambda x: x[1])
    prob_loc_r.sort(key=lambda x: x[1])
    
    real_loc_r = []
    tot_loc = []
    left_prob_count = 0
    right_prob_count = 0
    for loc in prob_loc_l:
        print("left", loc)
        tot_loc.append(loc)
        left_prob_count += 1
    for loc in prob_loc_r:
        loc = (loc[0]+image_show_clean.shape[1]//2,loc[1], loc[2], loc[3])
        print("right", loc)
        real_loc_r.append(loc)
        tot_loc.append(loc)
        right_prob_count += 1
        
    prob_areas = []
    if left_prob_count > 1:
        for i in range (left_prob_count - 1):
            tmp = prob_loc_l[i]
            tmp_next = prob_loc_l[i+1]
            prob_area = (tmp[0], tmp[1], image_show_clean.shape[1]//2-tmp[0]-3, tmp_next[1]-tmp[1]-3)
            prob_areas.append(prob_area)
        tmp = prob_loc_l[left_prob_count - 1]
        prob_areas.append((tmp[0], tmp[1], image_show_clean.shape[1]//2-tmp[0], image_show_clean.shape[0]-tmp[1]-3))
    else:
        prob_areas.append((prob_loc_l[0], prob_loc_l[1], image_show_clean.shape[1]//2-prob_loc_l[0]-3, image_show_clean.shape[0]-prob_loc_l[1]-3))

    if right_prob_count > 1:
        for i in range (right_prob_count - 1):
            tmp = real_loc_r[i]
            tmp_next = real_loc_r[i+1]
            prob_area = (tmp[0], tmp[1], image_show_clean.shape[1]-tmp[0]-3, tmp_next[1]-tmp[1]-3)
            prob_areas.append(prob_area)
        tmp = real_loc_r[right_prob_count - 1]
        prob_areas.append((tmp[0], tmp[1], image_show_clean.shape[1]-tmp[0], image_show_clean.shape[0]-tmp[1]-3))
    else:
        prob_areas.append((real_loc_r[0], real_loc_r[1], image_show_clean.shape[1]-real_loc_r[0]-3, image_show_clean.shape[0]-real_loc_r[1]-3))

    # visualize_problem_locations(image_show_clean[:,], prob_areas)
    
    tl, br = hand_loc(image_hand)
    hand_area_loc = (tl[0], tl[1], br[0]-tl[0], br[1]-tl[1])
    # visualize_hand_area(image_show_hand[:,], hand_area_loc)
    
    prob_loc_rats = []
    image_clean_size = (image_clean.shape[0], image_clean.shape[1])
    for (prob_x, prob_y, prob_w, prob_h) in prob_areas:
        rat_x, rat_y, rat_w, rat_h = area_loc2ratio(image_clean_size, prob_x, prob_y, prob_w, prob_h)
        prob_loc_rats.append((rat_x, rat_y, rat_w, rat_h))
    
    #determine which prob_area the hand_are_loc is located
    handloc_x, handloc_y, handloc_w, handloc_h = hand_area_loc
    
    image_hand_size = (image_hand.shape[0], image_hand.shape[1])
    hand_x, hand_y, hand_w, hand_h = area_loc2ratio(image_hand_size, handloc_x, handloc_y, handloc_w, handloc_h)
    
    print("-------*********")
    print("clean figure size: ", image_clean_size)
    print("hand figure size: ",image_hand_size)
    for i in prob_loc_rats:
        print(i)
    print("\n hand location", hand_area_loc)
    print(f"hand loc ratio: {hand_x, hand_y, hand_w, hand_h}")
    print("-------*********")
    
    prob_num = None
    for i, (prob_x, prob_y, prob_w, prob_h) in enumerate(prob_loc_rats):
        print("prob area: ", i, "prob location rat", (prob_x, prob_y, prob_w, prob_h))
        if (hand_x >= prob_x and hand_x <= prob_x + prob_w and
            hand_y >= prob_y and hand_y <= prob_y + prob_h):
            prob_num = i
            break
    
    if prob_num is None:
        prob_num = -1
    
    image_path = './temp'
    for filename in os.listdir(image_path):
        os.remove(os.path.join(image_path, filename))
    
    output = {
        "prob_area": prob_areas,
        "prob_num": prob_num,
    }
    
    return JSONResponse(content=output)

@router.get("/test")
async def test():

    model_answer = query_model('다음 문제를 풀고 정답만 {"answer":"정답"}의 형태를 알려줘. 일차방정식 x+5 = 3(x-1)의 해는? (x = ?)').strip()

    return JSONResponse(content={"model_answer": model_answer})