# Railway Hosting Feasibility — ZEO Embilipitiya Digital Platform

> **Assessment Date:** 2026-02-28
> **Assessor:** Claude Code (claude-sonnet-4-6)
> **Scope:** Node.js application + MySQL database on Railway.app
> **Last Updated:** 2026-03-01 — Phase 2 status review added (see Section 10)

---

## Section 10 — Phase 2 Status Update (2026-03-01)

> This section was added during the Phase 2 verification audit. It reflects the current state of the codebase after Phase 2 (SIS module) was declared complete. The sections below (1–9) are unchanged from the original assessment.

### Deployment Readiness — Current State

**All 3 blocking issues remain unresolved.** No deployment configuration files were created during Phase 2.

| Blocker | Original Issue | Status |
|---------|---------------|--------|
| BLOCKING 1 | No `railway.toml` | ❌ Still missing |
| BLOCKING 2 | No `.env.example` | ❌ Still missing |
| BLOCKING 3 | No `releaseCommand` for DB migrations | ❌ Still missing (depends on `railway.toml`) |
| NR1 | No `engines` field in `package.json` | ❌ Still missing |
| NR3 | No plain `GET /api/health` endpoint | ❌ Still missing |

The codebase **cannot be deployed to Railway** without first completing these 5 items (approximately 30–45 minutes of work). All recommended configuration is detailed in Sections 2, 6, and 7 of this document.

### Phase 2 Changes That Affect Deployment

**No new Railway incompatibilities were introduced.** The Phase 2 SIS module uses the same architecture:
- 6 new MySQL tables — handled by the existing `pnpm db:push` command, which will apply them when `railway.toml` is created with the `releaseCommand`
- 5 new React pages — served as static files by the existing Vite build, no Railway config change needed
- 11 new tRPC procedures — standard HTTP over the existing Express server
- i18next with 3 language files — pure frontend, zero Railway impact

**One deferred item affects the DB schema:** `reportCards` and `parentStudentLinks` tables were listed in the Phase 2 plan but are not present in `drizzle/schema.ts`. When these are added in Phase 3, the next `pnpm db:push` will apply them non-destructively (addition only).

### Revised Deployment Checklist (Phase 2 State)

Carry-overs from Section 7 that remain unactioned:

- [ ] Create `railway.toml` (template in Section 6)
- [ ] Create `.env.example` (template in Section 2 / BLOCKING 2)
- [ ] Add `"engines": { "node": ">=20.0.0" }` to `package.json`
- [ ] Add `GET /api/health` Express route in `server/_core/index.ts`
- [ ] **NEW for Phase 2:** Verify `pnpm db:push` applies all 21 current tables without error before connecting to Railway MySQL
- [ ] **NEW for Phase 2:** Confirm Manus OAuth `OAUTH_SERVER_URL` is reachable from Railway's network — test with a staging deployment before going live

### Cost Estimate — No Change

Phase 2 (SIS module) does not materially change the operational cost profile. The same `~$10–15/month` estimate from Section 9 applies. SIS data (student records, attendance, grades) will grow the MySQL database over time, but remains within the 1 GB included storage for the foreseeable future at a single-zone scale.

### Architecture Notes — Phase 2 Additions

| Phase 2 Feature | Railway Impact |
|----------------|---------------|
| SIS student/grade data | None — same MySQL plugin |
| Attendance bulk-mark endpoint | None — same tRPC/Express handler |
| Scholarship workflow | None — same stateless pattern |
| i18n (Sinhala, Tamil, English) | None — pure frontend, no server config |
| LanguageSwitcher component | None — stores preference in `localStorage` |

---

## Verdict

**Railway deployment is feasible but not currently ready.** The application architecture is fully compatible with Railway's infrastructure model — it uses Node.js, Express, pnpm, MySQL, and environment-based configuration, all of which Railway supports natively. However, **3 blocking issues** must be resolved before a first deployment can succeed, and **1 critical external dependency** (Manus OAuth) must be validated against Railway's network before the deployment can be considered production-ready.

**Summary:**

