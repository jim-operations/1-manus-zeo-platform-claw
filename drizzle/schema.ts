import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, uniqueIndex } from "drizzle-orm/mysql-core";

// ─── ZEO Role Enum ───────────────────────────────────────────────────────────
export const ZEO_ROLES = [
  "zonal_director",
  "deputy_director",
  "branch_head",
  "isa",
  "principal",
  "teacher",
  "parent",
  "student",
  "admin",
  "user",
] as const;
export type ZeoRole = (typeof ZEO_ROLES)[number];

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [...ZEO_ROLES]).default("user").notNull(),
  schoolId: int("schoolId"),
  departmentId: int("departmentId"),
  preferredLanguage: mysqlEnum("preferredLanguage", ["en", "si", "ta"]).default("en").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Schools ─────────────────────────────────────────────────────────────────
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  type: mysqlEnum("type", ["1AB", "1C", "2", "3"]),
  address: text("address"),
  district: varchar("district", { length: 100 }),
  division: varchar("division", { length: 100 }),
  principalId: int("principalId"),
  studentCount: int("studentCount").default(0),
  teacherCount: int("teacherCount").default(0),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

// ─── Departments ─────────────────────────────────────────────────────────────
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  description: text("description"),
  headId: int("headId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// ─── Staff Profiles ──────────────────────────────────────────────────────────
export const staffProfiles = mysqlTable("staff_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nic: varchar("nic", { length: 20 }).unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 100 }),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed"]),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  personalEmail: varchar("personalEmail", { length: 320 }),
  designation: varchar("designation", { length: 255 }),
  subjectSpecialization: varchar("subjectSpecialization", { length: 255 }),
  qualifications: json("qualifications"),
  schoolId: int("schoolId"),
  departmentId: int("departmentId"),
  appointmentDate: timestamp("appointmentDate"),
  confirmationDate: timestamp("confirmationDate"),
  retirementDate: timestamp("retirementDate"),
  salaryStep: varchar("salaryStep", { length: 20 }),
  epfNumber: varchar("epfNumber", { length: 20 }),
  etfNumber: varchar("etfNumber", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  bankBranch: varchar("bankBranch", { length: 100 }),
  bankAccountNumber: varchar("bankAccountNumber", { length: 50 }),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  profilePictureUrl: text("profilePictureUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type InsertStaffProfile = typeof staffProfiles.$inferInsert;

// ─── Service History ─────────────────────────────────────────────────────────
export const serviceHistory = mysqlTable("service_history", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  eventType: mysqlEnum("eventType", [
    "appointment",
    "transfer",
    "promotion",
    "confirmation",
    "increment",
    "disciplinary",
    "training",
    "award",
    "other",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  effectiveDate: timestamp("effectiveDate").notNull(),
  endDate: timestamp("endDate"),
  fromSchoolId: int("fromSchoolId"),
  toSchoolId: int("toSchoolId"),
  fromDesignation: varchar("fromDesignation", { length: 255 }),
  toDesignation: varchar("toDesignation", { length: 255 }),
  documentUrl: text("documentUrl"),
  recordedBy: int("recordedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceHistoryRecord = typeof serviceHistory.$inferSelect;
export type InsertServiceHistory = typeof serviceHistory.$inferInsert;

// ─── Leave Requests ──────────────────────────────────────────────────────────
export const leaveRequests = mysqlTable("leave_requests", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  leaveType: mysqlEnum("leaveType", [
    "casual",
    "sick",
    "annual",
    "maternity",
    "paternity",
    "duty",
    "study",
    "no_pay",
    "other",
  ]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  numberOfDays: int("numberOfDays").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", [
    "draft",
    "pending",
    "approved_by_principal",
    "approved",
    "rejected",
    "cancelled",
  ]).default("draft").notNull(),
  appliedAt: timestamp("appliedAt"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewerComment: text("reviewerComment"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  approverComment: text("approverComment"),
  documentUrl: text("documentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

// ─── Leave Balances ──────────────────────────────────────────────────────────
export const leaveBalances = mysqlTable(
  "leave_balances",
  {
    id: int("id").autoincrement().primaryKey(),
    staffId: int("staffId").notNull(),
    year: int("year").notNull(),
    casualTotal: int("casualTotal").default(7).notNull(),
    casualUsed: int("casualUsed").default(0).notNull(),
    sickTotal: int("sickTotal").default(21).notNull(),
    sickUsed: int("sickUsed").default(0).notNull(),
    annualTotal: int("annualTotal").default(14).notNull(),
    annualUsed: int("annualUsed").default(0).notNull(),
    dutyTotal: int("dutyTotal").default(0).notNull(),
    dutyUsed: int("dutyUsed").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    staffYearUnique: uniqueIndex("leave_balances_staff_year_unique").on(table.staffId, table.year),
  }),
);

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = typeof leaveBalances.$inferInsert;

// ─── Transfer Requests ───────────────────────────────────────────────────────
export const transferRequests = mysqlTable("transfer_requests", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  currentSchoolId: int("currentSchoolId").notNull(),
  requestedSchoolId: int("requestedSchoolId"),
  reason: text("reason"),
  status: mysqlEnum("status", [
    "draft",
    "pending",
    "recommended_by_principal",
    "reviewed_by_branch",
    "approved",
    "rejected",
    "completed",
  ]).default("draft").notNull(),
  workflowState: varchar("workflowState", { length: 50 }).default("initiated"),
  principalRecommendation: text("principalRecommendation"),
  principalRecommendedAt: timestamp("principalRecommendedAt"),
  branchReview: text("branchReview"),
  branchReviewedAt: timestamp("branchReviewedAt"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  approverComment: text("approverComment"),
  effectiveDate: timestamp("effectiveDate"),
  documentUrl: text("documentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransferRequest = typeof transferRequests.$inferSelect;
export type InsertTransferRequest = typeof transferRequests.$inferInsert;

// ─── Professional Development ────────────────────────────────────────────────
export const professionalDevelopment = mysqlTable("professional_development", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  programName: varchar("programName", { length: 255 }).notNull(),
  programType: mysqlEnum("programType", [
    "workshop",
    "seminar",
    "conference",
    "course",
    "certification",
    "other",
  ]).notNull(),
  provider: varchar("provider", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  durationHours: int("durationHours"),
  certificateUrl: text("certificateUrl"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfessionalDevelopmentRecord = typeof professionalDevelopment.$inferSelect;
export type InsertProfessionalDevelopment = typeof professionalDevelopment.$inferInsert;

// ─── Announcements ───────────────────────────────────────────────────────────
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "general",
    "urgent",
    "circular",
    "event",
    "holiday",
    "exam",
    "training",
    "other",
  ]).default("general").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
  authorId: int("authorId").notNull(),
  targetAudience: json("targetAudience"),
  targetSchoolIds: json("targetSchoolIds"),
  attachmentUrl: text("attachmentUrl"),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  expiresAt: timestamp("expiresAt"),
  isPinned: boolean("isPinned").default(false).notNull(),
  readCount: int("readCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ─── Announcement Reads ──────────────────────────────────────────────────────
export const announcementReads = mysqlTable("announcement_reads", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type AnnouncementRead = typeof announcementReads.$inferSelect;

// ─── Notifications ───────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", [
    "info",
    "success",
    "warning",
    "error",
    "leave_update",
    "transfer_update",
    "announcement",
    "message",
    "system",
  ]).default("info").notNull(),
  channel: mysqlEnum("channel", ["in_app", "email", "sms", "push"]).default("in_app").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: int("relatedEntityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Message Threads ─────────────────────────────────────────────────────────
export const messageThreads = mysqlTable("message_threads", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 255 }),
  createdBy: int("createdBy").notNull(),
  isGroup: boolean("isGroup").default(false).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageThread = typeof messageThreads.$inferSelect;
export type InsertMessageThread = typeof messageThreads.$inferInsert;

// ─── Thread Participants ─────────────────────────────────────────────────────
export const threadParticipants = mysqlTable("thread_participants", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  userId: int("userId").notNull(),
  lastReadAt: timestamp("lastReadAt"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ThreadParticipant = typeof threadParticipants.$inferSelect;

// ─── Messages ────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachmentUrl"),
  isEdited: boolean("isEdited").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Student Information System (SIS)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Student Profiles ───────────────────────────────────────────────────────
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  admissionNumber: varchar("admissionNumber", { length: 30 }).unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  nameWithInitials: varchar("nameWithInitials", { length: 150 }),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  nationality: varchar("nationality", { length: 100 }).default("Sri Lankan"),
  religion: varchar("religion", { length: 100 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  // Parent/Guardian info stored as JSON for flexibility
  parentGuardianInfo: json("parentGuardianInfo"),
  // e.g. { father: { name, nic, occupation, phone }, mother: {...}, guardian: {...} }
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  healthRecords: json("healthRecords"),
  // e.g. { bloodGroup, allergies: [], conditions: [], vaccinations: [] }
  previousSchool: varchar("previousSchool", { length: 255 }),
  profilePictureUrl: text("profilePictureUrl"),
  // Link to user account (if student has login)
  userId: int("userId"),
  // Link to parent user account
  parentUserId: int("parentUserId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

// ─── Enrollments ────────────────────────────────────────────────────────────
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  schoolId: int("schoolId").notNull(),
  academicYear: int("academicYear").notNull(),
  grade: varchar("grade", { length: 10 }).notNull(), // e.g. "1", "2", ..., "13"
  classSection: varchar("classSection", { length: 10 }), // e.g. "A", "B", "C"
  medium: mysqlEnum("medium", ["sinhala", "tamil", "english"]).default("sinhala"),
  status: mysqlEnum("status", [
    "active",
    "transferred",
    "graduated",
    "dropped_out",
    "suspended",
  ]).default("active").notNull(),
  enrollmentDate: timestamp("enrollmentDate").defaultNow().notNull(),
  leavingDate: timestamp("leavingDate"),
  leavingReason: text("leavingReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ─── Attendance Records ─────────────────────────────────────────────────────
export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  schoolId: int("schoolId").notNull(),
  date: timestamp("date").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).notNull(),
  markedBy: int("markedBy").notNull(), // teacher userId
  remarks: text("remarks"),
  // For offline sync support
  syncedAt: timestamp("syncedAt"),
  deviceId: varchar("deviceId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

// ─── Subjects ───────────────────────────────────────────────────────────────
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  medium: mysqlEnum("medium", ["sinhala", "tamil", "english"]),
  gradeLevel: varchar("gradeLevel", { length: 10 }), // applicable grade
  isCompulsory: boolean("isCompulsory").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

// ─── Grades / Marks ─────────────────────────────────────────────────────────
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  enrollmentId: int("enrollmentId"),
  subjectId: int("subjectId").notNull(),
  academicYear: int("academicYear").notNull(),
  term: mysqlEnum("term", ["term_1", "term_2", "term_3"]).notNull(),
  assessmentType: mysqlEnum("assessmentType", [
    "class_test",
    "term_exam",
    "practical",
    "assignment",
    "project",
    "other",
  ]).notNull(),
  assessmentName: varchar("assessmentName", { length: 255 }),
  maxMarks: int("maxMarks").default(100).notNull(),
  obtainedMarks: int("obtainedMarks"),
  gradeSymbol: varchar("gradeSymbol", { length: 5 }), // A, B, C, S, W, F
  remarks: text("remarks"),
  enteredBy: int("enteredBy").notNull(), // teacher userId
  verifiedBy: int("verifiedBy"), // principal/HOD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

// ─── Scholarships ───────────────────────────────────────────────────────────
export const scholarshipPrograms = mysqlTable("scholarship_programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  provider: varchar("provider", { length: 255 }), // government, NGO, etc.
  eligibilityCriteria: text("eligibilityCriteria"),
  amount: int("amount"), // in LKR
  frequency: mysqlEnum("frequency", ["one_time", "monthly", "annual"]).default("annual"),
  academicYear: int("academicYear"),
  applicationDeadline: timestamp("applicationDeadline"),
  maxRecipients: int("maxRecipients"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScholarshipProgram = typeof scholarshipPrograms.$inferSelect;
export type InsertScholarshipProgram = typeof scholarshipPrograms.$inferInsert;

export const scholarshipApplications = mysqlTable("scholarship_applications", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId").notNull(),
  studentId: int("studentId").notNull(),
  schoolId: int("schoolId").notNull(),
  status: mysqlEnum("status", [
    "applied",
    "under_review",
    "shortlisted",
    "awarded",
    "rejected",
    "withdrawn",
  ]).default("applied").notNull(),
  applicationDate: timestamp("applicationDate").defaultNow().notNull(),
  supportingDocuments: json("supportingDocuments"), // array of URLs
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewComment: text("reviewComment"),
  awardedAmount: int("awardedAmount"),
  awardedAt: timestamp("awardedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScholarshipApplication = typeof scholarshipApplications.$inferSelect;
export type InsertScholarshipApplication = typeof scholarshipApplications.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — FINANCE & PROCUREMENT MODULE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Budgets ────────────────────────────────────────────────────────────────
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId"), // null = zonal-level budget
  academicYear: varchar("academicYear", { length: 9 }).notNull(), // e.g. "2025/2026"
  totalAllocation: int("totalAllocation").notNull(), // in LKR (cents)
  remainingBalance: int("remainingBalance").notNull(),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "closed"]).default("draft").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// ─── Transactions ───────────────────────────────────────────────────────────
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  budgetId: int("budgetId").notNull(),
  type: mysqlEnum("type", ["income", "expenditure"]).notNull(),
  category: mysqlEnum("category", [
    "salary",
    "stationery",
    "maintenance",
    "utilities",
    "transport",
    "equipment",
    "training",
    "grants",
    "fees",
    "donations",
    "other",
  ]).notNull(),
  amount: int("amount").notNull(), // in LKR (cents)
  description: text("description").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 64 }),
  receiptUrl: text("receiptUrl"),
  transactionDate: timestamp("transactionDate").notNull(),
  recordedBy: int("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─── Salary Records ─────────────────────────────────────────────────────────
export const salaryRecords = mysqlTable("salaryRecords", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  grossPay: int("grossPay").notNull(), // in LKR (cents)
  epfDeduction: int("epfDeduction").default(0).notNull(),
  etfDeduction: int("etfDeduction").default(0).notNull(),
  taxDeduction: int("taxDeduction").default(0).notNull(),
  otherDeductions: int("otherDeductions").default(0).notNull(),
  netPay: int("netPay").notNull(),
  payslipUrl: text("payslipUrl"),
  status: mysqlEnum("status", ["draft", "processed", "paid"]).default("draft").notNull(),
  processedBy: int("processedBy"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SalaryRecord = typeof salaryRecords.$inferSelect;
export type InsertSalaryRecord = typeof salaryRecords.$inferInsert;

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 64 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  category: mysqlEnum("category", [
    "stationery",
    "equipment",
    "furniture",
    "construction",
    "services",
    "food",
    "transport",
    "other",
  ]).notNull(),
  rating: int("rating"), // 1-5
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// ─── Purchase Requisitions ──────────────────────────────────────────────────
export const purchaseRequisitions = mysqlTable("purchaseRequisitions", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId"),
  budgetId: int("budgetId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  items: json("items").notNull(), // [{name, quantity, unitPrice, total}]
  totalEstimatedCost: int("totalEstimatedCost").notNull(),
  justification: text("justification"),
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "bid_invited",
    "bid_evaluated",
    "awarded",
    "completed",
    "cancelled",
  ]).default("draft").notNull(),
  vendorId: int("vendorId"), // awarded vendor
  actualCost: int("actualCost"),
  submittedBy: int("submittedBy").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewComment: text("reviewComment"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PurchaseRequisition = typeof purchaseRequisitions.$inferSelect;
export type InsertPurchaseRequisition = typeof purchaseRequisitions.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — SCHOOL SUPERVISION & QUALITY ASSURANCE MODULE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Inspection Templates ───────────────────────────────────────────────────
export const inspectionTemplates = mysqlTable("inspectionTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "curriculum",
    "infrastructure",
    "safety",
    "administration",
    "teaching_quality",
    "general",
  ]).notNull(),
  formSchema: json("formSchema").notNull(), // [{section, questions: [{id, label, type, options?, required}]}]
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type InsertInspectionTemplate = typeof inspectionTemplates.$inferInsert;

// ─── Inspections ────────────────────────────────────────────────────────────
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId").notNull(),
  templateId: int("templateId").notNull(),
  supervisorId: int("supervisorId").notNull(), // ISA or supervisor user ID
  scheduledDate: timestamp("scheduledDate").notNull(),
  completedDate: timestamp("completedDate"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  formData: json("formData"), // filled-in form responses
  overallScore: int("overallScore"), // 0-100
  summary: text("summary"),
  recommendations: text("recommendations"),
  principalAcknowledged: boolean("principalAcknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// ─── Improvement Plans ──────────────────────────────────────────────────────
export const improvementPlans = mysqlTable("improvementPlans", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId").notNull(),
  inspectionId: int("inspectionId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  recommendations: json("recommendations").notNull(), // [{id, action, responsible, deadline, status, progress}]
  status: mysqlEnum("status", ["draft", "active", "completed", "overdue"]).default("draft").notNull(),
  startDate: timestamp("startDate"),
  targetDate: timestamp("targetDate"),
  completedDate: timestamp("completedDate"),
  overallProgress: int("overallProgress").default(0).notNull(), // 0-100
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ImprovementPlan = typeof improvementPlans.$inferSelect;
export type InsertImprovementPlan = typeof improvementPlans.$inferInsert;

// ─── School Scorecards ──────────────────────────────────────────────────────
export const schoolScorecards = mysqlTable("schoolScorecards", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId").notNull(),
  academicYear: varchar("academicYear", { length: 9 }).notNull(),
  overallScore: int("overallScore").notNull(), // 0-100
  componentScores: json("componentScores").notNull(), // {curriculum: 85, infrastructure: 70, ...}
  inspectionCount: int("inspectionCount").default(0).notNull(),
  improvementPlanCount: int("improvementPlanCount").default(0).notNull(),
  rank: int("rank"), // within zone
  notes: text("notes"),
  generatedBy: int("generatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SchoolScorecard = typeof schoolScorecards.$inferSelect;
export type InsertSchoolScorecard = typeof schoolScorecards.$inferInsert;
