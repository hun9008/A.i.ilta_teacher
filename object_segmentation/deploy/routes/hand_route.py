from fastapi import HTTPException, APIRouter, File, UploadFile, Form
import base64
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import time
from models.cv_prob_area import prob_loc_crop, visualize_problem_locations
from models.cv_hand_loc import hand_loc, visualize_hand_area
from models.input_hand import ProbAreas_HandImg

hand_router = APIRouter()

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def decode_image(base64_str):
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def area_loc2ratio(image_size, x, y, w, h):
    
    output_loc2rat = ((x*100)/image_size[1], (y*100)/image_size[0], (w*100)/image_size[1], (h*100)/image_size[0])
    
    return output_loc2rat

## which problem is user solving
@hand_router.post("/prob_areas_which_prob")
async def define_prob_areas(input: ProbAreas_HandImg):
    image_clean = decode_image(input.image_clean)
    image_hand = decode_image(input.image_hand)
    
    prob_loc_l, prob_loc_r = prob_loc_crop(image_clean)
    
    if prob_loc_l is not None and prob_loc_r is not None:
        prob_loc_l.sort(key=lambda x: x[1])
        prob_loc_r.sort(key=lambda x: x[1])
        
        real_loc_r = []
        tot_loc = []
        left_prob_count = 0
        right_prob_count = 0
        for loc in prob_loc_l:
            print("left", loc)
            tot_loc.append(loc)
            left_prob_count += 1
        for loc in prob_loc_r:
            loc = (loc[0]+image_clean.shape[1]//2,loc[1], loc[2], loc[3])
            print("right", loc)
            real_loc_r.append(loc)
            tot_loc.append(loc)
            right_prob_count += 1
            
        prob_areas = []
        if left_prob_count > 1:
            for i in range (left_prob_count - 1):
                tmp = prob_loc_l[i]
                tmp_next = prob_loc_l[i+1]
                prob_area = (tmp[0], tmp[1], image_clean.shape[1]//2-tmp[0]-3, tmp_next[1]-tmp[1]-3)
                prob_areas.append(prob_area)
            tmp = prob_loc_l[left_prob_count - 1]
            prob_areas.append((tmp[0], tmp[1], image_clean.shape[1]//2-tmp[0], image_clean.shape[0]-tmp[1]-3))
        else:
            if len(prob_loc_l) > 0 and len(prob_loc_r) > 0:
                prob_areas.append((prob_loc_l[0], prob_loc_l[1], image_clean.shape[1]//2-prob_loc_l[0]-3, image_clean.shape[0]-prob_loc_l[1]-3))
            else:
                prob_areas.append((0, 0, image_clean.shape[1]//2, image_clean.shape[0]))
        if right_prob_count > 1:
            for i in range (right_prob_count - 1):
                tmp = real_loc_r[i]
                tmp_next = real_loc_r[i+1]
                prob_area = (tmp[0], tmp[1], image_clean.shape[1]-tmp[0]-3, tmp_next[1]-tmp[1]-3)
                prob_areas.append(prob_area)
            tmp = real_loc_r[right_prob_count - 1]
            prob_areas.append((tmp[0], tmp[1], image_clean.shape[1]-tmp[0], image_clean.shape[0]-tmp[1]-3))
        else:
            prob_areas.append((real_loc_r[0], real_loc_r[1], image_clean.shape[1]-real_loc_r[0]-3, image_clean.shape[0]-real_loc_r[1]-3))

        # visualize_problem_locations(image_show_clean[:,], prob_areas)
        
        tl, br = hand_loc(image_hand)
        hand_area_loc = (tl[0], tl[1], br[0]-tl[0], br[1]-tl[1])
        # visualize_hand_area(image_show_hand[:,], hand_area_loc)
            
        prob_loc_rats = []
        image_clean_size = (image_clean.shape[0], image_clean.shape[1])
        for (prob_x, prob_y, prob_w, prob_h) in prob_areas:
            rat_x, rat_y, rat_w, rat_h = area_loc2ratio(image_clean_size, prob_x, prob_y, prob_w, prob_h)
            prob_loc_rats.append((rat_x, rat_y, rat_w, rat_h))
        
        #determine which prob_area the hand_are_loc is located
        handloc_x, handloc_y, handloc_w, handloc_h = hand_area_loc
        
        image_hand_size = (image_hand.shape[0], image_hand.shape[1])
        hand_x, hand_y, hand_w, hand_h = area_loc2ratio(image_hand_size, handloc_x, handloc_y, handloc_w, handloc_h)
        
        print("-------*********")
        print("clean figure size: ", image_clean_size)
        print("hand figure size: ",image_hand_size)
        for i in prob_loc_rats:
            print(i)
        print("\n hand location", hand_area_loc)
        print(f"hand loc ratio: {hand_x, hand_y, hand_w, hand_h}")
        print("-------*********")
        
        prob_num = None
        for i, (prob_x, prob_y, prob_w, prob_h) in enumerate(prob_loc_rats):
            print("prob area: ", i, "prob location rat", (prob_x, prob_y, prob_w, prob_h))
            if (hand_x >= prob_x and hand_x <= prob_x + prob_w and
                hand_y >= prob_y and hand_y <= prob_y + prob_h):
                prob_num = i
                break
        
        if prob_num is None:
            prob_num = -1
        
        image_path = './temp'
        print("image_list : ", os.listdir(image_path))
        for filename in os.listdir(image_path):
            # print("filename: ", filename)
            os.remove(os.path.join(image_path, filename))
        
        output = {
            "prob_area": prob_areas,
            "prob_num": prob_num,
        }
    else:
        output = {
            "prob_area": [],
            "prob_num": -1,
        }
    
    return JSONResponse(content=output)