from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class User(BaseModel):
    _id: str
    name: str
    nickname: str
    email: str
    password: str
    avg_focusing_level: float
    stat: Dict[str, float]
    study: List[StudySession]
    unsolved_problem: List[UnsolvedProblem]

class UserInDB(User):
    hashed_password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# classes for class User
class StudySession(BaseModel):
    s_id: str
    init_state: InitState
    end_state: EndState
class InitState(BaseModel):
    start_date: datetime
    problems: Dict[str, int]
    study_time: int
    break_time: int
class EndState(BaseModel):
    end_date: datetime
    focusing_level: float
    solved_problem: Dict[str, int]
    r_study_time: int
    r_break_time: int
class UnsolvedProblem(BaseModel):
    s_id: str
    category: str
    level: str