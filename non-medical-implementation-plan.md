# Non-Medical Students — Full Activation Plan

> **Confirmed ground rules before any code:**
> - Course/batch codes → configurable via Admin ERP (no hardcodes)
> - No logbooks for engineering students
> - HOD = faculty with `is_hod = true` flag (already in `FacultyProfile` model) — manageable via Admin ERP

---

## Phase 0 — Git Branching Strategy (Before Any Code)

> [!IMPORTANT]
> This is the **mandatory first step**. No code is written until the branches are set up. The medical deployment on `main` must never be touched during non-medical development.

### Branch structure

```
main  ──────────────────────────────────────────────────────►  (MEDICAL — FROZEN)
  │
  └──► feature/non-medical  ──────────────────────────────────►  (NON-MEDICAL — active dev)
```

### Three repositories need branches:

| Repo | Current stable branch | New feature branch |
|---|---|---|
| `university-app` (mobile) | `main` | `feature/non-medical` |
| `unicampus` (backend + admin-panel) | `main` | `feature/non-medical` |

### Rules while on `feature/non-medical`

- ✅ All non-medical implementation goes into `feature/non-medical` only
- ✅ Bug fixes to medical-specific screens go to `main` and are **cherry-picked** into `feature/non-medical`
- ❌ Never merge `feature/non-medical` back to `main` until full QA sign-off
- ❌ Never push directly to `main` for anything non-medical related

### Branch creation commands (run once, before Phase 1)

```bash
# Mobile app
cd /Users/apple/Documents/projects/university-app
git checkout main && git pull
git checkout -b feature/non-medical
git push -u origin feature/non-medical

# Backend + Admin Panel (same repo)
cd /Users/apple/Documents/projects/unicampus
git checkout main && git pull
git checkout -b feature/non-medical
git push -u origin feature/non-medical
```

### Merging medical hotfixes into non-medical branch (when needed)

```bash
# If a bug fix lands on main that also affects non-medical:
git checkout feature/non-medical
git cherry-pick <commit-hash-from-main>
```

---

## What Already Works (zero changes needed)

Everything generic in the app works for non-medical students today. The full list is below — these are **explicitly out of scope**:

| Module | Status |
|---|---|
| Login / Auth / JWT | ✅ Generic |
| Student Dashboard (CGPA, Social Credits, AI Insight) | ✅ `isMed` branches already cover non-medical |
| AI Resume Builder / Mock Interview / Skill Gap | ✅ Non-medical path is the default |
| Outpass / Gate-pass | ✅ Generic |
| Fees (`ERPFeesScreen`) | ✅ Generic |
| Results (`ERPResultsScreen`) | ✅ Clinical tab already hidden for non-medical |
| Community / Social Feed / Chat | ✅ Generic |
| Marketplace / Campus Economy / Hustle Engine | ✅ Generic |
| Campus Journal / Mentally / AI assistant / Library | ✅ Generic |
| Fitness / Wallet / Campus Bites / Grievances | ✅ Generic |
| Faculty → Leave, Salary Slip, Official Chat | ✅ Generic |
| Faculty → Mark Attendance | ✅ Generic |
| Warden → Outpass Manager | ✅ Generic |
| Admin Panel — all 30+ modules (Examination, Admissions, etc.) | ✅ Built, data-driven |

---

## Phase 1 — Admin Panel (ERP): Course Program Configuration

**Goal**: Let admins define the ERP course programs (B.Tech, MBA, BBA) with their NORNX `course_cd` and `batch_cd` values. This replaces all hardcoded values in the backend.

### Why this comes first

The `users.py` `/students` endpoint and the ERP sync service both currently hardcode `course_cd=1` (MBBS) and batches `["66","63","60"]`. Every non-medical feature that relies on student data depends on this being configurable first.

### 1a — Backend: `CourseProgramConfig` model

**[NEW]** `backend/app/models/academic_ops.py` — add a new `CourseProgramConfig` table:

```
CourseProgramConfig
  id             UUID PK
  tenant_id      UUID FK → tenants
  name           String(100)   e.g. "B.Tech", "MBA", "BBA", "M.B.B.S."
  short_code     String(20)    e.g. "BTECH", "MBA", "BBA", "MBBS"
  erp_course_cd  String(10)    NORNX course_cd value
  erp_colg_cd    String(10)    NORNX college_cd value
  erp_batch_cds  ARRAY(String) list of batch_cd values for active years
  is_medical     Boolean       default False
  is_active      Boolean       default True
  year_count     Integer       total years (4 for B.Tech, 2 for MBA, etc.)
  created_at / updated_at
```

This table lives in `tenant.config`-adjacent space so each tenant can define its own programs.

### 1b — Backend: CRUD endpoints

