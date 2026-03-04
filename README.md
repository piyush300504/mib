# MIB — Learning Management System

A full-stack LMS with **Admin**, **Teacher**, and **Student** modules.

**Backend** → FastAPI + SQLite  
**Frontend** → Next.js 16 + Tailwind 4 + TypeScript

---

## 🚀 Quick Start

### 1. Backend

```bash
cd /path/to/mib

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

API docs → **http://localhost:8000/docs**

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

App → **http://localhost:3000**

---

## 📁 Project Structure

```
mib/
├── main.py              # FastAPI app entry point
├── config.py            # Settings (JWT secret, DB URL, pass %)
├── database.py          # SQLAlchemy engine & session
├── models.py            # All database models (9 tables)
├── schemas.py           # Pydantic request/response schemas
├── auth.py              # JWT, password hashing, role guards
├── requirements.txt     # Python dependencies
├── routers/
│   ├── auth.py          # /auth/register, /auth/login
│   ├── admin.py         # Admin endpoints
│   ├── teacher.py       # Teacher endpoints
│   └── student.py       # Student endpoints
└── frontend/            # Next.js app
    ├── app/             # Pages (login, register, dashboards)
    ├── components/      # Navbar, ProtectedRoute
    ├── context/         # AuthContext (JWT state)
    └── lib/             # API helper
```

---

## 🔑 Auth Flow

1. **Register** → `POST /auth/register` with `{ name, email, password, role }`
2. **Login** → `POST /auth/login` → returns JWT token
3. Use the token as `Authorization: Bearer <token>` in all protected requests

### Roles
| Role | Access |
|------|--------|
| `admin` | Manage teachers, students, approve courses, set passing criteria, analytics |
| `teacher` | Create courses, quizzes, MCQ questions, view student results |
| `student` | Enroll in courses, attempt exams, view results, download certificates |

---

## 📚 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |

### Admin (requires `admin` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/teachers` | Add teacher |
| GET | `/admin/teachers` | List teachers |
| DELETE | `/admin/teachers/{id}` | Remove teacher |
| GET | `/admin/students` | List students |
| DELETE | `/admin/students/{id}` | Remove student |
| GET | `/admin/courses` | List all courses |
| PATCH | `/admin/courses/{id}/approve` | Approve course |
| PUT | `/admin/courses/{id}/passing-criteria` | Set passing % |

### Teacher (requires `teacher` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/teacher/courses` | Create course |
| GET | `/teacher/courses` | List own courses |
| POST | `/teacher/courses/{id}/quizzes` | Create quiz |
| POST | `/teacher/quizzes/{id}/questions` | Add MCQ question |
| GET | `/teacher/quizzes/{id}/questions` | List questions |
| GET | `/teacher/courses/{id}/results` | Student performance |

### Student (requires `student` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/courses` | Browse approved courses |
| POST | `/student/courses/{id}/enroll` | Enroll in course |
| GET | `/student/quizzes/{id}/questions` | Get exam questions |
| POST | `/student/quizzes/{id}/submit` | Submit answers (auto-graded) |
| GET | `/student/results` | View all results |
| GET | `/student/certificates` | List certificates |
| GET | `/student/certificates/{id}/download` | Download certificate |

---

## 📝 Exam & Grading

- All questions are **MCQ** (4 options: A/B/C/D)
- Exams are **auto-graded** on submission
- Score = correct answers / total questions × 100
- Default passing criteria: **≥ 60%** (configurable per course by admin)

---

## ⚙️ Configuration

Edit `config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `super-secret-key` | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token expiry |
| `DATABASE_URL` | `sqlite:///./lms.db` | Database path |
| `DEFAULT_PASS_PERCENTAGE` | `60` | Default pass % |
