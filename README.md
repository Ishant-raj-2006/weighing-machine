# NAWI Test Report System

**Smart India Hackathon 2026 — Problem Statement 26035**
*Development of a Software Program/Application for Generation of Test Reports for
Non-Automatic Weighing Instruments (NAWI) as per OIML Recommendation R-76*
Ministry of Consumer Affairs, Food & Public Distribution — Department of Consumer Affairs (DoCA)

A working prototype that replaces manual spreadsheet-based NAWI test reports with a
digital workflow: register an instrument → record OIML R-76 test observations →
get automatic permissible-error calculations and PASS/FAIL determination →
download a standardized PDF / Word report.

---

## 1. What's inside

```
nawi-report-system/
├── backend/     FastAPI + SQLite — REST API, R-76 rule engine, PDF/Word report generation
└── frontend/    React + Vite + Tailwind — the web UI
```

Kept intentionally to two folders so it's easy to explain: **one backend, one frontend.**
No Docker, no cloud account, no separate database server required to run it locally —
SQLite ships with Python, so `pip install` + `npm install` is the whole setup.

## 2. Quick start (local)

**Requirements:** Python 3.10+ and Node.js 18+.

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs on **http://localhost:8000**. On first run it auto-creates `nawi.db` (SQLite) and
seeds demo users + one sample instrument — see credentials below.
Interactive API docs: http://localhost:8000/docs

### Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173** and proxies `/api` to the backend automatically
(see `vite.config.js`) — no extra configuration needed for local use.

Open http://localhost:5173 and log in.

### Demo logins (seeded automatically)

| Role             | Username     | Password   |
|------------------|--------------|------------|
| Admin             | `admin`      | `admin123` |
| Lab Manager       | `labmanager` | `lab123`   |
| Testing Officer   | `tester`     | `test123`  |
| Reviewer          | `reviewer`   | `review123`|

A sample instrument (`PW500E-2026-0001`, Class III, e = 0.1 kg) is seeded too, so you
can run a full test immediately without registering anything first.

## 3. Demo walkthrough

1. Log in as `tester` (Testing Officer).
2. **Instruments** → the seeded instrument is already there, or **+ New Instrument** to add one.
3. Click **New Test** on an instrument → fill in lab name / temperature / humidity → Continue.
4. On the **Observations** screen:
   - *Accuracy (Weighing) Test* tab → click **Suggest Test Points** (auto-fills loads at
     Min, 25/50/75/100% of Max) → edit the "Indication" column to your readings →
     **Save & Calculate**. Error, MPE and PASS/FAIL appear instantly.
   - *Repeatability* and *Eccentricity* tabs work the same way.
5. Click **Finalize & Calculate Result** → overall PASS/FAIL is computed from every
   observation entered.
6. On the result screen, download the **PDF** or **Word** report — both are generated
   on the fly from the same data, so they always match.
7. **Report History** → search/filter past reports by report number, manufacturer,
   model, serial number, status or result.
8. Log in as `admin` to see **Admin Panel** (user management, role-based).

## 4. How the OIML R-76 calculation actually works

This is the core of the problem statement, so it's kept in one small, isolated file:
`backend/app/r76_engine.py`.

- Every instrument declares an **accuracy class** (I / II / III / IIII) and a
  **verification scale interval `e`** at registration.
- For any test load `m`, the engine looks up the **Maximum Permissible Error (MPE)**
  from OIML R76-1 Table 3, expressed as a multiple of `e` (0.5e / 1.0e / 1.5e
  depending on how many verification intervals the load represents).
- **In-service** tests automatically use **double** the initial-verification MPE, per R76.
- `error = indicated_value − test_load`; **PASS** if `|error| ≤ MPE`, else **FAIL**.
- The same function powers all three implemented tests:
  - **Accuracy (weighing) test** — single-point check at each test load.
  - **Repeatability test** — the spread of repeated readings at one load must stay
    within the MPE for that load.
  - **Eccentricity (corner-load) test** — same single-point check, applied at each
    corner position.