**[NEW]** `backend/app/routers/academic_ops.py` — add endpoints:

- `POST /academic-ops/programs` → create a program config (admin/super_admin only)
- `GET  /academic-ops/programs` → list all program configs for this tenant
- `PATCH /academic-ops/programs/{id}` → update (toggle active, change batch codes)
- `DELETE /academic-ops/programs/{id}` → remove

### 1c — Backend: Update `/students` endpoint to use config

> [!IMPORTANT]
> **Medical data is NOT touched.** The existing MBBS fetch (hardcoded `course_cd=1`, batches `["66","63","60"]`) stays exactly as written today. It will continue to work identically for all medical users.

**[MODIFY]** `backend/app/routers/users.py` — the `GET /users/students` endpoint:

- Keep the existing MBBS block completely unchanged (the `if should_fetch_erp:` block with batches `[(1,"66"),(2,"63"),(3,"60")]`)
- **After** the MBBS block completes, query `CourseProgramConfig` for all **non-medical** active programs in this tenant
- If any non-medical programs are configured, fan out additional ERP calls for them in parallel and append to the results list
- This is purely additive — medical students still come from the hardcoded block, non-medical students come from the config table
- `seen_rollnos` dedup set is shared across both passes so no duplicates

### 1d — Admin Panel: Programs UI tab in SystemSettings

**[MODIFY]** `admin-panel/src/components/SystemSettings.tsx` — add a new "Programs" tab:

- Table of configured programs (name, short code, ERP codes, year count, active status)
- Add Program form: name, short_code, erp_course_cd, erp_colg_cd, erp_batch_cds (comma-separated), year_count, is_medical toggle
- Edit / deactivate each program
- Changes call the new `PATCH /academic-ops/programs/{id}` endpoint

> [!IMPORTANT]
> The HOD configuration is also part of Phase 1 (see 1e).

### 1e — Admin Panel: HOD Flag in Faculty HR Module

**[MODIFY]** `admin-panel/src/components/FacultyHRModule.tsx` — in the Faculty profiles tab:

- Already shows a table of faculty profiles with columns (Emp Code, Name, Designation, etc.)
- Add a "HOD" toggle column — calls `PATCH /faculty-hr/profiles/{id}` with `{ is_hod: true/false }`
- The `is_hod` field already exists in `FacultyProfile` model and is already returned by `GET /faculty-hr/profiles`

**[MODIFY]** `backend/app/routers/faculty_hr.py`:

- Add `PATCH /faculty-hr/profiles/{profile_id}` endpoint (currently only has POST + GET)
- Accepts `{ is_hod: bool, designation: str, ... }` — a general partial update

---

## Phase 2 — Backend: HOD-Aware Login & Token

**Goal**: When a faculty with `is_hod = true` logs in, the mobile app needs to know they are an HOD so it can show the right dashboard.

### 2a — Include `is_hod` in the login response / `/me` endpoint

**[MODIFY]** `backend/app/services/user_service.py` → `get_full_profile()`:

- For faculty users, join `FacultyProfile` and include `is_hod` in the response
- The `ProfileResponse` schema needs an optional `is_hod: bool` field

**[MODIFY]** `backend/app/schemas/user.py` → add `is_hod: bool = False` to `ProfileResponse`

### 2b — UserContext stores `is_hod`

**[MODIFY]** `mobile-app/src/context/UserContext.js`:

- After login / refresh, read `user.is_hod` from the profile response
- Expose `isHOD` as a derived value: `const isHOD = user?.is_hod === true && user?.role === 'faculty'`

### 2c — Route HODs to HOD Dashboard after login

**[MODIFY]** `mobile-app/src/screens/LoginScreen.js` (and/or `SplashScreen.js` token restore):

- Current routing: `faculty` → `TeacherMain`. Add: if `isHOD` → navigate to `HODMain` instead
- Or: keep routing to `TeacherMain` but show an HOD-specific tab in the Teacher tab bar

> [!NOTE]
> **Design decision**: Do HODs use the same teacher tab bar with an extra HOD tab, or a completely separate HOD tab bar? **Recommendation**: same teacher tabs + an extra "My Dept" HOD tab. This avoids duplicating all teacher screens. Please confirm.

---

## Phase 3 — Mobile: HOD Dashboard Screen

**Goal**: Build the `HODDashboardScreen` that a faculty with `is_hod=true` sees.

### What an HOD needs to see (department-scoped):

1. **Department Summary Card** — total students, avg attendance, number of defaulters (< 75%)
2. **Faculty in My Department** — list with workload hours from `/academic-ops/faculty-workload`
3. **Pending Leave Approvals** — faculty leave requests where `status = pending`, HOD can approve/reject inline
4. **Timetable Overview** — the department's weekly slots from `/academic-ops/timetable?department_id=...`
5. **Pending Appraisals** — faculty appraisals awaiting HOD rating from `/faculty-hr/appraisal`
6. **Quick Broadcast** — send a message to all faculty in their department

