import numpy as np
import cv2
import os

def imtrim(page):
    if page is None:
        print("Error: Input page is None.")
        return None, None
    
    top_trim = 100  
    bottom_trim = 50  
    page = page[top_trim:-bottom_trim, :]
    

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

def contour(page_rl, output_dir):
    if page_rl is None:
        print("Error: page_rl is None.")
        return

    imgray = cv2.cvtColor(page_rl, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(imgray, ksize=(3, 3), sigmaX=0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    edge = cv2.Canny(thresh, 100, 200)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 50)) 
    closed = cv2.morphologyEx(edge, cv2.MORPH_CLOSE, kernel)

    contours, hierarchy = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    contoured_image = page_rl.copy()
    cv2.drawContours(contoured_image, contours, -1, (0, 255, 0), 2) 

    cv2.imwrite(f"{output_dir}/contoured_image.png", contoured_image)

    for i, c in enumerate(contours):
        x, y, w, h = cv2.boundingRect(c)
        if w > 100 and h > 100:  
            img_trim = page_rl[y:y+h, x:x+w]
            cv2.imwrite(f"{output_dir}/problem_{i+1}.png", img_trim)

def problem_crop(image_url):
    if not os.path.exists(image_url):
        print(f"Error: The file {image_url} does not exist.")
        return
    
    imgfile = image_url
    image = cv2.imread(imgfile)

    if image is None:
        print(f"Error: Could not load image from {image_url}")
        return

    right, left = imtrim(image)
    print("right shape: ", right.shape)
    print("left shape: ", left.shape)

    if right is None or left is None:
        print("Error: Image trimming failed.")
        return

    output_dir = 'output_problems'
    os.makedirs(output_dir, exist_ok=True)

    contour(right, output_dir)
    contour(left, output_dir)


problem_crop('src/prob_1.jpeg')