from pydantic import BaseModel

class ChatRequest(BaseModel):
    u_id: str = None
    status: str
    text: str