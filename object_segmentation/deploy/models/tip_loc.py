import cv2
import os
import numpy as np
from cv_which_prob.unified_detector import Fingertips
from cv_which_prob.hand_detector.detector import YOLO

base_dir = os.path.dirname(os.path.abspath(__file__))
yolo_path = os.path.join('cv_which_prob/weights/yolo.h5')
fingertip_path = os.path.join('cv_which_prob/weights/fingertip.h5')

hand = YOLO(weights=yolo_path, threshold=0.8)
fingertips = Fingertips(weights=fingertip_path)

def hand_loc(image):

    # hand detection
    tl, br = hand.detect(image=image)

    if tl and br is not None:
        cropped_image = image[tl[1]:br[1], tl[0]: br[0]]
        height, width, _ = cropped_image.shape

        # gesture classification and fingertips regression
        prob, pos = fingertips.classify(image=cropped_image)
        pos = np.mean(pos, 0)

        # post-processing
        prob = np.asarray([(p >= 0.5) * 1.0 for p in prob])
        for i in range(0, len(pos), 2):
            pos[i] = pos[i] * width + tl[0]
            pos[i + 1] = pos[i + 1] * height + tl[1]

        # drawing
        index = 0
        color = [(15, 15, 240), (15, 240, 155), (240, 155, 15), (240, 15, 155), (240, 15, 240)]
        image = cv2.rectangle(image, (tl[0], tl[1]), (br[0], br[1]), (235, 26, 158), 2)
        for c, p in enumerate(prob):
            if p > 0.5:
                image = cv2.circle(image, (int(pos[index]), int(pos[index + 1])), radius=12,
                                   color=color[c], thickness=-2)
            index = index + 2
    
    return tl, br
