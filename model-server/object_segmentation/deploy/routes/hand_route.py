from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import time
# from models.cv_prob_area import prob_loc_crop, visualize_problem_locations
# from models.cv_hand_loc import hand_loc, visualize_hand_area
from models.input_hand import ProbAreas_HandImg, ImageInput
from google.cloud import vision
from google.protobuf import json_format
import io
import re
import time

hand_router = APIRouter()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./keys/flyai-432701-9290e087cf34.json"
client = vision.ImageAnnotatorClient()

user_ocr_result = []

def preprocess_image(page):

    gray = cv2.cvtColor(page, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 110, 255, cv2.THRESH_BINARY_INV)

        # 구조적 요소 커널을 생성하여 세로 선 강조
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, page.shape[0] // 30))
    
    # 모폴로지 연산을 통해 세로 선 강조
    detected_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    # Hough Line Transform을 사용하여 선 감지
    edges = cv2.Canny(detected_lines, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=page.shape[0] // 2, maxLineGap=10)
    
    if lines is not None:
        for line in lines:
            for x1, y1, x2, y2 in line:
                angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                line_length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                if angle > 85 and angle < 95 and line_length >= (page.shape[0] / 2):  
                    cv2.line(binary, (x1, y1), (x2, y2), (0, 0, 0), thickness=3)
                # elif x1 == x2 or (x2 - x1) < 10:  # 세로가 매우 작은 부분 제거
                #     cv2.line(binary, (x1, y1), (x2, y2), (0, 0, 0), thickness=cv2.FILLED)

    processed_image = cv2.bitwise_not(binary)

    return processed_image

def imtrim(page):
    if page is None:
        print("Error: Input page is None.")
        return None, None
    
    # top_trim = 100  
    # bottom_trim = 50  
    # page = page[top_trim:-bottom_trim, :]
    
    if len(page.shape) == 2:
        h, w = page.shape
    else:
        h, w, _ = page.shape
    
    print(f"Image size after trimming: {h}x{w}")

    half_width = w // 2  
    
    x_left = 0  
    w_left = half_width 
    
    x_right = half_width  
    w_right = w - half_width
    left = page[:, x_left:x_left + w_left]  
    right = page[:, x_right:]

    print(f"Left image shape: {left.shape}")
    print(f"Right image shape: {right.shape}")

    return right, left

def prob_loc_contour(page_rl, output_dir, type, origin):
    global problem_idx

    if page_rl is None:
        # print("Error: page_rl is None.")
        return

    imgray = page_rl

    blur = cv2.GaussianBlur(imgray, ksize=(3, 3), sigmaX=0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    edge = cv2.Canny(thresh, 100, 200)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 50)) 
    closed = cv2.morphologyEx(edge, cv2.MORPH_CLOSE, kernel)

    contours, hierarchy = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    contoured_image = page_rl.copy()
    contoured_image = cv2.cvtColor(contoured_image, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(contoured_image, contours, -1, (0, 0, 255), 2) 

    cv2.imwrite(f"{output_dir}/_{type}_contoured_image.png", contoured_image)

    problem_locations = []
    net_location = []


    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[1])
    cnt = 0
    # print("contours len, type: ", len(contours), " ",type)
    for i, c in enumerate(contours):
        x, y, w, h = cv2.boundingRect(c)
        # print("w, h : ", w, h)
        if w > 120 and h > 50:  
            problem_locations.append((x, y, w, h))
            # print("append : ", (x, y, w, h))

    # append된 것만 따로 파일로 coutour그린 이미지 저장
    contoured_image = page_rl.copy()
    contoured_image = cv2.cvtColor(contoured_image, cv2.COLOR_GRAY2BGR)
    for p_loc in problem_locations:
        x, y, w, h = p_loc
        cv2.rectangle(contoured_image, (x, y), (x + w, y + h), (0, 0, 255), 2)
    cv2.imwrite(f"{output_dir}/_{type}_problem_contoured_image.png", contoured_image)


    # 1단계: y 값 기준으로 영역 병합

    y_threshold = 0
    y_merged_locations = []
    for i, c in enumerate(contours):
        x, y, w, h = cv2.boundingRect(c)
        # print("x, y, w, h : ", x, y, w, h)
        
        merged = False
        for j in range(len(y_merged_locations)):
            prev_x, prev_y, prev_w, prev_h = y_merged_locations[j]
            
            # 조건 1: y 값과 y + h 값의 포함 관계 확인
            if ((y >= prev_y and y <= prev_y + prev_h) or (prev_y >= y and prev_y <= y + h)) and abs(y - prev_y) <= y_threshold:
                # 두 영역을 합치기
                new_x = min(prev_x, x)
                new_y = min(prev_y, y)
                new_w = max(prev_x + prev_w, x + w) - new_x
                new_h = max(prev_y + prev_h, y + h) - new_y
            
                # 전체 영역의 높이 1/3 이상인 경우 제외
                if new_h > page_rl.shape[0] // 3:
                    continue

                # 합쳐진 영역으로 업데이트
                y_merged_locations[j] = (new_x, new_y, new_w, new_h)
                # print("y_merge : ", y_merged_locations[j], end=" ")
                # print("y, h : ", y, h, end=" ")
                # print("prev : ", prev_y, prev_h)
                merged = True
                break
        
        if not merged:
            # 새로운 영역 추가
            y_merged_locations.append((x, y, w, h))
    
    # 2단계: x + w 값 기준으로 영역 병합
    final_locations = []
    for loc in y_merged_locations:
        x, y, w, h = loc
        merged = False
        for j in range(len(final_locations)):
            prev_x, prev_y, prev_w, prev_h = final_locations[j]
            
            # 조건 2: y 값 차이가 100 이하이고, x + w 값이 포함 관계인 경우
            if abs(y - prev_y) <= 300 and ((x + w >= prev_x and x + w <= prev_x + prev_w) or (prev_x + prev_w >= x and prev_x + prev_w <= x + w)):
                # 두 영역을 합치기
                new_x = min(prev_x, x)
                new_y = min(prev_y, y)
                new_w = max(prev_x + prev_w, x + w) - new_x
                new_h = max(prev_y + prev_h, y + h) - new_y

                # 합쳐진 영역으로 업데이트
                final_locations[j] = (new_x, new_y, new_w, new_h)
                # print("x_merge : ", final_locations[j])
                merged = True
                break
        
        if not merged:
            # 새로운 영역 추가
            final_locations.append((x, y, w, h))

    problem_locations = final_locations

    for p_loc in problem_locations:
        # print("location : " ,p_loc)
        if  p_loc[2] > 300 and p_loc[3] > 90:
            # print("location : " ,p_loc)
            net_location.append(p_loc)

    # print("problem_locations: ", len(problem_locations))
    print("net_contours: ", len(net_location))
    problem_locations = net_location

    # problem_loc의 x좌표는 0, w는 전체 w로 변경
    for i, p_loc in enumerate(problem_locations):
        x, y, w, h = p_loc
        problem_locations[i] = (0, y, page_rl.shape[1], h)

    # print("problem_locations: ", len(problem_locations))

    # for i 

    # print("contours len, type: ", len(contours), " ",type)
    # for i, c in enumerate(contours):
    #     x, y, w, h = cv2.boundingRect(c)
    #     if w > 100 and h > 50:  
    #         problem_locations.append((x, y, w, h))
    
    return problem_locations

