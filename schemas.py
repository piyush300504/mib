from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"  # admin / teacher / student


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# ── Course ────────────────────────────────────────────
class CourseCreate(BaseModel):
    title: str
    description: str = ""


class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    teacher_id: int
    is_approved: bool

    class Config:
        from_attributes = True


# ── Quiz ──────────────────────────────────────────────
class QuizCreate(BaseModel):
    title: str


class QuizOut(BaseModel):
    id: int
    title: str
    course_id: int

    class Config:
        from_attributes = True


# ── Question (MCQ) ───────────────────────────────────
class QuestionCreate(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # a / b / c / d


class QuestionOut(BaseModel):
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    class Config:
        from_attributes = True


class QuestionOutTeacher(QuestionOut):
    correct_option: str


# ── Exam Attempt ──────────────────────────────────────
class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: str  # a / b / c / d


class ExamSubmit(BaseModel):
    answers: list[AnswerSubmit]


class AttemptOut(BaseModel):
    id: int
    quiz_id: int
    score: int
    total: int
    percentage: float
    passed: bool
    attempted_at: datetime

    class Config:
        from_attributes = True


# ── Enrollment ────────────────────────────────────────
class EnrollmentOut(BaseModel):
    id: int
    course_id: int
    enrolled_at: datetime

    class Config:
        from_attributes = True


# ── Passing Criteria ─────────────────────────────────
class PassingCriteriaSet(BaseModel):
    percentage: float


class PassingCriteriaOut(BaseModel):
    id: int
    course_id: int
    percentage: float

    class Config:
        from_attributes = True


# ── Certificate Template ─────────────────────────────
class CertificateTemplateCreate(BaseModel):
    name: str
    body_text: str = "Congratulations {student_name} for completing {course_title}!"


class CertificateTemplateOut(BaseModel):
    id: int
    name: str
    body_text: str

    class Config:
        from_attributes = True


# ── Certificate ───────────────────────────────────────
class CertificateOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    issued_at: datetime

    class Config:
        from_attributes = True
