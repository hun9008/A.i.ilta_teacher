import numpy as np
import cv2
import os
import matplotlib.pyplot as plt
from PIL import Image

problem_idx = 0

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

def contour(page_rl, output_dir, type, origin, origin_format='png'):
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
    contoured_image = cv2.cvtColor(contoured_image, cv2.COLOR_GRAY2BGR)
    cv2.drawContours(contoured_image, contours, -1, (0, 0, 255), 2) 

    cv2.imwrite(f"{output_dir}/_{type}_contoured_image.png", contoured_image)

    problem_locations = []
    net_location = []

    # print("all area : ", len(contours))
    

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
            if abs(y - prev_y) <= 150 and ((x + w >= prev_x and x + w <= prev_x + prev_w) or (prev_x + prev_w >= x and prev_x + prev_w <= x + w)):
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
        
        output_file = f"{output_dir}/problem_{i+1+problem_idx}.{origin_format}"
        if origin_format.lower() == 'png':
            cv2.imwrite(output_file, anti_aliased_image, [cv2.IMWRITE_PNG_COMPRESSION, 0])
        elif origin_format.lower() in ['jpg', 'jpeg']:
            cv2.imwrite(output_file, anti_aliased_image, [cv2.IMWRITE_JPEG_QUALITY, 95])
        else:
            cv2.imwrite(output_file, anti_aliased_image)
        cnt += 1
    
    problem_idx += cnt

def problem_crop(image, image_format):
    
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

    for file in os.listdir(output_dir):
        os.remove(os.path.join(output_dir, file))

    contour(left, output_dir, 'left', origin_left, image_format)
    contour(right, output_dir, 'right', origin_right, image_format)
