import { and, desc, eq, gte, lte, sql, like, or, inArray, count, isNotNull, isNull, gt, sum, getTableColumns, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  schools, InsertSchool,
  departments, InsertDepartment,
  staffProfiles, InsertStaffProfile,
  serviceHistory, InsertServiceHistory,
  leaveRequests, InsertLeaveRequest,
  leaveBalances, InsertLeaveBalance,
  transferRequests, InsertTransferRequest,
  professionalDevelopment, InsertProfessionalDevelopment,
  announcements, InsertAnnouncement,
  announcementReads,
  notifications, InsertNotification,
  messageThreads, InsertMessageThread,
  threadParticipants,
  messages, InsertMessage,
  auditLogs, InsertAuditLog,
  studentProfiles, InsertStudentProfile,
  enrollments, InsertEnrollment,
  attendanceRecords, InsertAttendanceRecord,
  subjects, InsertSubject,
  grades, InsertGrade,
  scholarshipPrograms, InsertScholarshipProgram,
  scholarshipApplications, InsertScholarshipApplication,
  parentStudentLinks, InsertParentStudentLink,
  reportCards, InsertReportCard,
  budgets, InsertBudget,
  transactions, InsertTransaction,
  salaryRecords, InsertSalaryRecord,
  vendors, InsertVendor,
  purchaseRequisitions, InsertPurchaseRequisition,
  inspectionTemplates, InsertInspectionTemplate,
  inspections, InsertInspection,
  improvementPlans, InsertImprovementPlan,
  schoolScorecards, InsertSchoolScorecard,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Sanitize LIKE wildcards (S5) ───────────────────────────────────────────
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers(filters?: { role?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.role) conditions.push(eq(users.role, filters.role as any));
  if (filters?.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));
  return db.select().from(users).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(users.createdAt));
}

export async function listUsersPaginated(page: number, pageSize: number) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const [data, countResult] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
}

export async function searchUsersForMessages(query: string) {
  const db = await getDb();
  if (!db) return [];
  const escaped = escapeLike(query);
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(or(like(users.name, `%${escaped}%`), like(users.email, `%${escaped}%`)))
    .limit(20);
}

// ─── Schools ─────────────────────────────────────────────────────────────────
export async function listSchools() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      ...getTableColumns(schools),
      principalName: staffProfiles.fullName,
    })
    .from(schools)
    .leftJoin(staffProfiles, eq(schools.principalId, staffProfiles.id))
    .where(eq(schools.isActive, true))
    .orderBy(schools.name);
}

export async function listSchoolsPaginated(page: number, pageSize: number, search?: string) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions = [eq(schools.isActive, true)];
  if (search) {
    const escaped = escapeLike(search);
    conditions.push(or(like(schools.name, `%${escaped}%`), like(schools.code, `%${escaped}%`), like(schools.division, `%${escaped}%`))!);
  }
  const where = and(...conditions);
  const [data, countResult] = await Promise.all([
    db
      .select({
        ...getTableColumns(schools),
        principalName: staffProfiles.fullName,
      })
      .from(schools)
      .leftJoin(staffProfiles, eq(schools.principalId, staffProfiles.id))
      .where(where)
      .orderBy(schools.name)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schools).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getSchoolById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
  return result[0];
}

export async function getSchoolNameMap(ids: number[]): Promise<Map<number, string>> {
  const db = await getDb();
  if (!db || ids.length === 0) return new Map();
  const result = await db.select({ id: schools.id, name: schools.name }).from(schools).where(inArray(schools.id, ids));
  return new Map(result.map(r => [r.id, r.name]));
}

export async function createSchool(data: InsertSchool) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schools).values(data);
  return result[0].insertId;
}

export async function updateSchool(id: number, data: Partial<InsertSchool>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schools).set(data).where(eq(schools.id, id));
}

// ─── Departments ─────────────────────────────────────────────────────────────
export async function listDepartments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).where(eq(departments.isActive, true)).orderBy(departments.name);
}

export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(data);
  return result[0].insertId;
}

