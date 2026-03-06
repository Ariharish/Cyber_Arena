import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cyberarena")
SECRET_KEY = os.getenv("SECRET_KEY", "cyberarena_secret_key")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
DB_NAME = "cyberarena"
