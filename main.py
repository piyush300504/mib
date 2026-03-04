from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth, admin, teacher, student

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LMS System", description="Admin / Teacher / Student LMS API", version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(teacher.router)
app.include_router(student.router)


@app.get("/")
async def root():
    return {"message": "LMS API is running 🚀", "status": "ok"}

