from pydantic import BaseModel

# user 설정 시간
class SetTime(BaseModel):
    u_id: str #
    study_time: int 
    break_time: int
    
# 실제 공부 시간    
class RealTime(BaseModel):
    u_id: str #
    s_id: str #
    study_time: int 
    break_time: int