
def prompt_delay(ocr, concept, user_text, prev_chat):
    if prev_chat : # 이전 대화가 존재하는 경우 
        prompt = prev_chat # 이전 대화 불러오기
        prompt += "학생의 질문: " + user_text + "\n"
    else: 
        prompt = "아래 상황에서 나의 다음 답변을 두세 문장 안으로 말해줘. 단, 답변만 말해야 해.\n"
        if type(ocr) == list:
            # serialize list to string
            ocr = '\n'.join(ocr)
        prompt += "나는 수학 선생님, 상대는 학생이야. 문제는 다음과 같아.\n" + ocr + "\n"
        if type(concept) == list:
            concept = '\n'.join(concept)
        prompt += "여기에 사용된 개념은 다음과 같아.\n" + concept + "\n"
        if type(user_text) == list:
            user_text = '\n'.join(user_text)
        prompt += "학생의 질문: " + user_text + "\n"
        
    return prompt

def prompt_wrong(ocr, solution, user_text, prev_chat):
    if prev_chat : # 이전 대화가 존재하는 경우 
        prompt = prev_chat # 이전 대화 불러오기
        prompt += "학생의 질문: " + user_text + "\n"
    else: 
        prompt = "아래 상황에서 나의 다음 답변을 말해줘. 단, 답변만 말해야 해.\n"
        if type(ocr) == list:
            # serialize list to string
            ocr = '\n'.join(ocr)
        prompt += "나는 수학 선생님, 상대는 학생이야. 문제는 다음과 같아.\n" + ocr + "\n"
        if type(solution) == list:
            solution = '\n'.join(solution)
        prompt += "이 문제의 전체 풀이는 다음과 같아.\n" + solution + "\n"
        prompt += "단, 한 단계에 해당하는 답변만 간략하게 해줘.\n"
        if type(user_text) == list:
            user_text = '\n'.join(user_text)
        prompt += "학생의 질문: " + user_text + "\n"
        
    return prompt