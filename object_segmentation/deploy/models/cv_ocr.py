import numpy as np
import cv2
import os
# import matplotlib.pyplot as plt
from PIL import Image
import pytesseract

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
    

    h, w = page.shape
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

def contour(page_rl, output_dir, type):
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

    cnt = 0
    print("contours len, type: ", len(contours), " ",type)
    for i, c in enumerate(contours):
        x, y, w, h = cv2.boundingRect(c)
        if w > 100 and h > 50:  
            img_trim = page_rl[y:y+h, x:x+w]
            cv2.imwrite(f"{output_dir}/problem_{i+1+problem_idx}.png", img_trim)
            cnt += 1
    
    problem_idx += cnt

def problem_crop(image):
    
    image = preprocess_image(image)

    right, left = imtrim(image)
    print("all shape:", image.shape)
    print("right shape: ", right.shape)
    print("left shape: ", left.shape)

    if right is None or left is None:
        print("Error: Image trimming failed.")
        return

    output_dir = './temp'
    os.makedirs(output_dir, exist_ok=True)

    contour(right, output_dir, 'right')
    contour(left, output_dir, 'left')

def ocr(image_path):

    # path = 'src/scenes/prob_9.png'
    os.environ['TESSDATA_PREFIX'] = '/Users/jeong-yonghun/Desktop/FLY_AI/project/model/A.i.ilta_teacher/object_segmentation/deploy/tessdata'
    # kor_equ = pytesseract.image_to_string(Image.open(path), config='-l kor + equ')

    ocrs = []

    image_files = os.listdir(image_path)
    for file in image_files:
        if not file.startswith('_'):
            file_path = os.path.join(image_path, file)
            text = pytesseract.image_to_string(Image.open(file_path), config='-l kor+equ')
            ocrs.append(text)

    return ocrs


# problem_crop('src/scenes/prob_8.png')