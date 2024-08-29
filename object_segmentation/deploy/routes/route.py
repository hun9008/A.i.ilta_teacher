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
from models.input_ocr import OCRInput, Determinent, SolverInput
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
    
def resize_and_compress_image(image, max_size_kb=3300, quality=85):
    # 이미지 파일 크기 확인
    _, img_encoded = cv2.imencode('.jpg', image, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    img_size_kb = len(img_encoded) / 1024  # KB 단위로 변환

    # 이미지 크기가 제한을 초과하는 경우 크기 조정
    while img_size_kb > max_size_kb and quality > 10:
        scale_factor = (max_size_kb / img_size_kb) ** 0.5
        new_width = int(image.shape[1] * scale_factor)
        new_height = int(image.shape[0] * scale_factor)
        image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

        _, img_encoded = cv2.imencode('.jpg', image, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        img_size_kb = len(img_encoded) / 1024  # 다시 크기 확인
        quality -= 5  # 품질 감소
        print(f"Quality reduced to {quality}, new size: {img_size_kb:.2f} KB")

    img_base64 = base64.b64encode(img_encoded).decode('utf-8')
    return img_base64

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

    google_text_results = []
    for text in texts:
        # print(f'\n"{text.description}"')

        vertices = [
            f"({vertex.x},{vertex.y})" for vertex in text.bounding_poly.vertices
        ]
        google_text_results.append(text.description)

        # print("bounds: {}".format(",".join(vertices)))

    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )
    
    # print('len : ', len(texts[0].description))

    return google_text_results

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
                    "media_type": "image/jpeg",
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
        max_tokens=2000,
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

@router.post("/problems_ocr")
async def just_ocr(input: OCRInput):

    encoded_imgs = []
    image = decode_image(input.image)
    problem_crop(image, 'jpeg')

    image_path = './temp'

    def sort_key(filename):
        return int(''.join(filter(str.isdigit, filename)))
    
    filenames = sorted([f for f in os.listdir(image_path) if not f.startswith('_')], key=sort_key)

    for filename in filenames:
        image = cv2.imread(os.path.join(image_path, filename))
        encoded_img = resize_and_compress_image(image, max_size_kb=3300)  # 3.3MB 이하로 줄이기
        encoded_imgs.append(encoded_img)

    claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    ocr_tasks = [
        fetch_ocr_claude(claude_client, encoded_img, "이 이미지에서 OCR로 문제를 추출해 알려줘(부등호 구분에 주의). 문제 번호 앞뒤로 별표(*)를 붙여줘. 별표 외 다른 사족은 붙이지 말고 추출한 텍스트만 출력해줘.")
        for encoded_img in encoded_imgs
    ]

    ocrs = await asyncio.gather(*ocr_tasks)

    output_json = {
        "ocrs": ocrs,
    }

    return JSONResponse(content=output_json)

@router.post("/problems_solver")
async def problems_ocr(input: SolverInput):
    
    ocrs = input.ocrs

    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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

    image_path = './temp'
    # temp directory cleanup
    for filename in os.listdir(image_path):
        os.remove(os.path.join(image_path, filename))
    
    output_json = {
        "concepts": concepts,
        "solutions": final_solutions,
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

async def fetch(ocr_result, solution):
    truth = re.search(r'\(정답: \d+\)', solution)
    if truth is None:
        truth = re.search(r'\(정답 : \d+\)', solution)
    if truth is None:
        truth = re.search(r'\(정답: \-\d+\)', solution)
    if truth is None:
        truth = re.search(r'\(정답 : \-\d+\)', solution)
    
    if truth is None:
        truth = solution
    else:
        truth = truth.group().split(":")[1].strip()

    truth = re.sub(r'\)', '', truth)
    result = await fetch_ans_llama31(f"너는 학생의 수학문제 정답을 판단하는 수학강사야. 내가 '//'로 구분되는 유저의 응답(ocr_result)과 정답인 truth를 줄거야. 반드시 ocr_result와 truth가 정확히 일치하는 경우만 ##1## 을 반환해. 일치하지 않는다면 ##2##을 반환해. // ocr_result : {ocr_result} // truth : {truth}")
    if "##1##" in result:
        return "solve"
    else:
        return "not_solve"
    
async def fetch_process(ocr_result, solution):
    result = await fetch_ans_llama31(f"너는 수학선생님이야. 내가 '//'로 구분되는 유저의 응답(ocr_result)과 문제의 풀이인 solution을 줄거야. 참고로 solution은 유저가 한 응답이 아니야. ocr_result가 solution을 고려했을때 잘못된 풀이나 틀린 답이라면 ##2##을 반환해. 풀이가 맞고 ocr_result가 solution에 포함되어있으면 ##3##을 반환해줘. // ocr_result : {ocr_result} // solution : {solution}")

    if "##2##" in result:
        return "wrong"
    else:
        return "doing"
    
# async def fetch_voting(user_ocrs, solution):
#     tasks = [fetch(user_ocrs, solution) for _ in range(3)]
#     results = await asyncio.gather(*tasks)
#     print("answer : ", user_ocrs, "results : ", results)
#     voting_result = max(set(results), key=results.count)
#     print("voting_result : ", voting_result)
#     print("=====================================")
#     return voting_result

async def fetch_voting(user_answer, solution):

    ans_result = await fetch(user_answer, solution)
    if ans_result == "solve":
        print("result : solve")
        return "solve"
    else:
        result = await fetch_process(user_answer, solution)
        print("result : ", result)
        return result
    
def find_ans_in_sol(solution):
    # Find the index of the keyword "정답"
    keyword = "정답"
    start_index = solution.find(keyword)
    
    if start_index == -1:
        # If "정답" is not found, return an empty string
        return "no keyword: answer"
    
    # Extract the substring starting right after "정답"
    tmp = solution[start_index + len(keyword):]
    
    # Strip leading colons or spaces
    ans = tmp.strip(": ").strip()
    
    return ans


@router.post("/hand_ocr")
async def hand_ocr(input: Determinent):

    start_time = time.time()
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./keys/flyai-432701-9290e087cf34.json"

    ocr_results = detect_hand_ocr_text(input.hand_write_image)
    # for hand_ocr in ocr_results:
    #     print("### textAnnotations: ", hand_ocr)
    ocr_result = ocr_results[0]
    start_step_time = time.time()
    print("@@@@@@@@@ hand_ocr_start @@@@@@@@@")

    print(f"OCR 수행 시간: {start_step_time - start_time:.2f}초")
    print("ocr_result : ", ocr_result)
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    solution = input.solution

    print("ocr_result : ", ocr_result)
    print("solution : ", solution)
    # openai_result = await fetch_openai(client, f"// ocr_result : {ocr_result} // solution : {solution} // 앞의 ocr_result 와 실제 문제의 solution을 비교해보고 (정답이 일치함, 풀이가 틀림, 푸는 중임) 중 하나를 알려줘. 답이 맞으면 ##1##을 반환하고 풀이 방법 잘못됨이라면 ##2##을 반환하고 문제를 아직 푸는 중이라면 ##3##을 반환해줘.")
    # openai_result = await fetch_ans_llama31(f"// ocr_result : {ocr_result} // solution : {solution} // 앞의 ocr_result 와 실제 문제의 solution을 비교해보고 (정답이 일치함, 풀이가 틀림, 푸는 중임) 중 하나를 알려줘. 답이 맞으면 ##1##을 반환하고 풀이 방법 잘못됨이라면 ##2##을 반환하고 문제를 아직 푸는 중이라면 ##3##을 반환해줘.")
    # openai_result = await fetch_voting(ocr_result, solution)
    
    # code understanding
    # ocr_result: hand ocr result
    # solution: input.solution, input := Determinent
    # class Determinent(BaseModel):
    #   hand_write_image : str
    #   solution : str
    
    # hard coding version user status determinating
    # answer = solution[-1]

    openai_result = ''
    pattern = r"\(정답:[^)]+\)"
    match = re.search(pattern, solution)

    ignore_word = '구하시오.\n'

    if match:
        # match.group(0)으로 정답 부분을 문자열로 추출하고, 괄호와 공백을 제거
        pre_answer = match.group(0).replace("(", "").replace(")", "").replace(" ", "")
        print("pre_answer:", pre_answer)

        # OCR 결과에서 불필요한 부분 제거
        pre_ocr_result = ocr_result.strip()
        print("pre_ocr_result:", pre_ocr_result)
        ignore_index = ocr_result.find(ignore_word)
        pre_ocr_result = ocr_result[ignore_index + len(ignore_word):].strip()

        # 정답 부분과 OCR 결과 비교
        if pre_ocr_result in pre_answer:
            openai_result = 'solve'
        else:
            # solution 내에서 OCR 결과가 포함된 항목이 있는지 확인
            for sol in solution:
                if pre_ocr_result in sol:
                    openai_result = 'doing'
                    break
    else:
        openai_result = 'wrong'

    if openai_result == '':
        openai_result = 'wrong'

    print("openai_result:", openai_result)


    # openai_result = 'doing'
    
    # if (ocr_result in solution) and (ocr_result != answer):
    #     openai_result = 'doing'
    # elif ocr_result == answer:
    #     openai_result = 'solve'
    # else:
    #     openai_result = 'wrong'
        
    start_step_time = time.time()
    print(f"Llamma 수행 시간: {start_step_time - start_time:.2f}초")
    # print(f"OpenAI 수행 시간: {start_step_time - start_time:.2f}초")
    # print("openai_result : ", openai_result)

    determinent = openai_result

    # determinent = "None"
    # if "##1##" in openai_result:
    #     print("solve")
    #     determinent = "solve"
    # elif "##2##" in openai_result:
    #     print("wrong")
    #     determinent = "wrong"
    # elif "##3##" in openai_result:
    #     print("doing")
    #     determinent = "doing"
    # else:
    #     print("None")
    #     determinent = "None"

    output_json = {
        "ocr_result": ocr_result,
        "determinants": determinent,
    }
    print("output_json : ", output_json)
    print("@@@@@@@@@ hand_ocr_end @@@@@@@@@")


    return JSONResponse(content=output_json)

@router.get("/test")
async def test():

    model_answer = query_model('다음 문제를 풀고 정답만 {"answer":"정답"}의 형태를 알려줘. 일차방정식 x+5 = 3(x-1)의 해는? (x = ?)').strip()

    return JSONResponse(content={"model_answer": model_answer})