# Phase 1 Verification Audit — ZEO Embilipitiya Digital Platform

> **Audit Date:** 2026-02-28
> **Method:** Static code analysis of the codebase at HEAD of `claude/phase1-audit-railway-check-dtDgW`
> **Auditor:** Claude Code (claude-sonnet-4-6)

---

## Executive Summary

Phase 1 of the ZEO Embilipitiya Digital Platform has been declared "complete" in `AGENTS.md`, but a full audit reveals a **partially complete build with significant gaps**. The foundation is genuinely solid — 15 database tables, 10 RBAC roles, 30+ granular permissions, a full tRPC router, and 14 rendered pages — but the application is not production-ready and several features labelled as complete are either placeholders or contain critical bugs.

**Key findings at a glance:**

| Category | Status |
|----------|--------|
| Database schema | ✅ Complete (15 tables) |
| RBAC permission matrix | ✅ Complete (10 roles, 30+ permissions) |
| tRPC router coverage | ✅ Complete (all modules) |
| Security (permission enforcement) | ❌ 4 procedures unguarded |
| Business logic (leave workflow) | ❌ Balance not updated on approval |
| Action forms (staff, leave, transfer…) | ❌ All 7 are "coming soon" placeholders |
| Pagination on list views | ❌ Missing — will fail at scale |
| PWA (service worker, manifest) | ❌ 0 of 4 items done |
| i18n (i18next, translations) | ❌ 0 of 4 items done (only fonts) |
| Test coverage | ⚠️ 25 tests — RBAC + 1 logout; no router or workflow tests |

**The most urgent issues** (data integrity and security) must be fixed before this application handles any real users:
1. Three unguarded tRPC procedures expose user data and analytics to all roles
2. Leave approval does not update leave balances, causing permanent silent data corruption
3. No input validation on leave date ranges

---

## 1. Documentation Inconsistencies

The following contradictions exist between the documentation and the actual codebase:

| # | Claim | Source | Actual State | Severity |
|---|-------|--------|--------------|----------|
| D1 | "Phase 1 build complete" | `AGENTS.md` changelog (2026-03-01) | ~15 todo items are unchecked or placeholder; 4 security gaps; no PWA | **Critical** |
| D2 | "8 hierarchical roles" | `README.md` | 10 roles implemented (`admin`, `user` added on top of 8) | Minor |
| D3 | "PWA with offline-first capabilities" | `README.md` | Zero PWA features delivered; no service worker, no manifest, no IndexedDB | Major |
| D4 | "multi-language support (Sinhala, Tamil, English)" | `README.md` Phase 1 scope | Only Google Fonts loaded; no i18next, no translations, no language switcher | Major |
| D5 | "role-based middleware for tRPC procedures" | `AGENTS.md` | `requirePermission` accepts `string`, not `Permission` type; 3 procedures bypass it entirely | Major |
| D6 | "25 tests passing" | `AGENTS.md` | Accurate count, but coverage is limited to RBAC matrix + 1 cookie test | Minor |

**Recommendation:** Update `AGENTS.md` — change the changelog entry from "Phase 1 build complete" to reflect the current state. This is important for any future AI agent or developer picking up this codebase.

---

## 2. Implementation Coverage Matrix

Mapped against `todo.md`:

### Project Setup
| Item | Status |
|------|--------|
| README, LICENSE, AGENTS.md | ✅ Done |
| Global theming (dark/light mode) | ✅ Done |
| DashboardLayout customization | ✅ Done |

### Database Schema
| Item | Status |
|------|--------|
| All 11 schema items | ✅ Done |
| Database migrations pushed | ✅ Done |

### Core Infrastructure — RBAC
| Item | Status |
|------|--------|
| Role definitions (10 roles) | ✅ Done |
| Permission matrix (30+ perms) | ✅ Done |
| Role-based middleware | ⚠️ Partial — type-unsafe; 3 procedures bypass it |
| Audit logging for mutations | ✅ Done |
| Admin user management UI | ✅ Done |
| Role hierarchy system | ✅ Done |

### Authentication & User Management
| Item | Status |
|------|--------|
| Manus OAuth integration | ✅ Done (pre-built) |
| Session management | ✅ Done (pre-built) |
| User profile in sidebar | ✅ Done |
| **Role assignment form** | ❌ Placeholder — "coming soon" |

