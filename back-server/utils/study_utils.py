import random
import string

def generate_random_s_id(seed_time):

    random.seed(seed_time)
    characters = string.ascii_letters + string.digits

    s_id = ''.join(random.choice(characters) for _ in range(30))
    
    return s_id