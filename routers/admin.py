from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import require_admin
import schemas
from config import DEFAULT_PASS_PERCENTAGE
from utils import fix_id, fix_ids
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Phase 4: Manage Teachers ─────────────────────────
@router.post("/teachers", response_model=schemas.UserOut)
def add_teacher(user: schemas.UserCreate, db = Depends(get_db), _ = Depends(require_admin)):
    existing = db["users"].find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    from auth import hash_password
    db_user = {
        "name": user.name, "email": user.email,
        "hashed_password": hash_password(user.password), "role": "teacher"
    }
    res = db["users"].insert_one(db_user)
    db_user["_id"] = res.inserted_id
    return fix_id(db_user)


@router.get("/teachers", response_model=list[schemas.UserOut])
def list_teachers(db = Depends(get_db), _ = Depends(require_admin)):
    return fix_ids(list(db["users"].find({"role": "teacher"})))


@router.delete("/teachers/{teacher_id}")
def remove_teacher(teacher_id: str, db = Depends(get_db), _ = Depends(require_admin)):
    teacher = db["users"].find_one({"_id": ObjectId(teacher_id), "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db["users"].delete_one({"_id": ObjectId(teacher_id)})
    return {"detail": "Teacher removed"}


# ── Phase 5: Manage Students ─────────────────────────
@router.get("/students", response_model=list[schemas.UserOut])
def list_students(db = Depends(get_db), _ = Depends(require_admin)):
    return fix_ids(list(db["users"].find({"role": "student"})))


@router.delete("/students/{student_id}")
def remove_student(student_id: str, db = Depends(get_db), _ = Depends(require_admin)):
    student = db["users"].find_one({"_id": ObjectId(student_id), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db["users"].delete_one({"_id": ObjectId(student_id)})
    return {"detail": "Student removed"}


# ── Phase 6: Approve Courses & Passing Criteria ──────
@router.get("/courses", response_model=list[schemas.CourseOut])
def list_all_courses(db = Depends(get_db), _ = Depends(require_admin)):
    return fix_ids(list(db["courses"].find()))


@router.patch("/courses/{course_id}/approve", response_model=schemas.CourseOut)
def approve_course(course_id: str, db = Depends(get_db), _ = Depends(require_admin)):
    course = db["courses"].find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db["courses"].update_one({"_id": ObjectId(course_id)}, {"$set": {"is_approved": True}})
    course["is_approved"] = True
    return fix_id(course)


@router.put("/courses/{course_id}/passing-criteria", response_model=schemas.PassingCriteriaOut)
def set_passing_criteria(course_id: str, data: schemas.PassingCriteriaSet, db = Depends(get_db), _ = Depends(require_admin)):
    course = db["courses"].find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    criteria = db["passing_criteria"].find_one({"course_id": course_id})
    if criteria:
        db["passing_criteria"].update_one(
            {"_id": criteria["_id"]}, {"$set": {"percentage": data.percentage}}
        )
        criteria["percentage"] = data.percentage
    else:
        criteria = {"course_id": course_id, "percentage": data.percentage}
        res = db["passing_criteria"].insert_one(criteria)
        criteria["_id"] = res.inserted_id
    return fix_id(criteria)


# ── Phase 14: Analytics Dashboard ────────────────────
@router.get("/analytics")
def analytics(db = Depends(get_db), _ = Depends(require_admin)):
    total_students = db["users"].count_documents({"role": "student"})
    total_teachers = db["users"].count_documents({"role": "teacher"})
    total_courses = db["courses"].count_documents({})
    approved_courses = db["courses"].count_documents({"is_approved": True})
    total_attempts = db["exam_attempts"].count_documents({})
    passed = db["exam_attempts"].count_documents({"passed": True})
    failed = total_attempts - passed
    certificates_issued = db["certificates"].count_documents({})
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "approved_courses": approved_courses,
        "total_attempts": total_attempts,
        "passed": passed,
        "failed": failed,
        "certificates_issued": certificates_issued,
    }


# ── Phase 15: Certificate Templates ─────────────────
@router.post("/certificate-templates", response_model=schemas.CertificateTemplateOut)
def create_template(data: schemas.CertificateTemplateCreate, db = Depends(get_db), _ = Depends(require_admin)):
    t = {"name": data.name, "body_text": data.body_text}
    res = db["certificate_templates"].insert_one(t)
    t["_id"] = res.inserted_id
    return fix_id(t)


@router.get("/certificate-templates", response_model=list[schemas.CertificateTemplateOut])
def list_templates(db = Depends(get_db), _ = Depends(require_admin)):
    return fix_ids(list(db["certificate_templates"].find()))


@router.put("/certificate-templates/{template_id}", response_model=schemas.CertificateTemplateOut)
def update_template(template_id: str, data: schemas.CertificateTemplateCreate, db = Depends(get_db), _ = Depends(require_admin)):
    t = db["certificate_templates"].find_one({"_id": ObjectId(template_id)})
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db["certificate_templates"].update_one(
        {"_id": ObjectId(template_id)},
        {"$set": {"name": data.name, "body_text": data.body_text}}
    )
    t["name"] = data.name
    t["body_text"] = data.body_text
    return fix_id(t)
