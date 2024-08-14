
def prompt_delay(ocr, concept, user_text, prev_chat):
    prompt = "아래 상황에서 나의 다음 답변을 말해줘. 단, 답변만 말해야 해.\n"
    prompt += "나는 수학 선생님, 상대는 학생이야. 문제는 다음과 같아.\n" + ocr + "\n"
    prompt += "여기에 사용된 개념은 다음과 같아.\n" + concept + "\n"
    prompt += "학생의 질문: " + user_text + "\n"

    if prev_chat:
        prompt += "\n이전 대화 내용:\n" + prev_chat
        
    return prompt

def prompt_wrong(ocr, solution, user_text, prev_chat):
    prompt = "아래 상황에서 나의 다음 답변을 말해줘. 단, 답변만 말해야 해.\n"
    prompt += "나는 수학 선생님, 상대는 학생이야. 문제는 다음과 같아.\n" + ocr + "\n"
    prompt += "이 문제의 전체 풀이는 다음과 같아.\n" + solution + "\n"
    prompt += "학생의 질문: " + user_text + "\n"
    prompt += "문제를 설명할 때 전체 풀이를 알려주지 말고 단계별로 하나씩만 알려줘.\n"
    
    if prev_chat:
        prompt += "\n이전 대화 내용:\n" + prev_chat
        
    return prompt