def prob_loc_crop(image):
    origin_image = image.copy()
    durty_image = preprocess_image(image)

    right, left = imtrim(durty_image)
    # print("r : ", right)
    # print("l : ", left)
    origin_right, origin_left = imtrim(origin_image)
    # print(f"Left image shape: {left.shape}")
    # print(f"Right image shape: {right.shape}")
    # print(f"Origin left image shape: {origin_left.shape}")
    # print(f"Origin right image shape: {origin_right.shape}")

    if right is None or left is None:
        print("Error: Image trimming failed.")
        return

    output_dir = './temp'
    os.makedirs(output_dir, exist_ok=True)

    for file in os.listdir(output_dir):
        os.remove(os.path.join(output_dir, file))

    left_contour = prob_loc_contour(left, output_dir, 'left', origin_left)
    right_contour = prob_loc_contour(right, output_dir, 'right', origin_right)

    return right_contour, left_contour

def draw_transparent_rectangles(image, rects, color=(0, 0, 255), alpha=0.3):
    overlay = image.copy()
    for (x, y, w, h) in rects:
        # Draw filled rectangle on the overlay image
        cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)

    # Blend the overlay with the original image
    cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)

def calculate_inter_question_areas(problem_locations, image_height):
    inter_question_areas = []

    for i in range(len(problem_locations) - 1):
        # 현재 문제와 다음 문제의 좌표를 가져옴
        x1, y1, w1, h1 = problem_locations[i]
        x2, y2, w2, h2 = problem_locations[i + 1]

        # 문제 사이의 중간 영역을 계산
        inter_y_start = y1 + h1
        inter_y_end = y2
        inter_h = inter_y_end - inter_y_start
        inter_w = max(w1, w2)
        inter_x = min(x1, x2)

        # 중복 제거: 동일한 x, y 좌표를 가진 경우 높이가 큰 문제만 유지
        if x1 == x2 and y1 == y2:
            if h1 > h2:
                continue  # 다음 문제로 넘어감 (더 작은 높이의 문제는 추가하지 않음)

        # 음수 높이 제거
        if inter_h > 0:
            # 중간 영역을 추가
            inter_question_areas.append((inter_x, inter_y_start, inter_w, inter_h))

    # 마지막 문제와 이미지 하단 사이의 영역을 계산
    if problem_locations:
        x_last, y_last, w_last, h_last = problem_locations[-1]
        inter_y_start = y_last + h_last
        inter_y_end = image_height
        inter_h = inter_y_end - inter_y_start
        inter_w = w_last
        inter_x = x_last

        # 영역 추가 (음수 높이 제거)
        if inter_h > 0:
            inter_question_areas.append((inter_x, inter_y_start, inter_w, inter_h))

    return inter_question_areas

