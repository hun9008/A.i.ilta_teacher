import cv2
import os
import numpy as np
import matplotlib as plt
from cv_which_prob.hand_detector.detector import YOLO

base_dir = os.path.dirname(os.path.abspath(__file__))
yolo_path = os.path.join('cv_which_prob/weights/yolo.h5')
fingertip_path = os.path.join('cv_which_prob/weights/fingertip.h5')

hand = YOLO(weights=yolo_path, threshold=0.8)

def hand_loc(image):

    # hand detection
    tl, br = hand.detect(image=image)

    if tl and br is not None:
        return tl, br
    
    return (0,0), (0,0)

def visualize_hand_area(image, hand_locations):
    cv2.rectangle(image, (hand_locations[0], hand_locations[1]), (hand_locations[0]+hand_locations[2], hand_locations[1]+hand_locations[3]), (0, 255, 255), 2)
    cv2.putText(image, f"({hand_locations[0]},{hand_locations[1]})", (hand_locations[0], hand_locations[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    
    plt.figure(figsize=(10, 10))
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()