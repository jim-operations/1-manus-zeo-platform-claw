import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "phase4-test-user",
    email: "phase4@test.local",
    name: "Phase 4 Tester",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Phase 4 - Report Cards", () => {
  it("reportCards.list rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.reportCards.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("reportCards.list allows parent role (GRADE_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "parent" as any }));
    const result = await caller.reportCards.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });

  it("reportCards.upsert rejects parent role (no GRADE_MANAGE)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "parent" as any }));
    await expect(caller.reportCards.upsert({
      studentId: 1,
      academicYear: 2026,
      term: "term_1",
      averageMarks: 78,
    })).rejects.toThrow();
  });

  it("reportCards.upsert validates attendanceRate <= 100", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(caller.reportCards.upsert({
      studentId: 1,
      academicYear: 2026,
      term: "term_1",
      attendanceRate: 101,
    })).rejects.toThrow();
  });
});

describe("Phase 4 - Parent Portal", () => {
  it("parentPortal.myChildren rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.parentPortal.myChildren()).rejects.toThrow();
  });

  it("parentPortal.linkChild rejects parent role (requires STUDENT_MANAGE)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "parent" as any }));
    await expect(caller.parentPortal.linkChild({
      parentUserId: 10,
      studentId: 20,
      relationship: "guardian",
    })).rejects.toThrow();
  });

  it("parentPortal.linkChild validates relationship enum", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(caller.parentPortal.linkChild({
      parentUserId: 10,
      studentId: 20,
      relationship: "uncle" as any,
    })).rejects.toThrow();
  });

  it("parentPortal.childProfile rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.parentPortal.childProfile({ studentId: 1 })).rejects.toThrow();
  });

  it("parentPortal.childAttendanceSummary validates academicYear", async () => {
    const caller = appRouter.createCaller(createContext({ role: "parent" as any }));
    await expect(caller.parentPortal.childAttendanceSummary({
      studentId: 1,
      academicYear: Number.NaN,
    } as any)).rejects.toThrow();
  });

  it("parentPortal.childReportCards allows optional input (returns empty result shape)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "parent" as any }));
    const result = await caller.parentPortal.childReportCards();
    expect(result).toEqual({ data: [], total: 0 });
  });
});

describe("Phase 4 - Procedure existence", () => {
  it("exposes reportCards procedures", () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    expect(typeof caller.reportCards.list).toBe("function");
    expect(typeof caller.reportCards.upsert).toBe("function");
  });

  it("exposes parentPortal procedures", () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    expect(typeof caller.parentPortal.linkChild).toBe("function");
    expect(typeof caller.parentPortal.myChildren).toBe("function");
    expect(typeof caller.parentPortal.childProfile).toBe("function");
    expect(typeof caller.parentPortal.childAttendanceSummary).toBe("function");
    expect(typeof caller.parentPortal.childGradeSummary).toBe("function");
    expect(typeof caller.parentPortal.childReportCards).toBe("function");
  });
});
