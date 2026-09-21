# EcoSync - Smart Municipal Waste Management & Circular Economy Platform

EcoSync is a full-stack, multi-role smart municipal waste management and circular economy platform for coordinating citizens, collection drivers, verified recyclers, and municipal administrators.

---

## Project Overview

The platform supports verified household onboarding, OTP-based registration, electricity bill verification, pickup scheduling, complaint workflows, closed-loop points & rewards, live GPS route tracking, nearest-neighbor route dispatch, recycler marketplace mechanics with EPR credits, community engagement with strict privacy guarantees, and an offline-resilient Progressive Web App (PWA).

---

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, React Router, Zustand, TanStack React Query, Axios, Framer Motion, Recharts, Lucide Icons
- **Backend:** FastAPI, Python 3.11, SQLAlchemy ORM, Alembic Migrations, Pydantic v2, JWT authentication
- **Database:** PostgreSQL (production) / SQLite (local testing & development)
- **Maps & Geospatial:** Leaflet & React Leaflet with OpenStreetMap tiles for real pickup tracking, driver location streaming, and spatial complaint heatmaps
- **PWA & Offline:** Web App Manifest (`manifest.webmanifest`), Service Worker (`public/sw.js`), and zero-dependency Native IndexedDB (`offlineStore.ts`)
- **Notifications & SMS:** Twilio SMS integration for OTP challenge delivery
- **Analytics & Operations:** Pandas-powered operational summaries, SLA monitoring, and CSV export

---

## Platform Feature Modules

### 1. Verified Pickup Logging & Closed-Loop Points Engine

- **Driver Verification**: Collection drivers record actual pickup weight (kg), waste category (`wet`, `dry`, `hazardous`, `e_waste`, `sanitary`), and optional photo proof.
- **Deterministic Points Engine**:
  - Base award: 10 points for on-time segregated pickup.
  - Weight bonus: +2 points per kg over 5 kg, strictly capped on a rolling 7-day window.
  - Streak multiplier: $1.25\times$ applied for $4+$ consecutive weeks of compliant segregation.
  - Dispute reversal: Flagged transactions reverse points safely without negative balance drift.
- **Citizen Tier Progression**: Bronze $\rightarrow$ Silver $\rightarrow$ Gold $\rightarrow$ Platinum tiers with dynamic points redemption catalog.

### 2. Municipal Operations, Fleet Management & Route Optimization

- **Multi-Zone Governance**: Administrative zones, ward boundaries, and localized collection policies.
- **Fleet Registry & Dispatch**: Vehicle management (EV, Diesel, CNG) mapped to assigned municipal drivers.
- **Bulk Waste Generators**: Dedicated tracking for high-volume entities (apartments, tech parks, commercial complexes).
- **Batch Route Optimization**: Nearest-neighbor routing algorithm optimizing daily collection routes with estimated arrival times.
- **Spatial Incident Heatmap & Hotspots**: Automated detection of complaint hotspots ($> 5$ complaints in 30 days) and dynamic Leaflet-based geospatial heatmap rendering in the admin dashboard.

### 3. Recycler Marketplace & EPR Credit Ledger (Ledger-Only)

- **Role 4: Verified Recyclers**: Dedicated onboarding, business license verification, and municipal admin approval queue.
- **Public Scrap Price Board**: Real-time indicative scrap rates across major recyclables (`plastic`, `paper`, `metal`, `e_waste`, `glass`) with historical rate card tracking.
- **Ledger-Only Marketplace**: Citizens request recyclable sales; recyclers confirm weights and issue digital receipts (strictly ledger-only; no payment gateway integration or real money movement).
- **EPR Credit Ledger**: Recycler transactions generate verifiable Extended Producer Responsibility (EPR) credits with status lifecycle (`available` $\rightarrow$ `allocated` $\rightarrow$ `retired`).
- **Municipal Compost Batches**: Wet-waste recovery tracker aggregating residential organic collections into cured agricultural compost batches.

### 4. Citizen Engagement & Community Hub

