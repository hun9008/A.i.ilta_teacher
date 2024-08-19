from pydantic import BaseModel

class OCRInput(BaseModel):
    image: str

class Determinent(BaseModel):
    image: str
    solution : str
    
class ProbAreas_HandImg(BaseModel):
    image_clean : str
    image_hand : str