export async function listDepartmentsPaginated(
  page: number,
  pageSize: number,
  filters?: { search?: string; isActive?: boolean }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions: any[] = [];
  if (filters?.isActive !== undefined) conditions.push(eq(departments.isActive, filters.isActive));
  else conditions.push(eq(departments.isActive, true));
  if (filters?.search) {
    const escaped = filters.search.replace(/%/g, "\\%").replace(/_/g, "\\_");
    conditions.push(or(
      like(departments.name, `%${escaped}%`),
      like(departments.code, `%${escaped}%`),
    )!);
  }
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];
  const [data, countResult] = await Promise.all([
    db.select().from(departments).where(where).orderBy(departments.name).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(departments).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result[0];
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete
  await db.update(departments).set({ isActive: false }).where(eq(departments.id, id));
}

export async function getDepartmentStaffCount() {
  const db = await getDb();
  if (!db) return new Map<number, number>();
  const rows = await db.select({
    departmentId: staffProfiles.departmentId,
    count: sql<number>`count(*)`,
  }).from(staffProfiles)
    .where(and(eq(staffProfiles.isActive, true), sql`${staffProfiles.departmentId} IS NOT NULL`))
    .groupBy(staffProfiles.departmentId);
  return new Map(rows.map(r => [r.departmentId!, Number(r.count)]));
}

export async function getStaffByDepartment(departmentId: number, page: number, pageSize: number) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const where = and(eq(staffProfiles.departmentId, departmentId), eq(staffProfiles.isActive, true));
  const [data, countResult] = await Promise.all([
    db.select({
      id: staffProfiles.id,
      fullName: staffProfiles.fullName,
      designation: staffProfiles.designation,
      phone: staffProfiles.phone,
      personalEmail: staffProfiles.personalEmail,
      schoolId: staffProfiles.schoolId,
    }).from(staffProfiles).where(where).orderBy(staffProfiles.fullName).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(staffProfiles).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

// ─── Staff Profiles ──────────────────────────────────────────────────────────
export async function listStaffProfiles(filters?: { schoolId?: number; departmentId?: number; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(staffProfiles.isActive, true)];
  if (filters?.schoolId) conditions.push(eq(staffProfiles.schoolId, filters.schoolId));
  if (filters?.departmentId) conditions.push(eq(staffProfiles.departmentId, filters.departmentId));
  if (filters?.search) {
    const escaped = escapeLike(filters.search);
    conditions.push(or(
      like(staffProfiles.fullName, `%${escaped}%`),
      like(staffProfiles.nic, `%${escaped}%`),
      like(staffProfiles.designation, `%${escaped}%`),
    )!);
  }
  return db.select().from(staffProfiles).where(and(...conditions)).orderBy(staffProfiles.fullName);
}

export async function listStaffProfilesPaginated(
  page: number,
  pageSize: number,
  filters?: { schoolId?: number; departmentId?: number; search?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions = [eq(staffProfiles.isActive, true)];
  if (filters?.schoolId) conditions.push(eq(staffProfiles.schoolId, filters.schoolId));
  if (filters?.departmentId) conditions.push(eq(staffProfiles.departmentId, filters.departmentId));
  if (filters?.search) {
    const escaped = escapeLike(filters.search);
    conditions.push(or(
      like(staffProfiles.fullName, `%${escaped}%`),
      like(staffProfiles.nic, `%${escaped}%`),
      like(staffProfiles.designation, `%${escaped}%`),
    )!);
  }
  const where = and(...conditions);
  const [data, countResult] = await Promise.all([
    db.select().from(staffProfiles).where(where).orderBy(staffProfiles.fullName).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(staffProfiles).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getStaffProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staffProfiles).where(eq(staffProfiles.id, id)).limit(1);
  return result[0];
}

export async function getStaffProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function createStaffProfile(data: InsertStaffProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(staffProfiles).values(data);
  return result[0].insertId;
}

export async function updateStaffProfile(id: number, data: Partial<InsertStaffProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffProfiles).set(data).where(eq(staffProfiles.id, id));
}

// ─── Service History ─────────────────────────────────────────────────────────
export async function getServiceHistory(staffId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceHistory).where(eq(serviceHistory.staffId, staffId)).orderBy(desc(serviceHistory.effectiveDate));
}

export async function createServiceRecord(data: InsertServiceHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceHistory).values(data);
  return result[0].insertId;
}

// ─── Leave Requests ──────────────────────────────────────────────────────────
export async function listLeaveRequests(filters?: { staffId?: number; status?: string; schoolId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.staffId) conditions.push(eq(leaveRequests.staffId, filters.staffId));
  if (filters?.status) conditions.push(eq(leaveRequests.status, filters.status as any));
  return db.select().from(leaveRequests).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(leaveRequests.createdAt));
}

export async function listLeaveRequestsPaginated(
  page: number,
  pageSize: number,
  filters?: { staffId?: number; status?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions = [];
  if (filters?.staffId) conditions.push(eq(leaveRequests.staffId, filters.staffId));
  if (filters?.status) conditions.push(eq(leaveRequests.status, filters.status as any));
  if (filters?.search) {
    const escaped = escapeLike(filters.search);
    const pattern = `%${escaped}%`;
    conditions.push(or(
      like(leaveRequests.reason, pattern),
      like(leaveRequests.leaveType, pattern),
      like(leaveRequests.status, pattern),
      sql`${leaveRequests.staffId} in (select ${staffProfiles.id} from ${staffProfiles} where ${like(staffProfiles.fullName, pattern)})`,
    )!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rawData, countResult] = await Promise.all([
    db.select().from(leaveRequests).where(where).orderBy(desc(leaveRequests.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(leaveRequests).where(where),
  ]);

  // Enrich with staff names
  const staffIds = Array.from(new Set(rawData.map(r => r.staffId)));
  const staffMap = new Map<number, string>();
  if (staffIds.length > 0) {
    const staffRows = await db.select({ id: staffProfiles.id, fullName: staffProfiles.fullName }).from(staffProfiles).where(inArray(staffProfiles.id, staffIds));
    staffRows.forEach(s => staffMap.set(s.id, s.fullName));
  }

  const data = rawData.map(r => ({ ...r, staffName: staffMap.get(r.staffId) ?? `Staff #${r.staffId}` }));
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getLeaveRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
  return result[0];
}

export async function createLeaveRequest(data: InsertLeaveRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leaveRequests).values(data);
  return result[0].insertId;
}

export async function updateLeaveRequest(id: number, data: Partial<InsertLeaveRequest>) {
  const db = await getDb();
  if (!db) return;
  await db.update(leaveRequests).set(data).where(eq(leaveRequests.id, id));
}

// ─── Leave Balances ──────────────────────────────────────────────────────────
export async function getLeaveBalance(staffId: number, year: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leaveBalances).where(and(eq(leaveBalances.staffId, staffId), eq(leaveBalances.year, year))).limit(1);
  return result[0];
}

export async function upsertLeaveBalance(data: InsertLeaveBalance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leaveBalances).values(data).onDuplicateKeyUpdate({
    set: {
      casualTotal: data.casualTotal,
      casualUsed: data.casualUsed,
      sickTotal: data.sickTotal,
      sickUsed: data.sickUsed,
      annualTotal: data.annualTotal,
      annualUsed: data.annualUsed,
      dutyTotal: data.dutyTotal,
      dutyUsed: data.dutyUsed,
    },
  });
}

// B1: Increment leave used on approval
export async function incrementLeaveUsed(staffId: number, year: number, usedField: string, days: number) {
  const db = await getDb();
  if (!db) return;
  // Ensure balance record exists
  const existing = await getLeaveBalance(staffId, year);
  if (!existing) {
    await db.insert(leaveBalances).values({ staffId, year } as any);
  }
  await db.update(leaveBalances)
    .set({ [usedField]: sql`${sql.identifier(usedField)} + ${days}` } as any)
    .where(and(eq(leaveBalances.staffId, staffId), eq(leaveBalances.year, year)));
}

// ─── Transfer Requests ───────────────────────────────────────────────────────
export async function listTransferRequests(filters?: { staffId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.staffId) conditions.push(eq(transferRequests.staffId, filters.staffId));
  if (filters?.status) conditions.push(eq(transferRequests.status, filters.status as any));
  return db.select().from(transferRequests).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(transferRequests.createdAt));
}

export async function listTransferRequestsPaginated(
  page: number,
  pageSize: number,
  filters?: { staffId?: number; status?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions = [];
  if (filters?.staffId) conditions.push(eq(transferRequests.staffId, filters.staffId));
  if (filters?.status) conditions.push(eq(transferRequests.status, filters.status as any));
  if (filters?.search) {
    const escaped = escapeLike(filters.search);
    const pattern = `%${escaped}%`;
    conditions.push(or(
      like(transferRequests.reason, pattern),
      like(transferRequests.status, pattern),
      like(transferRequests.workflowState, pattern),
      sql`${transferRequests.staffId} in (select ${staffProfiles.id} from ${staffProfiles} where ${like(staffProfiles.fullName, pattern)})`,
      sql`${transferRequests.currentSchoolId} in (select ${schools.id} from ${schools} where ${like(schools.name, pattern)})`,
      sql`${transferRequests.requestedSchoolId} in (select ${schools.id} from ${schools} where ${like(schools.name, pattern)})`,
    )!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rawData, countResult] = await Promise.all([
    db.select().from(transferRequests).where(where).orderBy(desc(transferRequests.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(where),
  ]);

  // B9: Enrich with school names and staff names
  const schoolIds = Array.from(new Set(rawData.flatMap(r => [r.currentSchoolId, r.requestedSchoolId].filter(Boolean) as number[])));
  const staffIds = Array.from(new Set(rawData.map(r => r.staffId)));

  const [schoolNameMap, staffRows] = await Promise.all([
    getSchoolNameMap(schoolIds),
    staffIds.length > 0
      ? db.select({ id: staffProfiles.id, fullName: staffProfiles.fullName }).from(staffProfiles).where(inArray(staffProfiles.id, staffIds))
      : Promise.resolve([]),
  ]);
  const staffMap = new Map(staffRows.map(s => [s.id, s.fullName]));

  const data = rawData.map(r => ({
    ...r,
    staffName: staffMap.get(r.staffId) ?? `Staff #${r.staffId}`,
    currentSchoolName: r.currentSchoolId ? (schoolNameMap.get(r.currentSchoolId) ?? `School #${r.currentSchoolId}`) : null,
    requestedSchoolName: r.requestedSchoolId ? (schoolNameMap.get(r.requestedSchoolId) ?? `School #${r.requestedSchoolId}`) : null,
  }));

  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getTransferRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transferRequests).where(eq(transferRequests.id, id)).limit(1);
  return result[0];
}

export async function createTransferRequest(data: InsertTransferRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transferRequests).values(data);
  return result[0].insertId;
}

export async function updateTransferRequest(id: number, data: Partial<InsertTransferRequest>) {
  const db = await getDb();
  if (!db) return;
  await db.update(transferRequests).set(data).where(eq(transferRequests.id, id));
}

// ─── Professional Development ────────────────────────────────────────────────
export async function listProfessionalDevelopment(staffId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(professionalDevelopment).where(eq(professionalDevelopment.staffId, staffId)).orderBy(desc(professionalDevelopment.startDate));
}

export async function createProfessionalDevelopment(data: InsertProfessionalDevelopment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(professionalDevelopment).values(data);
  return result[0].insertId;
}

// ─── Announcements ───────────────────────────────────────────────────────────
export async function listAnnouncements(filters?: { category?: string; isPublished?: boolean; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.category) conditions.push(eq(announcements.category, filters.category as any));
  if (filters?.isPublished !== undefined) conditions.push(eq(announcements.isPublished, filters.isPublished));
  const query = db.select().from(announcements).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  if (filters?.limit) return query.limit(filters.limit);
  return query;
}

export async function listAnnouncementsPaginated(
  page: number,
  pageSize: number,
  filters?: { category?: string; isPublished?: boolean; search?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions = [];
  if (filters?.category) conditions.push(eq(announcements.category, filters.category as any));
  if (filters?.isPublished !== undefined) conditions.push(eq(announcements.isPublished, filters.isPublished));
  if (filters?.search) {
    const escaped = escapeLike(filters.search);
    conditions.push(or(like(announcements.title, `%${escaped}%`), like(announcements.content, `%${escaped}%`))!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [data, countResult] = await Promise.all([
    db.select().from(announcements).where(where).orderBy(desc(announcements.isPinned), desc(announcements.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(announcements).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getAnnouncementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return result[0];
}

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(data);
  return result[0].insertId;
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) return;
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function markAnnouncementRead(announcementId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(announcementReads).where(and(eq(announcementReads.announcementId, announcementId), eq(announcementReads.userId, userId))).limit(1);
  if (existing.length === 0) {
    await db.insert(announcementReads).values({ announcementId, userId });
    await db.update(announcements).set({ readCount: sql`${announcements.readCount} + 1` }).where(eq(announcements.id, announcementId));
  }
}

// ─── Notifications ───────────────────────────────────────────────────────────
export async function listNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Messages ────────────────────────────────────────────────────────────────
export async function listUserThreads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const participantThreads = await db.select({ threadId: threadParticipants.threadId }).from(threadParticipants).where(eq(threadParticipants.userId, userId));
  if (participantThreads.length === 0) return [];
  const threadIds = participantThreads.map(p => p.threadId);
  return db.select().from(messageThreads).where(inArray(messageThreads.id, threadIds)).orderBy(desc(messageThreads.lastMessageAt));
}

export async function getThreadMessages(threadId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(messages.createdAt).limit(limit);
}

export async function createThread(data: InsertMessageThread, participantIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messageThreads).values(data);
  const threadId = result[0].insertId;
  for (const userId of participantIds) {
    await db.insert(threadParticipants).values({ threadId, userId });
  }
  return threadId;
}

export async function sendMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, data.threadId));
  return result[0].insertId;
}

export async function getThreadParticipants(threadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(threadParticipants).where(eq(threadParticipants.threadId, threadId));
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function listAuditLogs(filters?: { userId?: number; entityType?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  const query = db.select().from(auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(auditLogs.createdAt));
  if (filters?.limit) return query.limit(filters.limit);
  return query.limit(200);
}

export async function listAuditLogsPaginated(
  page: number,
  pageSize: number,
  filters?: { userId?: number; entityType?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const conditions = [];
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [data, countResult] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0, page, pageSize };
}

// ─── Analytics Helpers ───────────────────────────────────────────────────────
export async function getStaffCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(staffProfiles).where(eq(staffProfiles.isActive, true));
  return result[0]?.count ?? 0;
}

export async function getSchoolCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(schools).where(eq(schools.isActive, true));
  return result[0]?.count ?? 0;
}

export async function getPendingLeaveCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
  return result[0]?.count ?? 0;
}

export async function getPendingTransferCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(eq(transferRequests.status, "pending"));
  return result[0]?.count ?? 0;
}

export async function getAnnouncementCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(announcements).where(eq(announcements.isPublished, true));
  return result[0]?.count ?? 0;
}

export async function getStaffByDesignation() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    designation: staffProfiles.designation,
    count: sql<number>`count(*)`,
  }).from(staffProfiles).where(eq(staffProfiles.isActive, true)).groupBy(staffProfiles.designation).orderBy(desc(sql`count(*)`)).limit(10);
}

