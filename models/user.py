from pydantic import BaseModel

class User(BaseModel):
    _id: str
    u_email: str
    u_pwd: str
    u_name: str

class UserInDB(User):
    hashed_password: str

class LoginRequest(BaseModel):
    email: str
    password: str
