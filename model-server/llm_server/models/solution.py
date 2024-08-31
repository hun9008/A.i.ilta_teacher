from pydantic import BaseModel

class SolutionRequest(BaseModel):
    image_base64: str