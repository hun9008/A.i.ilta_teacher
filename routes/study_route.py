from fastapi import APIRouter

from models.study_init import SetTime, RealTime
from config import user_vars

from config.database import create_connection, execute_query, read_query
from utils.study_utils import generate_random_s_id
from datetime import datetime

route = APIRouter()

@route.post("/study/settime")
async def set_time(settime:SetTime):
    # DB 연결
    print("DB connected in /study/settime\n")
    connection = create_connection()
    
    # s_id 생성 
    current = datetime.now().strftime("%Y%m%d%H%M%S")
    s_id = generate_random_s_id(current)
    
    # settime에서 u_id, time 두개 가져오기
    u_id = settime.u_id
    study_time = settime.study_time
    break_time = settime.break_time
    
    start_date = datetime.now()
    
    # DB : init_state
    insert_settime = """
    INSERT INTO init_state (u_id, s_id, start_date, study_time, break_time) 
    VALUES ('{}', '{}', '{}', '{}', '{}');
    """.format(
        u_id, 
        s_id, 
        start_date,
        study_time,
        break_time
    )
    user_settime = execute_query(connection, insert_settime)
    
    # DB : study
    insert_study = """
    INSERT INTO study (u_id, s_id, start_time) 
    VALUES ('{}', '{}', '{}');
    """.format(
        u_id, 
        s_id, 
        start_date
    )
    user_initstudy = execute_query(connection, insert_study)
    
    # init user status
    user_vars.user_status = "doing"
    
    # response for test
    response = "Successfully store SET time."
    
    # DB 연결 닫기 
    print("DB closed in /study/settime\n")
    connection.close()
    
    return {"message": response, "s_id": s_id}

@route.post("/study/realtime")
async def real_time(realtime:RealTime):
    # DB 연결
    print("DB connected in /study/realtime\n")
    connection = create_connection()

    # front에서 가져올 data
    u_id = realtime.u_id
    s_id = realtime.s_id
    r_study_time = realtime.study_time
    r_break_time = realtime.break_time
    
    end_date = datetime.now()
    
    # dummy : focusing level
    focusing_level = r_study_time/r_break_time
    
    # DB : end_state
    insert_realtime = """
    INSERT INTO end_state (u_id, s_id, end_date, focusing_level, r_study_time, r_break_time) 
    VALUES ('{}', '{}', '{}', '{}', '{}');
    """.format(
        u_id, 
        s_id, 
        end_date,
        focusing_level,
        r_study_time,
        r_break_time
    )
    user_realtime = execute_query(connection, insert_realtime)
    
    # DB : study     
    update_study = """
    UPDATE study
    SET end_time = '{}'
    WHERE s_id = '{}';
    """.format(
        end_date, 
        s_id
    )
    user_endstudy = execute_query(connection, update_study)
    
    # response for test
    response = "Successfully store REAL time."
    
    # DB 연결 닫기 
    print("DB closed in /study/realtime\n")
    connection.close()
    
    return {"message": response, "data": realtime}