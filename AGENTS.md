# AGENTS.md

> This is a living document. It must be updated after every major implementation, change, or edit to the project. It serves as the primary context file for any AI agent working on this codebase.

## Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | ZEO Embilipitiya Digital Platform |
| **Repository** | [RajanthaR/1-manus-zeo-platform](https://github.com/RajanthaR/1-manus-zeo-platform) |
| **Author** | Rajantha R Ambegala (rajantha.rc@gmail.com) |
| **License** | Proprietary — All Rights Reserved |
| **Target ZEO** | Embilipitiya, Ratnapura District, Sabaragamuwa Province, Sri Lanka |

## Architecture Overview

The platform is a Progressive Web App (PWA) built on the Manus web-db-user scaffold. It uses React 19 + Tailwind CSS 4 + Express + tRPC 11 with MySQL/TiDB as the database via Drizzle ORM. Authentication is handled by Manus OAuth. Internationalization is powered by i18next with Sinhala, Tamil, and English support.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS 4, Shadcn/UI, wouter (routing) |
| Backend | Node.js, Express 4, tRPC 11, Superjson |
| Database | MySQL/TiDB via Drizzle ORM |
| Auth | Manus OAuth with JWT sessions |
| State | TanStack React Query (via tRPC) |
| i18n | i18next + react-i18next (en, si, ta) |
| Testing | Vitest |
| Fonts | Inter, Noto Sans Sinhala, Noto Sans Tamil (Google Fonts) |

### Key Files

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` | All database table definitions (30 tables) |
| `shared/permissions.ts` | RBAC permissions (41 permissions), role matrix, hierarchy, display names |
| `server/db.ts` | Database query helpers (137 functions) |
| `server/routers.ts` | tRPC procedure definitions (all modules: HRM, SIS, Finance, Supervision) |
| `client/src/App.tsx` | Routes and layout (28 routes) |
| `client/src/components/DashboardLayout.tsx` | Sidebar navigation with role-based filtering (HRM, SIS, Finance, Supervision, Communication, Admin) |
| `client/src/components/LanguageSwitcher.tsx` | Language switcher (EN/SI/TA) |
| `client/src/i18n/` | Translation files (en.json, si.json, ta.json) |
| `client/src/pages/` | Page components (29 pages) |
| `todo.md` | Development checklist |

## Role Hierarchy (RBAC)

The platform implements 10 hierarchical roles with 51+ granular permissions:

| Role | Hierarchy | Key Permissions |
|------|-----------|----------------|
| admin | 100 | All permissions (system-wide) |
| zonal_director | 90 | Zone-wide authority, all approvals, user management |
| deputy_director | 80 | Staff oversight, zone-level leave approval, transfer review |
| branch_head | 70 | Department management, transfer review and reject |
| isa | 60 | School supervision, staff view, announcements |
| principal | 50 | School-level leave approval, transfer recommendation, student management |
| teacher | 40 | Self-service HR, leave/transfer applications, attendance marking, grade entry |
| parent | 20 | Announcements, messaging, view child profile/grades/attendance |
| student | 10 | Announcements, notifications (read-only) |
| user | 0 | Minimal access (announcements, notifications) |

> Note: The Deputy Director position at ZEO Embilipitiya is titled "Deputy Director (Development)", not "Deputy Director (Education)".

### Permission Middleware Pattern
```typescript
// In server/routers.ts — uses typed Permission enum
const requirePermission = (permission: Permission) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!hasPermission(ctx.user.role as ZeoRole, permission))
      throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx });
  });
