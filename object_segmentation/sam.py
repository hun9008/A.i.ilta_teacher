import cv2
import numpy as np
import os
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
from tqdm import tqdm

sam = sam_model_registry["vit_h"](checkpoint="models/sam_vit_h_4b8939.pth")

mask_generator = SamAutomaticMaskGenerator(sam)

image_path = "src/scenes/prob_3.jpeg"
image = cv2.imread(image_path)

if image is None:
    raise ValueError(f"Error: Could not load image from {image_path}")

image_height, image_width = image.shape[:2]


box_width = image_width // 8
box_height = image_height // 8


masks = mask_generator.generate(image)

output_dir = "sam_output_problems"
os.makedirs(output_dir, exist_ok=True)

def post_process_mask(mask):

    mask = mask.astype(np.uint8) * 255

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    return mask

for i, mask in enumerate(tqdm(masks, desc="Processing Masks")):
    x, y, w, h = mask["bbox"]
    
    if w * h < (image_width * image_height) // 256:
        continue

    processed_mask = post_process_mask(mask["segmentation"])

    masked_image = np.zeros_like(image)
    masked_image[processed_mask == 255] = image[processed_mask == 255]
    
    cv2.imwrite(f"{output_dir}/problem_{i+1}.png", masked_image[y:y+h, x:x+w])

print("문제 영역 분할 완료.")