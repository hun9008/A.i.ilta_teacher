from pydantic import BaseModel

class OCRInput(BaseModel):
    image: str

class SolverInput(BaseModel):
    ocrs: list

class Determinent(BaseModel):
    hand_write: str
    solution : str