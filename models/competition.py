from pydantic import BaseModel

class DifficultyRequest(BaseModel):
    difficulty: int
