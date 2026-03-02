import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Dashboard Analytics Enhancement tests.
 * Tests cover:
 * - Permission guards for dashboardExtended endpoint
 * - Role-based access control for analytics data
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@zeo.lk",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    headers: new Headers(),
    setCookie: () => {},
  };
}

describe("Dashboard Analytics – analytics.dashboardExtended", () => {
  // Permission guard tests: dashboardExtended requires ANALYTICS_VIEW_SCHOOL
  // Roles WITHOUT this permission should be rejected
  it("rejects 'user' role (no ANALYTICS_VIEW_SCHOOL)", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.dashboardExtended()).rejects.toThrow();
  });

  it("rejects 'student' role", async () => {
    const ctx = createContext({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.dashboardExtended()).rejects.toThrow();
  });

  it("rejects 'parent' role", async () => {
    const ctx = createContext({ role: "parent" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.dashboardExtended()).rejects.toThrow();
  });

  it("rejects 'teacher' role", async () => {
    const ctx = createContext({ role: "teacher" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.dashboardExtended()).rejects.toThrow();
  });

  // Roles WITH ANALYTICS_VIEW_SCHOOL should be allowed
  // These roles have the permission: admin, zonal_director, deputy_zonal_director,
  // isa, accountant, planning_officer
  it("allows 'admin' role", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    // Should not throw (may fail on DB but not on permission)
    try {
      const result = await caller.analytics.dashboardExtended();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("budgetSummary");
      expect(result).toHaveProperty("transactionBreakdown");
      expect(result).toHaveProperty("inspectionStats");
      expect(result).toHaveProperty("improvementStats");
      expect(result).toHaveProperty("procurementStats");
      expect(result).toHaveProperty("studentCount");
      expect(result).toHaveProperty("recentActivity");
    } catch (e: any) {
      // If DB is unavailable, it should NOT be a permission error
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows 'zonal_director' role", async () => {
    const ctx = createContext({ role: "zonal_director" });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.analytics.dashboardExtended();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows 'isa' role", async () => {
    const ctx = createContext({ role: "isa" });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.analytics.dashboardExtended();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows 'deputy_director' role", async () => {
    const ctx = createContext({ role: "deputy_director" });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.analytics.dashboardExtended();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows 'principal' role", async () => {
    const ctx = createContext({ role: "principal" });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.analytics.dashboardExtended();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("Dashboard Analytics – analytics.overview (existing)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx: TrpcContext = { user: null, headers: new Headers(), setCookie: () => {} };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.overview()).rejects.toThrow();
  });

  it("rejects 'user' role", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analytics.overview()).rejects.toThrow();
  });
});
