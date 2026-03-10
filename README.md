# Email Subject Line Optimizer 📧✨

> **AI-powered platform** for generating, managing, and A/B testing email subject lines.  
> Built with **Django REST Framework** + **Groq LLM** on the backend and a **React + Vite** SPA on the frontend.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Data Models](#data-models)
6. [API Reference](#api-reference)
7. [Frontend Pages](#frontend-pages)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [Running in Development](#running-in-development)
11. [Admin Panel](#admin-panel)
12. [API Documentation](#api-documentation)

---

## Overview

Email Subject Line Optimizer helps marketers and developers:

- 📝 **Create campaigns** with industry and audience context
- 🤖 **Generate subject lines** instantly using Groq-powered AI (LLaMA 3)
- 💬 **Refine ideas** via a real-time AI chat interface (multi-turn conversations)
- 📊 **Track performance** with optional A/B test scores on each subject line
- 🛡️ **Administer the platform** through a full admin API and a Jazzmin-enhanced Django admin UI

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│         React SPA  (localhost:5173)                 │
│  Vite · React Router v7 · Tailwind v4 · framer-motion│
└──────────┬──────────────────────────────────────────┘
           │  HTTP/JSON  (Vite proxy → /api/*)
           ▼
┌─────────────────────────────────────────────────────┐
│              Django Backend (localhost:8000)         │
│  Django 4.2 · DRF · SimpleJWT · drf-spectacular     │
│  CORS via django-cors-headers                        │
│  Jazzmin Admin UI  ·  Custom REST Admin API          │
└──────────┬──────────────────────────────────────────┘
           │  psycopg2
           ▼
┌─────────────────────────────────────────────────────┐
│          PostgreSQL 15  (Docker · port 5450)         │
└─────────────────────────────────────────────────────┘
           │
           │  Groq SDK  (external HTTPS)
           ▼
┌─────────────────────────────────────────────────────┐
│              Groq Cloud API  (LLaMA 3)               │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| Framework | Django 4.2.11 |
| REST API | Django REST Framework 3.15 |
| Auth | SimpleJWT 5.3 (Bearer tokens) |
| AI / LLM | Groq SDK 1.0 (LLaMA 3) |
| Database | PostgreSQL 15 (via psycopg2) |
| Config | python-decouple |
| CORS | django-cors-headers |
| API Docs | drf-spectacular (Swagger / ReDoc) |
| Admin UI | django-jazzmin |
| Images | Pillow (avatar uploads) |

### Frontend
| Layer | Technology |
|---|---|
| Language | JavaScript (ES2022+) |
| Framework | React 19 |
| Bundler | Vite 6 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Animations | framer-motion |
| HTTP Client | Axios (JWT interceptors + auto-refresh) |
| Markdown | react-markdown |
| Icons | lucide-react |

### Infrastructure
| Component | Technology |
|---|---|
| Database container | Docker Compose (postgres:15-alpine) |
| DB port mapping | 5450 → 5432 |

---

## Project Structure

```
email-subject-line-optimizer/
│
├── backend/                     # Django project root
│   ├── config/
│   │   ├── settings.py          # All settings (JWT, CORS, Groq, Jazzmin, Throttle)
│   │   └── urls.py              # Root URL config (mounts /api/, /admin/, /api/schema/)
│   ├── core/
│   │   ├── models.py            # User, EmailCampaign, SubjectLine, ChatSession, ChatMessage
│   │   ├── serializers.py       # DRF serializers for all models
│   │   ├── views.py             # All API views (auth, campaigns, subjects, chat, admin)
│   │   ├── urls.py              # /api/* route definitions
│   │   ├── permissions.py       # IsAdminUser, IsNotBlocked custom permissions
│   │   ├── ai_utils.py          # Groq LLM integration helpers
│   │   ├── admin.py             # Django admin registration (Jazzmin)
│   │   └── migrations/          # Database migrations
│   ├── manage.py
│   ├── requirements.txt
│   ├── docker-compose.yml       # PostgreSQL service only
│   ├── .env                     # Secret config (gitignored)
│   └── .env.example             # Template for environment variables
│
└── frontend/                    # Vite React app
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # JWT auth state, login/logout, token storage
    │   ├── services/
    │   │   ├── api.js           # Axios instance + JWT interceptors + auto-refresh
    │   │   └── endpoints.js     # All API call functions organised by resource
    │   ├── components/
    │   │   └── Layout.jsx       # Floating nav dock, page transitions, logout
    │   ├── pages/
    │   │   ├── LandingPage.jsx  # Public hero page (/)
    │   │   ├── Login.jsx        # JWT login form
    │   │   ├── Register.jsx     # Registration form
    │   │   ├── Dashboard.jsx    # Live stats + campaign list
    │   │   ├── ItemsList.jsx    # Campaigns grid (search, filter, delete)
    │   │   ├── CampaignDetail.jsx # AI generation + subject line CRUD
    │   │   ├── ItemForm.jsx     # Create / Edit campaign form
    │   │   ├── Chat.jsx         # Multi-session AI chat
    │   │   └── AdminPanel.jsx   # Users / Campaigns / Subjects admin tabs
    │   ├── App.jsx              # Route definitions + AuthProvider
    │   ├── main.jsx             # React entry point
    │   └── index.css            # Global styles, Glassmorphism utilities, .ai-markdown prose
    ├── vite.config.js           # Vite config + /api proxy to :8000
    ├── tailwind.config.js       # 5-color brand palette
    └── package.json
```

---

## Data Models

```
User
 ├── email (unique login field)
 ├── first_name, last_name, avatar
 ├── is_admin, is_user, is_blocked, is_active
 └── created_at, updated_at

EmailCampaign
 ├── owner → User
 ├── title, description, target_audience
 ├── industry (ecommerce | saas | finance | healthcare | education | other)
 ├── status (draft | active | archived)
 └── created_at, updated_at

SubjectLine
 ├── campaign → EmailCampaign
 ├── text (≤ 150 chars)
 ├── tone (professional | casual | urgent | curious | funny)
 ├── is_ai_generated
 ├── performance_score (0–100, optional)
 └── created_at

ChatSession
 ├── user → User
 ├── campaign → EmailCampaign (optional)
 ├── title (auto or user-set)
 └── created_at

ChatMessage
 ├── session → ChatSession
 ├── role (user | assistant)
 ├── content (Markdown for AI replies)
 └── created_at
```

---

## API Reference

All endpoints are prefixed with `/api/`.  
Authentication: `Authorization: Bearer <access_token>`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `auth/register/` | Create new user account |
| `POST` | `auth/login/` | Obtain JWT access + refresh tokens |
| `POST` | `auth/token/refresh/` | Refresh access token |
| `POST` | `auth/token/verify/` | Verify token validity |
| `GET` | `auth/profile/` | Get current user profile |
| `PATCH` | `auth/profile/` | Update name / avatar |
| `POST` | `auth/change-password/` | Change password |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `campaigns/` | List own campaigns (paginated) |
| `POST` | `campaigns/` | Create new campaign |
| `GET` | `campaigns/{id}/` | Get campaign + full subject lines |
| `PATCH` | `campaigns/{id}/` | Update campaign |
| `DELETE` | `campaigns/{id}/` | Delete campaign |
| `POST` | `campaigns/{id}/generate/` | 🤖 AI-generate & save subject lines |
| `GET` | `campaigns/{id}/subjects/` | List subject lines for campaign |
| `POST` | `campaigns/{id}/subjects/` | Add subject line manually |

### Subject Lines
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `subjects/{id}/` | Get subject line detail |
| `PATCH` | `subjects/{id}/` | Update (text, tone, score) |
| `DELETE` | `subjects/{id}/` | Delete subject line |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `chat/sessions/` | List own chat sessions |
| `POST` | `chat/sessions/` | Create new session |
| `GET` | `chat/sessions/{id}/` | Get session + all messages |
| `DELETE` | `chat/sessions/{id}/` | Delete session |
| `POST` | `chat/sessions/{id}/send/` | 🤖 Send message, get AI reply |

### Admin API (admin role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `admin/users/` | List all users (`?search=` `?is_blocked=`) |
| `GET` | `admin/users/{id}/` | Get user detail |
| `POST` | `admin/users/{id}/block/` | Block / unblock user `{ "block": true }` |
| `GET` | `admin/campaigns/` | All campaigns (`?status=` `?owner=`) |
| `GET` | `admin/campaigns/{id}/` | Campaign detail |
| `PATCH` | `admin/campaigns/{id}/` | Update any campaign |
| `DELETE` | `admin/campaigns/{id}/` | Delete any campaign |
| `GET` | `admin/subjects/` | All subject lines (`?is_ai_generated=`) |
| `PATCH` | `admin/subjects/{id}/` | Update any subject line |
| `DELETE` | `admin/subjects/{id}/` | Delete any subject line |

### Throttle Limits
| Scope | Limit |
|-------|-------|
| Anonymous | 30 req / hour |
| Authenticated | 300 req / hour |
| AI endpoints | 30 req / hour |

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Animated hero with stats, features, CTA |
| `/login` | Login | JWT login form |
| `/register` | Register | Account creation |
| `/dashboard` | Dashboard | Live campaign stats + quick campaign list |
| `/campaigns` | Campaigns | Grid of all campaigns with search & filter |
| `/campaigns/new` | New Campaign | Create campaign form |
| `/campaigns/:id` | Campaign Detail | AI generation + subject line management |
| `/campaigns/:id/edit` | Edit Campaign | Edit campaign fields |
| `/ai` | AI Chat | Multi-session AI chat with conversation history |
| `/admin` | Admin Panel | Users / Campaigns / Subjects management (admin only) |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20 LTS or 22 LTS
- Docker Desktop (for PostgreSQL)

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `DB_NAME` | PostgreSQL database name | `emailoptimizer` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5450` |
| `GROQ_API_KEY` | Groq Cloud API key | `gsk_...` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

> 🔑 Get your Groq API key free at [console.groq.com](https://console.groq.com)

---

## Running in Development

### 1. Start the Database

```bash
cd backend
docker-compose up -d
```

### 2. Set up the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create a superuser (admin)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

Backend runs at → **http://127.0.0.1:8000**

### 3. Set up the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend runs at → **http://localhost:5173**

> The Vite dev server proxies all `/api/*` requests to the Django backend automatically, so no CORS issues in development.

---

## Admin Panel

### Django Admin UI (Jazzmin)
Navigate to **http://127.0.0.1:8000/admin/** and log in with your superuser credentials.

Features: full CRUD on all models, search, filters, Jazzmin dark sidebar theme.

### React Admin Panel
Navigate to **/admin** in the frontend (visible only to users with `is_admin=True`).

Tabs:
- **Users** — search by email, filter active/blocked, block/unblock
- **Campaigns** — filter by status/owner, change status inline, delete
- **Subject Lines** — filter by AI/manual, set performance scores, delete

---

## API Documentation

With the backend running, visit:

| Format | URL |
|--------|-----|
| Swagger UI | http://127.0.0.1:8000/api/schema/swagger-ui/ |
| ReDoc | http://127.0.0.1:8000/api/schema/redoc/ |
| OpenAPI JSON | http://127.0.0.1:8000/api/schema/ |

---

## Design System

The frontend uses a strict **5-color palette**:

| Name | Hex | Usage |
|------|-----|-------|
| King's Plum | `#AD117E` | Primary brand, buttons, headings |
| Pastel Magenta | `#D385DF` | Accents, gradients, icons |
| Thistle | `#DEC0E8` | Backgrounds, card borders |
| Snow | `#F5EEF2` | Card surfaces, input backgrounds |
| Soothing Lime | `#D6E574` | Success states, AI markers |

**Glassmorphism** cards with `backdrop-filter: blur`, **Bento Grid** dashboard layout, **framer-motion** page transitions, and a floating bottom navigation dock.

---

## License

MIT — feel free to use, modify, and distribute.
