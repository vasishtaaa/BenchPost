# Benchpost

> **Campus life, together.**  
> *A Role-Based University Student Community & Collaboration Platform*

Benchpost is a full-stack university community platform designed to replace scattered messaging groups, emails, and physical notice boards with one centralized, role-based digital workspace for students, faculty members, and campus administrators.

---

## Key Capabilities (Modules A–J)

| Module | Features Implemented |
| :--- | :--- |
| **A. Auth & Profiles** | Student registration with configurable university email domain rules, bcrypt password hashing, stateless HS256 JWT authentication, role guards (`STUDENT`, `FACULTY`, `ADMIN`), profile editing, and password updates. |
| **B. Home Dashboard** | Personalized campus feed combining active discussions, joined communities, upcoming events, official notices, and interactive campus polls. |
| **C. Communities** | Public and private academic/club communities with search, category filters, instant join for public groups, and moderator approval queues for private spaces. |
| **D. Discussions** | Category-tagged posts, nested threaded comments (`parent_id` tree), duplicate-safe reactions (`LIKE`, `HELPFUL`, `CELEBRATE`, `INTERESTING`), saved bookmarks, and feed sorting. |
| **E. Campus Polls** | Single-choice and multi-choice polls with closing deadlines, database-enforced duplicate-vote prevention (`UniqueConstraint`), and live vote percentage bars. |
| **F. Campus Events** | Event creation (Faculty/Admin), seat capacity tracking, atomic transactional RSVP reservations (`SELECT ... FOR UPDATE` row locking to prevent overbooking), cancellation, and attendee rosters. |
| **G. Announcements** | Official university and department notices with priority tiers (`URGENT`, `HIGH`, `NORMAL`, `LOW`), pinning, expiry handling, and per-user read acknowledgments. |
| **H. Notifications** | Database-backed in-app notification center for replies, RSVPs, announcements, and moderation updates, paired with a live navbar unread indicator and mark-all-read support. |
| **I. Admin Console** | Dedicated `/admin` dashboard with live platform analytics, role distribution breakdowns, searchable user directory, and role management. |
| **J. Moderation & Audit** | Content reporting modal on posts/comments, review queue (`REMOVE_CONTENT`, `USER_WARNED`, `DISMISS`), and an append-only `AuditLog` table for administrative accountability. |

---

## Tech Stack

### Frontend (`frontend/`)
- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS** + **Lucide React**
- **React Router v7** (protected role-based routes)
- **TanStack Query v5** (server state, caching, background polling)
- **React Hook Form** + **Zod** (client-side schema validation)
- **Axios** (HTTP client with Bearer token interceptor)

### Backend (`backend/`)
- **Python** + **FastAPI** + **Uvicorn**
- **SQLAlchemy 2.0 ORM** + **Alembic**
- **Pydantic v2** + `pydantic-settings`
- **JWT (`python-jose`)** + **bcrypt (`passlib`)**
- **SQLite** (zero-config local default) / **PostgreSQL** ready via `DATABASE_URL`

### Quality & Tooling
- **Pytest** + **HTTPX** (39 automated backend API & RBAC integration tests)
- **Vitest** + **React Testing Library** (frontend component & workflow tests)
- **TypeScript (`tsc -b`)** + **Oxlint**

---

## Architecture Overview

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full ER diagrams, RBAC specs, and concurrency guarantees.

```text
React 19 + Vite SPA (localhost:5173)
   │  HTTP / REST (JSON + JWT Bearer Token)
   ▼
FastAPI + Uvicorn (localhost:8000/api/v1)
   ├── Auth & RBAC Dependencies (get_current_active_user, require_role)
   ├── Pydantic v2 Request / Response Validation
   ├── Domain Routers (auth, users, communities, posts, polls, events, announcements, notifications, admin, moderation)
   └── SQLAlchemy 2.0 ORM
         ▼
SQLite (campusloop.db) / PostgreSQL (14 normalized tables)
```

---

## Repository Structure

```text
Campus Loop/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Auth & RBAC FastAPI dependencies
│   │   │   └── v1/
│   │   │       ├── api.py            # Master v1 router registration
│   │   │       └── endpoints/        # auth, users, communities, discussions, polls, events, announcements, notifications, admin, moderation, health
│   │   ├── core/                     # config.py, database.py, security.py, init_db.py
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   ├── schemas/                  # Pydantic v2 schemas
│   │   └── main.py                   # FastAPI entrypoint, CORS, DB init & seed
│   ├── tests/                        # Pytest integration suite (39 tests)
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── public/                       # Static assets & favicon
│   ├── src/
│   │   ├── components/               # Navbar, PostCard, PollWidget, ReportModal, Create*Modals, ProtectedRoute, etc.
│   │   ├── context/                  # AuthContext (JWT persistence & session hydration)
│   │   ├── pages/                    # LandingPage, Login, Register, Dashboard, Communities, CommunityDetail, Discussions, DiscussionDetail, Events, Announcements, Notifications, Profile, AdminDashboard, Unauthorized
│   │   ├── services/                 # Axios API client & domain service modules
│   │   ├── types/                    # TypeScript domain interfaces
│   │   ├── App.tsx                   # QueryClientProvider + React Router routes
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── .env.example                      # Sample environment configuration
├── .gitignore
├── run_dev.ps1                       # Windows PowerShell launcher for backend + frontend
└── README.md
```