export async function getLeaveByType() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    leaveType: leaveRequests.leaveType,
    count: sql<number>`count(*)`,
  }).from(leaveRequests).groupBy(leaveRequests.leaveType).orderBy(desc(sql`count(*)`));
}


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Student Information System (SIS) Queries
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Students ───────────────────────────────────────────────────────────────
export async function getStudents(opts: { page: number; pageSize: number; search?: string; schoolId?: number; grade?: string }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: any[] = [eq(studentProfiles.isActive, true)];
  if (opts.search) {
    const s = `%${escapeLike(opts.search)}%`;
    conditions.push(or(like(studentProfiles.fullName, s), like(studentProfiles.admissionNumber ?? "", s)));
  }
  if (opts.schoolId) {
    // filter by students enrolled in this school (current year active)
    const enrolledIds = db.select({ id: enrollments.studentId }).from(enrollments)
      .where(and(eq(enrollments.schoolId, opts.schoolId), eq(enrollments.status, "active")));
    conditions.push(inArray(studentProfiles.id, enrolledIds));
  }
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];
  const [rows, countResult] = await Promise.all([
    db.select().from(studentProfiles).where(where)
      .orderBy(desc(studentProfiles.createdAt))
      .limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(studentProfiles).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id)).limit(1);
  return rows[0];
}

