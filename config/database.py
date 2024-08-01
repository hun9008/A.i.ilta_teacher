#mongoDB 연결하는거 작업 

# 비동기식(async) MongoDB driver 
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

#database 설정 파일에서 .env의 값을 사용하도록 수정
mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client.myproject 
users_collection = db.users # table을 만들겠다