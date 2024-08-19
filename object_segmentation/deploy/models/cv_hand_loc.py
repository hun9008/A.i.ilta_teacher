import numpy as np
import cv2
import os
import matplotlib.pyplot as plt
from PIL import Image

problem_idx = 0

def preprocess_image(page):

    gray = cv2.cvtColor(page, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # 구조적 요소 커널을 생성하여 세로 선 강조
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, page.shape[0] // 30))
    
    # 모폴로지 연산을 통해 세로 선 강조
    detected_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    # 세로 구분선 제거
    cnts = cv2.findContours(detected_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        if h > page.shape[0] // 2:  # 세로 선이 이미지의 절반 이상을 잇는 경우
            cv2.drawContours(binary, [c], -1, (0, 0, 0), thickness=cv2.FILLED)  

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
        print("Error: page_rl is None.")
        return

    imgray = page_rl

    blur = cv2.GaussianBlur(imgray, ksize=(3, 3), sigmaX=0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    edge = cv2.Canny(thresh, 100, 200)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 50)) 
    closed = cv2.morphologyEx(edge, cv2.MORPH_CLOSE, kernel)

    contours, hierarchy = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    contoured_image = page_rl.copy()
    cv2.drawContours(contoured_image, contours, -1, (0, 255, 0), 2) 

    cv2.imwrite(f"{output_dir}/_{type}_contoured_image.png", contoured_image)

    problem_locations = []

    cnt = 0
    print("contours len, type: ", len(contours), " ",type)
    for i, c in enumerate(contours):
        x, y, w, h = cv2.boundingRect(c)
        if w > 100 and h > 50:  
            problem_locations.append((x, y, w, h))
    
    return problem_locations

def prob_loc_crop(image):
    durty_image = preprocess_image(image)

    right, left = imtrim(durty_image)
    origin_right, origin_left = imtrim(image)
    # print("all shape:", image.shape)
    # print("right shape: ", right.shape)
    # print("left shape: ", left.shape)

    if right is None or left is None:
        print("Error: Image trimming failed.")
        return

    output_dir = './temp'
    os.makedirs(output_dir, exist_ok=True)

    return prob_loc_contour(left, output_dir, 'left', origin_left), prob_loc_contour(right, output_dir, 'right', origin_right)

def visualize_problem_locations(image, problem_locations):
    for (x, y, w, h) in problem_locations:
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(image, f"({x},{y})", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

    plt.figure(figsize=(10, 10))
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()
    
def visualize_hand_area(image, hand_locations):
    cv2.rectangle(image, hand_locations[0], hand_locations[1], (0, 255, 255), 2)
    cv2.putText(image, f"({hand_locations[0][0]},{hand_locations[0][1]})", (hand_locations[0][0], hand_locations[0][1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    
    plt.figure(figsize=(10, 10))
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()