export async function createStudent(data: InsertStudentProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(studentProfiles).values(data);
}

export async function updateStudent(id: number, data: Partial<InsertStudentProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studentProfiles).set(data).where(eq(studentProfiles.id, id));
}

// ─── Enrollments ────────────────────────────────────────────────────────────
export async function getEnrollments(opts: { studentId?: number; schoolId?: number; academicYear?: number; page: number; pageSize: number }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: any[] = [];
  if (opts.studentId) conditions.push(eq(enrollments.studentId, opts.studentId));
  if (opts.schoolId) conditions.push(eq(enrollments.schoolId, opts.schoolId));
  if (opts.academicYear) conditions.push(eq(enrollments.academicYear, opts.academicYear));
  const where = conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(enrollments).where(where)
      .orderBy(desc(enrollments.enrollmentDate))
      .limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(enrollments).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function createEnrollment(data: InsertEnrollment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(enrollments).values(data);
}

export async function updateEnrollment(id: number, data: Partial<InsertEnrollment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(enrollments).set(data).where(eq(enrollments.id, id));
}

export async function getActiveEnrollment(studentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(enrollments)
    .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, "active")))
    .orderBy(desc(enrollments.academicYear)).limit(1);
  return rows[0];
}

// ─── Attendance ─────────────────────────────────────────────────────────────
export async function markAttendance(records: InsertAttendanceRecord[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (records.length === 0) return;
  await db.insert(attendanceRecords).values(records);
}

export async function getAttendanceByDate(opts: { schoolId: number; date: string; grade?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [
    eq(attendanceRecords.schoolId, opts.schoolId),
    sql`DATE(${attendanceRecords.date}) = ${opts.date}`,
  ];
  return db.select().from(attendanceRecords).where(and(...conditions))
    .orderBy(attendanceRecords.studentId);
}

export async function getStudentAttendanceSummary(studentId: number, academicYear: number) {
  const db = await getDb();
  if (!db) return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  const yearStart = `${academicYear}-01-01`;
  const yearEnd = `${academicYear}-12-31`;
  const rows = await db.select({
    status: attendanceRecords.status,
    count: sql<number>`count(*)`,
  }).from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.studentId, studentId),
      sql`DATE(${attendanceRecords.date}) >= ${yearStart}`,
      sql`DATE(${attendanceRecords.date}) <= ${yearEnd}`,
    ))
    .groupBy(attendanceRecords.status);
  const result = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  for (const r of rows) {
    const key = r.status as keyof typeof result;
    if (key in result) result[key] = r.count;
    result.total += r.count;
  }
  return result;
}

export async function getSchoolAttendanceSummary(schoolId: number, date: string) {
  const db = await getDb();
  if (!db) return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  const rows = await db.select({
    status: attendanceRecords.status,
    count: sql<number>`count(*)`,
  }).from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.schoolId, schoolId),
      sql`DATE(${attendanceRecords.date}) = ${date}`,
    ))
    .groupBy(attendanceRecords.status);
  const result = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  for (const r of rows) {
    const key = r.status as keyof typeof result;
    if (key in result) result[key] = r.count;
    result.total += r.count;
  }
  return result;
}

