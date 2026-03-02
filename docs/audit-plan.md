# Plan: Phase 1 Audit & Railway Feasibility for ZEO Platform

## Context

The ZEO Embilipitiya Digital Platform is a PWA for the Zonal Education Office in Sri Lanka, built on React 19 + tRPC 11 + MySQL/TiDB + Drizzle ORM. The developer reports Phase 1 as "complete" per AGENTS.md. This plan covers:
1. A full audit of implementation gaps, security issues, test coverage gaps, and plan discrepancies
2. A Railway hosting feasibility assessment covering the app and MySQL database

Both outputs are documentation files (not code changes). The branch is `claude/phase1-audit-railway-check-dtDgW`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `docs/phase1-audit.md` | Phase 1 verification audit with gaps, security issues, and improvements |
| `docs/railway-feasibility.md` | Railway hosting feasibility for Node.js app + MySQL DB |

No source code will be modified — audit documents only.

---

## Document 1: `docs/phase1-audit.md`

### Sections

**1. Executive Summary**
- Phase 1 declared complete, but ~15 items remain as placeholders ("coming soon")
- Solid foundation: 15 tables, 10 RBAC roles, 30+ permissions, tRPC router, 14 UI pages
- Critical security gaps, missing business logic, and thin test coverage
- PWA and i18n are entirely unimplemented despite Phase 1 scope claims

**2. Implementation Coverage Matrix**
Table mapping each todo.md item to actual status: ✅ Done / ⚠️ Partial / ❌ Missing

Key gaps to highlight:
- All input forms are "coming soon" placeholders (6 forms missing)
- PWA: 0/4 done
- i18n: 1/5 done (fonts only, no framework integration)
- Role assignment: placeholder
- WCAG 2.1 AA: not audited

**3. Security Findings (Critical)**

| # | Severity | Issue | File | Recommendation |
|---|----------|-------|------|----------------|
| S1 | HIGH | `users.getById` has no permission check — any authenticated user can query any user's full record | `server/routers.ts:59` | Add `requirePermission(PERMISSIONS.USERS_VIEW)` |
| S2 | HIGH | `professionalDev.create` has no permission check — any authenticated user can create PD records for any staffId | `server/routers.ts:386` | Add `requirePermission(PERMISSIONS.STAFF_EDIT)` |
| S3 | HIGH | `analytics.overview` has no permission guard — any user (including parent/student) sees zone-wide stats | `server/routers.ts:522` | Add `requirePermission(PERMISSIONS.ANALYTICS_VIEW_SCHOOL)` |
| S4 | MEDIUM | `requirePermission()` accepts `string` not `Permission` type — bypasses compile-time type safety | `server/routers.ts:12` | Change signature to `requirePermission(permission: Permission)` |
| S5 | MEDIUM | `listStaffProfiles` search uses raw string interpolation in LIKE — no sanitization | `server/db.ts:141` | Trust Drizzle ORM's parameterized queries (low actual risk with Drizzle but good to note) |
| S6 | LOW | `users.updateRole` only requires `USERS_ASSIGN_ROLES` but doesn't prevent role escalation (user assigning admin to themselves) | `server/routers.ts:52` | Add server-side check: role assigner must be higher in hierarchy than the assigned role |

**4. Business Logic Gaps**

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| B1 | HIGH | Leave approval does NOT update `leaveBalances` | `db.updateLeaveRequest` called but `leaveBalances.casualUsed/sickUsed/annualUsed` never incremented on approval |
| B2 | HIGH | No leave balance check before applying | `leave.submit` never checks if staff has remaining balance for the leave type |
| B3 | HIGH | No date-range validation in leave submit | `numberOfDays` field can be any value, not verified against startDate/endDate diff |
| B4 | MEDIUM | No notifications triggered on leave approve/reject | Users never notified of leave status changes |
| B5 | MEDIUM | No notifications triggered on transfer status changes | Teachers never notified when principal recommends or ZD approves/rejects |
| B6 | MEDIUM | Transfer `reject` endpoint requires `TRANSFER_APPROVE` permission only | Branch heads reviewing (TRANSFER_REVIEW) cannot reject at their stage — they can only "review" forward |
| B7 | LOW | `leaveBalances` missing unique constraint on `(staffId, year)` in schema definition | `onDuplicateKeyUpdate` in upsert implies uniqueness but schema doesn't enforce it |
| B8 | LOW | No tRPC endpoint exposed for `leaveBalance` management | `upsertLeaveBalance` exists in `db.ts` but no router procedure to set/view balances |
| B9 | LOW | Transfer displays school IDs not names | Frontend shows "From School #3" instead of school name — needs join or lookup |

