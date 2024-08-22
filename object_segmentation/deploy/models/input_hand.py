from pydantic import BaseModel

class ProbAreas_HandImg(BaseModel):
    image_clean : str
    image_hand : str

class HandArea_HandImg(BaseModel):
    image : str