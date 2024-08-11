import cv2
import numpy as np

def extract_features(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create()
    keypoints, descriptors = orb.detectAndCompute(gray, None)
    return keypoints, descriptors

def match_features(template_descriptors, scene_descriptors):
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(template_descriptors, scene_descriptors)
    matches = sorted(matches, key=lambda x: x.distance)
    return matches

def find_best_match(scene_image, template_descriptors, step_size=50, min_match_count=10):
    h, w = scene_image.shape[:2]
    best_match = None
    best_match_score = float('inf')
    best_x, best_y, best_w, best_h = 0, 0, 0, 0

    for y in range(0, h, step_size):
        for x in range(0, w, step_size):
            window = scene_image[y:y+step_size, x:x+step_size]
            _, scene_descriptors = extract_features(window)

            if scene_descriptors is None or len(scene_descriptors) < min_match_count:
                continue

            matches = match_features(template_descriptors, scene_descriptors)
            score = sum([m.distance for m in matches])

            if score < best_match_score:
                best_match_score = score
                best_match = window
                best_x, best_y, best_w, best_h = x, y, step_size, step_size

    return best_match, (best_x, best_y, best_w, best_h)