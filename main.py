from fastapi import FastAPI
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LMS System", description="Admin / Teacher / Student LMS API", version="0.1.0"
)


@app.get("/")
async def root():
    return {"message": "LMS API is running 🚀", "status": "ok"}

