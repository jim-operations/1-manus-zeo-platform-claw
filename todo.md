# ZEO Platform - Phase 1 Development Checklist

## Project Setup
- [x] README.md with project overview, architecture, and setup instructions
- [x] LICENSE file (All Rights Reserved - Rajantha R Ambegala)
- [x] AGENTS.md living document for AI agent context
- [x] Global theming (color palette, typography, dark/light mode)
- [x] DashboardLayout customization for ZEO sidebar navigation

## Database Schema
- [x] Extended users table with ZEO-specific roles
- [x] Staff profiles table
- [x] Service history table
- [x] Leave requests table (with leave balances)
- [x] Announcements table (with read tracking)
- [x] Notifications table
- [x] Messages table (threads, messages, participants)
- [x] Audit logs table
- [x] Schools table
- [x] Transfer requests table
- [x] Professional development table
- [x] Database migrations pushed

## Core Infrastructure - RBAC
- [x] Role definitions (10 roles: admin, zonal_director, deputy_director, branch_head, isa, principal, teacher, parent, student, user)
- [x] Permission matrix (30+ granular permissions)
- [x] Role-based middleware for tRPC procedures (requirePermission)
- [x] Audit logging for all sensitive operations
- [x] Admin user management interface
- [x] Role hierarchy system

## Authentication & User Management
- [x] Manus OAuth integration (pre-built)
- [x] Session management (pre-built)
- [x] User profile display in sidebar with role badge
- [x] Role assignment form with escalation prevention

## HRM Module
- [x] Centralized staff database with search
- [x] Staff Directory page with pagination and search
- [x] Service record database table and queries
- [x] Leave management system (apply, approve, reject, track balances)
- [x] Leave Management page with approve/reject actions and application form
- [x] Teacher transfer request workflow (submit → recommend → review → approve)
- [x] Transfers page with workflow visualization and request form
- [x] Professional development tracking table and queries
- [x] Professional Development page (placeholder)
- [x] Staff creation form with full field set
- [x] Leave application form with date validation
- [x] Transfer request form

## Communication Hub
- [x] Centralized announcements system with categories and priorities
- [x] Announcements page with read tracking and creation form
- [x] Notification system (in-app)
- [x] Notifications page with mark-read and unread count
- [x] Secure messaging (threads, messages, participants)
- [x] Messages page with compose dialog and thread view
- [x] Notification bell with unread indicator in top bar
- [x] Announcement creation form
- [x] Message compose form with user search

## Organization
- [x] Schools page with type badges, division info, and registration form
- [x] Departments page (placeholder)
- [x] School registration form

## PWA & Offline Support
- [ ] Service worker registration
- [ ] Offline-first data caching with IndexedDB
- [ ] Background sync for form submissions
- [ ] PWA manifest and install prompt

## Multi-Language Support (i18n)
- [x] Multi-script font loading (Inter, Noto Sans Sinhala, Noto Sans Tamil)
- [x] i18next framework integration
- [x] Sinhala translations (key UI strings)
- [x] Tamil translations (key UI strings)
- [x] Language switcher component

## Analytics Foundation
- [x] Real-time KPI dashboard cards (staff, schools, leaves, transfers, announcements)
- [x] Staff distribution by designation
- [x] Leave by type breakdown
- [x] Analytics Dashboard page
- [x] Dashboard home with stat cards and recent announcements

## Workflow Engine
- [x] Transfer request workflow (submit → recommend → review → approve/reject)
- [x] Leave approval workflow (submit → approve/reject)
- [ ] Digital workflow engine integration (Camunda/Flowable — future phase)

## Audit & Compliance
- [x] Audit log table with IP tracking and metadata
- [x] Audit log creation on all mutations
- [x] Audit Log page (admin/ZD access only)

## Accessibility & Responsiveness
- [x] Mobile-first responsive design (sidebar collapses on mobile)
- [x] Keyboard navigation support (focus rings, button accessibility)
- [ ] Full WCAG 2.1 AA compliance audit

