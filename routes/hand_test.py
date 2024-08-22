
hand_detect_dummy = {
  "prob_area": [
    [
      47,
      40,
      496,
      428
    ],
    [
      45,
      471,
      498,
      474
    ],
    [
      47,
      948,
      499,
      401
    ],
    [
      595,
      35,
      494,
      486
    ],
    [
      599,
      524,
      490,
      429
    ],
    [
      602,
      956,
      490,
      393
    ]
  ],
  "prob_num": 1
}

async def decide_user_wrong(websocket: WebSocket):
    while True:
        
        await asyncio.sleep(sleep_time)  
        
        print("len(concepts) : ", len(concepts_storage))
        print("len(solutions) : ", len(solutions_storage))
        print("len(ocrs) : ", len(ocrs_storage))
        print("len(origin_image) : ", len(origin_image_storage))
        print("type of origin_image : ", type(origin_image_storage))
        if len(solutions_storage) != 0 and len(ocrs_storage) != 0 and len(origin_image_storage) != 0:
            # directory path
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
            storage_dir = os.path.join(root_dir, "local_storage/mobile")
            
            file_list = glob.glob(os.path.join(storage_dir, "*"))
            if not file_list:
                continue  # 혹시 이미지가 없는 경우

            latest_img = max(file_list, key=os.path.getctime)
            
            # # encoding 
            with open(latest_img, "rb") as target_img:
                include_hand = base64.b64encode(target_img.read()).decode('utf-8')
            

            # problem_detect_json = {
            #     "image_clean" : origin_image_storage[0],
            #     "image_hand" : include_hand
            # }

            # url = "http://model.maitutor.site/prob_areas_which_prob"

            # headers = {'Content-Type': 'application/json'}
            # response = await asyncio.to_thread(requests.post, url, json=problem_detect_json, headers=headers)
            
            # response = hand_detect_dummy
            # print("hand response : ", response)


            # # (assume) 지금 어떤 문제 풀고 있는지 알아내기
            # prob_num = response.get("prob_num")
            # problem_index = 0
            # if prob_num != -1:
            #     problem_index = prob_num
            #     prob_area = response.get("prob_area")
            #     this_prob_area = prob_area[problem_index]
            #     ## 전체 이미지에서 this_prob_area에 해당하는 부분만 crop
            #     x = this_prob_area[0]
            #     y = this_prob_area[1]
            #     w = this_prob_area[2]
            #     h = this_prob_area[3]

            #     origin_image_decoded = base64.b64decode(origin_image_storage[0])
            #     crop_img = origin_image_decoded[y:y+h, x:x+w]
            #     frame_data = base64.b64encode(crop_img).decode('utf-8')

            problem_index = 0
            solution = solutions_storage[problem_index]

            # hand_ocr = await perform_handwrite_ocr(frame_data, solution)
            hand_ocr = {
                "determinants": "wrong"
            }
            
            user_vars.user_status = hand_ocr.get("determinants")
            # print("user_status : ", user_vars.user_status)
        