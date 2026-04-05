from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import require_teacher
import schemas
from utils import fix_id, fix_ids
from bson import ObjectId

router = APIRouter(prefix="/teacher", tags=["Teacher"])


# ── Phase 7: Create Courses ──────────────────────────
@router.post("/courses", response_model=schemas.CourseOut)
def create_course(data: schemas.CourseCreate, db = Depends(get_db), teacher = Depends(require_teacher)):
    course = {
        "title": data.title,
        "description": data.description,
        "teacher_id": str(teacher.get("id")),
        "is_approved": False
    }
    res = db["courses"].insert_one(course)
    course["_id"] = res.inserted_id
    return fix_id(course)


@router.get("/courses", response_model=list[schemas.CourseOut])
def list_my_courses(db = Depends(get_db), teacher = Depends(require_teacher)):
    return fix_ids(list(db["courses"].find({"teacher_id": str(teacher.get("id"))})))


# ── Phase 8: Quizzes & Questions ─────────────────────
@router.post("/courses/{course_id}/quizzes", response_model=schemas.QuizOut)
def create_quiz(course_id: str, data: schemas.QuizCreate, db = Depends(get_db), teacher = Depends(require_teacher)):
    course = db["courses"].find_one({"_id": ObjectId(course_id), "teacher_id": str(teacher.get("id"))})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    quiz = {"title": data.title, "course_id": course_id}
    res = db["quizzes"].insert_one(quiz)
    quiz["_id"] = res.inserted_id
    return fix_id(quiz)


@router.get("/courses/{course_id}/quizzes", response_model=list[schemas.QuizOut])
def list_quizzes(course_id: str, db = Depends(get_db), teacher = Depends(require_teacher)):
    course = db["courses"].find_one({"_id": ObjectId(course_id), "teacher_id": str(teacher.get("id"))})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    return fix_ids(list(db["quizzes"].find({"course_id": course_id})))


@router.post("/quizzes/{quiz_id}/questions", response_model=schemas.QuestionOutTeacher)
def add_question(quiz_id: str, data: schemas.QuestionCreate, db = Depends(get_db), teacher = Depends(require_teacher)):
    quiz = db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    course = db["courses"].find_one({"_id": ObjectId(quiz.get("course_id")), "teacher_id": str(teacher.get("id"))})
    if not course:
        raise HTTPException(status_code=403, detail="Not your quiz")
    q = {
        "quiz_id": quiz_id, "text": data.text,
        "option_a": data.option_a, "option_b": data.option_b,
        "option_c": data.option_c, "option_d": data.option_d,
        "correct_option": data.correct_option.lower(),
    }
    res = db["questions"].insert_one(q)
    q["_id"] = res.inserted_id
    return fix_id(q)


@router.get("/quizzes/{quiz_id}/questions", response_model=list[schemas.QuestionOutTeacher])
def list_questions(quiz_id: str, db = Depends(get_db), teacher = Depends(require_teacher)):
    quiz = db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return fix_ids(list(db["questions"].find({"quiz_id": quiz_id})))


# ── Phase 9: View Student Performance ────────────────
@router.get("/courses/{course_id}/results")
def course_results(course_id: str, db = Depends(get_db), teacher = Depends(require_teacher)):
    course = db["courses"].find_one({"_id": ObjectId(course_id), "teacher_id": str(teacher.get("id"))})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    quizzes = list(db["quizzes"].find({"course_id": course_id}))
    quiz_ids = [str(q["_id"]) for q in quizzes]
    if not quiz_ids:
        return []
    attempts = list(db["exam_attempts"].find({"quiz_id": {"$in": quiz_ids}}))
    results = []
    for a in attempts:
        student = db["users"].find_one({"_id": ObjectId(a["student_id"])})
        quiz = db["quizzes"].find_one({"_id": ObjectId(a["quiz_id"])})
        results.append({
            "student_name": student["name"] if student else "Unknown",
            "student_email": student["email"] if student else "",
            "quiz_title": quiz["title"] if quiz else "",
            "score": a.get("score"),
            "total": a.get("total"),
            "percentage": a.get("percentage"),
            "passed": a.get("passed"),
            "attempted_at": a.get("attempted_at").isoformat() if a.get("attempted_at") else "",
        })
    return results
