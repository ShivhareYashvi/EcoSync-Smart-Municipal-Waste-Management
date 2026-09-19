# EcoSync — Smart Municipal Waste Management & Circular Economy Platform

EcoSync is a full-stack, multi-role municipal waste management and circular economy platform designed to coordinate citizens, collection drivers, verified recyclers, and municipal administrators.

---

## 🌟 Platform Capabilities (Phases 1–5)

### Phase 1: Verified Pickup Logging & Closed-Loop Points
- **Driver Verification**: Collection drivers log actual pickup weights (kg), waste categories (wet, dry, hazardous, e-waste, sanitary), and upload optional photo proof.
- **Deterministic Points Engine**:
  - Base award: 10 points for on-time segregated pickup.
  - Weight bonus: +2 pts per kg over 5 kg, strictly capped weekly.
  - Streak multiplier: $1.25\times$ for $4+$ consecutive weeks of compliant segregation.
  - Transparent dispute reversal: flagged transactions reverse earned points without negative drift.
- **Citizen Tier Progression**: Bronze $\rightarrow$ Silver $\rightarrow$ Gold $\rightarrow$ Platinum with dynamic catalog redemption.

### Phase 2: Municipal Operations & Fleet Management
- **Multi-Zone Governance**: Administrative zones, ward polygons, and localized collection policies.
- **Fleet Registry & Dispatch**: Vehicle management (EV, Diesel, CNG) mapped to assigned municipal drivers.
- **Bulk Waste Generators**: Dedicated tracking for high-volume entities (apartments, tech parks, commercial complexes).
- **Batch Route Optimization**: Nearest-neighbor routing algorithm optimizing multi-stop daily collection routes with estimated arrival times.
- **Spatial Incident Heatmap & Hotspots**: Automated detection of complaint clusters ($> 5$ incidents in 30 days) and dynamic Leaflet-based geospatial heatmap rendering in the admin dashboard.

### Phase 3: Recycler Marketplace & EPR Credit Ledger (Ledger-Only)
- **Role 4: Verified Recyclers**: Dedicated onboarding, license verification, and municipal admin approval queue.
- **Public Scrap Price Board**: Real-time indicative scrap rates across major recyclables (plastic, paper, metal, e-waste, glass) with historical rate card tracking.
- **Ledger-Only Marketplace**: Citizens request recyclable sales; recyclers confirm weights and issue digital receipts (no direct fiat transactions or payment gateway required).
- **EPR Credit Ledger**: Recycler transactions generate verifiable Extended Producer Responsibility (EPR) credits with status lifecycle (`available` $\rightarrow$ `allocated` $\rightarrow$ `retired`).
- **Municipal Compost Batches**: Wet-waste recovery tracker that aggregates residential organic collections into cured agricultural compost batches.

### Phase 4: Citizen Engagement & Community
- **Strict Opt-In Leaderboards**: Default state is opted **out**. Citizens must explicitly opt in to appear on individual leaderboards; supports custom anonymous handles and zone/city scopes.
- **RWA / Society Portal with $k$-Anonymity**: Aggregated society dashboards enforce a strict threshold ($k \ge 3$) to prevent deriving individual household compliance or dispute records.
- **Community Complaint Upvoting**: Citizens upvote existing neighborhood civic complaints with unique database constraints to prevent duplicate reports.
- **Referral Rewards Engine**: Anti-gaming referral mechanism where bonus points (100 pts) are disbursed strictly upon the invitee's first verified collection.
- **Localized Segregation Guide**: Multi-stream sorting guide supporting regional languages with seamless English fallback.

### Phase 5: Progressive Web App & Offline Resilience
- **Offline Shell Caching**: Service worker (`public/sw.js`) and Web App Manifest (`manifest.webmanifest`) for standalone mobile and field installation.
- **Zero-Dependency IndexedDB Queue**: Client-side IndexedDB store (`offlineStore.ts`) buffers pickup logs and route stop updates when field connectivity drops.
- **Automated Background Sync**: Auto-sync engine (`syncEngine.ts`) replays pending mutations upon network reconnection.
- **Paused GPS Broadcasts**: Real-time driver location pings are automatically paused while offline to prevent broadcasting or replaying stale coordinates.
- **Server-Side SHA-256 Idempotency**: FastAPI middleware (`IdempotencyMiddleware`) protects mutating endpoints against network retries:
  - Cache hit returns original payload (`X-Cache-Lookup: HIT`).
  - Payload tampering or divergence with same key returns `409 Conflict` and triggers client-side divergence alerts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, React Query, React Router, Zustand, Axios, Leaflet / React Leaflet, Recharts, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy ORM, Alembic Migrations, Pydantic v2, SQLite / PostgreSQL |
| **PWA & Offline** | Web App Manifest, Service Worker API, Native IndexedDB API |
| **Testing** | Pytest, AnyIO, TypeScript Compiler (`tsc`), ESLint 9 |

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Backend API will be available at: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will run at: `http://localhost:5173`

---

## 🧪 Testing & Validation

### Backend Test Suite (96 Tests)
Run the full test suite including unit, integration, and idempotency tests:
```bash
cd backend
pytest tests/ -v
```

### Frontend Build & Lint Verification
Validate TypeScript types, production asset bundles, and code cleanliness:
```bash
cd frontend
npm run lint    # ESLint checking (0 errors, 0 warnings)
npm run build   # TypeScript compiler & Vite production bundle
```

---

## 🔒 Security & Privacy Guarantees

1. **Opt-In Leaderboards**: Citizens never appear on leaderboards by default (`opted_in = False`).
2. **$k$-Anonymity Aggregate Suppression**: RWA / society metrics return `privacy_suppressed = True` if the active household count is below 3.
3. **Idempotency Fingerprinting**: All offline driver mutation replays require client-generated UUID `Idempotency-Key` headers validated with SHA-256 payload digests.
4. **GPS Integrity**: Driver coordinates are strictly real-time and never queued or replayed retrospectively.