---

## Local Setup & Running

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**

### Option 1: One-Command Launch (Windows PowerShell)

After completing initial dependency installation below, start both servers together:

```powershell
.\run_dev.ps1
```

You can also start a single service with `.\run_dev.ps1 -Service backend` or `.\run_dev.ps1 -Service frontend`.

### Option 2: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

- **Backend API Base:** `http://localhost:8000/api/v1`
- **Interactive Swagger Docs:** `http://localhost:8000/api/v1/docs`
- **ReDoc:** `http://localhost:8000/api/v1/redoc`

> On startup, `backend/app/main.py` automatically creates the SQLite schema (`campusloop.db`) and seeds initial communities, discussions, polls, events, announcements, notifications, reports, and demo accounts.

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

- **Web Application:** `http://localhost:5173`

---

## Seeded Demo Accounts

Use the quick-fill buttons on `/login` or sign in manually with these pre-seeded accounts:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusloop.edu` | `Student@123456` | Join communities, post discussions, vote in polls, RSVP to events, bookmark, report content |
| **Faculty** | `faculty@campusloop.edu` | `Faculty@123456` | Publish official announcements, organize events, manage private community approvals, review reports |
| **Administrator** | `admin@campusloop.edu` | `Admin@123456` | Full platform analytics, user role management, moderation queue resolution, audit trail inspection |

---

## API Modules (`/api/v1`)

| Prefix | Domain | Key Endpoints |
| :--- | :--- | :--- |
| `/health` | System | `GET /health` |
| `/auth` | Authentication | `POST /register`, `POST /login`, `GET /me`, `POST /change-password` |
| `/users` | Profiles | `GET /me`, `PUT /me`, `GET /{user_id}` |
| `/communities` | Communities | `GET /`, `POST /`, `GET /{slug}`, `POST /{id}/join`, `DELETE /{id}/leave`, `GET /{id}/members`, `PATCH /{id}/members/{user_id}` |
| `/posts` | Discussions | `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `POST /{id}/comments`, `POST /{id}/reactions`, `POST /{id}/bookmark` |
| `/polls` | Polls | `GET /`, `POST /`, `GET /{id}`, `POST /{id}/vote` |
| `/events` | Events & RSVPs | `GET /`, `POST /`, `GET /{id}`, `POST /{id}/register`, `DELETE /{id}/register` |
| `/announcements` | Notices | `GET /`, `POST /`, `POST /{id}/read` |
| `/notifications` | Notifications | `GET /`, `PATCH /{id}/read`, `POST /mark-all-read` |
| `/moderation` | Moderation | `POST /reports`, `GET /reports`, `POST /reports/{id}/resolve` |
| `/admin` | Administration | `GET /analytics`, `GET /users`, `PUT /users/{id}/role`, `GET /audit-logs` |

---

## Testing & Verification

### Backend Integration Suite (Pytest)
```bash
cd backend
.\venv\Scripts\pytest -v
```
Runs 39 tests across `test_health.py`, `test_auth.py`, `test_communities.py`, `test_discussions.py`, `test_polls.py`, `test_events.py`, `test_announcements.py`, `test_notifications.py`, `test_moderation.py`, and `test_admin.py` against an isolated test database.

### Frontend Tests, Type-Check, Build & Lint
```bash
cd frontend
npm test        # Runs Vitest + React Testing Library suite
npm run build   # Runs tsc -b && vite build
npm run lint    # Runs oxlint
```

---

## Environment Variables

See [`.env.example`](.env.example) for all supported configuration keys:

- `DATABASE_URL` — Defaults to `sqlite:///./campusloop.db`. Supports PostgreSQL URLs (e.g., `postgresql+psycopg://user:pass@localhost:5432/campusloop`).
- `SECRET_KEY` — JWT signing secret (override before deploying to production).
- `REQUIRE_UNIVERSITY_DOMAIN` — Toggle strict university domain enforcement during registration (`false` in dev/demo mode).
- `BACKEND_CORS_ORIGINS` — JSON array of allowed frontend origins.
- `VITE_API_URL` *(frontend)* — Defaults to `http://localhost:8000/api/v1`.

---

## GitHub Pages Deployment

The repository includes [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) to automatically run backend tests (`pytest`), build the Vite frontend with SPA fallback (`404.html`), and deploy the static bundle to **GitHub Pages** on every push to `main`.

1. In your GitHub repository, open **Settings -> Pages** and ensure **Source** is set to **GitHub Actions**.
2. *(Optional)* Under **Settings -> Secrets and variables -> Actions -> Variables**, add `VITE_API_URL` pointing to your hosted FastAPI backend (for example, `https://your-api.onrender.com/api/v1`).
   - If left unset, the deployed Pages site defaults to `http://localhost:8000/api/v1`, so you can run the FastAPI backend locally while browsing the GitHub Pages URL (`https://vasishtaaa.github.io/BenchPost/`).