### Backend changes for Phase 3

**[MODIFY]** `backend/app/routers/faculty_hr.py`:

- `GET /faculty-hr/hod-summary?department_id=X` → aggregated stats: faculty count, leave pending count, avg workload
- `PATCH /faculty-hr/leave/{leave_id}/action` → approve/reject with `{ action: "approved"|"rejected", remarks: "" }` — already has the status field in `FacultyLeave`, just needs the endpoint
- `PATCH /faculty-hr/appraisal/{id}/hod-rating` → HOD rates a faculty appraisal

### Mobile file

**[NEW]** `mobile-app/src/screens/teacher/HODDashboardScreen.js`

**[MODIFY]** `mobile-app/src/navigation/TeacherTabs.js` — add "My Dept" tab visible only when `isHOD === true`

**[MODIFY]** `mobile-app/src/navigation/AppNavigator.js` — register `HODDashboard` screen

---

## Phase 4 — Mobile: Student Timetable (Live)

**Goal**: Replace the static `StudentScheduleScreen` with a live timetable from the backend.

### Current state

`StudentScheduleScreen.js` imports `ATTENDANCE_SUBJECTS` from a constants file (static data). The backend already has:
- `TimetableSlot` model with day_of_week, start_time, end_time, subject_name, faculty_name, room
- `GET /academic-ops/timetable?semester=X&department_id=Y` endpoint
- `AcademicOpsModule` in admin panel lets admins enter timetable slots

### Changes

**[MODIFY]** `mobile-app/src/screens/student/StudentScheduleScreen.js`:

- Remove static import; call `GET /academic-ops/timetable` with the student's semester/department
- Show day-of-week tabs (Mon–Sat)
- Each slot shows: time range, subject name, faculty name, room, lecture type (theory/practical)
- Loading skeleton + pull-to-refresh

**[MODIFY]** `mobile-app/src/data/apiService.js`:

- Add `getTimetable(accessToken, { semester, department_id })` function

No backend changes needed — endpoint already exists.

---

## Phase 5 — Mobile: Placement Screen (Student-Facing)

**Goal**: Non-medical students need a placement screen. The backend (`/placement/...`) and admin panel (`PlacementModule.tsx`) are already built.

### What students need to see:

1. **Active Drives** — company name, role, CTC, eligibility, deadline
2. **My Registration** — registered/not-registered for each drive
3. **Interview Schedule** — upcoming interviews with time/venue
4. **Offer Status** — accepted offer if any
5. **Link to Resume Builder** — shortcut to existing `ResumeBuilderScreen`

### Backend check

The placement router (`/placement/...`) already has:
- `GET /placement/drives` — list company drives
- `POST /placement/register` — student registers for a drive  
- `GET /placement/my-registrations` — student's registrations
- `GET /placement/offers` — placement offers

No backend changes needed.

### Mobile files

**[NEW]** `mobile-app/src/screens/student/PlacementScreen.js`

**[MODIFY]** `mobile-app/src/navigation/AppNavigator.js` — register `PlacementScreen`

**[MODIFY]** `mobile-app/src/data/apiService.js` — add `getPlacementDrives()`, `registerForDrive()`, `getMyPlacementRegistrations()`, `getPlacementOffers()` if not already present

### Where to surface it

- **ERPHub screen**: add a "Placement" tile for non-medical students (where the Logbook tile is for medical)
- **Dashboard**: Career AI section already has Resume Builder — add a "Placement" card below it for non-medical students

---

## Phase 6 — Mobile: ERPHub Tiles for Non-Medical

**Goal**: The ERPHub shows the right quick-access tiles depending on student type.

### Current ERPHub tile layout (medical):
Attendance → Results → Fees → Logbook → Competency → Outpass → Library → Bus Pass

### Non-medical ERPHub tile layout:
Attendance → Results → Fees → **Timetable** → **Placement** → Outpass → Library → Bus Pass

### Changes

**[MODIFY]** `mobile-app/src/screens/student/ERPHubScreen.js`:

- The `isMedical` flag is already computed at line 24
- Where medical tiles (Logbook, Competency) are rendered: replace with Timetable + Placement for `!isMedical`
- Timetable tile → `navigation.navigate('StudentSchedule')`
- Placement tile → `navigation.navigate('Placement')`

---

## Phase 7 — Admin Panel: Student Directory Course Filter

**Goal**: Admin's student directory shows all courses, not just MBBS.

### Current state