**5. Frontend / UX Gaps**

| # | Severity | Issue |
|---|----------|-------|
| F1 | HIGH | 6 action forms are "coming soon" placeholders (staff, leave, transfer, announcement, message, school) |
| F2 | HIGH | No pagination on any list view — will be unusable with 5,000+ staff records |
| F3 | MEDIUM | No staff detail/profile page (only list view) |
| F4 | MEDIUM | No announcement detail view (list only, full content not displayed) |
| F5 | MEDIUM | No error state handling (only loading spinner) |
| F6 | LOW | Search only on Staff Directory — missing on schools, announcements, leave, transfers |
| F7 | LOW | No schools page principal linkage display |
| F8 | LOW | Transfer list resolves school IDs as raw numbers |

**6. Test Coverage Analysis**

Current state:
- `server/permissions.test.ts` — 24 tests (RBAC logic only)
- `server/auth.logout.test.ts` — 1 test (cookie clearing)
- **Total: 25 tests**
- **Zero** tests for: db.ts functions, tRPC router procedures, workflows, notifications, frontend

Missing test categories with specific suggestions:

| Category | Priority | Suggested Tests |
|----------|----------|----------------|
| Router permission enforcement | HIGH | Test that `users.getById`, `professionalDev.create`, `analytics.overview` reject unauthorized roles |
| Leave workflow | HIGH | Submit → approve increments balance; submit checks balance; date validation |
| Transfer workflow | HIGH | State transitions: pending → recommended → reviewed → approved/rejected |
| DB query helpers | MEDIUM | `listStaffProfiles` filtering, `getLeaveBalance`, `createAuditLog` |
| Notification creation | MEDIUM | Leave approve/reject fires notification; message send notifies participants |
| Error handling | MEDIUM | TRPC NOT_FOUND and FORBIDDEN error codes |

Recommended: Add 20–30 additional Vitest unit/integration tests in `server/` covering the above.

**7. Development Plan Discrepancies**

| # | Issue | Expected | Actual |
|---|-------|----------|--------|
| P1 | AGENTS.md claims "Phase 1 build complete" | All Phase 1 items done | ~15 items are "coming soon" placeholders |
| P2 | README says "8 hierarchical roles" | 8 roles | 10 roles (admin and user added) |
| P3 | PWA scope in Phase 1 | Service worker, IndexedDB, background sync, manifest | None implemented |
| P4 | i18n scope in Phase 1 | i18next, Sinhala + Tamil translations, language switcher | Only Google Fonts loaded |
| P5 | todo.md "Deployment" section | Push to GitHub, save checkpoint | Not done |
| P6 | AGENTS.md changelog "25 tests passing" | 25 is accurate | True but coverage is very limited |

**8. Suggested Improvements (Prioritized)**

Critical (before production):
1. Fix S1, S2, S3 permission holes
2. Fix B1 leave balance update on approval
3. Fix B2 leave balance check before submission
4. Add B3 date range validation
5. Implement B4/B5 notifications for leave/transfer actions

High (Phase 1 completion):
6. Implement at least 3 key forms: leave application, staff detail view, announcement create
7. Add pagination (at minimum to staff list — virtual/infinite scroll)
8. Fix S4 type safety in requirePermission
9. Add transfer reject capability for branch heads (B6)
10. Expose leaveBalance management via tRPC (B8)

