# Phase 2 Verification Audit — ZEO Embilipitiya Digital Platform

> **Audit Date:** 2026-03-01
> **Method:** Static code analysis of the codebase at HEAD of `claude/p2audit-8JsDJ`
> **Auditor:** Claude Code (claude-sonnet-4-6)
> **Scope:** Verification of Phase 1 audit fix claims + Phase 2 (SIS) implementation audit + development plan accuracy + Railway feasibility update

---

## Executive Summary

Phase 2 of the ZEO Embilipitiya Digital Platform has been declared complete in `todo.md`. A cross-check of the actual codebase reveals **Phase 2 is substantially complete**, with the SIS module (5 pages, full tRPC backend, i18n, multilingual translations) genuinely delivered. However, **several gaps remain** that must be addressed before Phase 3 begins or before any production deployment.

**Key findings at a glance:**

| Category | Status |
|----------|--------|
| Phase 1 audit fixes (S1–S6, B1–B9) | ⚠️ 16 of 17 confirmed — B7 (leaveBalances unique key) falsely claimed done |
| Phase 2 SIS pages (5 pages) | ✅ All implemented with forms, pagination, and role-based nav |
| Phase 2 SIS backend (tRPC procedures) | ✅ All guarded with typed `Permission` — no unguarded procedures found |
| Phase 2 schema (SIS tables) | ⚠️ 6 of 8 expected tables — `reportCards` and `parentStudentLinks` missing |
| i18n (i18next + 3 languages) | ✅ Complete — 94 keys, full Sinhala/Tamil parity, LanguageSwitcher implemented |
| Test coverage | ⚠️ 79 tests — but no business-logic tests for B1/B3 fixes, no SIS role-permission tests |
| Railway deployment readiness | ❌ All 3 blocking issues still unresolved |
| Development plan accuracy (AGENTS.md) | ❌ 5 discrepancies — including falsely completed B7 and 2 missing tables |

**The most urgent issues before any production deployment:**

1. B7 (`leaveBalances` unique constraint) was marked done but never implemented — `upsertLeaveBalance` is still silently broken
2. `railway.toml`, `.env.example`, and `/api/health` endpoint all still missing — deployment cannot proceed
3. `reportCards` and `parentStudentLinks` tables listed in AGENTS.md Phase 2 scope but not built

---

## 1. Phase 1 Audit Fix Verification

Verification of every fix claimed in AGENTS.md against the actual codebase at current HEAD.

### Security Fixes (S1–S6)

| ID | Finding | AGENTS.md Claim | Code Evidence | Verdict |
|----|---------|-----------------|---------------|---------|
| S1 | `requirePermission` accepts loose `string` | Fixed — uses `Permission` type | `function requirePermission(permission: Permission)` at `server/routers.ts:12` — no `as any` cast | ✅ Fixed |
| S2 | `analytics.overview` unguarded | Fixed — gated by `ANALYTICS_VIEW_SCHOOL` | `requirePermission(PERMISSIONS.ANALYTICS_VIEW_SCHOOL)` at analytics router entry | ✅ Fixed |
| S3 | `users.getById` unguarded | Fixed — requires `USERS_VIEW` or own-ID check | Ownership check + `USERS_VIEW` permission guard present | ✅ Fixed |
| S4 | `professionalDev.create` unguarded | Fixed — requires `STAFF_EDIT` | `requirePermission(PERMISSIONS.STAFF_EDIT)` on create mutation | ✅ Fixed |
| S5 | Role escalation in `users.updateRole` | Fixed — hierarchy check added | Cannot assign role equal or higher than own; cannot modify own role | ✅ Fixed |
| S6 | LIKE wildcard resource exhaustion | Fixed — `escapeLike()` helper added | `escapeLike()` applied to all search inputs in `server/db.ts` | ✅ Fixed |

### Business Logic Fixes (B1–B9)

