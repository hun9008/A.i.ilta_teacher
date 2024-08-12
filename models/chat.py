from pydantic import BaseModel

class ChatRequest(BaseModel):
    status: str
    text: str