// ─── Subjects ───────────────────────────────────────────────────────────────
export async function getSubjects(opts?: { gradeLevel?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(subjects.isActive, true)];
  if (opts?.gradeLevel) conditions.push(eq(subjects.gradeLevel, opts.gradeLevel));
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];
  return db.select().from(subjects).where(where).orderBy(subjects.name);
}

export async function createSubject(data: InsertSubject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subjects).values(data);
}

// ─── Grades / Marks ─────────────────────────────────────────────────────────
export async function getGrades(opts: { studentId?: number; subjectId?: number; academicYear?: number; term?: string; page: number; pageSize: number }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: any[] = [];
  if (opts.studentId) conditions.push(eq(grades.studentId, opts.studentId));
  if (opts.subjectId) conditions.push(eq(grades.subjectId, opts.subjectId));
  if (opts.academicYear) conditions.push(eq(grades.academicYear, opts.academicYear));
  if (opts.term) conditions.push(eq(grades.term, opts.term as any));
  const where = conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(grades).where(where)
      .orderBy(desc(grades.createdAt))
      .limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(grades).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function createGrade(data: InsertGrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(grades).values(data);
}

export async function updateGrade(id: number, data: Partial<InsertGrade>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(grades).set(data).where(eq(grades.id, id));
}

export async function getStudentGradeSummary(studentId: number, academicYear: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    subjectId: grades.subjectId,
    term: grades.term,
    avgMarks: sql<number>`ROUND(AVG(${grades.obtainedMarks}), 1)`,
    maxMarks: sql<number>`MAX(${grades.maxMarks})`,
    assessmentCount: sql<number>`count(*)`,
  }).from(grades)
    .where(and(eq(grades.studentId, studentId), eq(grades.academicYear, academicYear)))
    .groupBy(grades.subjectId, grades.term)
    .orderBy(grades.subjectId, grades.term);
}

// ─── Scholarships ───────────────────────────────────────────────────────────
export async function getScholarshipPrograms(opts: { page: number; pageSize: number; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: any[] = [];
  if (opts.isActive !== undefined) conditions.push(eq(scholarshipPrograms.isActive, opts.isActive));
  const where = conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(scholarshipPrograms).where(where)
      .orderBy(desc(scholarshipPrograms.createdAt))
      .limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(scholarshipPrograms).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function createScholarshipProgram(data: InsertScholarshipProgram) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(scholarshipPrograms).values(data);
}

export async function getScholarshipApplications(opts: { programId?: number; studentId?: number; status?: string; page: number; pageSize: number }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: any[] = [];
  if (opts.programId) conditions.push(eq(scholarshipApplications.programId, opts.programId));
  if (opts.studentId) conditions.push(eq(scholarshipApplications.studentId, opts.studentId));
  if (opts.status) conditions.push(eq(scholarshipApplications.status, opts.status as any));
  const where = conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(scholarshipApplications).where(where)
      .orderBy(desc(scholarshipApplications.applicationDate))
      .limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(scholarshipApplications).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function createScholarshipApplication(data: InsertScholarshipApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(scholarshipApplications).values(data);
}

export async function updateScholarshipApplication(id: number, data: Partial<InsertScholarshipApplication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scholarshipApplications).set(data).where(eq(scholarshipApplications.id, id));
}

// ─── Parent-Student Links / Parent Portal ──────────────────────────────────
export async function linkParentToStudent(data: InsertParentStudentLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(parentStudentLinks).values(data).onDuplicateKeyUpdate({
    set: { relationship: data.relationship ?? "guardian", isPrimary: data.isPrimary ?? false, isActive: data.isActive ?? true, updatedAt: new Date() },
  });
}

export async function listChildrenForParent(parentUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    linkId: parentStudentLinks.id,
    studentId: studentProfiles.id,
    fullName: studentProfiles.fullName,
    admissionNumber: studentProfiles.admissionNumber,
    relationship: parentStudentLinks.relationship,
    isPrimary: parentStudentLinks.isPrimary,
    isActive: parentStudentLinks.isActive,
  }).from(parentStudentLinks)
    .innerJoin(studentProfiles, eq(parentStudentLinks.studentId, studentProfiles.id))
    .where(and(eq(parentStudentLinks.parentUserId, parentUserId), eq(parentStudentLinks.isActive, true), eq(studentProfiles.isActive, true)))
    .orderBy(studentProfiles.fullName);
}

export async function getParentChildProfile(parentUserId: number, studentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({
    id: studentProfiles.id,
    fullName: studentProfiles.fullName,
    admissionNumber: studentProfiles.admissionNumber,
    dateOfBirth: studentProfiles.dateOfBirth,
    gender: studentProfiles.gender,
    nationality: studentProfiles.nationality,
    address: studentProfiles.address,
    phone: studentProfiles.phone,
    email: studentProfiles.email,
    emergencyContact: studentProfiles.emergencyContact,
    emergencyPhone: studentProfiles.emergencyPhone,
    healthRecords: studentProfiles.healthRecords,
  }).from(parentStudentLinks)
    .innerJoin(studentProfiles, eq(parentStudentLinks.studentId, studentProfiles.id))
    .where(and(eq(parentStudentLinks.parentUserId, parentUserId), eq(parentStudentLinks.studentId, studentId), eq(parentStudentLinks.isActive, true)))
    .limit(1);
  return rows[0];
}

export async function getParentChildAttendanceSummary(parentUserId: number, studentId: number, academicYear: number) {
  const link = await getParentChildProfile(parentUserId, studentId);
  if (!link) return undefined;
  return getStudentAttendanceSummary(studentId, academicYear);
}

export async function getParentChildGradeSummary(parentUserId: number, studentId: number, academicYear: number) {
  const link = await getParentChildProfile(parentUserId, studentId);
  if (!link) return undefined;
  return getStudentGradeSummary(studentId, academicYear);
}