```

### Role Escalation Prevention
```typescript
// users.assignRole checks hierarchy before allowing assignment
if (ROLE_HIERARCHY[targetRole] >= ROLE_HIERARCHY[ctx.user.role as ZeoRole]) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Cannot assign role >= own level" });
}
```

## Database Schema (30 Tables)

### Core & Auth
| Table | Purpose |
|-------|---------|
| `users` | Core auth with ZEO role enum (10 roles) |

### HRM Module
| Table | Purpose |
|-------|---------|
| `staffProfiles` | Staff details: NIC, designation, school, service dates |
| `serviceHistory` | Career records: appointments, promotions, transfers |
| `leaveRequests` | Leave applications with multi-level approval |
| `leaveBalances` | Annual leave entitlements by type (unique per staffId+year) |
| `transferRequests` | Transfer workflow: submit → recommend → review → approve |
| `professionalDevelopment` | Training and certification records |

### Organization
| Table | Purpose |
|-------|---------|
| `schools` | School registry with type, code, division, counts |

### Communication Hub
| Table | Purpose |
|-------|---------|
| `announcements` | Official notices with categories, priorities, audience |
| `announcementReads` | Read tracking per user per announcement |
| `notifications` | System notifications with type classification |
| `messageThreads` | Conversation threads |
| `threadParticipants` | Thread membership |
| `messages` | Individual messages within threads |

### Student Information System (SIS) — Phase 2
| Table | Purpose |
|-------|---------|
| `students` | Student profiles: demographics, parent info, medium, health |
| `enrollments` | Student-school-year-grade mapping with status tracking |
| `attendanceRecords` | Daily per-student attendance (present/absent/late/excused) |
| `grades` | Subject grades: assessment type, score, max score, term |
| `reportCards` | Term report cards with overall GPA and teacher/principal remarks |
| `scholarshipPrograms` | Scholarship programs: eligibility, amount, frequency |
| `scholarshipApplications` | Applications with status workflow (applied → reviewed → awarded/rejected) |
| `parentStudentLinks` | Parent-student relationship mapping for portal access |

### Finance & Procurement Module — Phase 3
| Table | Purpose |
|-------|--------|
| `budgets` | Fiscal year budgets with line items, status workflow (draft → submitted → approved/rejected) |
| `transactions` | Financial transactions (income/expenditure) linked to budgets |
| `salaryRecords` | Monthly salary records with gross/net pay, EPF/ETF/tax deductions |
| `purchaseRequisitions` | Procurement requests with item lists, cost estimates, approval workflow |
| `vendors` | Vendor registry with categories, contact info, active status |

### Supervision & QA Module — Phase 3
| Table | Purpose |
|-------|--------|
| `inspectionTemplates` | Configurable inspection form templates with scoring criteria |
| `inspections` | School inspection records with scheduling, scoring, and acknowledgment |
| `improvementPlans` | Post-inspection improvement plans with recommendations and progress tracking |
| `qualityScorecards` | Annual school quality scorecards with component scores and rankings |

### Audit
| Table | Purpose |
|-------|--------|
| `auditLogs` | Comprehensive audit trail with IP and metadata |

## Implemented Pages (28 Pages)

| Page | Route | Module | Status |
|------|-------|--------|--------|
| Dashboard | `/` | Overview — tabbed analytics (Overview/Finance/Quality), 6 stat cards, budget summary, inspection scores, Recharts charts, activity feed | Complete |
| Staff Directory | `/staff` | HRM — paginated, searchable, with Add Staff form | Complete |
| Staff Detail | `/staff/:id` | HRM — profile, service history, leave balances | Complete |
| Leave Management | `/leave` | HRM — application form, approve/reject, balance check | Complete |
| Transfers | `/transfers` | HRM — request form, 4-stage workflow, school names | Complete |
| Professional Dev | `/professional-dev` | HRM — training records, CPD tracking, certifications | Full CRUD with stats |
| Schools | `/schools` | Organization — registry with Add School form | Complete |
| Departments | `/departments` | Organization — full CRUD, staff-by-department view, branch head assignment, search, pagination | Complete |
| Student Directory | `/students` | SIS — paginated, searchable, with enrollment form | Complete |
| Student Profile | `/students/:id` | SIS — demographics, enrollment, attendance, grades tabs | Complete |
| Attendance | `/attendance` | SIS — bulk marking, daily summary by school | Complete |
| Grades | `/grades` | SIS — grade entry, listing by student/subject | Complete |
| Scholarships | `/scholarships` | SIS — program listing, application management | Complete |
| Announcements | `/announcements` | Communication — creation form, read tracking | Complete |
| Announcement Detail | `/announcements/:id` | Communication — full view with metadata | Complete |
| Messages | `/messages` | Communication — compose, thread view, user search | Complete |
| Notifications | `/notifications` | Communication — mark-read, unread badge | Complete |
| Analytics | `/analytics` | Admin — KPI charts, staff/leave breakdowns | Complete |
| Audit Log | `/audit` | Admin — paginated activity trail | Complete |
| User Management | `/user-management` | Admin — role assignment with escalation prevention | Complete |
| Budget Management | `/budgets` | Finance — budget creation, line items, status tracking | Complete |
| Transactions | `/transactions` | Finance — income/expenditure records, category filtering | Complete |
| Payroll | `/payroll` | Finance — salary records, monthly/yearly filtering | Complete |
| Procurement | `/procurement` | Finance — purchase requisitions + vendor management (tabs) | Complete |
| Inspections | `/inspections` | Supervision — schedule, submit reports, acknowledge | Complete |
| Improvement Plans | `/improvement-plans` | Supervision — create plans, track progress, mark complete | Complete |
| Quality Scorecards | `/scorecards` | Supervision — school quality metrics, component scores, grades | Complete |
| 404 Not Found | `/404` | Error — fallback for unknown routes | Complete |

## Security Measures Implemented

1. **S1:** `requirePermission()` uses typed `Permission` enum (not raw strings)
2. **S2:** `analytics.overview` gated by `ANALYTICS_VIEW_SCHOOL` permission
3. **S3:** `users.getById` requires `USERS_VIEW` permission
4. **S4:** `professionalDev.create` requires `STAFF_EDIT` permission
5. **S5:** Role escalation prevention — cannot assign role >= own hierarchy level
6. **S6:** Wildcard characters (`%`, `_`) escaped in LIKE patterns for search queries

## Business Logic Implemented

1. **B1:** Leave approval deducts days from `leaveBalances` table
2. **B2:** Leave submission checks available balance before allowing
3. **B3:** `numberOfDays` validated against actual date range
4. **B4:** Notifications sent on leave approve/reject
5. **B5:** Notifications sent on transfer status changes (recommend, review, approve, reject)
6. **B6:** Branch head can reject transfers at review stage
7. **B7:** Unique constraint on `leaveBalances(staffId, year)` prevents duplicates
8. **B8:** Leave balance management exposed via tRPC procedures
9. **B9:** School names joined in transfer queries (displays names, not IDs)

## Finance & Procurement Module (Phase 3)

### Finance Permissions (10 new)
| Permission | Description |
|------------|-------------|
| `BUDGET_VIEW` | View budget allocations and line items |
| `BUDGET_CREATE` | Create new budgets |
| `BUDGET_APPROVE` | Approve/reject budget submissions |
| `TRANSACTION_VIEW` | View financial transactions |
| `TRANSACTION_CREATE` | Record income/expenditure transactions |
| `SALARY_VIEW` | View salary records |
| `SALARY_MANAGE` | Create and manage salary records |
| `PROCUREMENT_VIEW` | View purchase requisitions |
| `PROCUREMENT_CREATE` | Create purchase requisitions |
| `VENDOR_VIEW` | View vendor registry |

### Finance Router Structure
```
finance:
  budgets:
    list, create, updateStatus
  transactions:
    list, create
  salary:
    list, create
  procurement:
    list, create, updateStatus
  vendors:
    list, create, update