### HRM Module
| Item | Status |
|------|--------|
| Staff database with search | ✅ Done (list + search) |
| Staff Directory page | ✅ Done (read-only) |
| Service record table and queries | ✅ Done |
| Leave management system (logic) | ⚠️ Partial — approval doesn't update balances |
| Leave Management page (approve/reject) | ✅ Done |
| Transfer request workflow (logic) | ✅ Done |
| Transfers page with workflow viz | ✅ Done |
| Professional development table | ✅ Done |
| Professional Development page | ⚠️ Placeholder only |
| **Staff creation/edit form** | ❌ Placeholder — "coming soon" |
| **Leave application form** | ❌ Placeholder — "coming soon" |
| **Transfer request form** | ❌ Placeholder — "coming soon" |

### Communication Hub
| Item | Status |
|------|--------|
| Announcements system | ✅ Done |
| Announcements page | ✅ Done (read-only list) |
| Notification system (in-app) | ✅ Done (infrastructure only — nothing triggers it) |
| Notifications page | ✅ Done |
| Secure messaging (threads) | ✅ Done |
| Messages page | ✅ Done |
| Notification bell with unread count | ✅ Done |
| **Announcement creation form** | ❌ Placeholder — "coming soon" |
| **Message compose form** | ❌ Placeholder — "coming soon" |

### Organization
| Item | Status |
|------|--------|
| Schools page | ✅ Done (read-only) |
| Departments page | ⚠️ Placeholder only |
| **School registration form** | ❌ Placeholder — "coming soon" |

### PWA & Offline Support
| Item | Status |
|------|--------|
| Service worker registration | ❌ Not started |
| Offline-first data caching (IndexedDB) | ❌ Not started |
| Background sync for form submissions | ❌ Not started |
| PWA manifest and install prompt | ❌ Not started |

### Multi-Language Support (i18n)
| Item | Status |
|------|--------|
| Multi-script font loading | ✅ Done |
| i18next framework integration | ❌ Not started |
| Sinhala translations | ❌ Not started |
| Tamil translations | ❌ Not started |
| Language switcher component | ❌ Not started |

### Analytics Foundation
| Item | Status |
|------|--------|
| Real-time KPI dashboard | ✅ Done |
| Staff distribution by designation | ✅ Done |
| Leave by type breakdown | ✅ Done |
| Analytics Dashboard page | ✅ Done |
| Dashboard home with stat cards | ✅ Done |

### Workflow Engine
| Item | Status |
|------|--------|
| Transfer request workflow | ✅ Done |
| Leave approval workflow | ⚠️ Partial — balance not updated |
| Digital workflow engine (future) | Deferred |

### Audit & Compliance
| Item | Status |
|------|--------|
| Audit log table + queries | ✅ Done |
| Audit log creation on mutations | ✅ Done |
| Audit Log page | ✅ Done |

### Accessibility & Responsiveness
| Item | Status |
|------|--------|
| Mobile-first responsive design | ✅ Done |
| Keyboard navigation support | ✅ Done |
| WCAG 2.1 AA compliance audit | ❌ Not done |

### Testing & Deployment
| Item | Status |
|------|--------|
| Vitest RBAC permission tests (24) | ✅ Done |
| Auth logout test (1) | ✅ Done |
| Push to GitHub | ❌ Not done |
| Save checkpoint | ❌ Not done |

---

## 3. Security Findings

### S1 — HIGH: `requirePermission` accepts loose `string` type

**Location:** `server/routers.ts` line 12

```typescript
// Current (unsafe):
function requirePermission(permission: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!hasPermission(userRole, permission as any)) { // <-- `as any` cast
```

**Impact:** TypeScript cannot catch invalid or misspelled permission strings at compile time. A typo in any call to `requirePermission("stafft:view_all")` silently grants full access (because `hasPermission` will return `false` for an unknown permission string, but the procedure still runs — wait, actually it throws `FORBIDDEN`). More accurately: the type signature misleads future developers and defeats the purpose of having a `Permission` type union.

**Fix:**
```typescript
import type { Permission } from "@shared/permissions";

function requirePermission(permission: Permission) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!hasPermission(userRole, permission)) { // no cast needed
```

---

### S2 — HIGH: `analytics.overview` has no permission guard

**Location:** `server/routers.ts` line 522

```typescript
// Current (unsafe):
analytics: router({
  overview: protectedProcedure.query(async () => {
    // Returns: staffCount, schoolCount, pendingLeaves, pendingTransfers,
    //          announcementCount, staffByDesignation, leaveByType
  }),
}),
```