- **Strict Opt-In Leaderboards**: Default state is opted **out**. Citizens must explicitly opt in to appear on individual leaderboards; supports custom anonymous handles and zone/city scopes.
- **RWA / Society Portal with $k$-Anonymity**: Aggregated society dashboards enforce a strict threshold ($k \ge 3$) to prevent deriving individual household compliance or dispute records.
- **Community Complaint Upvoting**: Citizens upvote existing neighborhood civic complaints with unique database constraints to prevent duplicate reports.
- **Referral Rewards Engine**: Anti-gaming referral mechanism where bonus points (100 pts) are disbursed strictly upon the invitee's first verified collection.
- **Localized Segregation Guide**: Multi-stream sorting guide supporting regional languages with seamless English fallback.

### 5. Progressive Web App & Offline Resilience

- **Offline Shell Caching**: Service worker (`public/sw.js`) and Web App Manifest (`manifest.webmanifest`) for standalone mobile and field installation.
- **Zero-Dependency IndexedDB Queue**: Client-side IndexedDB store (`offlineStore.ts`) buffers pickup logs and route stop updates when field connectivity drops.
- **Automated Background Sync**: Auto-sync engine (`syncEngine.ts`) replays pending mutations upon network reconnection.
- **Paused GPS Broadcasts**: Real-time driver location pings are automatically paused while offline to prevent broadcasting or replaying stale coordinates.
- **Server-Side SHA-256 Idempotency**: FastAPI middleware (`IdempotencyMiddleware`) protects mutating endpoints against network retries:
  - Cache hit returns original payload (`X-Cache-Lookup: HIT`).
  - Payload tampering or divergence with same key returns `409 Conflict` and triggers client-side divergence alerts.

---

## Environment Variables

Create `backend/.env` before running the API:

```env
APP_NAME="EcoSync API"
ENVIRONMENT="local"
DATABASE_URL="postgresql://ecosync:ecosync@localhost:5432/ecosync"
# For SQLite local development:
# DATABASE_URL="sqlite:///./ecosync.db"
JWT_SECRET_KEY="replace-with-a-secure-secret"
FRONTEND_ORIGIN="http://localhost:5173"
UPLOAD_DIR="backend/uploads"
MAX_UPLOAD_SIZE_MB="10"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_FROM_PHONE=""
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run lint    # ESLint checking (0 errors, 0 warnings)
npm run build   # TypeScript compiler & Vite production bundle
npm run dev     # Start Vite development server
```

The frontend runs on <http://localhost:5173> by default.

---

## Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # create manually if the example is not present yet
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The API runs on <http://localhost:8000> by default.

---

## Database Setup

1. Create a PostgreSQL database named `ecosync` (or use the included SQLite database for local testing).
2. Configure `DATABASE_URL` in `backend/.env`.
3. Run Alembic migrations from the `backend` directory:

   ```bash
   alembic upgrade head
   ```

The schema includes `users`, `pickup_requests`, `complaints`, `rewards`, `drivers`, `notifications`, `otp_challenges`, `driver_locations`, `zones`, `vehicles`, `bulk_generators`, `routes`, `route_stops`, `complaint_hotspots`, `recyclers`, `rate_cards`, `recycling_transactions`, `recycling_receipts`, `epr_credits`, `compost_batches`, `societies`, `society_memberships`, `leaderboard_opt_ins`, `complaint_upvotes`, `referrals`, and `idempotency_keys`.

---

## Integrated Feature Notes

- **Database persistence:** Auth, pickups, complaints, rewards, notifications, OTPs, zones, vehicles, recyclers, and live tracking events are persisted with SQLAlchemy.
- **Live tracking:** Driver location updates are available through REST endpoints and `/api/v1/tracking/pickups/{pickup_id}/ws`.
- **Maps:** Dashboards render OpenStreetMap maps with Leaflet for pickup destinations, live driver positions, and spatial complaint heatmaps.
- **Uploads:** Verification documents and pickup photos can be uploaded through `/api/v1/uploads/...` and are served from `/uploads/...`.
- **Analytics:** `/api/v1/analytics/summary` returns aggregated metrics and `/api/v1/analytics/export.csv` exports persisted pickup data.
- **Idempotency Protection:** Mutating endpoints validate `Idempotency-Key` headers against a 24-hour cache table to eliminate duplicate requests.

