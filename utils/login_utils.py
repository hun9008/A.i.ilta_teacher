from passlib.context import CryptContext

import random
import string

pwd_context = CryptContext(schemes = ["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def generate_random_u_id(seed_time):

    random.seed(seed_time)
    characters = string.ascii_letters + string.digits

    u_id = ''.join(random.choice(characters) for _ in range(30))
    
    return u_id