## Testing & Deployment
- [x] Vitest unit tests for RBAC permissions (24 tests)
- [x] Auth logout test (1 test)
- [x] Router permission guard tests (33 tests)
- [x] Push to GitHub repository
- [x] Save checkpoint

## Phase 1 Audit Fixes — Tier 1 (Security / Data Integrity)
- [x] S1: Fix requirePermission to use Permission type instead of string
- [x] S2: Add permission guard to analytics.overview
- [x] S3: Add permission guard / ownership check to users.getById
- [x] S4: Add permission guard to professionalDev.create
- [x] S5: Add role escalation prevention in users.assignRole
- [x] S6: Escape wildcards in staff search LIKE patterns
- [x] B1: Leave approval must update leave balances (deduct used days)
- [x] B2: Add leave balance check before submission
- [x] B3: Validate numberOfDays against date range
- [x] B7: Add unique constraint on leaveBalances(staffId, year)

## Phase 1 Audit Fixes — Tier 2 (Core Functionality)
- [x] F1: Add pagination to all list views (staff, leave, transfers, announcements, schools, audit)
- [x] F2: Implement staff creation form
- [x] F2: Implement leave application form
- [x] F2: Implement transfer request form
- [x] F2: Implement announcement creation form
- [x] F2: Implement message compose form
- [x] F2: Implement school registration form
- [x] F2: Implement role assignment form
- [x] B4: Add notifications on leave approve/reject
- [x] B5: Add notifications on transfer status changes
- [x] B6: Allow branch head to reject transfers at their stage
- [x] B8: Expose leave balance management via tRPC
- [x] B9: Join school names in transfer queries (show names not IDs)

## Phase 1 Audit Fixes — Tier 3 (Quality / Completeness)
- [x] F3: Staff detail/profile page (completed in Phase 2)
- [x] F4: Announcement detail view (completed in Phase 2)
- [x] F5: Error state handling on all pages
- [x] F6: Add search/filter to staff, leave, transfers, announcements, schools pages
- [x] F7: Show principal assignment on Schools page
- [x] Add 33 tests for router permissions, input validation, auth flow
- [x] Update AGENTS.md with audit fix changelog
- [x] Fix README role count (8 → 10)

## Phase 2 — Student Information System & Enhancements

### Database Schema (SIS)
- [x] Student profiles table (demographics, parent info, health records)
- [x] Enrollments table (student-school-year-grade mapping)
- [x] Attendance records table (daily per-student with offline sync support)
- [x] Grades table (subject, assessment type, score, teacher)
- [x] Scholarships table (programs, applications, awards)
- [x] Push database migrations (23 tables total)

### Backend (SIS)
- [x] Student CRUD procedures (create, list, getById, update)
- [x] Enrollment management procedures (enroll, transfer, list by school/grade)
- [x] Attendance procedures (mark, bulk mark, daily summary, monthly report)
- [x] Grade entry procedures (enter, update, list by student/subject)
- [x] Scholarship procedures (create program, apply, award, list)
- [x] Parent portal procedures (view child profile, attendance, grades)
- [x] Permission guards on all new SIS procedures (11 new permissions added)

### Frontend (SIS Pages)
- [x] Student Directory page (paginated, searchable, with enrollment form)
- [x] Student Profile detail page (demographics, enrollment history, grades, attendance)
- [x] Attendance page (daily mark sheet, calendar view, statistics)
- [x] Grades page (entry form, student report view, class summary)
- [x] Scholarships page (programs list, application form, award tracking)
- [x] Add SIS routes to App.tsx and sidebar navigation

### Phase 1 Deferred Items
- [x] Staff Detail page (F3) with full service history and leave balances
- [x] Announcement Detail view (F4) with metadata and read tracking
- [ ] Professional Development page (full implementation, not placeholder)

### i18n (Multi-Language Support)
- [x] Install and configure i18next + react-i18next
- [x] Create translation files (en.json, si.json, ta.json)
- [x] Translate key UI strings (sidebar, forms, buttons, labels)
- [x] Language switcher component in header/sidebar
- [x] Persist language preference per user (localStorage)

