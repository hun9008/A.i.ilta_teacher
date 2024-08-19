from pydantic import BaseModel

class ProbAreas_HandImg(BaseModel):
    image_clean : str
    image_hand : str