**Impact:** Any authenticated user — including `parent`, `student`, and `user` (the lowest role) — can query zone-wide operational statistics. This data includes pending leave counts and staff distribution breakdowns that should be restricted to management roles.

**Fix:** Replace `protectedProcedure` with `requirePermission(PERMISSIONS.ANALYTICS_VIEW_SCHOOL)`. The minimum role with this permission is `isa` (hierarchy level 60).

---

### S3 — HIGH: `users.getById` has no permission guard

**Location:** `server/routers.ts` line 59

```typescript
// Current (unsafe):
getById: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return db.getUserById(input.id);
  }),
```

**Impact:** Any authenticated user can enumerate all user records by iterating `id` values. Each record exposes: `name`, `email`, `role`, `schoolId`, `departmentId`, `preferredLanguage`, `isActive`, `createdAt`.

**Fix:** Add `requirePermission(PERMISSIONS.USERS_VIEW)`, OR restrict to own ID with an ownership check:
```typescript
getById: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ ctx, input }) => {
    if (ctx.user.id !== input.id && !hasPermission(ctx.user.role as ZeoRole, PERMISSIONS.USERS_VIEW)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getUserById(input.id);
  }),
```

---

### S4 — HIGH: `professionalDev.create` has no permission guard

**Location:** `server/routers.ts` line 386

```typescript
// Current (unsafe):
create: protectedProcedure.input(
  z.object({
    staffId: z.number(),    // <-- accepts any staffId
    programName: z.string().min(1),
    // ...
  })
).mutation(async ({ ctx, input }) => {
  const id = await db.createProfessionalDevelopment(input as any);
```

**Impact:** Any authenticated user (including `parent`, `student`, `user`) can write professional development records to any staff member's profile. No validation that the caller owns or manages the target `staffId`.

**Fix:** Add `requirePermission(PERMISSIONS.SERVICE_MANAGE)`. For self-service (teachers recording their own training), add ownership check: `staffId` must match the caller's own staff profile ID.

---

### S5 — MEDIUM: Role escalation not prevented in `users.updateRole`

**Location:** `server/routers.ts` lines 52–58

**Impact:** Any user with `USERS_ASSIGN_ROLES` permission (currently: `admin`, `zonal_director`) can assign *any* role to any user, including `admin`. A `zonal_director` could escalate another user to `admin`, granting system-wide access they themselves don't have.

**Fix:** Add a hierarchy check — the assigning user's role must be higher than or equal to the role being assigned:
```typescript
const assignerHierarchy = ROLE_HIERARCHY[ctx.user.role as ZeoRole];
const targetHierarchy = ROLE_HIERARCHY[input.role as ZeoRole];
if (assignerHierarchy <= targetHierarchy && ctx.user.role !== "admin") {
  throw new TRPCError({ code: "FORBIDDEN", message: "Cannot assign a role equal or higher than your own" });
}
```

---

### S6 — MEDIUM: `listStaffProfiles` search — wildcard resource exhaustion

**Location:** `server/db.ts` lines 142–146

```typescript
if (filters?.search) {
  conditions.push(or(
    like(staffProfiles.fullName, `%${filters.search}%`),
    like(staffProfiles.nic, `%${filters.search}%`),
    like(staffProfiles.designation, `%${filters.search}%`),
  )!);
}
```

**Impact:** Drizzle ORM uses parameterized queries, so SQL injection is not a risk. However, a `search` value of `"%"` or `"_"` matches every row and forces a full table scan across three columns on a table projected to have 5,000+ rows. A single such request can cause server-wide slowdown. MySQL's LIKE pattern matching is not indexed for leading wildcards.

**Fix (short-term):** Escape `%` and `_` in user input: `filters.search.replace(/[%_]/g, '\\$&')`. **Fix (long-term):** Use MySQL full-text search (`FULLTEXT` index + `MATCH ... AGAINST`) or implement server-side search with a minimum character limit.

---

## 4. Business Logic Gaps

### B1 — HIGH: Leave approval does not update leave balances

**Location:** `server/routers.ts` lines 267–281 (leave `approve` mutation)

The `approve` mutation calls `db.updateLeaveRequest(...)` to set the status to `approved`, but **never calls `db.upsertLeaveBalance(...)`** to increment the `casualUsed`, `sickUsed`, or `annualUsed` fields.