```

## Supervision & QA Module (Phase 3)

### Supervision Permissions (7 new)
| Permission | Description |
|------------|-------------|
| `INSPECTION_VIEW` | View inspection records and templates |
| `INSPECTION_SCHEDULE` | Schedule new inspections |
| `INSPECTION_SUBMIT` | Submit inspection reports |
| `IMPROVEMENT_VIEW` | View improvement plans |
| `IMPROVEMENT_MANAGE` | Create and update improvement plans |
| `SCORECARD_VIEW` | View quality scorecards |
| `SCORECARD_MANAGE` | Create and update scorecards |

### Supervision Router Structure
```
supervision:
  templates:
    list, create
  inspections:
    list, schedule, submit, acknowledge
  plans:
    list, create, update
  scorecards:
    list, create
```

### Departments Router Structure
```
departments:
  list, listPaginated, create, getById, update, delete, staff
```

## SIS Module (Phase 2)

### SIS Permissions (11 new)
| Permission | Description |
|------------|-------------|
| `STUDENT_VIEW` | View student profiles and enrollment data |
| `STUDENT_CREATE` | Create new student records |
| `STUDENT_EDIT` | Edit student information |
| `ENROLLMENT_VIEW` | View enrollment records |
| `ENROLLMENT_MANAGE` | Enroll, transfer, or withdraw students |
| `ATTENDANCE_VIEW` | View attendance records |
| `ATTENDANCE_MARK` | Mark daily attendance |
| `GRADE_VIEW` | View grades and report cards |
| `GRADE_ENTER` | Enter or update grades |
| `SCHOLARSHIP_VIEW` | View scholarship programs and applications |
| `SCHOLARSHIP_MANAGE` | Create programs, review and award scholarships |

### SIS Router Structure
```
scholarships:
  programs:
    list, create
  applications:
    list, apply, review