def detect_handwriting(image, problem_texts):
    """
    이미지에서 손글씨가 있는지 감지
    :param image: OpenCV 이미지
    :param problem_texts: 해당 문제에서 이미 감지된 텍스트 리스트
    :return: 손글씨가 포함된 경우 True, 그렇지 않으면 False
    """
    # image에서 상하좌우 10%를 잘라내어 사용
    h, w = image.shape[:2]
    percentage = 0.22
    crop_top = int(h * percentage)
    crop_bottom = int(h * (1 - percentage))
    crop_left = int(w * percentage)
    crop_right = int(w * (1 - percentage))
    image = image[crop_top:crop_bottom, crop_left:crop_right]

    content = cv2.imencode('.png', image)[1].tobytes()
    image_vision = vision.Image(content=content)
    
    response = client.document_text_detection(image=image_vision)
    full_text_annotation = response.full_text_annotation

    if not full_text_annotation:
        user_ocr_result.append("")
        return False

    # 전체 텍스트에서 이미 감지된 텍스트(problem_texts)를 제외
    cropped_text = full_text_annotation.text.strip()

    cropped_lines = []
    for text in cropped_text.split("\n"):
        if text:
            cropped_lines.append(text)
    
    # print("problem len : ", len(problem_texts))
    # print("cropped len : ", len(cropped_lines))

    # 문제 텍스트의 각 항목을 cropped_lines에서 제거
    for problem_text in problem_texts:
        for i, cropped_line in enumerate(cropped_lines):
            # problem_text와 cropped_line이 조금이라도 일치하면 제거
            if problem_text in cropped_line:
                cropped_lines[i] = ""
            elif cropped_line in problem_text:
                cropped_lines[i] = ""
            

    # 남아있는 텍스트가 있다면 손글씨로 판단
    cropped_lines = [line for line in cropped_lines if line]  # 빈 문자열 제거
    if cropped_lines:
        detected_text = " ".join(cropped_lines)
        print(f"Detected text: {detected_text}")
        user_ocr_result.append(detected_text)
        return True

    return False

def print_ocr_response(image):
    """
    이미지에 대한 OCR 응답을 반환
    :param image: OpenCV 이미지
    :return: OCR 결과 텍스트와 BoundingBox 리스트
    """
    content = cv2.imencode('.jpg', image)[1].tobytes()
    image_vision = vision.Image(content=content)
    
    response = client.document_text_detection(image=image_vision)
    full_text_annotation = response.full_text_annotation

    if not full_text_annotation:
        return "", []

    texts = full_text_annotation.text.strip()
    bounding_boxes = []

    for page in full_text_annotation.pages:
        for block in page.blocks:
            for paragraph in block.paragraphs:
                for word in paragraph.words:
                    bounding_boxes.append(word.bounding_box)

    return texts, bounding_boxes

