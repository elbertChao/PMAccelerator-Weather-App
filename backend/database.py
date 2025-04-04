from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables from .env.local file
load_dotenv('.env.local')

# Get the MongoDB URI from the environment variables
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("No MongoDB URI found. Please set MONGODB_URI in your .env.local file.")

# Connect to MongoDB
client = AsyncIOMotorClient(MONGODB_URI)

# Choose your database and collection
db = client["weather_app"]
weather_collection = db["weather_records"]

# Example: Print a success message
print("Connected to MongoDB and ready to use the collection!")