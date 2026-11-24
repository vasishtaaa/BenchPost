# CampusLoop

> **CampusLoop: A Role-Based University Student Community and Collaboration Platform**  
> *B.Tech CSE VI Semester Mini-Project*

CampusLoop is a unified digital ecosystem designed for universities to streamline academic communities, student discussions, verified campus announcements, event RSVP capacity management, and content moderation under a strict Role-Based Access Control (RBAC) architecture.

---

## 🏗️ System Architecture

- **Frontend:** React 18/19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide React.
- **Backend:** FastAPI (Python), SQLAlchemy 2.0 ORM, Pydantic v2, Alembic, JWT (OAuth2 Password Bearer).
- **Database:** PostgreSQL (with dual-engine SQLite support for portable local evaluation/defense).
- **Security:** Argon2/bcrypt password hashing, fine-grained RBAC dependencies, atomic SQL transactions.

---

## 📁 Repository Structure

```
Campus Loop/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API endpoints organized by domain
│   │   ├── core/             # Configuration, security, database session
│   │   ├── models/           # SQLAlchemy Declarative Models
│   │   ├── schemas/          # Pydantic v2 validation schemas
│   │   └── services/         # Business logic layer
│   ├── tests/                # Pytest suite
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Backend entrypoint
├── frontend/                 # React + Vite + TypeScript Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # View pages (Dashboard, Communities, etc.)
│   │   ├── services/         # API client & services
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Project documentation & review viva materials
├── .env.example              # Sample environment variables
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload --port 8000
```
API Documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web application will be available at: `http://localhost:5173`