| Category | Status |
|----------|--------|
| Node.js/Express server | ✅ Compatible |
| MySQL database | ✅ Compatible (Railway MySQL plugin) |
| pnpm package manager | ✅ Native support |
| Build script | ✅ Functional |
| Start script | ✅ Functional |
| PORT env var handling | ✅ Compatible |
| `railway.toml` config file | ❌ Missing — **BLOCKING** |
| `.env.example` documentation | ❌ Missing — **BLOCKING** |
| Database migration automation | ❌ Missing — **BLOCKING** |
| Node.js version constraint | ⚠️ Not specified — risk |
| HTTP health check endpoint | ⚠️ Only tRPC — recommended to add plain HTTP |
| Manus OAuth (external) | ⚠️ Must be reachable from Railway network |

**Estimated effort to unblock:** 2–4 hours

---

## 1. Application Architecture Compatibility

### What works natively on Railway

| Component | Technology | Railway Compatibility |
|-----------|-----------|----------------------|
| HTTP server | Express 4.21 | ✅ Node.js auto-detected |
| API layer | tRPC 11 over HTTP | ✅ Standard HTTP |
| Package manager | pnpm 10.4 | ✅ Detected via `package.json.packageManager` |
| Frontend build | Vite 7 → `dist/public/` | ✅ Static files served by Express |
| Backend build | esbuild → `dist/index.js` | ✅ ESM bundle, `node dist/index.js` |
| Database driver | mysql2 3.15 | ✅ Compatible with Railway MySQL |
| ORM | Drizzle ORM 0.44 | ✅ Works with MySQL connection string |
| Auth sessions | JWT cookies (jose) | ✅ Stateless — no sticky sessions needed |
| Port binding | `process.env.PORT ?? 3000` | ✅ Railway auto-injects `PORT` |
| File storage | `@aws-sdk/client-s3` | ✅ External S3 — no Railway impact |

### Stateless architecture advantage

The application uses JWT-based cookies for session management. This means **no shared session store is needed** — Railway can run multiple instances of the Node.js service without sticky sessions. This is architecturally correct for horizontal scaling.

---

## 2. Blocking Issues

These issues will cause deployment to fail or the application to be non-functional after deploy.

---

### BLOCKING 1: No `railway.toml` configuration file

Railway uses `railway.toml` to determine how to build and start the application. Without it, Railway's auto-detection parses `package.json` scripts and typically identifies `build` and `start`. However, for this application the non-standard build output structure (client built via Vite to `dist/public/`, server via esbuild to `dist/index.js`) may cause auto-detection issues.

More critically, there is no way to specify the **release command** (database migration) without `railway.toml`.

**Required file — create at project root:**

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
releaseCommand = "pnpm db:push"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

> **Note on `healthcheckPath`:** The existing `system.health` tRPC endpoint at `/api/trpc/system.health` requires a JSON-formatted query string, making it awkward as a health check URL. It is recommended to add a plain `GET /api/health` Express route (see Non-Blocking Issue 4 below). If that route is not added, the healthcheck path can be changed to `/api/trpc/system.health?input=%7B%7D` but this is fragile.

---

### BLOCKING 2: No `.env.example` file

There is no documented list of required environment variables. All required vars must be reverse-engineered from `server/_core/env.ts` and the `server/_core/` source files. Without this documentation, deployment to Railway will fail with cryptic startup errors.

**Required file — create at project root as `.env.example`:**