| ID | Finding | AGENTS.md Claim | Code Evidence | Verdict |
|----|---------|-----------------|---------------|---------|
| B1 | Leave approval doesn't update balances | Fixed | Zone-level approve increments `casualUsed`/`sickUsed`/`annualUsed`/`dutyUsed` | ✅ Fixed |
| B2 | No balance check before submission | Fixed | Pre-submission balance check throws `BAD_REQUEST` if insufficient | ✅ Fixed |
| B3 | `numberOfDays` not validated against date range | Fixed | Date-range calculation validates `numberOfDays` within tolerance of 1 | ✅ Fixed |
| B4 | No notifications on leave approve/reject | Fixed | `createNotification()` called after each leave status change | ✅ Fixed |
| B5 | No notifications on transfer status changes | Fixed | `createNotification()` called after each transfer stage transition | ✅ Fixed |
| B6 | Branch head cannot reject at their stage | Fixed — `rejectByBranch` added | `transfers.rejectByBranch` procedure with `TRANSFER_REVIEW` permission | ✅ Fixed |
| **B7** | **`leaveBalances` missing unique constraint** | **Fixed — "unique per staffId+year"** | **`drizzle/schema.ts:189–203` — no `unique()` call present. The table definition has no composite unique index on `(staffId, year)`.** | **❌ NOT FIXED** |
| B8 | `leave.setBalance` not exposed via tRPC | Fixed | `leave.setBalance` procedure with `LEAVE_APPROVE_ZONE` guard | ✅ Fixed |
| B9 | Transfer cards show school IDs not names | Fixed | School names joined in `listTransferRequests` DB query | ✅ Fixed |

### Frontend / UX Fixes (F1–F7)

| ID | Finding | Verdict |
|----|---------|---------|
| F1 | No pagination on any list view | ✅ Fixed — all list views paginated with `page`/`pageSize` |
| F2 | All 7 action forms are placeholders | ✅ Fixed — Staff, Leave, Transfer, Announcement, Message, School, Role forms all implemented |
| F3 | No staff detail/profile page | ✅ Fixed — `/staff/:id` (StaffDetail.tsx) implemented |
| F4 | No announcement detail view | ✅ Fixed — `/announcements/:id` (AnnouncementDetail.tsx) implemented |
| F5 | No error state handling | ✅ Fixed — `isError` states handled on all pages |
| F6 | Search missing on most list pages | ✅ Fixed — search added to Leave, Transfers, Announcements, Schools |
| F7 | Schools page doesn't show principal assignment | ✅ Fixed — principal name displayed in school list |

### Phase 1 Fix Summary

**16 of 17 fixes confirmed. B7 is falsely marked complete.**

B7 is a data-integrity issue: `db.upsertLeaveBalance()` uses `onDuplicateKeyUpdate` which silently falls back to an `INSERT` if no unique key exists, creating duplicate `leaveBalances` rows per staff per year. Since `getLeaveBalance` returns the first row by primary key ordering, the displayed balance is eventually stale. This was the most straightforward schema fix in the original audit (5 lines), yet it was never applied.

---

## 2. Phase 2 Implementation Audit

### 2.1 Database Schema (SIS)

| Table | AGENTS.md Listed | In Schema | Notes |
|-------|-----------------|-----------|-------|
| `studentProfiles` | ✅ | ✅ | Demographics, guardian, health info |
| `enrollments` | ✅ | ✅ | Student–school–year–grade mapping |
| `attendanceRecords` | ✅ | ✅ | Daily per-student attendance |
| `grades` | ✅ | ✅ | Term/assessment grades with max/obtained marks |
| `scholarshipPrograms` | ✅ | ✅ | Program definitions with amount, deadline |
| `scholarshipApplications` | ✅ | ✅ | Application status workflow |
| `reportCards` | ✅ | ❌ | **Missing** — referenced in AGENTS.md as Phase 2 deliverable |
| `parentStudentLinks` | ✅ | ❌ | **Missing** — referenced in AGENTS.md as Phase 2 deliverable |

**Schema gaps beyond missing tables:**

| Gap | Severity | Detail |
|-----|----------|--------|
| No index on `attendanceRecords(studentId, date)` | MEDIUM | Daily lookups across a 200-school deployment will full-scan this table |
| No index on `enrollments(studentId, academicYear)` | MEDIUM | Transcript generation queries iterate without an index |
| No index on `grades(studentId, academicYear, term)` | MEDIUM | Student grade summary queries lack index support |
| No index on `scholarshipApplications(programId, status)` | LOW | Review queries will degrade as applications accumulate |
| `leaveBalances` missing unique on `(staffId, year)` | HIGH | Carry-over from B7 — still not fixed |

### 2.2 Backend — tRPC Procedures

