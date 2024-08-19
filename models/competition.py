from pydantic import BaseModel

class DifficultyRequest(BaseModel):
    difficulty: int
    term: int

class AnswerResponse(BaseModel):
    q_id: str
    user_answer: str

class SubmitCompetition(BaseModel):
    c_id: str
    u_id: str
    answers : list[AnswerResponse]

class TierRequest(BaseModel):
    u_id: str