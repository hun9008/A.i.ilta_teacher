from fastapi import FastAPI
from routes.route import route


app = FastAPI()

app.include_router(route)

# middleware