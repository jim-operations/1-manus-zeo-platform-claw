import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Professional Development module tests.
 * Tests cover:
 * - Permission guards for all professionalDev routes
 * - Role-based access control (STAFF_EDIT for create/update/delete)
 * - Input validation for create and update
 * - Public read access for authenticated users
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
    req: { headers: { "x-forwarded-for": "127.0.0.1" } } as any,
  };
}

const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

// ─── Route Existence ──────────────────────────────────────────────────────

describe("Professional Development — Route Existence", () => {
  it("has professionalDev.list procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.list");
  });
  it("has professionalDev.create procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.create");
  });
  it("has professionalDev.listPaginated procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.listPaginated");
  });
  it("has professionalDev.getById procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.getById");
  });
  it("has professionalDev.update procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.update");
  });
  it("has professionalDev.delete procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.delete");
  });
  it("has professionalDev.stats procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("professionalDev.stats");
  });
});

// ─── Authentication Guards ────────────────────────────────────────────────

describe("Professional Development — Auth Guards", () => {
  const noAuth: TrpcContext = { user: null, req: {} as any };

  it("rejects unauthenticated access to list", async () => {
    await expect(caller(noAuth).professionalDev.list({ staffId: 1 })).rejects.toThrow();
  });
  it("rejects unauthenticated access to listPaginated", async () => {
    await expect(caller(noAuth).professionalDev.listPaginated()).rejects.toThrow();
  });
  it("rejects unauthenticated access to getById", async () => {
    await expect(caller(noAuth).professionalDev.getById({ id: 1 })).rejects.toThrow();
  });
  it("rejects unauthenticated access to create", async () => {
    await expect(
      caller(noAuth).professionalDev.create({
        staffId: 1,
        programName: "Test Workshop",
        programType: "workshop",
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });
  it("rejects unauthenticated access to update", async () => {
    await expect(
      caller(noAuth).professionalDev.update({ id: 1, programName: "Updated" })
    ).rejects.toThrow();
  });
  it("rejects unauthenticated access to delete", async () => {
    await expect(caller(noAuth).professionalDev.delete({ id: 1 })).rejects.toThrow();
  });
  it("rejects unauthenticated access to stats", async () => {
    await expect(caller(noAuth).professionalDev.stats()).rejects.toThrow();
  });
});

// ─── Permission Guards (Write Operations) ─────────────────────────────────

describe("Professional Development — Permission Guards", () => {
  // 'user' role does not have STAFF_EDIT permission
  const userCtx = createContext({ role: "user" });
  // 'teacher' role does not have STAFF_EDIT permission
  const teacherCtx = createContext({ role: "teacher" });

  it("denies create to user role (no STAFF_EDIT)", async () => {
    await expect(
      caller(userCtx).professionalDev.create({
        staffId: 1,
        programName: "Test Workshop",
        programType: "workshop",
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("denies create to teacher role (no STAFF_EDIT)", async () => {
    await expect(
      caller(teacherCtx).professionalDev.create({
        staffId: 1,
        programName: "Test Workshop",
        programType: "workshop",
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("denies update to user role (no STAFF_EDIT)", async () => {
    await expect(
      caller(userCtx).professionalDev.update({ id: 1, programName: "Updated" })
    ).rejects.toThrow();
  });

  it("denies delete to user role (no STAFF_EDIT)", async () => {
    await expect(
      caller(userCtx).professionalDev.delete({ id: 1 })
    ).rejects.toThrow();
  });
});

// ─── Input Validation ─────────────────────────────────────────────────────

describe("Professional Development — Input Validation", () => {
  const adminCtx = createContext({ role: "admin" });

  it("rejects create with empty programName", async () => {
    await expect(
      caller(adminCtx).professionalDev.create({
        staffId: 1,
        programName: "",
        programType: "workshop",
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("rejects create with invalid programType", async () => {
    await expect(
      caller(adminCtx).professionalDev.create({
        staffId: 1,
        programName: "Test",
        programType: "invalid_type" as any,
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("accepts valid programType values", async () => {
    const validTypes = ["workshop", "seminar", "conference", "course", "certification", "other"];
    for (const type of validTypes) {
      // Should not throw on input validation (may throw on DB operation)
      try {
        await caller(adminCtx).professionalDev.create({
          staffId: 1,
          programName: `Test ${type}`,
          programType: type as any,
          startDate: new Date(),
        });
      } catch (e: any) {
        // DB errors are acceptable, input validation errors are not
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });

  it("rejects list with non-number staffId", async () => {
    await expect(
      caller(adminCtx).professionalDev.list({ staffId: "abc" as any })
    ).rejects.toThrow();
  });

  it("rejects listPaginated with page < 1", async () => {
    await expect(
      caller(adminCtx).professionalDev.listPaginated({ page: 0, pageSize: 25 })
    ).rejects.toThrow();
  });

  it("rejects listPaginated with pageSize > 100", async () => {
    await expect(
      caller(adminCtx).professionalDev.listPaginated({ page: 1, pageSize: 200 })
    ).rejects.toThrow();
  });
});

// ─── Read Access for Authenticated Users ──────────────────────────────────

describe("Professional Development — Read Access", () => {
  // Any authenticated user should be able to read
  const userCtx = createContext({ role: "user" });
  const teacherCtx = createContext({ role: "teacher" });

  it("allows user role to access listPaginated", async () => {
    // Should not throw UNAUTHORIZED - may throw DB error
    try {
      await caller(userCtx).professionalDev.listPaginated();
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows teacher role to access stats", async () => {
    try {
      await caller(teacherCtx).professionalDev.stats();
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("allows user role to access getById", async () => {
    try {
      await caller(userCtx).professionalDev.getById({ id: 1 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});
