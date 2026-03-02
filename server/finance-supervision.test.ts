import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Phase 3: Finance & Procurement + Supervision & QA module tests.
 * Tests cover:
 * - Permission guards for all Finance & Supervision routes
 * - Input validation for budget, transaction, salary, procurement, inspection, plan, scorecard
 * - Role-based access control verification
 */

// ─── Test Helpers ────────────────────────────────────────────────────────
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

// ─── Finance Module: Permission Guards ───────────────────────────────────
describe("Finance Module: Permission Guards", () => {
  it("finance.budgets.list rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.finance.budgets.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("finance.budgets.list rejects 'user' role (no BUDGET_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.finance.budgets.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("finance.transactions.list rejects 'user' role (no TRANSACTION_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.finance.transactions.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("finance.salary.list rejects 'user' role (no SALARY_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.finance.salary.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("finance.procurement.list rejects 'user' role (no PROCUREMENT_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.finance.procurement.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("finance.vendors.list rejects 'user' role (no VENDOR_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.finance.vendors.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("finance.budgets.list allows 'admin' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    // Should not throw (may return empty data from DB)
    const result = await caller.finance.budgets.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("finance.transactions.list allows 'zonal_director' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "zonal_director" as any }));
    const result = await caller.finance.transactions.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
  });

  it("finance.salary.list allows 'deputy_director' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "deputy_director" as any }));
    const result = await caller.finance.salary.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
  });
});

// ─── Finance Module: Input Validation ────────────────────────────────────
describe("Finance Module: Input Validation", () => {
  it("finance.budgets.create rejects empty title", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.budgets.create({
        fiscalYear: "2025/2026",
        title: "",
        totalAllocated: 1000000,
        lineItems: [],
      })
    ).rejects.toThrow();
  });

  it("finance.transactions.create rejects negative amount", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.transactions.create({
        budgetId: 1,
        type: "expenditure",
        category: "salary",
        amount: -100,
        description: "Invalid negative",
        transactionDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("finance.salary.create rejects month > 12", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.salary.create({
        staffId: 1,
        month: 13,
        year: 2026,
        grossPay: 50000,
        netPay: 45000,
      })
    ).rejects.toThrow();
  });

  it("finance.salary.create rejects month < 1", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.salary.create({
        staffId: 1,
        month: 0,
        year: 2026,
        grossPay: 50000,
        netPay: 45000,
      })
    ).rejects.toThrow();
  });

  it("finance.vendors.create rejects invalid email", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.vendors.create({
        name: "Test Vendor",
        category: "stationery",
        email: "not-an-email",
      })
    ).rejects.toThrow();
  });

  it("finance.vendors.create rejects empty name", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.vendors.create({
        name: "",
        category: "stationery",
      })
    ).rejects.toThrow();
  });

  it("finance.procurement.create rejects empty title", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.finance.procurement.create({
        title: "",
        items: [{ name: "Item 1", quantity: 1, unitPrice: 100, total: 100 }],
        totalEstimatedCost: 100,
      })
    ).rejects.toThrow();
  });
});