**Impact:** The `leaveBalances` table is permanently stale. `leave.getBalance` returns incorrect data. A teacher can submit unlimited leave requests regardless of actual entitlement. This is silent data corruption — no error is thrown, but the data is wrong.

**Fix:** After setting status to `approved`, read the leave request's `leaveType` and `numberOfDays`, then increment the appropriate `*Used` field:
```typescript
const leaveRecord = await db.getLeaveRequestById(input.id);
const currentYear = new Date().getFullYear();
const balance = await db.getLeaveBalance(leaveRecord.staffId, currentYear);
// Increment the correct field based on leaveRecord.leaveType
await db.upsertLeaveBalance({ ...balance, casualUsed: balance.casualUsed + leaveRecord.numberOfDays });
```

---

### B2 — HIGH: No leave balance check before submitting

**Location:** `server/routers.ts` lines 247–265 (leave `submit` mutation)

No balance check is performed before `createLeaveRequest`. The submission always succeeds regardless of remaining entitlement.

**Fix:** In `submit`, fetch the current year's leave balance for the staff member and check if the requested `numberOfDays` exceeds the remaining entitlement for that leave type. Throw `BAD_REQUEST` if insufficient.

---

### B3 — HIGH: `numberOfDays` not validated against date range

**Location:** `server/routers.ts` leave `submit` input schema

The `numberOfDays: z.number().min(1)` input is accepted without verifying it matches `endDate - startDate`. A user can submit a 30-day leave spanning 2 calendar days, or a 1-day leave for a 30-day period.

**Fix:** Compute the expected number of calendar days from the date range and validate:
```typescript
const expectedDays = Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / 86400000) + 1;
if (Math.abs(expectedDays - input.numberOfDays) > 1) { // tolerance of 1 for edge cases
  throw new TRPCError({ code: "BAD_REQUEST", message: "Number of days does not match date range" });
}
```

---

### B4 — MEDIUM: No notifications on leave approve/reject

**Location:** `server/routers.ts` leave `approve` and `reject` mutations

The `notifications` table, `createNotification` db function, and `leave_update` notification type all exist but are never called from the leave approval mutations. Staff receive no feedback when their leave status changes.

**Fix:** After each status change, look up the leave request, find the staff member's `userId`, and create a notification:
```typescript
const staffProfile = await db.getStaffProfileById(leave.staffId);
await db.createNotification({
  userId: staffProfile.userId,
  title: "Leave Request Updated",
  content: `Your ${leave.leaveType} leave from ${leave.startDate} has been ${newStatus}.`,
  type: "leave_update",
  channel: "in_app",
});
```

---

### B5 — MEDIUM: No notifications on transfer status changes

**Location:** `server/routers.ts` transfer `recommend`, `review`, `approve`, `reject` mutations

Same gap as B4. The `transfer_update` notification type is defined but never triggered. Teachers submit transfer requests and receive no updates when principals recommend, branch heads review, or the ZD approves/rejects.

**Fix:** Same pattern as B4 — create a notification for the teacher (`staffProfile.userId`) after each status change.

---

### B6 — MEDIUM: Branch head cannot reject a transfer at their stage

**Location:** `server/routers.ts` line 366

```typescript
reject: requirePermission(PERMISSIONS.TRANSFER_APPROVE).input(...)
```

`branch_head` has `TRANSFER_REVIEW` permission but **not** `TRANSFER_APPROVE`. This means a branch head cannot reject a transfer that has been recommended by a principal. The workflow can only move forward at the branch head stage; rejection requires escalation to the Zonal Director.

**Fix:** Allow rejection by either `TRANSFER_APPROVE` or `TRANSFER_REVIEW`. Track which stage the rejection occurred at with a distinct status (e.g., `rejected_by_branch`):
```typescript
reject: protectedProcedure.use(({ ctx, next }) => {
  const canReject = hasAnyPermission(ctx.user.role as ZeoRole, [
    PERMISSIONS.TRANSFER_APPROVE, PERMISSIONS.TRANSFER_REVIEW
  ]);
  if (!canReject) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
}).input(z.object({ id: z.number(), comment: z.string().optional() }))
```

---

### B7 — LOW: `leaveBalances` missing unique constraint on `(staffId, year)`

**Location:** `drizzle/schema.ts` lines 188–203

The `upsertLeaveBalance` function uses `onDuplicateKeyUpdate` which requires a unique key on `(staffId, year)`, but no such constraint is defined in the schema. If the actual database table does not have this unique index, the upsert inserts duplicate rows, causing `getLeaveBalance` to return the first (not latest) record.

