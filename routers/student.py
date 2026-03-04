from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import require_student
from config import DEFAULT_PASS_PERCENTAGE
import models
import schemas

router = APIRouter(prefix="/student", tags=["Student"])


# ── Phase 10: Enroll in Course ───────────────────────
@router.get("/courses", response_model=list[schemas.CourseOut])
def browse_courses(db: Session = Depends(get_db), _=Depends(require_student)):
    return db.query(models.Course).filter(models.Course.is_approved == True).all()


@router.post("/courses/{course_id}/enroll", response_model=schemas.EnrollmentOut)
def enroll(course_id: int, db: Session = Depends(get_db), student=Depends(require_student)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.is_approved == True).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not approved")
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id,
        models.Enrollment.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
    enrollment = models.Enrollment(student_id=student.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/enrollments", response_model=list[schemas.EnrollmentOut])
def my_enrollments(db: Session = Depends(get_db), student=Depends(require_student)):
    return db.query(models.Enrollment).filter(models.Enrollment.student_id == student.id).all()


# ── Phase 11: Attempt Exam (Auto-Graded) ─────────────
@router.get("/quizzes/{quiz_id}/questions", response_model=list[schemas.QuestionOut])
def get_quiz_questions(quiz_id: int, db: Session = Depends(get_db), student=Depends(require_student)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    # check enrollment
    enrolled = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id,
        models.Enrollment.course_id == quiz.course_id
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    return db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()


@router.post("/quizzes/{quiz_id}/submit", response_model=schemas.AttemptOut)
def submit_exam(quiz_id: int, data: schemas.ExamSubmit, db: Session = Depends(get_db), student=Depends(require_student)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    # check enrollment
    enrolled = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id,
        models.Enrollment.course_id == quiz.course_id
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    questions = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="No questions in this quiz")

    correct_map = {q.id: q.correct_option.lower() for q in questions}
    score = 0
    for ans in data.answers:
        if correct_map.get(ans.question_id) == ans.selected_option.lower():
            score += 1

    total = len(questions)
    percentage = round((score / total) * 100, 2)

    # get passing criteria
    criteria = db.query(models.PassingCriteria).filter(models.PassingCriteria.course_id == quiz.course_id).first()
    pass_pct = criteria.percentage if criteria else DEFAULT_PASS_PERCENTAGE
    passed = percentage >= pass_pct

    attempt = models.ExamAttempt(
        student_id=student.id, quiz_id=quiz_id,
        score=score, total=total, percentage=percentage, passed=passed,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


# ── Phase 12: View Results ───────────────────────────
@router.get("/results", response_model=list[schemas.AttemptOut])
def my_results(db: Session = Depends(get_db), student=Depends(require_student)):
    return db.query(models.ExamAttempt).filter(models.ExamAttempt.student_id == student.id).all()


# ── Phase 13: Certificates ──────────────────────────
@router.get("/certificates", response_model=list[schemas.CertificateOut])
def my_certificates(db: Session = Depends(get_db), student=Depends(require_student)):
    return db.query(models.Certificate).filter(models.Certificate.student_id == student.id).all()


@router.post("/courses/{course_id}/certificate", response_model=schemas.CertificateOut)
def generate_certificate(course_id: int, db: Session = Depends(get_db), student=Depends(require_student)):
    # check enrollment
    enrolled = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student.id,
        models.Enrollment.course_id == course_id
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled")

    # check if passed any quiz in this course
    quizzes = db.query(models.Quiz).filter(models.Quiz.course_id == course_id).all()
    quiz_ids = [q.id for q in quizzes]
    if not quiz_ids:
        raise HTTPException(status_code=400, detail="No quizzes in this course")

    passed_attempt = db.query(models.ExamAttempt).filter(
        models.ExamAttempt.student_id == student.id,
        models.ExamAttempt.quiz_id.in_(quiz_ids),
        models.ExamAttempt.passed == True,
    ).first()
    if not passed_attempt:
        raise HTTPException(status_code=400, detail="You haven't passed any quiz in this course")

    # check duplicate
    existing = db.query(models.Certificate).filter(
        models.Certificate.student_id == student.id,
        models.Certificate.course_id == course_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Certificate already issued")

    cert = models.Certificate(student_id=student.id, course_id=course_id)
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/certificates/{cert_id}/download")
def download_certificate(cert_id: int, db: Session = Depends(get_db), student=Depends(require_student)):
    cert = db.query(models.Certificate).filter(
        models.Certificate.id == cert_id,
        models.Certificate.student_id == student.id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student_obj = db.query(models.User).filter(models.User.id == cert.student_id).first()
    course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()

    # use template if exists
    template = db.query(models.CertificateTemplate).first()
    if template:
        body = template.body_text.replace("{student_name}", student_obj.name).replace("{course_title}", course.title)
    else:
        body = f"Congratulations {student_obj.name} for completing {course.title}!"

    html = f"""
    <html>
    <body style="text-align:center; font-family:Georgia,serif; padding:60px; background:#fefefe;">
        <div style="border:8px double #333; padding:60px; max-width:700px; margin:auto;">
            <h1 style="color:#1a1a2e; font-size:36px;">📜 Certificate of Completion</h1>
            <hr style="border:1px solid #ccc; width:60%;">
            <p style="font-size:20px; margin-top:30px;">{body}</p>
            <p style="font-size:14px; color:#888; margin-top:40px;">Issued on: {cert.issued_at.strftime("%B %d, %Y") if cert.issued_at else "N/A"}</p>
            <p style="font-size:14px; color:#888;">Certificate ID: {cert.id}</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)