| Router | Procedures | Permission Guards | Status |
|--------|-----------|-------------------|--------|
| `students` | `list`, `create`, `getById`, `update` | `STUDENT_VIEW` / `STUDENT_MANAGE` | ✅ Complete |
| `enrollments` | `list`, `enroll`, `updateStatus` | `STUDENT_VIEW` / `STUDENT_MANAGE` | ✅ Complete |
| `attendance` | `bulkMark`, `getByDate`, `studentSummary`, `schoolSummary` | `ATTENDANCE_MARK` / `ATTENDANCE_VIEW` | ⚠️ See P2-P1 below |
| `studentGrades` | `list`, `enter`, `update`, `studentSummary` | `GRADE_VIEW` / `GRADE_MANAGE` | ✅ Complete |
| `scholarships.programs` | `list`, `create` | `SCHOLARSHIP_VIEW` / `SCHOLARSHIP_MANAGE` | ✅ Complete |
| `scholarships.applications` | `list`, `apply`, `review` | `SCHOLARSHIP_VIEW` / `SCHOLARSHIP_APPLY` / `SCHOLARSHIP_MANAGE` | ✅ Complete |

**Individual procedure gaps:**

### P2-P1 — MEDIUM: No single-record `attendance.mark` procedure

Only `attendance.bulkMark` exists. `sis.test.ts` references `attendance.mark` (a single-record variant) in its procedure existence test, but the procedure does not exist. The test passes because it uses a `typeof` check on the caller object — an implementation gap masked by the test approach.

**Impact:** A teacher who needs to correct one student's attendance record must go through the bulk-mark interface. More critically, the `sis.test.ts` procedure existence check is incorrect — it is testing for a procedure that does not exist but does not fail.

**Fix:** Either add `attendance.mark` as a single-record alias to `bulkMark`, or correct `sis.test.ts` to assert `attendance.bulkMark` and `attendance.getByDate` instead.

---

### P2-P2 — LOW: `scholarships.applications.review` handles all status transitions in one procedure

The `review` procedure accepts any `status` value and applies it without stage validation. A `SCHOLARSHIP_MANAGE` user can jump a scholarship application from `applied` directly to `awarded`, skipping `under_review` and `shortlisted` stages.

**Fix:** Add stage-transition validation: only allow `applied → under_review → shortlisted → awarded/rejected`. This mirrors the pattern used in the transfer workflow.

---

### P2-P3 — LOW: No bulk attendance for absent-by-default

The current `bulkMark` only records students explicitly listed. Absent students who are not in the submitted list receive no record for that date. `schoolSummary` then has no basis to calculate a meaningful attendance rate.

**Fix (short-term):** Document that all students must be listed (even absent ones) in each bulk mark submission, and add client-side guidance. **Fix (long-term):** Add an `absentByDefault` flag — if `true`, any enrolled student not in the list is automatically marked absent.

---

### 2.3 Frontend Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| StudentDirectory | `/students` | ✅ Complete | Form (13 fields), search, pagination, stats cards |
| StudentProfile | `/students/:id` | ✅ Complete | Tabbed: Personal, Enrollments, Grades, Attendance |
| Attendance | `/attendance` | ✅ Complete | School+date filters, summary stats, bulk mark table |
| Grades | `/grades` | ✅ Complete | Enter grade dialog (10 fields), filter, paginated table |
| Scholarships | `/scholarships` | ✅ Complete | Programs + Applications tabs, full CRUD |

**Frontend UX gaps:**

### P2-F1 — MEDIUM: No parent portal or role-separated view

`parentStudentLinks` table is missing, so the `parent` role has no way to view their own children's attendance, grades, or enrollment data. Parents can technically access the Students page (if `STUDENT_VIEW` is granted to their role), but would see all students — not their own children.

**Fix:** Implement `parentStudentLinks` table and add ownership filtering to all SIS queries when the calling role is `parent`.

---

### P2-F2 — LOW: StudentProfile attendance tab shows raw summary, no calendar

The attendance tab in `StudentProfile.tsx` shows aggregate counts (total/present/absent/late/excused) but no per-date breakdown. A teacher or parent cannot see which specific dates a student was absent.

**Fix:** Add a date-range filtered `attendanceRecords` query and display a simple date list or calendar heatmap.

---

### P2-F3 — LOW: Grades page has no subject name lookup

Grade records display a numeric `subjectId` rather than a human-readable subject name. There is no `subjects` table in the schema, so the grade entry form only accepts a raw ID.

