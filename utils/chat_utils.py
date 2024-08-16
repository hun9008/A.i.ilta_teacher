
def prompt_delay(ocr, concept, user_text, prev_chat):
    if prev_chat : # 이전 대화가 존재하는 경우 
        prompt = prev_chat # 이전 대화 불러오기
        prompt += "학생의 질문: " + user_text + "\n"
    else: 
        prompt = "아래 상황에서 나의 다음 답변을 말해줘. 단, 답변만 말해야 해.\n"
        prompt += "나는 수학 선생님, 상대는 학생이야. 문제는 다음과 같아.\n" + ocr + "\n"
        prompt += "여기에 사용된 개념은 다음과 같아.\n" + concept + "\n"
        prompt += "학생의 질문: " + user_text + "\n"
        
    return prompt

def prompt_wrong(ocr, solution, user_text, prev_chat):
    if prev_chat : # 이전 대화가 존재하는 경우 
        prompt = prev_chat # 이전 대화 불러오기
        prompt += "학생의 질문: " + user_text + "\n"
    else: 
        prompt = "아래 상황에서 나의 다음 답변을 말해줘. 단, 답변만 말해야 해.\n"
        prompt += "나는 수학 선생님, 상대는 학생이야. 문제는 다음과 같아.\n" + ocr + "\n"
        prompt += "이 문제의 전체 풀이는 다음과 같아.\n" + solution + "\n"
        prompt += "학생에게는 전체 풀이를 알려주지 말고 단계별로 하나씩만 알려줘야해.\n"
        prompt += "학생의 질문: " + user_text + "\n"
        
    return prompt