# ♻️ EcoSync — Smart Municipal Waste Management & Circular Economy Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](<https://img.shields.io/badge/Frontend-React%2019%20+%20Vite-61DAFB?logo=react&logoColor=black>)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](<https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791?logo=postgresql&logoColor=white>)](https://www.postgresql.org)

**EcoSync** is an intelligent, multi-role municipal waste management and circular economy operating system. It coordinates **Citizens**, **Collection Drivers**, **Authorized Recyclers**, and **Municipal Administrators** into a unified, transparent digital network.

---

## 🌟 Key Capabilities

### 🔐 Streamlined Civic Authentication

* **Option 1: Phone Login (Passwordless OTP)**
  * Validates 10-digit Indian numbers (`+91`, regex `^[6-9]\d{9}$`).
  * 6-digit OTP hashed via SHA-256 with 5-minute expiry.
  * Local development bypass code `1234` or console log fallback.
  * Auto-provisions new users and routes them straight to address completion.
* **Option 2: Email + Password Authentication**
  * Secure bcrypt password hashing (min 8 characters).
  * Email verification token link with login gating.
  * Self-service password reset workflow.
* **Civic Address Setup (Bhopal Municipal Corporation)**
  * Structured format: House/Flat Number, Street/Colony, Locality, Landmark.
  * BMC Ward selection (Wards 1–85) & Pincode validation (`462001`–`462047`).
  * **HTML5 GPS Geolocation Pin**: One-click coordinate capture for driver route dispatching.
* **Security & Resilience**
  * Sliding-window OTP rate limiting (max 3 per 10 minutes).
  * Brute-force account lockout (15 minutes after 5 consecutive failed attempts).
  * Dual-token lifecycle: 15-minute access token + 30-day refresh token with automatic client-side refresh queue.

---

### 👥 Multi-Role Portals

| Role                               | Core Capabilities                                                                                                                                                                                                                    |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🏠 Citizen**               | Request on-demand pickups, track collection vehicles on live Leaflet map, track green points & tier rewards (Bronze to Platinum), join housing societies (minimum 3 households for privacy), and sell scrap to verified recyclers. |
| **🚛 Collection Driver**     | View optimized daily routes, update stop statuses, log verified weight (kg) with waste categorization (`wet`, `dry`, `hazardous`, `e-waste`, `sanitary`), and work completely offline via native IndexedDB queue.          |
| **♻️ Authorized Recycler** | Manage facility materials, publish indicative scrap rates to the public Price Board, process citizen sales, and issue digital receipts that generate Extended Producer Responsibility (EPR) credits.                                 |
| **🏛️ Municipal Admin**     | City-wide operational dashboard, nearest-neighbor route optimization, fleet vehicle dispatch, spatial complaint heatmaps, and municipal organic compost batch tracking.                                                              |

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Vite, TailwindCSS, React Router 7, Zustand, TanStack Query, Leaflet / React Leaflet, Lucide Icons, Recharts.
* **Backend:** FastAPI, Python 3.11, SQLAlchemy ORM, Pydantic v2, Alembic, Uvicorn.
* **Databases:** PostgreSQL (production) or SQLite (zero-config local development).
* **Offline PWA:** Web App Manifest, Service Worker, Client-side IndexedDB store with automated reconnect synchronization and SHA-256 server idempotency.

---

## 🚀 Quickstart Guide

### Prerequisites

* **Node.js** (v18+ recommended) & **npm**
* **Python** (v3.11+)

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate Python virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

> The API will be running at **`http://localhost:8000`**.
> Interactive OpenAPI documentation is available at **`http://localhost:8000/docs`**.

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

> The application will be accessible at **`http://localhost:5173`**.

---

## 🧪 Demo Login Credentials

To explore the role-specific dashboards immediately, run the development seed script:

```bash
cd backend
python seed_dev.py
```

Use any of these pre-configured accounts on the [Login Screen](http://localhost:5173/login):

| Role | Email | Phone Number | Password | Dashboard Route |
| :----------------- | :------------------------------- | :------------- | :-------------- | :---------------------- |
| **Citizen** | `aarav@citizen.org` | `9876543210` | `password123` | `/dashboard/user` |
| **Driver** | `rajesh.driver@ecosync.org` | `9876543211` | `password123` | `/dashboard/driver` |
| **Recycler** | `vikram.malhotra@recycler.org` | `9876543212` | `password123` | `/dashboard/recycler` |
| **Admin** | `admin@ecosync.org` | `9876543213` | `password123` | `/dashboard/admin` |

> **Phone OTP Bypass:** When testing phone login in development mode, enter code **`1234`** for instant verification.

---

## 🧪 Testing & Quality Assurance

### Backend Test Suite (101 Integration & Unit Tests)

```bash
cd backend
pytest tests/ -v
```

### Frontend Typecheck & Production Build

```bash
cd frontend
npm run build
```

---

## 📂 Project Structure

```text
EcoSync-Smart-Municipal-Waste-Management/
├── .github/
│   └── workflows/ci.yml       # Automated GitHub Actions test & build pipeline
├── backend/
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── api/v1/            # Clean REST API endpoints (auth, pickups, routes, etc.)
│   │   ├── core/              # Security, JWT tokens, Indian phone validation
│   │   ├── middleware/        # Idempotency and CORS configuration
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── services/          # Business logic & auth service
│   ├── tests/                 # 101 comprehensive pytest test suites
│   └── seed_dev.py            # Development database seeder
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components & ProtectedRoute
│   │   ├── layouts/           # Responsive dashboard layouts
│   │   ├── lib/               # API clients, navigation helpers, and types
│   │   ├── pages/             # Authentication & role dashboards (User, Driver, Recycler, Admin)
│   │   └── store/             # Zustand state management (session & token refresh)
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