// ─── Report Cards ───────────────────────────────────────────────────────────
export async function listReportCards(opts: { studentId?: number; academicYear?: number; term?: "term_1" | "term_2" | "term_3"; page: number; pageSize: number }) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: any[] = [];
  if (opts.studentId) conditions.push(eq(reportCards.studentId, opts.studentId));
  if (opts.academicYear) conditions.push(eq(reportCards.academicYear, opts.academicYear));
  if (opts.term) conditions.push(eq(reportCards.term, opts.term));
  const where = conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(reportCards).where(where).orderBy(desc(reportCards.generatedAt)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(reportCards).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function createOrUpdateReportCard(data: InsertReportCard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reportCards).values(data).onDuplicateKeyUpdate({
    set: {
      classTeacherRemarks: data.classTeacherRemarks ?? null,
      principalRemarks: data.principalRemarks ?? null,
      attendanceRate: data.attendanceRate ?? null,
      totalMarks: data.totalMarks ?? null,
      averageMarks: data.averageMarks ?? null,
      gradePointAverage: data.gradePointAverage ?? null,
      rankInClass: data.rankInClass ?? null,
      generatedBy: data.generatedBy,
      generatedAt: new Date(),
      publishedAt: data.publishedAt ?? null,
      isPublished: data.isPublished ?? false,
      updatedAt: new Date(),
    },
  });
}

// ─── SIS Analytics ──────────────────────────────────────────────────────────
export async function getStudentCount() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(studentProfiles).where(eq(studentProfiles.isActive, true));
  return rows[0]?.count ?? 0;
}

export async function getEnrollmentsByGrade(schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(enrollments.status, "active")];
  if (schoolId) conditions.push(eq(enrollments.schoolId, schoolId));
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];
  return db.select({
    grade: enrollments.grade,
    count: sql<number>`count(*)`,
  }).from(enrollments).where(where).groupBy(enrollments.grade).orderBy(enrollments.grade);
}


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — FINANCE & PROCUREMENT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Budgets ────────────────────────────────────────────────────────────────
export async function createBudget(data: InsertBudget) {
  const db = await getDb(); if (!db) return;
  await db.insert(budgets).values(data);
}