// ─── Supervision Module: Permission Guards ───────────────────────────────
describe("Supervision Module: Permission Guards", () => {
  it("supervision.inspections.list rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.supervision.inspections.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("supervision.inspections.list rejects 'user' role (no INSPECTION_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.supervision.inspections.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("supervision.templates.list rejects 'user' role (no INSPECTION_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.supervision.templates.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("supervision.plans.list rejects 'user' role (no IMPROVEMENT_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.supervision.plans.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("supervision.scorecards.list rejects 'user' role (no SCORECARD_VIEW)", async () => {
    const caller = appRouter.createCaller(createContext({ role: "user" }));
    await expect(caller.supervision.scorecards.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("supervision.inspections.list allows 'admin' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    const result = await caller.supervision.inspections.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("supervision.inspections.list allows 'isa' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "isa" as any }));
    const result = await caller.supervision.inspections.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
  });

  it("supervision.plans.list allows 'principal' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "principal" as any }));
    const result = await caller.supervision.plans.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
  });

  it("supervision.scorecards.list allows 'branch_head' role", async () => {
    const caller = appRouter.createCaller(createContext({ role: "branch_head" as any }));
    const result = await caller.supervision.scorecards.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("items");
  });
});

// ─── Supervision Module: Input Validation ────────────────────────────────
describe("Supervision Module: Input Validation", () => {
  it("supervision.templates.create rejects empty name", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.supervision.templates.create({
        name: "",
        category: "general",
        formSchema: [],
      })
    ).rejects.toThrow();
  });

  it("supervision.inspections.submit rejects score > 100", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.supervision.inspections.submit({
        id: 1,
        formData: {},
        overallScore: 150,
        summary: "Test",
      })
    ).rejects.toThrow();
  });

  it("supervision.inspections.submit rejects score < 0", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.supervision.inspections.submit({
        id: 1,
        formData: {},
        overallScore: -10,
        summary: "Test",
      })
    ).rejects.toThrow();
  });

  it("supervision.plans.create rejects empty title", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.supervision.plans.create({
        schoolId: 1,
        title: "",
        recommendations: [],
      })
    ).rejects.toThrow();
  });

  it("supervision.scorecards.create rejects overallScore > 100", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.supervision.scorecards.create({
        schoolId: 1,
        academicYear: "2025/2026",
        overallScore: 150,
        componentScores: {},
      })
    ).rejects.toThrow();
  });

  it("supervision.scorecards.create rejects overallScore < 0", async () => {
    const caller = appRouter.createCaller(createContext({ role: "admin" }));
    await expect(
      caller.supervision.scorecards.create({
        schoolId: 1,
        academicYear: "2025/2026",
        overallScore: -5,
        componentScores: {},
      })
    ).rejects.toThrow();
  });
});

// ─── Cross-module: Teacher role restrictions ─────────────────────────────
describe("Cross-module: Teacher role restrictions", () => {
  it("teacher cannot access budget management", async () => {
    const caller = appRouter.createCaller(createContext({ role: "teacher" as any }));
    await expect(caller.finance.budgets.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("teacher cannot access salary records", async () => {
    const caller = appRouter.createCaller(createContext({ role: "teacher" as any }));
    await expect(caller.finance.salary.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("teacher cannot access procurement", async () => {
    const caller = appRouter.createCaller(createContext({ role: "teacher" as any }));
    await expect(caller.finance.procurement.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("teacher cannot access inspections", async () => {
    const caller = appRouter.createCaller(createContext({ role: "teacher" as any }));
    await expect(caller.supervision.inspections.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("teacher cannot access improvement plans", async () => {
    const caller = appRouter.createCaller(createContext({ role: "teacher" as any }));
    await expect(caller.supervision.plans.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("teacher cannot access scorecards", async () => {
    const caller = appRouter.createCaller(createContext({ role: "teacher" as any }));
    await expect(caller.supervision.scorecards.list({ page: 1, pageSize: 20 })).rejects.toThrow();
  });
});

// ─── Cross-module: Principal role access ─────────────────────────────────
describe("Cross-module: Principal role access", () => {
  it("principal can view budgets", async () => {
    const caller = appRouter.createCaller(createContext({ role: "principal" as any }));
    const result = await caller.finance.budgets.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
  });

  it("principal can view transactions", async () => {
    const caller = appRouter.createCaller(createContext({ role: "principal" as any }));
    const result = await caller.finance.transactions.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
  });

  it("principal can view improvement plans", async () => {
    const caller = appRouter.createCaller(createContext({ role: "principal" as any }));
    const result = await caller.supervision.plans.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
  });

  it("principal can view scorecards", async () => {
    const caller = appRouter.createCaller(createContext({ role: "principal" as any }));
    const result = await caller.supervision.scorecards.list({ page: 1, pageSize: 20 });
    expect(result).toBeDefined();
  });
});
