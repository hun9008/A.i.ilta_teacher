import re
import asyncio
import subprocess

ocr = '92. 일차방정식 4x-3 = 2x-1 에서 2를 잘못 보고 풀어 x = -2를 해로 얻었다. 2를 어던 수로 잘못 보았는지 구하시오.'
solution = ['''
이 문제는 잘못 판독한 숫자가 2인 일차방정식이 x = -2가 해가 되도록 해석되어 풀렸다는 조건에서 출발하여 실제로 어떤 숫자로 잘못 보았는지 찾는 것입니다.

Step 1: 주어진 방정식 4x - 3 = 2x - 1에서 x = -2가 정답이 되기 위해 잘못 판독된 원래의 '2x' 부분을 'ax'로 가정해 봅니다.

Step 2: x = -2를 'ax'와 명시된 나머지 식에 대입하여 올바른 'a' 값 찾기:
\[ 4(-2) - 3 = a(-2) - 1 \]
\[ -8 - 3 = -2a - 1 \]
\[ -11 = -2a - 1 \]

Step 3: 위의 방정식을 'a'에 대해 풀기 위해서 양변에 1을 더합니다:
\[ -11 + 1 = -2a \]
\[ -10 = -2a \]

Step 4: 위의 방정식을 'a'에 대해 풀어줍니다:
\[ a = \frac{-10}{-2} \]
\[ a = 5 \]

따라서, 잘못 판독된 2의 실제 숫자는 5입니다. 잘못 보고 푼 방정식은 5x - 3 = 2x - 1이었을 것입니다.

(정답 : 5)''']

dummy = "// ocr_result : {ocr_result} // solution : {solution} // 앞의 ocr_result 와 실제 문제의 solution을 비교해보고 (정답이 일치함, 풀이가 틀림, 푸는 중임) 중 하나를 알려줘. 답이 맞으면 ##1##을 반환하고 풀이 방법 잘못됨이라면 ##2##을 반환하고 문제를 아직 푸는 중이라면 ##3##을 반환해줘."

test_user_answer = ['4x-3 = 2x-1', '4x-3=ax-1', '-8-3=-2a-1', '8-3=-2a-1', 'a = 5', 'a = 3', '15 = 3a+1', 'new']

async def fetch_ans_llama31(prompt_type: str):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: subprocess.run(
            ["ollama", "run", "llama3.1", prompt_type],
            capture_output=True,
            text=True
        )
    )
    output = result.stdout.strip()
    return output

async def fetch(ocr_result, solution):
    ## solution[0]에서 (정답:??)을 truth에 저장 또는 (정답 : ??)일 수도 있음
    truth = re.search(r'\(정답: \d+\)', solution)
    if truth is None:
        truth = re.search(r'\(정답 : \d+\)', solution)
    truth = truth.group().split(":")[1].strip()
    truth = re.sub(r'\)', '', truth)
    # print("truth : ", truth)
    result = await fetch_ans_llama31(f"너는 학생의 수학문제 정답을 판단하는 수학강사야. 내가 '//'로 구분되는 유저의 응답(ocr_result)과 정답인 truth를 줄거야. 반드시 ocr_result와 truth가 정확히 일치하는 경우만 ##1## 을 반환해. 일치하지 않는다면 ##2##을 반환해. // ocr_result : {ocr_result} // truth : {truth}")
    if "##1##" in result:
        return "solve"
    else:
        return "not_solve"
    
async def fetch_process(ocr_result, solution):

    result = await fetch_ans_llama31(f"너는 수학선생님이야. 내가 '//'로 구분되는 유저의 응답(ocr_result)과 문제의 풀이인 solution을 줄거야. 참고로 solution은 유저가 한 응답이 아니야. ocr_result가 solution을 고려했을때 잘못된 풀이나 틀린 답이라면 ##2##을 반환해. 풀이가 맞고 ocr_result가 solution에 포함되어있으면 ##3##을 반환해줘. // ocr_result : {ocr_result} // solution : {solution}")

    if "##2##" in result:
        return "wrong"
    else:
        return "doing"
    
# async def fetch_voting(test_user_answer, solution):
#     for user_answer in test_user_answer:
#         tasks = [fetch_process(user_answer, solution) for _ in range(5)]
#         results = await asyncio.gather(*tasks)  # 비동기 작업들을 병렬로 실행
#         print("answer : ", user_answer, "results : ", results)
#         voting_result = max(set(results), key=results.count)
#         print("voting_result : ", voting_result)
#         print("=====================================")


# 비동기 함수를 실행하고 결과를 출력
# result = asyncio.run(fetch("-8-3=-2a-1"))
# print(result)

## test_user_answer에 대해 fetch를 하는데 5번 fetch결과를 voting해서 최종 결과를 출력
# async def fetch_voting(test_user_answer):
#     result = []
#     for user_answer in test_user_answer:
#         for i in range(5):
#             result.append(await fetch(user_answer))
#         print("answer : ", user_answer, "result : ", result)
#         voting_result = max(set(result), key=result.count)
#         print("voting_result : ", voting_result)
#         result.clear()
#         print("=====================================")

# asyncio.run(fetch_voting(test_user_answer))

# async def fetch_voting(test_user_answer, solution):
#     for user_answer in test_user_answer:
#         tasks = [fetch_process(user_answer, solution) for _ in range(3)]
#         results = await asyncio.gather(*tasks)  # 비동기 작업들을 병렬로 실행
#         print("answer : ", user_answer, "results : ", results)
#         voting_result = max(set(results), key=results.count)
#         print("voting_result : ", voting_result)
#         print("=====================================")

async def fetch_voting(test_user_answer, solution):
    wrongs = []
    for user_answer in test_user_answer:
        tasks = [fetch(user_answer, solution) for _ in range(3)]
        ans_results = await asyncio.gather(*tasks)  
        if ans_results == "not_solve":
            wrongs.append(user_answer)
    
    for user_answer in wrongs:
        tasks = [fetch_process(user_answer, solution) for _ in range(3)]
        results = await asyncio.gather(*tasks) 
        print("answer : ", user_answer, "results : ", results)
        voting_result = max(set(results), key=results.count)
        print("voting_result : ", voting_result)
        print("=====================================")

asyncio.run(fetch_voting(test_user_answer, solution[0]))

# print(solution[0])

# def parse_solution(solution):
#     # Step이나 Answer, 정답이 포함된 패턴을 유연하게 매칭
#     steps = re.split(r'(Step \d+:|step \d+:|Answer:|정답:)', solution)
    
#     # 결과를 담을 리스트
#     steps_array = []
    
#     # 스텝이나 정답 키워드를 앞에 붙여서 저장
#     for i in range(1, len(steps), 2):  # 홀수 인덱스가 키워드
#         current_step = steps[i] + steps[i+1].strip()
#         ## current_step에 괄호가 있는 경우 괄호 삭제
#         current_step = re.sub(r'[\(\)]', '', current_step)
#         steps_array.append(current_step)
        
#     return steps_array

# parsed_solution = parse_solution(solution[0])

# # for step in parsed_solution:
# #     print(step)
# #     print("=====================================")

# for step in parsed_solution:
#     for user_answer in test_user_answer:
#         ## parsed_solution과 test_user_answer에 공백 모두 제거 후 비교
#         step = re.sub(r'\s', '', step)
#         user_answer = re.sub(r'\s', '', user_answer)

#         if user_answer in step:
#             print(user_answer, "is in step")
#             print("=====================================")
