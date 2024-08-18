from fastapi import FastAPI
 
from routes.login_route import route as login_route
from routes.sock_route import route as sock_route
from routes.chat_route import route as chat_route
from routes.study_route import route as study_route
from routes.competition_route import route as competition_route

from fastapi.middleware.cors import CORSMiddleware
from background_task import start_task

app = FastAPI()

# include router.
app.include_router(login_route)
app.include_router(sock_route)
app.include_router(chat_route)
app.include_router(study_route)
app.include_router(competition_route)

# middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    start_task()
