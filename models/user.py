from pydantic import BaseModel

class User(BaseModel):
    _id: str
    email: str
    pwd: str
    name: str

class UserInDB(User):
    hashed_password: str

class LoginRequest(BaseModel):
    email: str
    password: str
