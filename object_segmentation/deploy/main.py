from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.route import router
from routes.classification_route import clf_router
from routes.face_route import face_router
from routes.hand_route import hand_router
import sys
print(sys.path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(clf_router)
app.include_router(face_router)
app.include_router(hand_router)