**Fix (short-term):** Add a free-text `subjectName` field alongside `subjectId`. **Fix (long-term):** Add a `subjects` table and join it in grade queries.

---

### 2.4 i18n Implementation

| Item | Status |
|------|--------|
| `i18next` + `react-i18next` installed and configured | ✅ Complete |
| `i18n/index.ts` initialised in `main.tsx` | ✅ Complete |
| English (`en.json`) — 94 keys across 13 sections | ✅ Complete |
| Sinhala (`si.json`) — 94 keys, full parity with `en.json` | ✅ Complete |
| Tamil (`ta.json`) — 94 keys, full parity with `en.json` | ✅ Complete |
| Sinhala Unicode verified (U+0D80–U+0DFF) | ✅ Verified |
| Tamil Unicode verified (U+0B80–U+0BFF) | ✅ Verified |
| `LanguageSwitcher` component | ✅ Complete — globe icon, compact/full mode, `localStorage` persistence |
| Language detection order: `localStorage` → browser `navigator` | ✅ Correct |
| Language preference key: `zeo-language` | ✅ Consistent |

**i18n gap:**

### P2-I1 — LOW: SIS pages do not use i18n keys for all user-facing strings

The SIS pages (`StudentDirectory.tsx`, `Grades.tsx`, etc.) use hardcoded English strings (e.g., `"Add Student"`, `"Academic Year"`, `"Assessment Type"`) rather than `useTranslation()` hook calls. The `en.json` file has a `students`, `attendance`, `grades`, and `scholarships` section with keys, but these are only used in the nav and common elements — not inside the form labels and button text.

**Fix:** Refactor SIS page components to use `const { t } = useTranslation()` and replace hardcoded English labels with `t("students.addStudent")` etc. This is a significant but mechanical refactor.

---

## 3. Test Coverage Audit

### Current State

| File | Tests | What is Covered |
|------|-------|----------------|
| `permissions.test.ts` | 24 | RBAC matrix (pure data structure) |
| `auth.logout.test.ts` | 1 | Cookie clearing on logout |
| `routers.test.ts` | 33 | Permission guards (S2-S4), role escalation (S5), input validation, auth flow |
| `sis.test.ts` | 21 | Auth guards, input validation, pagination, procedure existence, i18n parity |
| **Total** | **79** | |

### Verified Missing Tests

The following scenarios have **no test coverage** despite having fixes or features in the codebase:

#### From Phase 1 Fixes

| Gap | Priority | Description |
|-----|----------|-------------|
| **B1 leave balance deduction** | HIGH | No test that calls `leave.approve` and then asserts `leaveBalances.casualUsed` was incremented. The fix is implemented but completely untested. |
| **B3 date range validation** | HIGH | No test that submits a leave request with mismatched `numberOfDays` and asserts `BAD_REQUEST`. The fix exists but is unverified by the test suite. |
| **B6 `rejectByBranch` accessibility** | MEDIUM | No test that a `branch_head` can call `transfers.rejectByBranch` (permitted) and that a `teacher` cannot (forbidden). |
| **B8 `leave.setBalance` restriction** | MEDIUM | No test that `leave.setBalance` requires `LEAVE_APPROVE_ZONE` and is blocked for `principal` and below. |
| **B7 unique constraint absence** | HIGH | No test exposes the duplicate-row bug in `upsertLeaveBalance`. Adding this test would catch the B7 regression. |

#### From Phase 2 SIS

| Gap | Priority | Description |
|-----|----------|-------------|
| **SIS role permission enforcement** | HIGH | `sis.test.ts` tests only that unauthenticated users are blocked. There is no test that `student` cannot call `grades.enter`, that `teacher` cannot call `scholarships.programs.create`, or that `parent` cannot call `attendance.bulkMark`. |
| **`attendance.mark` procedure existence** | HIGH | `sis.test.ts` asserts a procedure `attendance.mark` exists, but the actual procedure is `attendance.bulkMark`. The test passes due to a duck-type check. |
| **Enrollment workflow** | MEDIUM | No test for `enrollments.enroll` → `enrollments.updateStatus` transitions or that duplicate enrollment for the same student/year is blocked. |
| **Scholarship award workflow** | MEDIUM | No test for the `applied → under_review → shortlisted → awarded` transition sequence or that invalid transitions are rejected. |
| **i18n key completeness at runtime** | LOW | `sis.test.ts` checks top-level key parity across language files but does not verify nested key completeness or that `useTranslation()` returns non-empty strings for all keys. |