**Fix:** Add a composite unique index to the `leaveBalances` table definition:
```typescript
export const leaveBalances = mysqlTable("leave_balances", {
  // ...existing columns
}, (table) => ({
  staffYearUnique: unique().on(table.staffId, table.year),
}));
```

---

### B8 — LOW: Leave balance management not exposed via tRPC

**Location:** `server/db.ts` line 230, `server/routers.ts` leave router

`upsertLeaveBalance` exists in `db.ts` but there is no tRPC procedure to set or adjust leave balances. HR/Admin cannot initialize yearly entitlements or make corrections without direct database access.

**Fix:** Add a `leave.setBalance` procedure protected by `LEAVE_APPROVE_ZONE`:
```typescript
setBalance: requirePermission(PERMISSIONS.LEAVE_APPROVE_ZONE).input(
  z.object({ staffId: z.number(), year: z.number(), casualTotal: z.number(), sickTotal: z.number(), annualTotal: z.number() })
).mutation(async ({ input }) => {
  await db.upsertLeaveBalance(input as any);
  return { success: true };
}),
```

---

### B9 — LOW: Transfer cards display school IDs not names

**Location:** `client/src/pages/Transfers.tsx` lines 104–105

```tsx
<span>From School #{t.currentSchoolId}</span>
{t.requestedSchoolId && <span>To School #{t.requestedSchoolId}</span>}
```

Users see "From School #3" rather than the school name. The `schools` table is populated and `listSchools` is available.

**Fix:** Either join school names in the `listTransferRequests` DB query, or add a client-side lookup using the `schools.list` tRPC query.

---

## 5. Frontend / UX Gaps

### F1 — HIGH: No pagination on any list view

**Affected:** Staff Directory, Leave Management, Transfers, Announcements, Schools, Audit Log

The `listStaffProfiles`, `listLeaveRequests`, `listTransferRequests`, `listAnnouncements` DB functions return unbounded result sets (no `LIMIT`/`OFFSET`). With the stated scale of 5,000+ teachers and 200+ schools:

- A single `staff.list` query returns 5,000+ rows in one HTTP response
- The client renders all rows into the DOM simultaneously
- This causes: server memory pressure, slow network transfer, browser rendering freeze

**Fix:** Add `limit` and `offset` (or cursor-based pagination) to all list DB functions and tRPC inputs. Minimum: add `limit: 50` default with a `page` or `cursor` param. Consider virtual scrolling in the UI.

---

### F2 — HIGH: All action forms are "coming soon" placeholders

**Affected (7 forms):**

| Form | Location | Code Evidence |
|------|----------|---------------|
| Add Staff | `StaffDirectory.tsx:26` | `onClick={() => toast("Staff creation form coming soon")` |
| Apply Leave | `LeaveManagement.tsx:58` | `onClick={() => toast("Leave application form coming soon")` |
| Request Transfer | `Transfers.tsx:58` | `onClick={() => toast("Transfer request form coming soon")` |
| Create Announcement | `Announcements.tsx` | Same pattern |
| Compose Message | `Messages.tsx` | Same pattern |
| Register School | `Schools.tsx` | Same pattern |
| Assign Role | `UserManagement.tsx` | Same pattern |

**Impact:** The application is read-only for almost all roles. Teachers, principals, and branch heads cannot perform their primary tasks. The backend tRPC procedures for all these actions **are implemented** — only the frontend forms are missing.

---

### F3 — MEDIUM: No staff detail / profile page

Only a list view exists. There is no page to view a staff member's full profile, service history, or leave history. The "View" button in `StaffDirectory.tsx:91` calls `toast("Staff detail view coming soon")`.

---

### F4 — MEDIUM: No announcement detail view

`announcements.getById` is implemented in the router and marks announcements as read, but no page calls it. The full content of an announcement is never displayed; only truncated list items.

---

### F5 — MEDIUM: No error state handling

If a tRPC query fails (network error, server error, permission error), pages show only a loading spinner or empty state. No error message is shown to the user. Every page should handle `isError` states from tRPC queries.

---

### F6 — LOW: Search missing on most list pages

Search is only implemented on the Staff Directory. Leave, Transfers, Announcements, and Schools pages have no search or filter controls.

---

### F7 — LOW: Schools page doesn't show principal assignment

The `schools` table has a `principalId` column, and the `schools.list` query returns this field, but the Schools page UI doesn't display whether a principal is assigned to each school.

