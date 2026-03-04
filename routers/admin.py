from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import require_admin
import models
import schemas
from config import DEFAULT_PASS_PERCENTAGE

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Phase 4: Manage Teachers ─────────────────────────
@router.post("/teachers", response_model=schemas.UserOut)
def add_teacher(user: schemas.UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    from auth import hash_password
    db_user = models.User(
        name=user.name, email=user.email,
        hashed_password=hash_password(user.password), role="teacher"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/teachers", response_model=list[schemas.UserOut])
def list_teachers(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.User).filter(models.User.role == "teacher").all()


@router.delete("/teachers/{teacher_id}")
def remove_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    teacher = db.query(models.User).filter(models.User.id == teacher_id, models.User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return {"detail": "Teacher removed"}


# ── Phase 5: Manage Students ─────────────────────────
@router.get("/students", response_model=list[schemas.UserOut])
def list_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.User).filter(models.User.role == "student").all()


@router.delete("/students/{student_id}")
def remove_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"detail": "Student removed"}


# ── Phase 6: Approve Courses & Passing Criteria ──────
@router.get("/courses", response_model=list[schemas.CourseOut])
def list_all_courses(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.Course).all()


@router.patch("/courses/{course_id}/approve", response_model=schemas.CourseOut)
def approve_course(course_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.is_approved = True
    db.commit()
    db.refresh(course)
    return course


@router.put("/courses/{course_id}/passing-criteria", response_model=schemas.PassingCriteriaOut)
def set_passing_criteria(course_id: int, data: schemas.PassingCriteriaSet, db: Session = Depends(get_db), _=Depends(require_admin)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    criteria = db.query(models.PassingCriteria).filter(models.PassingCriteria.course_id == course_id).first()
    if criteria:
        criteria.percentage = data.percentage
    else:
        criteria = models.PassingCriteria(course_id=course_id, percentage=data.percentage)
        db.add(criteria)
    db.commit()
    db.refresh(criteria)
    return criteria


# ── Phase 14: Analytics Dashboard ────────────────────
@router.get("/analytics")
def analytics(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
    total_courses = db.query(models.Course).count()
    approved_courses = db.query(models.Course).filter(models.Course.is_approved == True).count()
    total_attempts = db.query(models.ExamAttempt).count()
    passed = db.query(models.ExamAttempt).filter(models.ExamAttempt.passed == True).count()
    failed = total_attempts - passed
    certificates_issued = db.query(models.Certificate).count()
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
def create_template(data: schemas.CertificateTemplateCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = models.CertificateTemplate(name=data.name, body_text=data.body_text)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/certificate-templates", response_model=list[schemas.CertificateTemplateOut])
def list_templates(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.CertificateTemplate).all()


@router.put("/certificate-templates/{template_id}", response_model=schemas.CertificateTemplateOut)
def update_template(template_id: int, data: schemas.CertificateTemplateCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = db.query(models.CertificateTemplate).filter(models.CertificateTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.name = data.name
    t.body_text = data.body_text
    db.commit()
    db.refresh(t)
    return t
