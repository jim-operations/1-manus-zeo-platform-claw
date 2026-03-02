import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { ZeoRole } from "../drizzle/schema";

function createMockContext(role: ZeoRole = "admin", userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: `test${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("SIS Router - Authentication Guards", () => {
  it("students.list requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.students.list({ page: 1, pageSize: 10 })).rejects.toThrow();
  });

  it("enrollments.list requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.enrollments.list({ page: 1, pageSize: 10 })).rejects.toThrow();
  });

  it("attendance.getByDate requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.attendance.getByDate({ schoolId: 1, date: "2026-01-15" })).rejects.toThrow();
  });

  it("studentGrades.list requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.studentGrades.list({ page: 1, pageSize: 10 })).rejects.toThrow();
  });

  it("scholarships.programs.list requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.scholarships.programs.list({ page: 1, pageSize: 10 })).rejects.toThrow();
  });
});

describe("SIS Router - Input Validation", () => {
  it("students.create rejects missing required fields", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    await expect(
      caller.students.create({
        admissionNumber: "",
        fullName: "",
        dateOfBirth: "2015-01-01",
        gender: "male",
      })
    ).rejects.toThrow();
  });

  it("students.create accepts valid input shape (DB may still reject in test env)", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    try {
      await caller.students.create({
        admissionNumber: "ADM-001",
        fullName: "Test Student",
        dateOfBirth: "2015-01-01",
        gender: "male",
      });
    } catch (e: any) {
      expect(e.message).not.toMatch(/input|validation/i);
    }
  });

  it("attendance.markBulk validates status enum", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    await expect(
      caller.attendance.markBulk({
        schoolId: 1,
        date: "2026-01-15",
        records: [{ studentId: 1, status: "invalid_status" as any }],
      })
    ).rejects.toThrow();
  });

  it("studentGrades.enter validates obtainedMarks is non-negative", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    await expect(
      caller.studentGrades.enter({
        studentId: 1,
        subjectId: 1,
        academicYear: 2026,
        term: "term_1",
        assessmentType: "term_exam",
        maxMarks: 100,
        obtainedMarks: -5,
      })
    ).rejects.toThrow();
  });

  it("scholarships.programs.create validates required fields", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    await expect(
      caller.scholarships.programs.create({
        name: "",
        description: "Test program",
      })
    ).rejects.toThrow();
  });
});

describe("SIS Router - Query Shape & Pagination", () => {
  it("students.list returns data/total", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    const result = await caller.students.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });

  it("enrollments.list returns data/total", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    const result = await caller.enrollments.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });

  it("attendance.getByDate returns an array", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    const result = await caller.attendance.getByDate({ schoolId: 1, date: "2026-01-15" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("studentGrades.list returns data/total", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    const result = await caller.studentGrades.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });

  it("scholarships.programs.list returns data/total", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));
    const result = await caller.scholarships.programs.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
  });
});

describe("i18n Configuration", () => {
  it("translation files have matching top-level keys", async () => {
    const en = await import("../client/src/i18n/en.json");
    const si = await import("../client/src/i18n/si.json");
    const ta = await import("../client/src/i18n/ta.json");

    const enKeys = Object.keys(en.default).sort();
    const siKeys = Object.keys(si.default).sort();
    const taKeys = Object.keys(ta.default).sort();

    expect(siKeys).toEqual(enKeys);
    expect(taKeys).toEqual(enKeys);
  });

  it("all nav translation keys are present in all languages", async () => {
    const en = await import("../client/src/i18n/en.json");
    const si = await import("../client/src/i18n/si.json");
    const ta = await import("../client/src/i18n/ta.json");

    const enNavKeys = Object.keys(en.default.nav).sort();
    const siNavKeys = Object.keys(si.default.nav).sort();
    const taNavKeys = Object.keys(ta.default.nav).sort();

    expect(siNavKeys).toEqual(enNavKeys);
    expect(taNavKeys).toEqual(enNavKeys);
  });

  it("Sinhala translations contain Sinhala Unicode characters", async () => {
    const si = await import("../client/src/i18n/si.json");
    // Sinhala Unicode range: U+0D80 to U+0DFF
    expect(si.default.common.appName).toMatch(/[\u0D80-\u0DFF]/);
    expect(si.default.nav.dashboard).toMatch(/[\u0D80-\u0DFF]/);
  });

  it("Tamil translations contain Tamil Unicode characters", async () => {
    const ta = await import("../client/src/i18n/ta.json");
    // Tamil Unicode range: U+0B80 to U+0BFF
    expect(ta.default.common.appName).toMatch(/[\u0B80-\u0BFF]/);
    expect(ta.default.nav.dashboard).toMatch(/[\u0B80-\u0BFF]/);
  });
});
