from pydantic import BaseModel

class TextChat(BaseModel):
    u_id: str
    text: str