`StudentDirectory.tsx` calls `fetchUsers()` which hits `GET /admin/users`. That endpoint queries the `student` table (which is local DB only — manually enrolled students). It does NOT call the ERP for live students. The ERP lookup is done separately in `GET /users/students` (used by faculty/teacher/admin).

After Phase 1, `/users/students` will return students from all programs. The admin panel's `StudentDirectory` should use this richer endpoint.

### Changes

**[MODIFY]** `admin-panel/src/lib/api.ts` — update `fetchUsers()` to call `/api/v1/users/students` instead of `/api/v1/admin/users`, or add a new `fetchAllStudents(courseFilter)` function

**[MODIFY]** `admin-panel/src/components/StudentDirectory.tsx`:

- Add a "Course" filter dropdown at the top: All / MBBS / B.Tech / MBA / BBA (options populated from `GET /academic-ops/programs`)
- Pass `course_filter` to the API call
- Student cards show `course` and `branch` fields

**[MODIFY]** `backend/app/routers/users.py` — `GET /users/students`:

- Accept optional `?course_filter=BTECH` query param
- Filter returned students by program short_code

---

## Build Order & Dependencies

```
Phase 1 (Admin: Programs Config + HOD toggle)
    ↓
Phase 2 (Backend: is_hod in token)
    ↓
Phase 3 (Mobile: HOD Dashboard)        Phase 4 (Mobile: Live Timetable)
                                        Phase 5 (Mobile: Placement Screen)
                                              ↓
                                        Phase 6 (Mobile: ERPHub tiles)
                                              ↓
                                        Phase 7 (Admin: Student Directory filter)
```

Phases 4 and 5 are independent of Phase 2/3 — they can be built in parallel.

---

## Full File Change List

### Backend (`/unicampus/backend/`)

| File | Change |
|---|---|
| `app/models/academic_ops.py` | [NEW] `CourseProgramConfig` model |
| `app/models/__init__.py` | Import `CourseProgramConfig` |
| `app/routers/academic_ops.py` | [NEW] CRUD endpoints for `programs` |
| `app/routers/users.py` | Replace hardcoded MBBS batch codes with dynamic config lookup |
| `app/routers/faculty_hr.py` | [NEW] `PATCH /profiles/{id}`, `GET /hod-summary`, `PATCH /leave/{id}/action`, `PATCH /appraisal/{id}/hod-rating` |
| `app/schemas/user.py` | Add `is_hod: bool = False` to `ProfileResponse` |
| `app/services/user_service.py` | Join `FacultyProfile` and include `is_hod` in profile response |

### Mobile App (`/university-app/src/`)

| File | Change |
|---|---|
| `context/UserContext.js` | Expose `isHOD` derived value |
| `screens/LoginScreen.js` | Route HODs correctly after login |
| `screens/teacher/HODDashboardScreen.js` | [NEW] HOD dashboard screen |
| `screens/student/StudentScheduleScreen.js` | Replace static data with live API call |
| `screens/student/PlacementScreen.js` | [NEW] Student placement screen |
| `screens/student/ERPHubScreen.js` | Replace medical tiles with non-medical tiles |
| `data/apiService.js` | Add `getTimetable()`, `getPlacementDrives()`, `registerForDrive()`, `getMyPlacementRegistrations()`, `getPlacementOffers()` |
| `navigation/AppNavigator.js` | Register `HODDashboard`, `Placement`, confirm `StudentSchedule` |
| `navigation/TeacherTabs.js` | Add "My Dept" tab for HODs |

### Admin Panel (`/unicampus/admin-panel/src/`)

| File | Change |
|---|---|
| `components/SystemSettings.tsx` | [NEW] "Programs" tab for course program CRUD |
| `components/FacultyHRModule.tsx` | Add HOD toggle in faculty profiles table |
| `components/StudentDirectory.tsx` | Add course filter dropdown |
| `lib/api.ts` | Add `fetchPrograms()`, `createProgram()`, `updateProgram()`, `fetchAllStudents(filter)`, `updateFacultyProfile()` |

---

## Database Migration

One new migration is needed for `CourseProgramConfig`. The `is_hod` field already exists in `faculty_profiles`. No other schema changes.

After Phase 1 backend is deployed:
1. Admin logs into ERP → Settings → Programs
2. Creates entries: B.Tech (erp_course_cd=X, batches=[...], year_count=4), MBA, BBA
3. Saves → backend now fetches all programs when building student directory

---

## What is NOT in scope (medical-only, untouched)

- UG Logbook screen (medical-only — stays as-is, non-medical students simply don't see it)
- PG Logbook / Foundation Logbook (medical-only)
- Clinical Competency Gap section in Dashboard (already hidden for non-medical via `isMed` check)
- MBBS Phase labels in Results screen (already conditional)