### Testing & Delivery
- [x] Write SIS router tests (21 tests: auth guards, input validation, pagination, procedure existence)
- [x] Write i18n tests (translation parity, Sinhala/Tamil Unicode verification)
- [x] Update AGENTS.md with Phase 2 changelog
- [x] Push to GitHub
- [x] Save checkpoint

## Phase 3 — Finance & Procurement, Supervision & QA, Completions

### UI Fixes
- [x] Fix sidebar label overlap (Development Schools / Scholarships / Announcements)
- [x] Enhance dashboard with more analytics widgets

### Finance & Procurement Module — Database
- [x] Budgets table (academic year, school, allocation, remaining balance)
- [x] Transactions table (income/expenditure, amount, category, receipt)
- [x] Salary records table (staff, month, gross, deductions, net)
- [x] Purchase requisitions table (school, items, estimated cost, workflow status)
- [x] Vendors table (name, registration, contact, rating)
- [x] Push Finance database migrations

### Finance & Procurement Module — Backend
- [x] Budget CRUD procedures (create, list, getById, update, approve)
- [x] Transaction procedures (create, list, summary by budget)
- [x] Salary procedures (create, list by staff/month)
- [x] Procurement procedures (create, list, getById, review/approve workflow)
- [x] Vendor procedures (create, list, getById)
- [x] Finance permissions added to RBAC matrix (11 new permissions)

### Finance & Procurement Module — Frontend
- [x] Budget Management page (school budgets, allocations, remaining)
- [x] Transactions page (record income/expenditure, filter, category summary)
- [x] Payroll page (salary records, payslip view)
- [x] Procurement page (requisition form, approval workflow, vendor selection)
- [x] Add Finance section to sidebar navigation

### School Supervision & QA Module — Database
- [x] Inspection templates table (name, form schema as JSON)
- [x] Inspections table (school, supervisor, date, form data, score)
- [x] Improvement plans table (school, inspection, recommendations, status)
- [x] School scorecards table (school, year, overall score, component scores)
- [x] Push Supervision database migrations (32 tables total)

### School Supervision & QA Module — Backend
- [x] Inspection template CRUD procedures
- [x] Inspection procedures (schedule, submit, acknowledge, list, getById)
- [x] Improvement plan procedures (create, update, list, getById)
- [x] Scorecard procedures (create, list, getById)
- [x] Supervision permissions added to RBAC matrix (7 new permissions)

### School Supervision & QA Module — Frontend
- [x] Inspections page (schedule, conduct, view results)
- [x] Improvement Plans page (create, track progress, update)
- [x] School Scorecards page (view, compare across schools)
- [x] Add Supervision section to sidebar navigation

### Placeholder Pages Completion
- [x] Professional Development page (full CRUD: add training, certifications, tracking)
- [x] Departments page (department list, staff by department, branch heads)

### i18n Updates
- [x] Add Finance module strings to en/si/ta translation files
- [x] Add Supervision module strings to en/si/ta translation files
- [x] Add Professional Development i18n strings to en/si/ta
- [x] Add Departments i18n strings to en/si/ta
- [x] Add Dashboard analytics i18n strings to en/si/ta

### Testing & Delivery
- [x] Write Finance module tests (41 tests: permission guards, input validation, role-based access)
- [x] Write Supervision module tests (included in finance-supervision.test.ts)
- [x] Update AGENTS.md with Phase 3 changelog
- [x] Push to GitHub
- [x] Save checkpoint

## Bug Fixes
- [x] Fix sidebar label overlap (section group headers overlap with nav items)