Medium (quality improvement):
11. Add 20+ tests covering router permissions and workflow logic
12. Add error state handling to all pages
13. Staff detail/profile page

Low (future phases):
14. PWA: service worker + manifest (Phase 2)
15. i18n: i18next integration (Phase 2)
16. WCAG 2.1 AA audit

---

## Document 2: `docs/railway-feasibility.md`

### Sections

**1. Executive Summary**
- Railway is feasible for hosting this app, but requires setup work before deployment
- 4 blocking issues must be resolved first
- MySQL on Railway is available via a first-class add-on
- Manus OAuth dependency is external and must remain on Manus infrastructure
- Estimated effort: 2–4 hours to get a working deployment

**2. Current Infrastructure State**

What exists:
- ✅ Build script: `vite build && esbuild` → outputs `dist/`
- ✅ Start script: `NODE_ENV=production node dist/index.js`
- ✅ Port read from `process.env.PORT` (Railway injects this)
- ✅ DATABASE_URL consumed from environment
- ✅ pnpm supported by Railway natively
- ✅ tRPC health endpoint: `/api/trpc/system.health` (responds `{ok:true}`)
- ❌ No `railway.toml`
- ❌ No `.env.example`
- ❌ No Node.js `engines` field in package.json
- ❌ No automated migration step in deploy pipeline

**3. Blocking Issues**

| # | Issue | Resolution |
|---|-------|-----------|
| R1 | No `railway.toml` — Railway cannot determine how to build/start | Create `railway.toml` with build + start commands |
| R2 | No `.env.example` — Environment variables undocumented | Create `.env.example` with all required vars |
| R3 | Database migrations not automated — schema won't apply on first deploy | Add `pnpm db:push` to release command in `railway.toml` |
| R4 | Static file serving path confusion — dev uses `/public/` but build outputs to `dist/public/` | Verify and test `server/_core/vite.ts` production path handling |

**4. Non-Blocking Recommendations**

| # | Priority | Recommendation |
|---|----------|---------------|
| NR1 | HIGH | Add `"engines": {"node": ">=18"}` to `package.json` |
| NR2 | HIGH | Add a simple `GET /health` HTTP endpoint alongside tRPC |
| NR3 | MEDIUM | Create a GitHub Actions workflow for CI (test on PR, deploy on merge) |
| NR4 | LOW | Create `Dockerfile` for consistent builds |

**5. Database: MySQL on Railway**

Railway offers MySQL as a first-class plugin via the Railway dashboard:
- Add MySQL plugin → Railway injects `${{MySQL.DATABASE_URL}}` automatically
- Connection string format: `mysql://user:pass@host:port/database`
- Compatible with `mysql2` driver and Drizzle ORM ✅
- Persistent storage included (not ephemeral)
- Railway MySQL limitations:
  - Default max connections: 25 (sufficient for Phase 1 single-instance deployment)
  - No read replicas on free tier
  - Storage: starts at 1GB (upgradable)

Alternative: Use an external TiDB serverless connection (if TiDB-specific features needed). TiDB Cloud Serverless has a free tier compatible with the `DATABASE_URL` format.

**6. Required Railway Environment Variables**

```
DATABASE_URL        = mysql://user:pass@host:port/dbname   (auto-injected if using Railway MySQL plugin)
JWT_SECRET          = <random 32+ char string>              (generate: openssl rand -hex 32)
OAUTH_SERVER_URL    = https://oauth.manus.computer          (external Manus OAuth — cannot be hosted on Railway)
VITE_APP_ID         = <your Manus app ID>                   (from Manus developer console)
OWNER_OPEN_ID       = <owner's Manus OpenID>                (first admin user's OpenID)
NODE_ENV            = production
PORT                = (auto-set by Railway — do not override)
```