```bash
# ─── Database ──────────────────────────────────────────────────────────────
# Use Railway MySQL plugin → Railway auto-injects this as ${{MySQL.DATABASE_URL}}
DATABASE_URL=mysql://user:password@host:3306/database

# ─── Authentication ────────────────────────────────────────────────────────
# Random 32+ character secret for JWT session signing
# Generate: openssl rand -hex 32
JWT_SECRET=change-me-generate-with-openssl-rand-hex-32

# Manus OAuth server URL (external — cannot be hosted on Railway)
OAUTH_SERVER_URL=https://oauth.manus.computer

# ─── Manus App Configuration ───────────────────────────────────────────────
# Application identifier from Manus developer console
VITE_APP_ID=your-app-id-from-manus-console

# OpenID of the initial admin user (first user to log in with this OpenID gets admin role)
OWNER_OPEN_ID=your-manus-openid

# ─── Runtime ───────────────────────────────────────────────────────────────
NODE_ENV=production
# Do NOT set PORT — Railway injects this automatically

# ─── Optional: AI / Forge Features ────────────────────────────────────────
# Only needed if using the built-in AI chat functionality
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

---

### BLOCKING 3: Database migrations not automated for deployment

`drizzle.config.ts` requires `DATABASE_URL` and `pnpm db:push` runs `drizzle-kit generate && drizzle-kit migrate`. This command is not called anywhere in the build or start process.

**Impact:** A fresh Railway deployment starts the Express server connected to an empty MySQL database with no schema. All tRPC queries return errors or empty results immediately after deployment.

**Resolution Options:**

| Option | How | Trade-off |
|--------|-----|-----------|
| **A — Railway release command** (recommended) | Add `releaseCommand = "pnpm db:push"` to `railway.toml` | Runs before traffic is switched; safest. Adds ~10–20s to each deployment. |
| B — Startup migration | Call `drizzle-kit migrate` programmatically in `server/_core/index.ts` before `server.listen()` | Runs on every cold start (e.g., after crash restart); migration errors crash the server |
| C — Manual one-time step | Run `pnpm db:push` from Railway's CLI or shell after first deploy | Easy to forget; breaks on schema changes |

**Recommended:** Option A. Add `releaseCommand = "pnpm db:push"` to `railway.toml` as shown above. Railway's release command runs after build but before the new deployment receives traffic, making it the safest migration slot.

---

## 3. Non-Blocking Issues (Recommended to Fix)

These will not prevent deployment but will cause operational problems.

---

### NR1 — HIGH: No Node.js version constraint

**Location:** `package.json` — no `engines` field

This application uses React 19, Vite 7, Tailwind CSS 4, and TypeScript 5.9 — all requiring Node.js 20+. Railway defaults to the latest LTS, which is currently Node.js 22, but this assumption is fragile.

**Fix:** Add to `package.json`:
```json
"engines": {
  "node": ">=20.0.0"
}
```

---

### NR2 — HIGH: Manus OAuth is an external dependency

**Location:** `server/_core/oauth.ts`, `server/_core/env.ts`

The entire authentication flow depends on `OAUTH_SERVER_URL` — a Manus-hosted OAuth server. This creates two risks for Railway deployment:

1. **Network reachability:** Railway's network must be able to reach the Manus OAuth server. This is likely but must be tested before going live.
2. **Availability coupling:** If Manus OAuth is down, no user can log in to the platform, regardless of Railway's own availability. The ZEO platform has no fallback authentication mechanism.

**Short-term recommendation:** Test the OAuth callback flow end-to-end from a Railway deployment before declaring it production-ready. Check that OAuth redirects work correctly with the Railway-assigned domain.

**Long-term recommendation:** Evaluate adding an email/password or alternative OAuth provider as a fallback, to reduce dependency on Manus infrastructure for a government education platform.

---

### NR3 — MEDIUM: No plain HTTP health check endpoint

**Location:** `server/_core/index.ts` (does not exist yet)

Railway's health check probe sends a plain `GET` request and expects a `200` response. The existing tRPC `system.health` endpoint works, but its URL is `GET /api/trpc/system.health?input={}` (URL-encoded), which is fragile for health check configuration.

**Fix:** Add a simple Express route in `server/_core/index.ts` before the tRPC middleware:
```typescript
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, timestamp: Date.now() });
});
```

Then set `healthcheckPath = "/api/health"` in `railway.toml`.

---

### NR4 — MEDIUM: Static file path relies on esbuild output location

**Location:** `server/_core/vite.ts` lines 50–54

```typescript
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");  // production
```

In production, `import.meta.dirname` resolves to the directory containing the bundled `dist/index.js`, which is `dist/`. So `path.resolve("dist/", "public")` = `dist/public/` — which is where Vite outputs the frontend build. **This is correct.**

However, this resolution is implicit and fragile: if the esbuild `--outdir` is ever changed, or if `server/_core/index.ts` is moved, the static path silently breaks. There is no startup log confirming the resolved path.

**Recommendation:** Add a startup log line in `serveStatic()`:
```typescript
console.log(`[Static] Serving from: ${distPath}`);
```

This helps diagnose Railway deployments where `index.html` is served as a 404.

---

### NR5 — LOW: `packageManager` checksum may conflict with Railway's Corepack

**Location:** `package.json` line 111

```json
"packageManager": "pnpm@10.4.1+sha512.c753b6c3..."
```

Railway uses Corepack to install the specified pnpm version. The `+sha512` suffix checksum is validated by Corepack against its registry. If the hash doesn't match (e.g., if Railway's Corepack cache has a different hash for that version), the build will fail with a cryptic error.

**Recommendation:** If the first Railway build fails with a Corepack error, remove the `+sha512...` suffix, leaving just `"packageManager": "pnpm@10.4.1"`.

---

## 4. Database: MySQL on Railway

### Option A: Railway MySQL Plugin (Recommended)

Railway offers MySQL as a first-class database service:

1. In the Railway dashboard → your project → **+ New** → **Database** → **MySQL**
2. Railway provisions a MySQL instance and automatically injects `${{MySQL.DATABASE_URL}}` into your service
3. Reference it in your service's environment variable settings: `DATABASE_URL=${{MySQL.DATABASE_URL}}`

**Compatibility:** The Railway MySQL connection string format is `mysql://user:password@host:port/database` — fully compatible with `mysql2` driver and Drizzle ORM. ✅

