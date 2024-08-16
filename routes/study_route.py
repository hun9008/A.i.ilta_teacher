from fastapi import APIRouter

from models.study_init import SetTime, RealTime
import config.user_vars

route = APIRouter()

@route.post("/study/settime")
async def set_time(settime:SetTime):
    # DB에 저장하는 부분
    
    # init user status
    user_vars.user_status = "doing"
    
    # response for test
    response = "Successfully store SET time."
    return {"message": response, "data": settime}

@route.post("/study/realtime")
async def real_time(realtime:RealTime):
    # DB에 저장하는 부분
    
    # response for test
    response = "Successfully store REAL time."
    return {"message": response, "data": realtime}