## Dashboard Enhancement
- [x] Backend: Add dashboardExtended analytics procedure (budget, inspection, improvement, procurement, activity)
- [x] Frontend: Budget summary widget (total allocated, spent, remaining with utilization progress bar)
- [x] Frontend: Inspection/QA scores widget (avg score, scheduled/in-progress/completed counts)
- [x] Frontend: Recent activity feed (latest audit log entries with user names and timestamps)
- [x] Frontend: Quick stats row (staff, schools, students, pending leaves, transfers, procurements)
- [x] Frontend: Recharts visualizations (expenditure by category bar chart, inspection score pie chart)
- [x] Frontend: Tabbed layout (Overview, Finance, Quality & Inspections)
- [x] Frontend: Improvement plans widget with progress tracking
- [x] Frontend: Procurement status breakdown with approval rate
- [x] Frontend: Recent announcements widget with priority indicators
- [x] Write tests for new dashboard analytics procedures (11 tests, 131 total passing)
- [x] Save checkpoint

## Departments Page (Full Implementation)
- [x] Backend: Add department update/delete db helpers
- [x] Backend: Add department paginated listing with staff count
- [x] Backend: Add staff-by-department query helper
- [x] Backend: Add branch head assignment procedure
- [x] Backend: Add department CRUD router procedures (create, list, update, delete, getById)
- [x] Backend: Add staff-by-department router procedure
- [x] Frontend: Department listing with search, pagination, and staff count
- [x] Frontend: Create department dialog (name, code, description, branch head)
- [x] Frontend: Edit department dialog
- [x] Frontend: Staff-by-department expandable view
- [x] Frontend: Branch head assignment dropdown
- [x] Frontend: Delete department with confirmation
- [x] Write department router tests (29 tests, 160 total passing)
- [x] Save checkpoint

## Professional Development Page (Full Implementation)
- [x] Backend: Add professional development paginated listing db helper
- [x] Backend: Add getById, update, delete db helpers for professional development
- [x] Backend: Extend professionalDev router with listPaginated, getById, update, delete, stats
- [x] Frontend: Training records listing with search, pagination, type/status filters
- [x] Frontend: Create training record dialog (title, type, provider, dates, hours, status, certificate)
- [x] Frontend: Edit training record dialog
- [x] Frontend: Delete training record with confirmation
- [x] Frontend: Summary stat cards (total records, completed, in-progress, CPD hours)
- [x] Frontend: DashboardLayout wrapping
- [x] Write professional development router tests (27 tests, 187 total passing)

## Phase 4 — Intelligence Layer (Kickoff)

### SIS (V2) — Report Cards & Parent Portal
- [x] Backend: report card schema + list/upsert router procedures
- [x] Backend: parent-student linking + parent portal read APIs
- [x] Frontend: Report Cards page (`/report-cards`) with filters, pagination, and upsert form
- [x] Frontend: Parent Portal page (`/parent-portal`) for linked children (profile, attendance summary, grade summary, report cards)
- [x] Navigation + routes: Added Report Cards and Parent Portal entries
- [x] i18n: Added reportCards + parentPortal keys to en/si/ta
- [x] Tests: Added `server/phase4.test.ts` for Phase 4 guards/validation/procedure existence

### Phase 4 — Remaining Work
- [ ] Add report card PDF export/generation pipeline
- [ ] Build advanced analytics drill-down dashboards (zonal/school comparative)
- [ ] Supervision deep workflows: stricter state transitions + compliance checks
- [ ] External reporting exports (CSV/XLSX templates for ministry submissions)

## Audit Hardening Improvements (2026-03-02)
- [x] Generated migration `drizzle/0004_flat_earthquake.sql` for parent/student links + report cards + leave balance unique index
- [x] Refactored `server/sis.test.ts` to align with current router contracts (`pageSize`, nested scholarships router, attendance route names)
- [x] Removed false-positive procedure-existence checks that relied on tRPC proxy `typeof` behavior
- [x] Moved analytics script loading from static `%VITE_*%` HTML placeholders to runtime injection in `client/src/main.tsx`
- [x] Re-ran full verification (`pnpm check`, `pnpm test`, `pnpm build`)
- [x] Performance: Route-level code splitting in `client/src/App.tsx` via `React.lazy` + `Suspense` (reduced monolithic initial bundle)
