from pydantic import BaseModel

class OCRInput(BaseModel):
    image: str