- Nothing is hard-coded per-instrument — change the accuracy class or `e`, and every
  calculation recalculates automatically from the same table.

**Scope note:** OIML R-76 defines more tests than these three (discrimination, tare,
temperature effect, etc.). The engine is structured so a new test = one new function
in `r76_engine.py` + one new small table/router — the pattern is already established.
This also directly satisfies the "supporting future updates whenever OIML
recommendations are revised" requirement: only this one file changes.

**Before relying on this for anything beyond a demo:** the MPE table values reproduce
the standard, widely published OIML R76-1:2006 Table 3 — cross-check them against the
current official text first.

## 5. Architecture / tech choices (and why)

| Layer         | Choice                        | Why |
|---------------|--------------------------------|-----|
| Frontend      | React + Vite + Tailwind        | As planned |
| Backend       | Python + FastAPI               | As planned |
| Database      | **SQLite** (via SQLAlchemy)    | Original plan used PostgreSQL/Supabase. SQLite needs zero setup for a prototype/demo — the whole app runs `pip install && npm install` with nothing external to configure. Because everything goes through SQLAlchemy, switching to PostgreSQL later is a one-line change in `backend/app/database.py` (`DATABASE_URL`) — no other code changes. |
| Auth          | JWT (`python-jose` + `passlib`) | Same idea as the original plan (JWT/Supabase Auth) without requiring a Supabase project just to log in. |
| File storage  | Local `backend/uploads/` folder | Swappable for Supabase/S3 later; the API layer (`instruments.py`) is the only place that would need to change. |
| PDF report    | ReportLab                      | As planned |
| Word report   | python-docx                    | As planned |
| Charts        | Recharts                       | As planned |
| Rule engine   | Plain Python module            | Isolated on purpose — see §4 |

Everything from the original architecture is here in spirit; the infra choices
(SQLite vs. Postgres, local disk vs. Supabase Storage) were simplified so the zip
runs immediately after cloning, with a clearly documented one-line path to swap
each one back in for a real deployment.

## 6. Deploying it for real (Vercel + Render, as originally planned)

- **Backend → Render/Railway:** deploy `backend/` as a standard FastAPI app
  (`uvicorn app.main:app`). Set `DATABASE_URL` to a managed Postgres instance and
  `NAWI_SECRET_KEY` to a real secret (both read from environment variables already —
  see `database.py` / `auth.py`).
- **Frontend → Vercel:** deploy `frontend/`. Set `VITE_API_BASE_URL` to your deployed
  backend's `/api` URL (e.g. `https://your-backend.onrender.com/api`) — the frontend
  already reads this from the environment (`src/api.js`), so no code change needed.

## 7. Data model (SQLite tables)

`users`, `instruments`, `test_reports`, `weighing_observations`,
`repeatability_tests`, `eccentricity_observations`, `attachments`.
Full field list is in `backend/app/models.py` — it's short enough to read directly
rather than duplicate here.

## 8. API reference

Once the backend is running, the full interactive API reference (every endpoint,
request/response shape, try-it-out) is auto-generated at **http://localhost:8000/docs**.

## 9. Roles

| Role              | Can do |
|-------------------|--------|
| Admin              | Everything, plus user management |
| Lab Manager        | Register instruments, run tests, review reports |
| Testing Officer    | Register instruments, run tests |
| Reviewer           | View completed reports, add review remarks |

## 10. What to say in the demo (short version)

> "Reports jo pehle Excel mein manually banti thi aur calculation galat hone ka
> risk rehta tha — ab: instrument register karo, test loads aur readings daalo,
> system khud OIML R-76 ke table se permissible error nikaal ke PASS/FAIL decide
> karta hai, aur ek click mein PDF ya Word report ban jaati hai. Poora calculation
> logic ek hi jagah (`r76_engine.py`) hai, isliye jab R-76 revise hoga, sirf wahi
> file update karni hogi — poora system nahi."
