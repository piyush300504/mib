from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_teacher
import models
import schemas

router = APIRouter(prefix="/teacher", tags=["Teacher"])


# ── Phase 7: Create Courses ──────────────────────────
@router.post("/courses", response_model=schemas.CourseOut)
def create_course(data: schemas.CourseCreate, db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    course = models.Course(title=data.title, description=data.description, teacher_id=teacher.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/courses", response_model=list[schemas.CourseOut])
def list_my_courses(db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    return db.query(models.Course).filter(models.Course.teacher_id == teacher.id).all()


# ── Phase 8: Quizzes & Questions ─────────────────────
@router.post("/courses/{course_id}/quizzes", response_model=schemas.QuizOut)
def create_quiz(course_id: int, data: schemas.QuizCreate, db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    quiz = models.Quiz(title=data.title, course_id=course_id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/courses/{course_id}/quizzes", response_model=list[schemas.QuizOut])
def list_quizzes(course_id: int, db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    return db.query(models.Quiz).filter(models.Quiz.course_id == course_id).all()


@router.post("/quizzes/{quiz_id}/questions", response_model=schemas.QuestionOutTeacher)
def add_question(quiz_id: int, data: schemas.QuestionCreate, db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    course = db.query(models.Course).filter(models.Course.id == quiz.course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(status_code=403, detail="Not your quiz")
    q = models.Question(
        quiz_id=quiz_id, text=data.text,
        option_a=data.option_a, option_b=data.option_b,
        option_c=data.option_c, option_d=data.option_d,
        correct_option=data.correct_option.lower(),
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/quizzes/{quiz_id}/questions", response_model=list[schemas.QuestionOutTeacher])
def list_questions(quiz_id: int, db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()


# ── Phase 9: View Student Performance ────────────────
@router.get("/courses/{course_id}/results")
def course_results(course_id: int, db: Session = Depends(get_db), teacher=Depends(require_teacher)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    quizzes = db.query(models.Quiz).filter(models.Quiz.course_id == course_id).all()
    quiz_ids = [q.id for q in quizzes]
    if not quiz_ids:
        return []
    attempts = db.query(models.ExamAttempt).filter(models.ExamAttempt.quiz_id.in_(quiz_ids)).all()
    results = []
    for a in attempts:
        student = db.query(models.User).filter(models.User.id == a.student_id).first()
        quiz = db.query(models.Quiz).filter(models.Quiz.id == a.quiz_id).first()
        results.append({
            "student_name": student.name if student else "Unknown",
            "student_email": student.email if student else "",
            "quiz_title": quiz.title if quiz else "",
            "score": a.score,
            "total": a.total,
            "percentage": a.percentage,
            "passed": a.passed,
            "attempted_at": a.attempted_at.isoformat() if a.attempted_at else "",
        })
    return results