Optional (only needed if AI/storage features used):
```
BUILT_IN_FORGE_API_URL  = <Manus AI API URL>
BUILT_IN_FORGE_API_KEY  = <Manus AI API key>
```

**7. Manus OAuth Dependency**

The app uses Manus OAuth for authentication (`server/_core/oauth.ts`). This is a hard external dependency:
- `OAUTH_SERVER_URL` must point to a running Manus OAuth server
- This cannot be self-hosted on Railway; it must remain on Manus infrastructure
- **Impact**: If Manus OAuth is unavailable, no users can log in
- **Mitigation for future**: Evaluate adding a fallback auth method (e.g., email/password or another OAuth provider) for resilience

**8. Recommended `railway.toml`**

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
releaseCommand = "pnpm db:push"
healthcheckPath = "/api/trpc/system.health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

Note: `releaseCommand` runs `pnpm db:push` before traffic switches to the new deployment, ensuring schema migrations are applied.

**9. Recommended `.env.example`**

```
# Database (use Railway MySQL plugin → auto-injects this as MySQL.DATABASE_URL)
DATABASE_URL=mysql://user:password@host:3306/database

# Auth
JWT_SECRET=change-me-use-openssl-rand-hex-32
OAUTH_SERVER_URL=https://oauth.manus.computer

# Manus App Configuration
VITE_APP_ID=your-app-id-from-manus-console
OWNER_OPEN_ID=your-manus-openid

# Runtime (Railway sets PORT automatically)
NODE_ENV=production

# Optional: AI/forge features
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

**10. Static File Serving Verification**

The Express server (`server/_core/vite.ts`) serves static files. In production, it should serve from `dist/public/`. Need to verify that:
- `vite build` outputs frontend to `dist/public/`
- The static middleware path in production mode points to `dist/public/` relative to process working directory
- The `index.html` SPA fallback is correctly configured

**11. Deployment Checklist**

Pre-deployment:
- [ ] Create Railway project
- [ ] Add MySQL plugin to project
- [ ] Create `railway.toml` with build/start/release commands
- [ ] Create `.env.example`
- [ ] Set all required environment variables in Railway dashboard
- [ ] Add `engines.node` to `package.json`
- [ ] Push code to GitHub branch

Deployment:
- [ ] Connect Railway to GitHub repository
- [ ] Trigger initial deployment
- [ ] Verify `pnpm db:push` runs successfully in release phase
- [ ] Test health endpoint: `GET /api/trpc/system.health`
- [ ] Perform login flow test

Post-deployment:
- [ ] Verify audit logs table is created
- [ ] Create initial admin user
- [ ] Test role-based navigation as different user types

**12. Cost Estimate (Railway)**

| Component | Plan | Monthly Cost |
|-----------|------|-------------|
| Node.js service | Hobby ($5/mo credit) | ~$0–5 |
| MySQL database | $1/GB storage + $0.000463/vCPU·s | ~$5–15 |
| **Total** | | ~$5–20/month |

Railway Hobby plan ($5/month) provides $5 credit, enough for a low-traffic deployment.

---

## Verification

After writing the two documents:
1. Confirm both files exist in `docs/` directory
2. Run `git status` to see new files
3. Commit and push to `claude/phase1-audit-railway-check-dtDgW`

---

## Critical Files Referenced

| File | Key Findings |
|------|-------------|
| `server/routers.ts` | S1 (line 59), S2 (line 386), S3 (line 522), S4 (line 12), B6 (line 366) |
| `server/db.ts` | B1 (no balance update in approval), B7 (no unique constraint) |
| `drizzle/schema.ts` | B7 (leaveBalances missing unique constraint) |
| `shared/permissions.ts` | Role matrix is correct |
| `server/permissions.test.ts` | Tests are good; coverage is thin |
| `package.json` | No `engines` field; pnpm 10.4.1; build/start scripts OK |
| `drizzle.config.ts` | Requires DATABASE_URL; fails if missing |
| `todo.md` | ~15 incomplete items vs AGENTS.md "Phase 1 complete" claim |
