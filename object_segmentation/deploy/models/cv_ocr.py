import numpy as np
import cv2
import os
# import matplotlib.pyplot as plt
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

    # plt.imshow(processed_image, cmap='gray')
    # plt.axis('off')
    # plt.show()

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

def contour(page_rl, output_dir, type, origin):
    global problem_idx

    if page_rl is None:
        print("Error: page_rl is None.")
        return

    # imgray = cv2.cvtColor(page_rl, cv2.COLOR_BGR2GRAY)
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
    
    print("problem_locations: ", len(problem_locations))
    padding = 10
    scale_factor = 2  # 해상도 확대 비율
    
    problem_locations.sort(key=lambda x: x[1])
    
    for i in range(len(problem_locations)):
        x, y, w, h = problem_locations[i]
        img_trim = origin[y:y+h, x:x+w]

        # 이미지 해상도 확대
        img_resized = cv2.resize(img_trim, (w * scale_factor, h * scale_factor), interpolation=cv2.INTER_CUBIC)
        
        img_padded = cv2.copyMakeBorder(
            img_resized, 
            top=padding * scale_factor, bottom=padding * scale_factor, 
            left=padding * scale_factor, right=padding * scale_factor, 
            borderType=cv2.BORDER_CONSTANT, 
            value=[255, 255, 255]  # 흰색 패딩
        )
        
        # Bilateral Filter 적용
        anti_aliased_image = cv2.bilateralFilter(img_padded, d=15, sigmaColor=100, sigmaSpace=100)
        
        cv2.imwrite(f"{output_dir}/problem_{i+1+problem_idx}.png", anti_aliased_image, [cv2.IMWRITE_PNG_COMPRESSION, 0])
        cnt += 1
    
    problem_idx += cnt

def problem_crop(image):

    durty_image = preprocess_image(image)

    right, left = imtrim(durty_image)
    origin_right, origin_left = imtrim(image)
    print("all shape:", image.shape)
    print("right shape: ", right.shape)
    print("left shape: ", left.shape)

    if right is None or left is None:
        print("Error: Image trimming failed.")
        return

    output_dir = './temp'
    os.makedirs(output_dir, exist_ok=True)

    contour(left, output_dir, 'left', origin_left)
    contour(right, output_dir, 'right', origin_right)