def filtering_contoured_areas(positions):
    filtered_positions = []

    # 중복을 피하기 위해 이미 처리된 영역을 저장
    processed = [False] * len(positions)

    for i in range(len(positions)):
        if processed[i]:
            continue
        
        max_area_position = positions[i]
        max_area = max_area_position[2] * max_area_position[3]
        
        for j in range(i + 1, len(positions)):
            if processed[j]:
                continue
            
            # x, y 좌표 차이의 합 계산
            diff = abs(positions[i][0] - positions[j][0]) + abs(positions[i][1] - positions[j][1])
            
            if diff < 200:
                # 면적 비교
                area_j = positions[j][2] * positions[j][3]
                if area_j > max_area:
                    max_area_position = positions[j]
                    max_area = area_j
                # j번 영역은 중복 처리되므로 제외
                processed[j] = True
        
        # i번 영역이 가장 큰 경우로 확정
        filtered_positions.append(max_area_position)
    return filtered_positions

@hand_router.post("/hand_determinant")
async def hand_determinant(image_input: ImageInput):
    start_time = time.time()
    
    user_ocr_result.clear()
    problem_image = image_input.get_origin_image()

    origin_right, origin_left = imtrim(problem_image)

    pre_right, pre_left = prob_loc_crop(problem_image)
    print("@@@@@@@@ hand_determinant_start @@@@@@@@@@@@")
    print("image_size compare-origin_width: ", problem_image.shape[1], " origin_left_width: ", origin_left.shape[1])

    # print(f"Step 1: Problem location detection time: {start_step_time - start_time:.2f} seconds")

    start_step_time = time.time()
    # 중복되는 영역 제거
    left = filtering_contoured_areas(pre_left)
    right = filtering_contoured_areas(pre_right)
    
    for i, (x, y, w, h) in enumerate(left):
        cropped_left = origin_left[y:y+h, x:x+w]
        cv2.imwrite(f"./temp/problem_left_{i}.png", cropped_left)

    for i, (x, y, w, h) in enumerate(right):
        cropped_right = origin_right[y:y+h, x:x+w]
        cv2.imwrite(f"./temp/problem_right_{i}.png", cropped_right)

    print("left position : ", left)
    print("right position : ", right)

    problem_locations_left = left
    problem_locations_right = right

    # 왼쪽 이미지의 높이 가져오기
    problem_contoured_image_left = cv2.imread('./temp/_left_problem_contoured_image.png')
    problem_contoured_image_left = cv2.cvtColor(problem_contoured_image_left, cv2.COLOR_BGR2RGB)
    image_height_left = problem_contoured_image_left.shape[0]

    # 오른쪽 이미지의 높이 가져오기
    problem_contoured_image_right = cv2.imread('./temp/_right_problem_contoured_image.png')
    problem_contoured_image_right = cv2.cvtColor(problem_contoured_image_right, cv2.COLOR_BGR2RGB)
    image_height_right = problem_contoured_image_right.shape[0]

    # 문제 사이 영역 계산 (왼쪽과 오른쪽)
    inter_question_areas_left = calculate_inter_question_areas(problem_locations_left, image_height_left)
    inter_question_areas_right = calculate_inter_question_areas(problem_locations_right, image_height_right)

    inter_question_areas_right_adjusted = []
    for i_r in inter_question_areas_right:
        x, y, w, h = i_r
        x = x + origin_left.shape[1] // 2
        inter_question_areas_right_adjusted.append((x, y, w, h))
    
    inter_position = inter_question_areas_left + inter_question_areas_right_adjusted
    print("inter position : ", inter_position)
    print("inter left : ", inter_question_areas_left)
    print("inter right : ", inter_question_areas_right)

    target_image = image_input.get_hand_image()

    target_right, target_left = imtrim(target_image)

    for i, (x, y, w, h) in enumerate(inter_question_areas_left):
        cropped_left = target_left[y:y+h, x:x+w]
        cv2.imwrite(f"./temp/cropped_left_{i}.png", cropped_left)

    for i, (x, y, w, h) in enumerate(inter_question_areas_right):
        cropped_right = target_right[y:y+h, x:x+w]
        cv2.imwrite(f"./temp/cropped_right_{i}.png", cropped_right)

    print(f"Step 2: Inter-question area cropping time: {time.time() - start_step_time:.2f} seconds")
    start_step_time = time.time()
    # 문제 OCR 결과를 저장할 변수
    problem_ocr_texts_left = []
    problem_ocr_texts_right = []

    # 문제 텍스트 추출
    for i in range(len(left)):
        problem_image_left = cv2.imread(f"./temp/problem_left_{i}.png")
        texts, _ = print_ocr_response(problem_image_left)
        prob = []
        for text in texts.split("\n"):
            if text:
                prob.append(text)
        print("problem text left : ", prob)
        problem_ocr_texts_left.append(prob)

    for i in range(len(right)):
        problem_image_right = cv2.imread(f"./temp/problem_right_{i}.png")
        texts, _ = print_ocr_response(problem_image_right)
        prob = []
        for text in texts.split("\n"):
            if text:
                prob.append(text)
        print("problem text right : ", prob)
        problem_ocr_texts_right.append(prob)
    
    left_flag = True
    handwrite_num = -1
    left_max_num = 0
    for i in range(len(inter_question_areas_left)):
        cropped_left = cv2.imread(f"./temp/cropped_left_{i}.png")
        is_handwriting = detect_handwriting(cropped_left, problem_ocr_texts_left[i])
        print(f"Cropped Left {i} - Is handwriting: {is_handwriting}")
        if is_handwriting:
            left_max_num = i + 1
        else:
            left_flag = False
            break

    right_max_num = 0
    if left_flag:
        for i in range(len(inter_question_areas_right)):
            cropped_right = cv2.imread(f"./temp/cropped_right_{i}.png")
            is_handwriting = detect_handwriting(cropped_right, problem_ocr_texts_right[i])
            print(f"Cropped Right {i} - Is handwriting: {is_handwriting}")
            if is_handwriting:
                right_max_num = i + 1
    
    if right_max_num > 0:
        handwrite_num += len(inter_question_areas_left)
        handwrite_num += right_max_num
    else:
        handwrite_num += left_max_num

    print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

    # left와 right의 문제수를 고려해 handwrite가 연속된 마지막 번호 출력

    print("handwrite_num : ", handwrite_num)
    print("len user_ocr_result : ", len(user_ocr_result))
    if handwrite_num > -1 and handwrite_num < len(user_ocr_result):
        print("user_ocr_result[handwrite_num] : ", user_ocr_result[handwrite_num])
        print("user_ocr_result : ", user_ocr_result)
   
    if handwrite_num == -1:
        output_json = {
            "handwrite_num": handwrite_num,
            "user_ocr_result": "No handwriting detected."
        }
    else:
        user_handwrite_position = inter_position[handwrite_num]
        user_handwrite_image = target_image[user_handwrite_position[1]:user_handwrite_position[1] + user_handwrite_position[3], user_handwrite_position[0]:user_handwrite_position[0] + user_handwrite_position[2]]

        # to base64
        _, buffer = cv2.imencode('.jpg', user_handwrite_image)
        user_handwrite_image_base64 = base64.b64encode(buffer).decode('utf-8')

        print("user_ocr_result[handwrite_num] : ", user_ocr_result[handwrite_num])
        # print("type handwrite_num : ", type(user_ocr_result[handwrite_num]))
        output_json = {
            "handwrite_num": handwrite_num,
            "user_handwrite_image": user_handwrite_image_base64,
            "user_hand_ocr_result": user_ocr_result[handwrite_num]
        }
    # print(f"Step 3: Handwriting detection time: {time.time() - start_step_time:.2f} seconds")
    print("@@@@@@@@ hand_determinant_end @@@@@@@@@@@@")

    return output_json

# origin_image = cv2.imread('./hand_no.jpg')
# hand_image = cv2.imread('./hand_no.jpg')

# hand_determinant(origin_image, hand_image)
