from pymongo import MongoClient
import certifi
from config import DATABASE_URL

# Use certifi for secure TLS connection in MongoDB Atlas
client = MongoClient(DATABASE_URL, tlsCAFile=certifi.where())
db = client.get_database("lms_db")

def get_db():
    yield db

