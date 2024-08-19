from pydantic import BaseModel

class OCRInput(BaseModel):
    image: str

class Determinent(BaseModel):
    image: str
    solution : str