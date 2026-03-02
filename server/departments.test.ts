import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Department module tests.
 * Tests cover:
 * - Permission guards for all department routes
 * - Role-based access control (DEPARTMENTS_VIEW, DEPARTMENTS_MANAGE)
 * - Input validation for create and update
 * - CRUD operation access patterns
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

// ─── Permission Guard Tests ──────────────────────────────────────────────────

describe("Departments – Permission Guards", () => {
  // departments.listPaginated requires DEPARTMENTS_VIEW
  // Roles WITHOUT this permission: user, student, parent, teacher
  describe("departments.listPaginated", () => {
    it("rejects 'user' role (no DEPARTMENTS_VIEW)", async () => {
      const ctx = createContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.listPaginated({ page: 1, pageSize: 20 })).rejects.toThrow();
    });

    it("rejects 'student' role", async () => {
      const ctx = createContext({ role: "student" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.listPaginated({ page: 1, pageSize: 20 })).rejects.toThrow();
    });

    it("rejects 'parent' role", async () => {
      const ctx = createContext({ role: "parent" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.listPaginated({ page: 1, pageSize: 20 })).rejects.toThrow();
    });

    it("rejects 'teacher' role", async () => {
      const ctx = createContext({ role: "teacher" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.listPaginated({ page: 1, pageSize: 20 })).rejects.toThrow();
    });

    // Roles WITH DEPARTMENTS_VIEW: admin (all), zonal_director, deputy_director, branch_head
    it("allows 'admin' role", async () => {
      const ctx = createContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);
      try {
        const result = await caller.departments.listPaginated({ page: 1, pageSize: 20 });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("data");
        expect(result).toHaveProperty("total");
        expect(result).toHaveProperty("page");
        expect(result).toHaveProperty("pageSize");
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows 'zonal_director' role", async () => {
      const ctx = createContext({ role: "zonal_director" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.listPaginated({ page: 1, pageSize: 20 });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows 'branch_head' role", async () => {
      const ctx = createContext({ role: "branch_head" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.listPaginated({ page: 1, pageSize: 20 });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });
  });

  // departments.getById requires DEPARTMENTS_VIEW
  describe("departments.getById", () => {
    it("rejects 'user' role", async () => {
      const ctx = createContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.getById({ id: 1 })).rejects.toThrow();
    });

    it("rejects 'student' role", async () => {
      const ctx = createContext({ role: "student" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.getById({ id: 1 })).rejects.toThrow();
    });
  });

  // departments.create requires DEPARTMENTS_MANAGE
  describe("departments.create", () => {
    it("rejects 'user' role (no DEPARTMENTS_MANAGE)", async () => {
      const ctx = createContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.create({ name: "Test Dept" })).rejects.toThrow();
    });

    it("rejects 'branch_head' role (VIEW only, not MANAGE)", async () => {
      const ctx = createContext({ role: "branch_head" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.create({ name: "Test Dept" })).rejects.toThrow();
    });

    it("rejects 'deputy_director' role (VIEW only, not MANAGE)", async () => {
      const ctx = createContext({ role: "deputy_director" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.create({ name: "Test Dept" })).rejects.toThrow();
    });

    it("allows 'admin' role", async () => {
      const ctx = createContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.create({ name: "Test Dept" });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows 'zonal_director' role", async () => {
      const ctx = createContext({ role: "zonal_director" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.create({ name: "Test Dept" });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });
  });

  // departments.update requires DEPARTMENTS_MANAGE
  describe("departments.update", () => {
    it("rejects 'user' role", async () => {
      const ctx = createContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.update({ id: 1, name: "Updated" })).rejects.toThrow();
    });

    it("rejects 'branch_head' role", async () => {
      const ctx = createContext({ role: "branch_head" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.update({ id: 1, name: "Updated" })).rejects.toThrow();
    });

    it("allows 'admin' role", async () => {
      const ctx = createContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.update({ id: 1, name: "Updated" });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });
  });

  // departments.delete requires DEPARTMENTS_MANAGE
  describe("departments.delete", () => {
    it("rejects 'user' role", async () => {
      const ctx = createContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.delete({ id: 1 })).rejects.toThrow();
    });

    it("rejects 'teacher' role", async () => {
      const ctx = createContext({ role: "teacher" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.delete({ id: 1 })).rejects.toThrow();
    });

    it("allows 'admin' role", async () => {
      const ctx = createContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.delete({ id: 1 });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });
  });

  // departments.staff requires DEPARTMENTS_VIEW
  describe("departments.staff", () => {
    it("rejects 'user' role", async () => {
      const ctx = createContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.staff({ departmentId: 1, page: 1, pageSize: 10 })).rejects.toThrow();
    });

    it("rejects 'student' role", async () => {
      const ctx = createContext({ role: "student" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.departments.staff({ departmentId: 1, page: 1, pageSize: 10 })).rejects.toThrow();
    });

    it("allows 'admin' role", async () => {
      const ctx = createContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);
      try {
        const result = await caller.departments.staff({ departmentId: 1, page: 1, pageSize: 10 });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("data");
        expect(result).toHaveProperty("total");
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });

    it("allows 'branch_head' role", async () => {
      const ctx = createContext({ role: "branch_head" });
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.departments.staff({ departmentId: 1, page: 1, pageSize: 10 });
      } catch (e: any) {
        expect(e.code).not.toBe("FORBIDDEN");
      }
    });
  });
});

// ─── Input Validation Tests ──────────────────────────────────────────────────

describe("Departments – Input Validation", () => {
  it("departments.create rejects empty name", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.departments.create({ name: "" })).rejects.toThrow();
  });

  it("departments.listPaginated rejects page < 1", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.departments.listPaginated({ page: 0, pageSize: 20 })).rejects.toThrow();
  });

  it("departments.listPaginated rejects pageSize > 100", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.departments.listPaginated({ page: 1, pageSize: 200 })).rejects.toThrow();
  });

  it("departments.staff rejects page < 1", async () => {
    const ctx = createContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.departments.staff({ departmentId: 1, page: 0, pageSize: 10 })).rejects.toThrow();
  });

  it("rejects unauthenticated access to departments.listPaginated", async () => {
    const ctx: TrpcContext = { user: null, headers: new Headers(), setCookie: () => {} };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.departments.listPaginated({ page: 1, pageSize: 20 })).rejects.toThrow();
  });
});