### Recommended Additional Tests (15 specific cases)

Add these to `server/routers.test.ts` and `server/sis.test.ts`:

**`server/routers.test.ts` additions (8 tests):**

```
1. "leave.approve increments casualUsed in leaveBalances"
   — approve a casual leave, then call leave.getBalance, assert casualUsed > 0

2. "leave.submitLeave rejects when numberOfDays mismatches date range"
   — submit with startDate=today, endDate=today+1, numberOfDays=10
   — assert TRPC BAD_REQUEST

3. "transfers.rejectByBranch is accessible to branch_head"
   — call rejectByBranch as branch_head role, assert does not throw FORBIDDEN

4. "transfers.rejectByBranch is blocked for teacher"
   — call rejectByBranch as teacher role, assert throws FORBIDDEN

5. "leave.setBalance is blocked for principal role"
   — call setBalance as principal, assert FORBIDDEN

6. "leave.setBalance succeeds for zonal_director role"
   — call setBalance as zonal_director, assert success

7. "upsertLeaveBalance does not create duplicate rows for same staffId+year"
   — upsert twice for same (staffId, year), assert row count = 1  [exposes B7]

8. "leave.approve on a rejected request returns BAD_REQUEST"
   — approve a leave that is already rejected, assert BAD_REQUEST or NOT_FOUND
```

**`server/sis.test.ts` additions (7 tests):**

```
9.  "student role cannot call studentGrades.enter"
    — call as student, assert FORBIDDEN

10. "teacher cannot call scholarships.programs.create"
    — call as teacher, assert FORBIDDEN

11. "parent cannot call attendance.bulkMark"
    — call as parent, assert FORBIDDEN

12. "attendance.bulkMark (not attendance.mark) procedure exists"
    — assert caller.attendance.bulkMark is a function [fix existing wrong assertion]

13. "enrollments.enroll rejects duplicate studentId+academicYear combination"
    — enroll same student twice for same year, assert BAD_REQUEST

14. "scholarships.applications.review rejects invalid status transition"
    — attempt to move directly from 'applied' to 'awarded', assert BAD_REQUEST

15. "studentGrades.enter rejects obtainedMarks > maxMarks"
    — enter grade with obtainedMarks=105 and maxMarks=100, assert BAD_REQUEST
```

> **Note on test 7:** This test will currently fail if B7 is not fixed first, which is the correct behaviour — it serves as a regression guard for the fix.

---

## 4. Development Plan (AGENTS.md) Discrepancies

These discrepancies exist between AGENTS.md claims and the actual codebase:

| # | AGENTS.md Claim | Actual State | Severity |
|---|----------------|--------------|----------|
| A1 | "23 tables" in schema section | Schema has 21 tables — `reportCards` and `parentStudentLinks` are missing | **Major** |
| A2 | B7 marked complete: "unique per `staffId`+`year`" | `drizzle/schema.ts:189–203` has no `unique()` constraint | **Critical** |
| A3 | "79 tests" — accurate count, listed as milestone | Accurate count but misleading — no business logic tests for B1, B3, B6, or B8 fixes | Minor |
| A4 | Phase 2 todo.md all 24 items `[x]` | 2 schema tables and their associated tRPC procedures were never built; `reportCards` and `parentStudentLinks` have no backend | **Major** |
| A5 | i18n listed as complete with "SIS page string translations" | SIS page component strings (form labels, button text) are hardcoded English; only nav/common keys use `t()` | Minor |

**Recommended AGENTS.md corrections:**

1. Update schema table count from 23 to 21 (or to 23 once missing tables are added)
2. Remove the B7 "fixed" checkmark until the schema migration is pushed
3. Add a note to the test count: "79 tests; business logic coverage is limited — see Phase 2 audit"
4. Mark `reportCards` and `parentStudentLinks` as deferred to Phase 3 in the todo

---

## 5. Railway Feasibility Summary

All 3 blocking issues identified in the original `docs/railway-feasibility.md` remain unresolved. No changes were made to deployment configuration files during Phase 2.

