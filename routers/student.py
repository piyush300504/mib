from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from database import get_db
from auth import require_student
from config import DEFAULT_PASS_PERCENTAGE
import schemas
from utils import fix_id, fix_ids
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/student", tags=["Student"])


# ── Phase 10: Enroll in Course ───────────────────────
@router.get("/courses", response_model=list[schemas.CourseOut])
def browse_courses(db = Depends(get_db), _ = Depends(require_student)):
    return fix_ids(list(db["courses"].find({"is_approved": True})))


@router.post("/courses/{course_id}/enroll", response_model=schemas.EnrollmentOut)
def enroll(course_id: str, db = Depends(get_db), student = Depends(require_student)):
    course = db["courses"].find_one({"_id": ObjectId(course_id), "is_approved": True})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not approved")
    existing = db["enrollments"].find_one({
        "student_id": str(student.get("id")),
        "course_id": course_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
    enrollment = {
        "student_id": str(student.get("id")),
        "course_id": course_id,
        "enrolled_at": datetime.now(timezone.utc)
    }
    res = db["enrollments"].insert_one(enrollment)
    enrollment["_id"] = res.inserted_id
    return fix_id(enrollment)


@router.get("/enrollments", response_model=list[schemas.EnrollmentOut])
def my_enrollments(db = Depends(get_db), student = Depends(require_student)):
    return fix_ids(list(db["enrollments"].find({"student_id": str(student.get("id"))})))


# ── Phase 11: Attempt Exam (Auto-Graded) ─────────────
@router.get("/quizzes/{quiz_id}/questions", response_model=list[schemas.QuestionOut])
def get_quiz_questions(quiz_id: str, db = Depends(get_db), student = Depends(require_student)):
    quiz = db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    # check enrollment
    enrolled = db["enrollments"].find_one({
        "student_id": str(student.get("id")),
        "course_id": quiz.get("course_id")
    })
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    return fix_ids(list(db["questions"].find({"quiz_id": quiz_id})))


@router.post("/quizzes/{quiz_id}/submit", response_model=schemas.AttemptOut)
def submit_exam(quiz_id: str, data: schemas.ExamSubmit, db = Depends(get_db), student = Depends(require_student)):
    quiz = db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    # check enrollment
    enrolled = db["enrollments"].find_one({
        "student_id": str(student.get("id")),
        "course_id": quiz.get("course_id")
    })
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    questions = list(db["questions"].find({"quiz_id": quiz_id}))
    if not questions:
        raise HTTPException(status_code=400, detail="No questions in this quiz")

    correct_map = {str(q["_id"]): q.get("correct_option", "").lower() for q in questions}
    score = 0
    for ans in data.answers:
        if correct_map.get(ans.question_id) == ans.selected_option.lower():
            score += 1

    total = len(questions)
    percentage = round((score / total) * 100, 2)

    # get passing criteria
    criteria = db["passing_criteria"].find_one({"course_id": quiz.get("course_id")})
    pass_pct = criteria.get("percentage") if criteria else DEFAULT_PASS_PERCENTAGE
    passed = percentage >= pass_pct

    attempt = {
        "student_id": str(student.get("id")),
        "quiz_id": quiz_id,
        "score": score,
        "total": total,
        "percentage": percentage,
        "passed": passed,
        "attempted_at": datetime.now(timezone.utc)
    }
    res = db["exam_attempts"].insert_one(attempt)
    attempt["_id"] = res.inserted_id
    return fix_id(attempt)


# ── Phase 12: View Results ───────────────────────────
@router.get("/results", response_model=list[schemas.AttemptOut])
def my_results(db = Depends(get_db), student = Depends(require_student)):
    return fix_ids(list(db["exam_attempts"].find({"student_id": str(student.get("id"))})))


# ── Phase 13: Certificates ──────────────────────────
@router.get("/certificates", response_model=list[schemas.CertificateOut])
def my_certificates(db = Depends(get_db), student = Depends(require_student)):
    return fix_ids(list(db["certificates"].find({"student_id": str(student.get("id"))})))


@router.post("/courses/{course_id}/certificate", response_model=schemas.CertificateOut)
def generate_certificate(course_id: str, db = Depends(get_db), student = Depends(require_student)):
    # check enrollment
    enrolled = db["enrollments"].find_one({
        "student_id": str(student.get("id")),
        "course_id": course_id
    })
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled")

    # check if passed any quiz in this course
    quizzes = list(db["quizzes"].find({"course_id": course_id}))
    quiz_ids = [str(q["_id"]) for q in quizzes]
    if not quiz_ids:
        raise HTTPException(status_code=400, detail="No quizzes in this course")

    passed_attempt = db["exam_attempts"].find_one({
        "student_id": str(student.get("id")),
        "quiz_id": {"$in": quiz_ids},
        "passed": True
    })
    if not passed_attempt:
        raise HTTPException(status_code=400, detail="You haven't passed any quiz in this course")

    # check duplicate
    existing = db["certificates"].find_one({
        "student_id": str(student.get("id")),
        "course_id": course_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Certificate already issued")

    cert = {
        "student_id": str(student.get("id")),
        "course_id": course_id,
        "issued_at": datetime.now(timezone.utc)
    }
    res = db["certificates"].insert_one(cert)
    cert["_id"] = res.inserted_id
    return fix_id(cert)


@router.get("/certificates/{cert_id}/download")
def download_certificate(cert_id: str, db = Depends(get_db), student = Depends(require_student)):
    cert = db["certificates"].find_one({
        "_id": ObjectId(cert_id),
        "student_id": str(student.get("id")),
    })
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student_obj = db["users"].find_one({"_id": ObjectId(cert.get("student_id"))})
    course = db["courses"].find_one({"_id": ObjectId(cert.get("course_id"))})

    # use template if exists
    template = db["certificate_templates"].find_one()
    
    body = f"Congratulations {student_obj.get('name')} for completing {course.get('title')}!"
    if template:
        body = template.get("body_text", body).replace("{student_name}", student_obj.get("name")).replace("{course_title}", course.get("title"))

    html = f"""
    <html>
    <body style="text-align:center; font-family:Georgia,serif; padding:60px; background:#fefefe;">
        <div style="border:8px double #333; padding:60px; max-width:700px; margin:auto;">
            <h1 style="color:#1a1a2e; font-size:36px;">📜 Certificate of Completion</h1>
            <hr style="border:1px solid #ccc; width:60%;">
            <p style="font-size:20px; margin-top:30px;">{body}</p>
            <p style="font-size:14px; color:#888; margin-top:40px;">Issued on: {cert.get("issued_at").strftime("%B %d, %Y") if cert.get("issued_at") else "N/A"}</p>
            <p style="font-size:14px; color:#888;">Certificate ID: {cert_id}</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)
