from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, date

class SignUpRequest(BaseModel):
    name: str
    nickname: str
    email: str
    parent_email: str
    phone_num: str 
    birthday: date
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str
    
# 2.1    
class User(BaseModel):
    u_id: str
    name: str
    nickname: str
    email: str
    parent_email: str
    phone_num: str 
    birth_day: date
    password: str
    avg_focusing_level: float
    b_id: str
    #stat: Dict[str, float]
    #study: List[StudySession]
    #unsolved_problem: List[UnsolvedProblem]
# 2.2
# 
class UserInDB(User):
    hashed_password: str
class Stat(BaseModel):
    u_id: str
    operation_0: float
    formulas_1: float
    function_2: float
    geometry_3: float
    probability_4: float
    level: float       
# 2.3      
# 2.4    
class InitState(BaseModel):
    u_id: str
    s_id: str
    start_date: datetime
    #problems: Dict[str, int]
    study_time: int
    break_time: int
# 2.5    
class EndState(BaseModel):
    u_id: str
    s_id: str
    end_date: datetime
    focusing_level: float
    #solved_problem: Dict[str, int]
    r_study_time: int
    r_break_time: int    
# 2.6
class StudySession(BaseModel):
    s_id: str
    init_state: InitState
    end_state: EndState  
class InitProblem(BaseModel):
    s_id: str
    category: str
    count: int    
# 2.7
class SolvedProblem(BaseModel):
    s_id: str
    category: str
    count: int    
# 2.8
class UnsolvedProblem(BaseModel):
    s_id: str
    category: str
    level: str