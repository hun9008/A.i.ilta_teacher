import cv2
import numpy as np
import os
from segment_anything_.segment_anything import sam_model_registry, SamAutomaticMaskGenerator
from tqdm import tqdm
import torch

sam = sam_model_registry["vit_h"](checkpoint="segment_anything_/ckpt/sam_vit_h_4b8939.pth")

device = "cuda" if torch.cuda.is_available() else "cpu"
print("device: ", device)
sam.to(device=device)

mask_generator = SamAutomaticMaskGenerator(sam)

def sam_hand_loc(image):

    if image is None:
        raise ValueError(f"Error: Could not load image.")

    image_height, image_width = image.shape[:2]

    box_width = image_width // 3
    box_height = image_height // 3

    masks = mask_generator.generate(image)

    output_dir = "tmp_sam_output"
    os.makedirs(output_dir, exist_ok=True)

    def post_process_mask(mask):

        mask = mask.astype(np.uint8) * 255

        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        return mask

    for i, mask in enumerate(tqdm(masks, desc="Processing Masks")):
        x, y, w, h = mask["bbox"]
        
        if w>= box_width and h >= box_height:
            print("!!!!!!mask_idx, loc: ", i, x, y, w, h)

            processed_mask = post_process_mask(mask["segmentation"])

            masked_image = np.zeros_like(image)
            masked_image[processed_mask == 255] = image[processed_mask == 255]
            
            cv2.imwrite(f"{output_dir}/problem_{i+1}.png", masked_image[y:y+h, x:x+w])

    print("hand loc detect done")