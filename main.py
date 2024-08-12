from fastapi import FastAPI
from routes.login_route import route as login_route
from routes.sock_route import route as sock_route
from routes.chat_route import route as chat_route
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# include router.
app.include_router(login_route)
app.include_router(sock_route)
app.include_router(chat_route)

# middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
