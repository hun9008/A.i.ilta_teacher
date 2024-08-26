import cv2 
import numpy as np
import base64 # decoding, encoding 방식
from config import user_vars

def decode_image(base64_str):
    try:
        img_data = base64.b64decode(base64_str)
        
        # img data to 1d array
        np_arr = np.frombuffer(img_data, np.uint8)
        if np_arr.size == 0:
            raise ValueError("Decoded buffer is empty")
        
        # Read image with flag(COLOR)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Image decoding failed")
        
        return image
    
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None
    
    
def detect_hand(frame):
    # RGB to HSV(Hue, Saturation, Value)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # 피부색 범위를 설정합니다 (HSV)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    
    # 피부색 범위에 해당하는 마스크 생성
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # 모폴로지 변환 적용 (노이즈 제거)
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.erode(mask, kernel, iterations=2)
    mask = cv2.dilate(mask, kernel, iterations=2)
    
    # 블러링을 통해 노이즈 제거
    mask = cv2.GaussianBlur(mask, (5, 5), 100)
    
    # 윤곽선 검출
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # 가장 큰 윤곽선을 선택
    if len(contours) > 0:
        max_contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(max_contour) > 10:  # 최소 면적 조건
            # print("Hand detected")
            return True
    # print("No hand detected")
    return False


def detect_motion(saved_images):
    
    # user의 초기 상태 설정 -> 공부 시작하면 doing으로 설정해야 함
    # user_status = "doing"
    
    frames = [cv2.imread(image_path) for image_path in saved_images]

    # 움직임 파악을 위한 초기 설정
    motion_detected = False
        
    prev_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    for i in range(1, len(frames)):
        curr_gray = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)

        diff = cv2.absdiff(prev_gray, curr_gray) 
        _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        motion = cv2.countNonZero(thresh) # 움직인 픽셀 수 측정 

        if motion > 50000:  # 임계값 조정 필요
            motion_detected = True
            break
            
        # 현재 프레임을 이전 프레임으로 설정해 다음 프레임과 비교
        prev_gray = curr_gray
        
    if not motion_detected:
        print("user status might be < solve_delay >")
        user_vars.user_status = "solve_delay"

    return user_vars.user_status