**Limitations:**
- Default max connections: 25 (sufficient for Phase 1 single-instance deployment)
- Storage: 1 GB included; upgradable at ~$0.25/GB/month
- No read replicas on the base plan
- MySQL 8.x (compatible with Drizzle ORM and mysql2)

### Option B: External TiDB Cloud Serverless

The project is designed for TiDB (MySQL-compatible). TiDB Cloud Serverless offers a **free tier** that is fully compatible with the `DATABASE_URL` format:

1. Create a TiDB Cloud account → New Cluster → Serverless (free)
2. Get the connection string: `mysql://username:password@host:4000/database?ssl=true`
3. Set this as `DATABASE_URL` in Railway

**Note on SSL:** TiDB Cloud requires SSL. Drizzle's mysql2 connection handles this via the `ssl` query parameter in the URL.

**When to choose TiDB over Railway MySQL:**
- If you want TiDB-specific features (HTAP, horizontal scale-out)
- If the free tier is sufficient (5 GB storage, 50M row reads/month)
- If you want a managed service separate from Railway

For Phase 1 (single-office, low-traffic), either option works. **Railway MySQL is simpler** (one dashboard, fewer credentials to manage).

---

## 5. Required Environment Variables

All variables consumed from `server/_core/env.ts`:

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `DATABASE_URL` | **YES** | MySQL connection string | Railway MySQL plugin or TiDB Cloud |
| `JWT_SECRET` | **YES** | 32+ char secret for session cookie signing | Generate: `openssl rand -hex 32` |
| `OAUTH_SERVER_URL` | **YES** | Manus OAuth server URL | Manus platform |
| `VITE_APP_ID` | **YES** | Application ID for Manus OAuth | Manus developer console |
| `OWNER_OPEN_ID` | **YES** | OpenID of first admin user | Your Manus account's OpenID |
| `NODE_ENV` | **YES** | Must be `production` for Railway | Set to `production` |
| `PORT` | Auto | HTTP port | **Do not set** — Railway injects this |
| `BUILT_IN_FORGE_API_URL` | No | Manus AI API endpoint | Optional — for AI chat features |
| `BUILT_IN_FORGE_API_KEY` | No | Manus AI API key | Optional — for AI chat features |

> **Security note:** Never commit `JWT_SECRET` or any API keys to the repository. Set them as Railway environment variables via the dashboard or CLI.

---

## 6. Recommended `railway.toml`

Create this file at the project root:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install --frozen-lockfile && pnpm build"