| Issue | Original Assessment | Current State |
|-------|--------------------|----|
| BLOCKING 1: No `railway.toml` | Must be created | ❌ Still missing |
| BLOCKING 2: No `.env.example` | Must be created | ❌ Still missing |
| BLOCKING 3: No `releaseCommand` for migrations | Needs `railway.toml` | ❌ Still missing |
| NR1: No `engines` in `package.json` | Recommended | ❌ Still missing |
| NR3: No plain `GET /api/health` | Recommended | ❌ Still missing |

**Phase 2 does not introduce any new Railway compatibility issues.** The SIS module uses the same Express/tRPC/MySQL stack. The additional 6 schema tables will be handled by the existing `pnpm db:push` release command once `railway.toml` is created.

**One new deployment consideration from Phase 2:**

The missing `reportCards` and `parentStudentLinks` tables mean that `pnpm db:push` reflects only the 21 tables in the schema. If these tables are added in Phase 3, the next `db:push` will be a non-destructive addition — no data migration required.

See `docs/railway-feasibility.md` Section 10 (Phase 2 Status Update) for the complete updated assessment.

---

## 6. Prioritized Action Plan

### Tier 1 — Fix Before Any Real Users (Data Integrity + Deployment)

| # | Issue | Effort | File(s) |
|---|-------|--------|---------|
| T1-1 | **B7: Add unique constraint to `leaveBalances(staffId, year)`** | 5 min | `drizzle/schema.ts` + new migration |
| T1-2 | **Create `railway.toml`** | 15 min | project root |
| T1-3 | **Create `.env.example`** | 10 min | project root |
| T1-4 | **Add `GET /api/health` endpoint** | 5 min | `server/_core/index.ts` |
| T1-5 | **Add `"engines": { "node": ">=20.0.0" }` to `package.json`** | 2 min | `package.json` |

### Tier 2 — Fix Before Phase 3 Begins (Schema Completeness + Test Integrity)

| # | Issue | Effort | File(s) |
|---|-------|--------|---------|
| T2-1 | Add `reportCards` table to schema | 30 min | `drizzle/schema.ts` + migration |
| T2-2 | Add `parentStudentLinks` table + ownership filtering in SIS queries | 1–2 hr | `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts` |
| T2-3 | Fix `attendance.mark` assertion in `sis.test.ts` (P2-P1 test bug) | 5 min | `server/sis.test.ts` |
| T2-4 | Add 8 missing tests to `routers.test.ts` (leave balance, date validation, rejectByBranch, setBalance) | 2–3 hr | `server/routers.test.ts` |
| T2-5 | Add 7 missing tests to `sis.test.ts` (role enforcement, workflow transitions) | 2–3 hr | `server/sis.test.ts` |
| T2-6 | Add DB indexes on SIS tables (`attendanceRecords`, `enrollments`, `grades`) | 30 min | `drizzle/schema.ts` + migration |

### Tier 3 — Before Production (Quality + Completeness)

| # | Issue | Effort | File(s) |
|---|-------|--------|---------|
| T3-1 | Apply `useTranslation()` to SIS page strings (P2-I1) | 3–4 hr | All SIS page `.tsx` files |
| T3-2 | Add per-date attendance view in StudentProfile (P2-F2) | 2 hr | `client/src/pages/StudentProfile.tsx` |
| T3-3 | Add scholarship stage-transition validation (P2-P2) | 1 hr | `server/routers.ts` |
| T3-4 | Add `absentByDefault` flag for bulk attendance (P2-P3) | 2 hr | `server/routers.ts`, `client/src/pages/Attendance.tsx` |
| T3-5 | Add subject name to grades (P2-F3) — free-text or `subjects` table | 1–4 hr | `drizzle/schema.ts`, `server/db.ts`, `client/src/pages/Grades.tsx` |
| T3-6 | Correct AGENTS.md discrepancies (A1–A5) | 30 min | `AGENTS.md` |

### Deferred to Phase 3

- PWA: service worker, IndexedDB, background sync, manifest (original Phase 1 deferral)
- WCAG 2.1 AA accessibility audit
- Parent portal (blocked by `parentStudentLinks` implementation)
- Report card generation (blocked by `reportCards` table)
- Digital workflow engine (Camunda/Flowable consideration)
- Email/SMS notification channels (currently in-app only)

---

*This audit covers the codebase as of the review date. Line numbers and file references are valid at HEAD of `claude/p2audit-8JsDJ`. Verify against current file state before acting on findings.*