students:
  list, create, getById
enrollments:
  list, enroll
attendance:
  mark, bulkMark, summary
studentGrades:
  list, enter
```

## i18n (Internationalization)

| Language | File | Status |
|----------|------|--------|
| English | `client/src/i18n/en.json` | Complete — all UI strings |
| Sinhala (සිංහල) | `client/src/i18n/si.json` | Complete — key UI strings |
| Tamil (தமிழ்) | `client/src/i18n/ta.json` | Complete — key UI strings |

- Language switcher in header bar (compact dropdown)
- Browser language detection with localStorage persistence
- Noto Sans Sinhala and Noto Sans Tamil fonts loaded via Google Fonts CDN

## Design Decisions

1. **MySQL/TiDB over PostgreSQL**: The Manus scaffold uses MySQL/TiDB. Schema adapted accordingly.
2. **tRPC over REST**: End-to-end type safety between frontend and backend.
3. **DashboardLayout**: Used for all authenticated views since this is an internal admin/management tool.
4. **Government Blue palette**: Professional dark navy sidebar (#0f172a) with teal accents for a government-appropriate look.
5. **Role-based navigation**: Sidebar items filtered by user permissions — users only see what they can access.
6. **Audit-first**: Every mutation creates an audit log entry with userId, action, entity, IP address.
7. **Paginated queries**: All list endpoints use page/pageSize pattern with total count for UI pagination.
8. **Notification-driven workflows**: Status changes in leave and transfer workflows trigger in-app notifications.
9. **Nested scholarship routers**: `scholarships.programs.*` and `scholarships.applications.*` for clean separation.
10. **i18n with i18next**: Lazy-loaded translation files with browser detection and localStorage persistence.

## Testing

| Test File | Tests | Description |
|-----------|-------|-------------|
| `server/permissions.test.ts` | 24 | RBAC permissions, hierarchy, role matrix, display names |
| `server/auth.logout.test.ts` | 1 | Auth session cleanup |
| `server/routers.test.ts` | 33 | Permission guards (S1-S6), role escalation (S5), input validation, auth flow |
| `server/sis.test.ts` | 19 | SIS auth guards, input validation, pagination/query shape checks, i18n parity |
| `server/finance-supervision.test.ts` | 41 | Finance & Supervision permission guards, input validation, role-based access, cross-module restrictions |
| `server/dashboard-analytics.test.ts` | 11 | Dashboard analytics endpoint permissions, response structure, role-based access |
| `server/departments.test.ts` | 29 | Department CRUD permissions, input validation, staff-by-department access, role guards |
| `server/phase4.test.ts` | 12 | Report Cards + Parent Portal auth guards, validation, and procedure coverage |
| **Total** | **197** | **All passing** |

## Known Issues

- Vite's tRPC type watcher sometimes shows stale errors for SIS routers — authoritative check is `npx tsc --noEmit`
- Post-code-splitting build still reports a chunk-size warning for `index` (~512k minified); additional manual chunking can further optimize startup payload.

## Known Gaps (Phase 3+ Backlog)

- PWA service worker, offline caching, background sync
- WCAG 2.1 AA full compliance audit
- Digital workflow engine (Camunda/Flowable)
- SMS/email notification channels (currently in-app only)
- Emergency alert system
- Report card PDF export pipeline (UI exists; export pending)

## Conventions for AI Agents

1. **Always update this file** after any major implementation, change, or edit.
2. **Use `requirePermission()`** for all new tRPC procedures that need access control.
3. **Add audit logging** via `logAudit()` for all mutations.
4. **Add notifications** via `notify()` for user-facing state changes.
5. **Use paginated queries** for all list endpoints (page/pageSize pattern).
6. **Escape search inputs** before using in SQL LIKE clauses.
7. **Run `pnpm test`** after any backend changes to ensure all 197 tests pass.
8. **Follow the role hierarchy** — never allow a user to assign a role >= their own level.
9. **Use `trpc.*.useQuery/useMutation`** for all frontend data access — no raw fetch/axios.
10. **Mark completed items in todo.md** immediately after implementation.
11. **SIS scholarships use nested routers**: `scholarships.programs.*` and `scholarships.applications.*`.
12. **Use `useTranslation()` hook** for all new UI strings and add keys to all 3 translation files.

## Changelog

| Date | Change | Details |
|------|--------|---------|
| 2026-03-01 | Project initialized | Scaffold created, README, LICENSE, AGENTS.md, todo.md |
| 2026-03-01 | Phase 1 build complete | Database schema (15 tables), RBAC (10 roles, 30+ perms), 14 pages, 25 tests passing |
| 2026-03-01 | Phase 1 audit fixes | Security (S1-S6), business logic (B1-B9), all forms (F1-F7), pagination, search, error states, 58 tests passing |
| 2026-03-01 | Phase 2 build complete | SIS module (8 new tables, 11 new permissions, 7 new pages), i18n (en/si/ta), Staff Detail, Announcement Detail, 79 tests passing |
| 2026-03-01 | Phase 3 build complete | Finance module (5 tables, 10 permissions, 4 pages), Supervision module (4 tables, 7 permissions, 3 pages), DashboardLayout updated, 120 tests passing |
| 2026-03-01 | Sidebar overlap fix | Added `shrink-0` to SidebarGroup to prevent flex compression; all 8 sidebar sections properly spaced |
| 2026-03-01 | Dashboard enhancement | Tabbed analytics (Overview/Finance/Quality), 6 stat cards, budget utilization, inspection scores, Recharts charts (expenditure bar, inspection pie), procurement breakdown, improvement plans tracker, activity feed, announcements widget, 131 tests |
| 2026-03-01 | Departments page complete | Full CRUD (create/edit/delete), paginated listing with staff count, staff-by-department expandable view, branch head assignment, search, 6 new db helpers, 5 new router procedures, 160 tests |
| 2026-03-01 | Professional Development page | Full CRUD replacing placeholder: training records listing with search/pagination/type+status filters, create/edit/delete dialogs, CPD hours tracking, stats cards, 5 new db helpers, 5 new router procedures |
| 2026-03-01 | i18n Phase 3 update | Added Finance, Supervision, Professional Development, Departments, and Dashboard analytics strings to en.json, si.json, ta.json (all 3 languages) |
| 2026-03-01 | Professional Dev tests | 27 new tests (route existence, auth guards, permission guards, input validation, read access), 187 total tests passing |
| 2026-03-01 | Phase 1 gap closure pass | Added unique index for `leaveBalances(staffId, year)`, tightened leave date-range and balance checks, enabled leave/transfer search filtering in backend + UI search controls, wired branch-level transfer rejection in UI, added announcement detail navigation, improved dashboard/analytics/notifications error states, aligned README role/PWA claims, and updated router tests to current procedure names (`leave.create`, `users.updateRole`) |
| 2026-03-02 | Phase 2 integrity fixes | Added missing `parentStudentLinks` and `reportCards` schema models; added parent-portal backend procedures (`linkChild`, `myChildren`, `childProfile`, child attendance/grade summary, child report cards); added report-card list/upsert router procedures for SIS completeness. |
| 2026-03-02 | Phase 4 kickoff | Added Phase 4 frontend surfaces: new Report Cards page and Parent Portal page, wired routes/sidebar navigation, added i18n keys (en/si/ta), and introduced `phase4.test.ts` for report-card + parent-portal guards/validation/procedure coverage. |
| 2026-03-02 | Audit hardening pass | Added schema migration `0004_flat_earthquake` for parent/report-card tables and leave-balance uniqueness, refactored SIS tests to current router contracts (removed proxy false-positives), and moved analytics script injection to runtime to remove unresolved Vite env build warnings. |
| 2026-03-02 | Route-level code splitting | Refactored `client/src/App.tsx` to lazy-load all page routes using `React.lazy` + `Suspense`; reduced monolithic frontend bundle from ~1.4MB to split chunks (`index` ~512k, route chunks loaded on demand). |