[deploy]
startCommand = "pnpm start"
releaseCommand = "pnpm db:push"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
numReplicas = 1
```

**Key decisions:**

- `--frozen-lockfile` — ensures `pnpm-lock.yaml` is respected in CI/CD (reproducible builds)
- `releaseCommand = "pnpm db:push"` — runs Drizzle migrations before traffic switches
- `healthcheckPath = "/api/health"` — requires the plain HTTP health route (NR3) to be added
- `numReplicas = 1` — explicitly single instance for Phase 1 (cheaper, simpler)

---

## 7. Deployment Checklist

### Pre-deployment Code Changes

- [ ] Create `railway.toml` as shown above
- [ ] Create `.env.example` documenting all required variables
- [ ] Add `"engines": { "node": ">=20.0.0" }` to `package.json`
- [ ] Add `GET /api/health` Express route in `server/_core/index.ts`
- [ ] Confirm `OAUTH_SERVER_URL` is reachable from external networks (test with `curl`)

### Railway Setup

- [ ] Create new Railway project
- [ ] Add MySQL database service to the project
- [ ] Link `DATABASE_URL` to the MySQL plugin: `DATABASE_URL=${{MySQL.DATABASE_URL}}`
- [ ] Set remaining environment variables via Railway dashboard:
  - `JWT_SECRET` (generate with `openssl rand -hex 32`)
  - `OAUTH_SERVER_URL`
  - `VITE_APP_ID`
  - `OWNER_OPEN_ID`
  - `NODE_ENV=production`
- [ ] Connect Railway project to GitHub repository

### First Deployment

- [ ] Trigger deployment from Railway dashboard or `railway up`
- [ ] Verify build step completes (check Nixpacks build log)
- [ ] Verify release step (`pnpm db:push`) completes without error
- [ ] Verify health check passes at `/api/health`
- [ ] Open the Railway-assigned URL (e.g., `https://your-app.up.railway.app`)

### Post-Deployment Validation

- [ ] Test Manus OAuth login flow end-to-end
- [ ] Log in as the `OWNER_OPEN_ID` user (should receive `admin` role automatically)
- [ ] Navigate to Dashboard — verify stat cards load (confirms DB connection)
- [ ] Navigate to Staff Directory — verify empty state (no staff yet, confirms query works)
- [ ] Navigate to Audit Log — verify the login event is recorded
- [ ] Navigate to User Management — verify the admin user appears

---

## 8. Architecture Notes for Future Phases

| Feature | Railway Impact |
|---------|---------------|
| PWA service worker | None — served as static files by Express. Works natively. |
| i18n translations | None — frontend-only. |
| File uploads (S3) | None — `@aws-sdk/client-s3` already in dependencies. Use S3, not Railway filesystem (ephemeral). |
| Real-time notifications (WebSockets) | Railway supports WebSockets. No config changes needed. |
| Horizontal scaling (multiple replicas) | ✅ JWT sessions are stateless — no sticky sessions needed. Increase `numReplicas` in `railway.toml`. |
| Background jobs / cron | Railway supports cron services. Add a separate Railway service for scheduled tasks. |
| Email/SMS notifications | External service (SendGrid, Twilio). Configure via environment variables. |

---

## 9. Cost Estimate

Based on Railway's pricing as of early 2026:

| Component | Plan | Estimated Monthly Cost |
|-----------|------|----------------------|
| Node.js service (1 vCPU, 512 MB RAM) | Hobby | ~$5–10 |
| MySQL database (1 GB storage) | Plugin pricing | ~$5 |
| **Total** | | **~$10–15/month** |

Railway's **Hobby plan** ($5/month credit) covers a low-traffic deployment. The credit offsets the compute cost; you pay for usage above the credit.

**For a pilot deployment** (ZEO internal use, <100 concurrent users): the Hobby plan is sufficient. Upgrade to Pro when the platform serves the full zone.

**TiDB Cloud Serverless free tier** (if chosen instead of Railway MySQL): $0/month for Phase 1 traffic levels, reducing total Railway cost to ~$5–10.

---

*This assessment is based on Railway.app's feature set and pricing as of February 2026. Railway's offerings may change; verify current database plugin availability in the Railway dashboard before deploying.*