---

## API Documentation

When the backend server is running, FastAPI exposes interactive documentation at:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

---

## Creating User Accounts for Flow Testing

Use the frontend at <http://localhost:5173/register> to create test accounts, or call the auth endpoints directly from Swagger.

1. Request an OTP for the phone number you want to use.
2. Verify the OTP for that phone number.
3. Complete registration with the desired role.
4. Sign in at <http://localhost:5173/login> to land on the role-specific dashboard.

### 1. Citizen test account

- Choose the `Citizen` role on the registration page.
- Fill in name, phone, password, address, and optionally upload an electricity bill.
- Lands on `/dashboard/user`.
- Capabilities: Schedule pickups, watch live driver tracking, check points & tier status, opt in to community leaderboards, join housing societies, upvote complaints, and request recyclable sales on the scrap market.

### 2. Driver test account

- Choose the `Driver` role on the registration page.
- Provide a `vehicle number` (mandatory for driver accounts).
- Lands on `/dashboard/driver`.
- Capabilities: View assigned pickups, stream live GPS coordinates, manage today's route stops, log verified weights with photo proof, and work seamlessly offline with automatic IndexedDB synchronization.

### 3. Recycler test account

- Choose the `Recycler` role on the registration page.
- Provide business name, GSTIN, facility address, and accepted material streams.
- Once verified by an admin, lands on `/dashboard/recycler`.
- Capabilities: Publish material rate cards to the public price board, process citizen scrap pickup requests, verify scrap weights, and issue digital recycling receipts that generate EPR credits.

### 4. Admin test account

Admin accounts cannot be created through public registration. Provision an administrator in the database, then sign in at <http://localhost:5173/login> to use `/dashboard/admin`.

- Capabilities: Assign pickups, dispatch fleet routes with nearest-neighbor optimization, review pending recycler applications, approve RWA societies, view spatial complaint heatmaps, track compost batches, and monitor city-wide SLA performance.

---

## Recommended End-to-End Flow Check

1. **Citizen Request**: Sign in as a Citizen and schedule a pickup at `/dashboard/user`.
2. **Admin Dispatch**: Sign in as an Admin at `/dashboard/admin`, assign the pickup to a driver, or generate an optimized daily collection route in Route Dispatch.
3. **Driver Execution & Logging**: Sign in as a Driver at `/dashboard/driver`. Update stop statuses, log the actual verified weight (kg) and waste category. Points are automatically calculated and awarded to the citizen.
4. **Offline Mode Validation**: In the Driver dashboard, toggle network to Offline in browser DevTools. Log a pickup or change stop status. Notice the mutation is stored locally in IndexedDB with an amber offline banner. When toggled back Online, the sync engine automatically replays the mutation with its `Idempotency-Key`.
5. **Recycler Flow**: Register a Recycler account, approve it via Admin dashboard, post rates for plastic/paper, and submit a sale request from the Citizen dashboard. Confirm the transaction to observe digital receipt and EPR credit issuance.
6. **Community Features**: From the Citizen dashboard, open the Community & Rewards Hub to toggle leaderboard opt-in, join a housing society, and upvote open civic complaints.

---

## Testing & Validation Suite

```bash
# Run all backend unit, integration, and idempotency tests (96 tests)
cd backend
pytest tests/ -v

# Run frontend linting (0 errors, 0 warnings)
cd frontend
npm run lint

# Run frontend production build
cd frontend
npm run build
```

---

## Planning and Progress Tracking

All project architecture notes, database schema snapshots, task statuses, and progress updates across modules are tracked in `tasks.json` and [walkthrough.md](file:///c:/VsCodeFolder/Project/EcoSync-Smart-Municipal-Waste-Management/walkthrough.md).