export async function listBudgets(opts: { page: number; pageSize: number; schoolId?: number; academicYear?: string; status?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.schoolId) conditions.push(eq(budgets.schoolId, opts.schoolId));
  if (opts.academicYear) conditions.push(eq(budgets.academicYear, opts.academicYear));
  if (opts.status) conditions.push(eq(budgets.status, opts.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(budgets).where(where).orderBy(desc(budgets.createdAt)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(budgets).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getBudgetById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
  return result[0];
}

export async function updateBudget(id: number, data: Partial<InsertBudget>) {
  const db = await getDb(); if (!db) return;
  await db.update(budgets).set(data).where(eq(budgets.id, id));
}

// ─── Transactions ───────────────────────────────────────────────────────────
export async function createTransaction(data: InsertTransaction) {
  const db = await getDb(); if (!db) return;
  await db.insert(transactions).values(data);
  // Update budget remaining balance
  if (data.budgetId) {
    const budget = await getBudgetById(data.budgetId);
    if (budget) {
      const delta = data.type === "income" ? data.amount : -data.amount;
      await db.update(budgets).set({ remainingBalance: budget.remainingBalance + delta }).where(eq(budgets.id, data.budgetId));
    }
  }
}

export async function listTransactions(opts: { page: number; pageSize: number; budgetId?: number; type?: string; category?: string; search?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.budgetId) conditions.push(eq(transactions.budgetId, opts.budgetId));
  if (opts.type) conditions.push(eq(transactions.type, opts.type as any));
  if (opts.category) conditions.push(eq(transactions.category, opts.category as any));
  if (opts.search) conditions.push(like(transactions.description, `%${opts.search.replace(/%/g, "\\%")}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(transactions).where(where).orderBy(desc(transactions.transactionDate)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(transactions).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getTransactionSummary(budgetId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({
    category: transactions.category,
    type: transactions.type,
    total: sql<number>`SUM(amount)`,
    count: sql<number>`count(*)`,
  }).from(transactions).where(eq(transactions.budgetId, budgetId)).groupBy(transactions.category, transactions.type);
}

// ─── Salary Records ─────────────────────────────────────────────────────────
export async function createSalaryRecord(data: InsertSalaryRecord) {
  const db = await getDb(); if (!db) return;
  await db.insert(salaryRecords).values(data);
}

export async function listSalaryRecords(opts: { page: number; pageSize: number; staffId?: number; month?: number; year?: number; status?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.staffId) conditions.push(eq(salaryRecords.staffId, opts.staffId));
  if (opts.month) conditions.push(eq(salaryRecords.month, opts.month));
  if (opts.year) conditions.push(eq(salaryRecords.year, opts.year));
  if (opts.status) conditions.push(eq(salaryRecords.status, opts.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(salaryRecords).where(where).orderBy(desc(salaryRecords.year), desc(salaryRecords.month)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(salaryRecords).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

// ─── Vendors ────────────────────────────────────────────────────────────────
export async function createVendor(data: InsertVendor) {
  const db = await getDb(); if (!db) return;
  await db.insert(vendors).values(data);
}

export async function listVendors(opts: { page: number; pageSize: number; category?: string; search?: string; isActive?: boolean }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.category) conditions.push(eq(vendors.category, opts.category as any));
  if (opts.isActive !== undefined) conditions.push(eq(vendors.isActive, opts.isActive));
  if (opts.search) conditions.push(like(vendors.name, `%${opts.search.replace(/%/g, "\\%")}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(vendors).where(where).orderBy(vendors.name).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(vendors).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getVendorById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  return result[0];
}

// ─── Purchase Requisitions ──────────────────────────────────────────────────
export async function createPurchaseRequisition(data: InsertPurchaseRequisition) {
  const db = await getDb(); if (!db) return;
  await db.insert(purchaseRequisitions).values(data);
}

export async function listPurchaseRequisitions(opts: { page: number; pageSize: number; schoolId?: number; status?: string; search?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.schoolId) conditions.push(eq(purchaseRequisitions.schoolId, opts.schoolId));
  if (opts.status) conditions.push(eq(purchaseRequisitions.status, opts.status as any));
  if (opts.search) conditions.push(like(purchaseRequisitions.title, `%${opts.search.replace(/%/g, "\\%")}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(purchaseRequisitions).where(where).orderBy(desc(purchaseRequisitions.createdAt)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(purchaseRequisitions).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getPurchaseRequisitionById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(purchaseRequisitions).where(eq(purchaseRequisitions.id, id)).limit(1);
  return result[0];
}

export async function updatePurchaseRequisition(id: number, data: Partial<InsertPurchaseRequisition>) {
  const db = await getDb(); if (!db) return;
  await db.update(purchaseRequisitions).set(data).where(eq(purchaseRequisitions.id, id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — SUPERVISION & QA HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Inspection Templates ───────────────────────────────────────────────────
export async function createInspectionTemplate(data: InsertInspectionTemplate) {
  const db = await getDb(); if (!db) return;
  await db.insert(inspectionTemplates).values(data);
}

export async function listInspectionTemplates(opts: { page: number; pageSize: number; category?: string; isActive?: boolean }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.category) conditions.push(eq(inspectionTemplates.category, opts.category as any));
  if (opts.isActive !== undefined) conditions.push(eq(inspectionTemplates.isActive, opts.isActive));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(inspectionTemplates).where(where).orderBy(desc(inspectionTemplates.createdAt)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(inspectionTemplates).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getInspectionTemplateById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(inspectionTemplates).where(eq(inspectionTemplates.id, id)).limit(1);
  return result[0];
}

// ─── Inspections ────────────────────────────────────────────────────────────
export async function createInspection(data: InsertInspection) {
  const db = await getDb(); if (!db) return;
  await db.insert(inspections).values(data);
}

export async function listInspections(opts: { page: number; pageSize: number; schoolId?: number; supervisorId?: number; status?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.schoolId) conditions.push(eq(inspections.schoolId, opts.schoolId));
  if (opts.supervisorId) conditions.push(eq(inspections.supervisorId, opts.supervisorId));
  if (opts.status) conditions.push(eq(inspections.status, opts.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(inspections).where(where).orderBy(desc(inspections.scheduledDate)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(inspections).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getInspectionById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return result[0];
}

export async function updateInspection(id: number, data: Partial<InsertInspection>) {
  const db = await getDb(); if (!db) return;
  await db.update(inspections).set(data).where(eq(inspections.id, id));
}

// ─── Improvement Plans ──────────────────────────────────────────────────────
export async function createImprovementPlan(data: InsertImprovementPlan) {
  const db = await getDb(); if (!db) return;
  await db.insert(improvementPlans).values(data);
}

export async function listImprovementPlans(opts: { page: number; pageSize: number; schoolId?: number; status?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.schoolId) conditions.push(eq(improvementPlans.schoolId, opts.schoolId));
  if (opts.status) conditions.push(eq(improvementPlans.status, opts.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(improvementPlans).where(where).orderBy(desc(improvementPlans.createdAt)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(improvementPlans).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getImprovementPlanById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(improvementPlans).where(eq(improvementPlans.id, id)).limit(1);
  return result[0];
}

export async function updateImprovementPlan(id: number, data: Partial<InsertImprovementPlan>) {
  const db = await getDb(); if (!db) return;
  await db.update(improvementPlans).set(data).where(eq(improvementPlans.id, id));
}

// ─── School Scorecards ──────────────────────────────────────────────────────
export async function createSchoolScorecard(data: InsertSchoolScorecard) {
  const db = await getDb(); if (!db) return;
  await db.insert(schoolScorecards).values(data);
}

export async function listSchoolScorecards(opts: { page: number; pageSize: number; schoolId?: number; academicYear?: string }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions: any[] = [];
  if (opts.schoolId) conditions.push(eq(schoolScorecards.schoolId, opts.schoolId));
  if (opts.academicYear) conditions.push(eq(schoolScorecards.academicYear, opts.academicYear));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(schoolScorecards).where(where).orderBy(desc(schoolScorecards.overallScore)).limit(opts.pageSize).offset((opts.page - 1) * opts.pageSize),
    db.select({ count: sql<number>`count(*)` }).from(schoolScorecards).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getSchoolScorecardById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(schoolScorecards).where(eq(schoolScorecards.id, id)).limit(1);
  return result[0];
}


// ─── Dashboard Analytics Helpers ─────────────────────────────────────────────

export async function getDashboardBudgetSummary() {
  const db = await getDb(); if (!db) return { totalAllocated: 0, totalSpent: 0, totalRemaining: 0, budgetCount: 0, approvedCount: 0 };
  const budgetRows = await db.select({
    totalAllocated: sql<number>`COALESCE(SUM(totalAllocation), 0)`,
    totalRemaining: sql<number>`COALESCE(SUM(remainingBalance), 0)`,
    budgetCount: sql<number>`count(*)`,
    approvedCount: sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`,
  }).from(budgets);
  const row = budgetRows[0] ?? { totalAllocated: 0, totalRemaining: 0, budgetCount: 0, approvedCount: 0 };
  return {
    totalAllocated: Number(row.totalAllocated),
    totalSpent: Number(row.totalAllocated) - Number(row.totalRemaining),
    totalRemaining: Number(row.totalRemaining),
    budgetCount: Number(row.budgetCount),
    approvedCount: Number(row.approvedCount),
  };
}

export async function getDashboardTransactionBreakdown() {
  const db = await getDb(); if (!db) return [];
  return db.select({
    category: transactions.category,
    type: transactions.type,
    total: sql<number>`COALESCE(SUM(amount), 0)`,
    count: sql<number>`count(*)`,
  }).from(transactions).groupBy(transactions.category, transactions.type);
}

export async function getDashboardInspectionStats() {
  const db = await getDb(); if (!db) return { total: 0, completed: 0, scheduled: 0, inProgress: 0, avgScore: 0, recentInspections: [] };
  const [statsRows, recentRows] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
      scheduled: sql<number>`SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
      avgScore: sql<number>`COALESCE(AVG(CASE WHEN status = 'completed' AND overallScore IS NOT NULL THEN overallScore END), 0)`,
    }).from(inspections),
    db.select({
      id: inspections.id,
      schoolId: inspections.schoolId,
      overallScore: inspections.overallScore,
      status: inspections.status,
      scheduledDate: inspections.scheduledDate,
      completedDate: inspections.completedDate,
    }).from(inspections).orderBy(desc(inspections.createdAt)).limit(5),
  ]);
  const stats = statsRows[0] ?? { total: 0, completed: 0, scheduled: 0, inProgress: 0, avgScore: 0 };
  return {
    total: Number(stats.total),
    completed: Number(stats.completed),
    scheduled: Number(stats.scheduled),
    inProgress: Number(stats.inProgress),
    avgScore: Math.round(Number(stats.avgScore)),
    recentInspections: recentRows,
  };
}

export async function getDashboardImprovementPlanStats() {
  const db = await getDb(); if (!db) return { total: 0, active: 0, completed: 0, overdue: 0, avgProgress: 0 };
  const rows = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
    completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
    overdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END)`,
    avgProgress: sql<number>`COALESCE(AVG(overallProgress), 0)`,
  }).from(improvementPlans);
  const row = rows[0] ?? { total: 0, active: 0, completed: 0, overdue: 0, avgProgress: 0 };
  return {
    total: Number(row.total),
    active: Number(row.active),
    completed: Number(row.completed),
    overdue: Number(row.overdue),
    avgProgress: Math.round(Number(row.avgProgress)),
  };
}

export async function getDashboardProcurementStats() {
  const db = await getDb(); if (!db) return { total: 0, pending: 0, approved: 0, totalCost: 0 };
  const rows = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`SUM(CASE WHEN status IN ('submitted', 'under_review') THEN 1 ELSE 0 END)`,
    approved: sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`,
    totalCost: sql<number>`COALESCE(SUM(totalEstimatedCost), 0)`,
  }).from(purchaseRequisitions);
  const row = rows[0] ?? { total: 0, pending: 0, approved: 0, totalCost: 0 };
  return {
    total: Number(row.total),
    pending: Number(row.pending),
    approved: Number(row.approved),
    totalCost: Number(row.totalCost),
  };
}

export async function getDashboardRecentActivity(limit = 10) {
  const db = await getDb(); if (!db) return [];
  const logs = await db.select({
    id: auditLogs.id,
    userId: auditLogs.userId,
    action: auditLogs.action,
    entityType: auditLogs.entityType,
    entityId: auditLogs.entityId,
    createdAt: auditLogs.createdAt,
  }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  // Resolve user names
  const userIds = Array.from(new Set(logs.filter(l => l.userId).map(l => l.userId!)));
  let userMap = new Map<number, string>();
  if (userIds.length > 0) {
    const userRows = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
    userMap = new Map(userRows.map(u => [u.id, u.name ?? "Unknown"] as [number, string]));
  }
  return logs.map(l => ({
    ...l,
    userName: l.userId ? userMap.get(l.userId) ?? "Unknown" : "System",
  }));
}


// ─── Professional Development (Extended) ──────────────────────────────────────
export async function listProfessionalDevelopmentPaginated(
  page: number,
  pageSize: number,
  filters?: { staffId?: number; programType?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  const conditions: SQL[] = [];
  if (filters?.staffId) conditions.push(eq(professionalDevelopment.staffId, filters.staffId));
  if (filters?.programType) conditions.push(eq(professionalDevelopment.programType, filters.programType as any));
  if (filters?.search) {
    const s = `%${filters.search.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        like(professionalDevelopment.programName, s),
        like(professionalDevelopment.provider ?? "", s)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select({
      id: professionalDevelopment.id,
      staffId: professionalDevelopment.staffId,
      programName: professionalDevelopment.programName,
      programType: professionalDevelopment.programType,
      provider: professionalDevelopment.provider,
      startDate: professionalDevelopment.startDate,
      endDate: professionalDevelopment.endDate,
      durationHours: professionalDevelopment.durationHours,
      certificateUrl: professionalDevelopment.certificateUrl,
      description: professionalDevelopment.description,
      createdAt: professionalDevelopment.createdAt,
      staffName: staffProfiles.fullName,
    })
      .from(professionalDevelopment)
      .leftJoin(staffProfiles, eq(professionalDevelopment.staffId, staffProfiles.id))
      .where(where)
      .orderBy(desc(professionalDevelopment.startDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(professionalDevelopment).where(where),
  ]);
  return { data: rows, total: countResult[0]?.count ?? 0 };
}

export async function getProfessionalDevelopmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(professionalDevelopment).where(eq(professionalDevelopment.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateProfessionalDevelopment(id: number, data: Partial<InsertProfessionalDevelopment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(professionalDevelopment).set({ ...data, updatedAt: new Date() }).where(eq(professionalDevelopment.id, id));
}

export async function deleteProfessionalDevelopment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(professionalDevelopment).where(eq(professionalDevelopment.id, id));
}

export async function getProfessionalDevelopmentStats() {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, inProgress: 0, totalHours: 0, byType: [] as { type: string; count: number }[] };
  const now = new Date();
  const [totalResult, completedResult, inProgressResult, hoursResult, byTypeResult] = await Promise.all([
    db.select({ count: count() }).from(professionalDevelopment),
    db.select({ count: count() }).from(professionalDevelopment).where(
      and(isNotNull(professionalDevelopment.endDate), lte(professionalDevelopment.endDate, now))
    ),
    db.select({ count: count() }).from(professionalDevelopment).where(
      or(isNull(professionalDevelopment.endDate), gt(professionalDevelopment.endDate, now))
    ),
    db.select({ total: sum(professionalDevelopment.durationHours) }).from(professionalDevelopment),
    db.select({ type: professionalDevelopment.programType, count: count() })
      .from(professionalDevelopment)
      .groupBy(professionalDevelopment.programType),
  ]);
  return {
    total: totalResult[0]?.count ?? 0,
    completed: completedResult[0]?.count ?? 0,
    inProgress: inProgressResult[0]?.count ?? 0,
    totalHours: Number(hoursResult[0]?.total ?? 0),
    byType: byTypeResult.map(r => ({ type: r.type, count: r.count })),
  };
}