---

## 6. Test Coverage Analysis

### Current State

| File | Tests | What is Covered |
|------|-------|----------------|
| `server/permissions.test.ts` | 24 | RBAC matrix (pure data structure) |
| `server/auth.logout.test.ts` | 1 | Cookie clearing on logout |
| **Total** | **25** | **RBAC data + 1 cookie** |

### Coverage Gap

The 24 existing permission tests only verify `shared/permissions.ts` — a static data structure. No server logic, database interaction, or HTTP behavior is tested. The test suite gives a misleading sense of coverage.

**Zero tests exist for:**
- tRPC router procedure access control (that `requirePermission` actually blocks)
- Any database query function in `server/db.ts`
- Leave workflow state transitions
- Transfer workflow state transitions
- Notification creation logic
- Leave balance updates
- Date range validation
- Frontend components

### Recommended Tests to Add

| Category | Priority | Specific Test Cases |
|----------|----------|---------------------|
| **Router permission enforcement** | HIGH | `analytics.overview` rejects `parent`, `student`, `user` roles; `users.getById` rejects unauthenticated; `professionalDev.create` rejects unauthorized |
| **Leave workflow** | HIGH | Submit leave → approve → assert `leaveBalance.casualUsed` incremented; submit with insufficient balance → expect BAD_REQUEST; submit with mismatched `numberOfDays` → expect BAD_REQUEST |
| **Transfer workflow** | HIGH | State transition: `pending` → `recommend` → `review` → `approve`; `reject` by branch head blocked (currently); each step creates audit log |
| **Notification creation** | MEDIUM | Leave approve triggers notification for staff; message `send` creates notifications for other participants |
| **DB query helpers** | MEDIUM | `listStaffProfiles` filters by `schoolId`; `getLeaveBalance` returns 0 for unknown staff |
| **Error cases** | MEDIUM | NOT_FOUND when updating non-existent leave request; FORBIDDEN for wrong role |

**Recommended:** Add 20–30 additional Vitest tests covering the above. Use the existing pattern in `server/auth.logout.test.ts` (creating a mock context with `appRouter.createCaller(ctx)`) for router integration tests.

---

## 7. Prioritized Action Plan

### Tier 1 — Fix Before Any Real Users (Security / Data Integrity)

1. **S2** — Add permission guard to `analytics.overview` _(1 line change)_
2. **S3** — Add permission guard or ownership check to `users.getById` _(3–5 lines)_
3. **S4** — Add permission guard to `professionalDev.create` _(1 line change)_
4. **S1** — Fix `requirePermission` to use `Permission` type _(2 line change)_
5. **B1** — Implement leave balance deduction on approval _(~15 lines)_
6. **B2** — Add balance check before leave submission _(~10 lines)_
7. **B3** — Validate `numberOfDays` against date range _(~8 lines)_
8. **B7** — Add unique constraint on `leaveBalances(staffId, year)` in schema + re-migrate _(5 lines)_

### Tier 2 — Fix Before Beta (Core Functionality)

9. **F1** — Add pagination to all list views _(significant, affects db.ts, routers.ts, and all list pages)_
10. **F2** — Implement the 7 placeholder forms (prioritize: leave application, staff creation, announcement creation)
11. **B6** — Allow branch head to reject transfers at their stage
12. **B4/B5** — Add notifications on leave/transfer status changes (~20 lines each)
13. **B8** — Expose `leaveBalance` management via tRPC
14. **S5** — Add role escalation prevention in `updateUserRole`
15. **B9** — Join school names in transfer queries

### Tier 3 — Before Production (Quality / Completeness)

16. **F3** — Add staff detail/profile page
17. **F4** — Add announcement detail view
18. **F5** — Add error state handling to all pages
19. **F6/F7** — Add search to remaining list pages; show principal assignment on Schools page
20. **Tests** — Add ~20 tests for router permissions, leave workflow, transfer workflow
21. **Docs** — Update `AGENTS.md` changelog; fix README role count (8 → 10)

### Deferred to Phase 2

- PWA: service worker, IndexedDB, background sync, manifest
- i18n: i18next integration, Sinhala/Tamil translations, language switcher
- WCAG 2.1 AA compliance audit
- Digital workflow engine (Camunda/Flowable)
- Transfer `reject` by branch head with distinct status

---

*This audit covers the codebase as of the review date. Line numbers reference the current HEAD of the branch. If the codebase has been modified since, verify findings against current file state.*
