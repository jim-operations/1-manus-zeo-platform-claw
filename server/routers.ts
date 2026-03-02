import { COOKIE_NAME } from "@shared/const";
import { hasPermission, PERMISSIONS, ROLE_HIERARCHY, type Permission } from "@shared/permissions";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import type { ZeoRole } from "../drizzle/schema";

// ─── Permission Middleware Factory (S1: typed Permission, not string) ────────
function requirePermission(permission: Permission) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = ctx.user.role as ZeoRole;
    if (!hasPermission(userRole, permission)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return next({ ctx });
  });
}

// ─── Audit Helper ────────────────────────────────────────────────────────────
async function audit(userId: number, action: string, entityType: string, entityId?: number, details?: any, req?: any) {
  await db.createAuditLog({
    userId,
    action,
    entityType,
    entityId: entityId ?? null,
    details: details ?? null,
    ipAddress: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"] ?? null,
  });
}

// ─── Notification Helper ─────────────────────────────────────────────────────
async function notify(userId: number, title: string, content: string, type: string, relatedEntityType?: string, relatedEntityId?: number) {
  await db.createNotification({
    userId,
    title,
    content,
    type: type as any,
    channel: "in_app",
    relatedEntityType: relatedEntityType ?? null,
    relatedEntityId: relatedEntityId ?? null,
  });
}

// ─── Leave balance field mapping ─────────────────────────────────────────────
const LEAVE_BALANCE_FIELD_MAP: Record<string, { used: string; total: string }> = {
  casual: { used: "casualUsed", total: "casualTotal" },
  sick: { used: "sickUsed", total: "sickTotal" },
  annual: { used: "annualUsed", total: "annualTotal" },
  duty: { used: "dutyUsed", total: "dutyTotal" },
};

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── User Management ────────────────────────────────────────────────────
  users: router({
    list: requirePermission(PERMISSIONS.USERS_VIEW).input(
      z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(25) }).optional()
    ).query(async ({ ctx, input }) => {
      return db.listUsersPaginated(input?.page ?? 1, input?.pageSize ?? 25);
    }),
    // S3: Add permission guard to getById
    getById: requirePermission(PERMISSIONS.USERS_VIEW).input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getUserById(input.id);
    }),
    // S6: Role escalation prevention
    updateRole: requirePermission(PERMISSIONS.USERS_ASSIGN_ROLES).input(
      z.object({ userId: z.number(), role: z.string() })
    ).mutation(async ({ ctx, input }) => {
      const assignerRole = ctx.user.role as ZeoRole;
      const targetRole = input.role as ZeoRole;
      const assignerLevel = ROLE_HIERARCHY[assignerRole] ?? 0;
      const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
      // Cannot assign a role equal to or higher than your own (unless admin)
      if (assignerRole !== "admin" && targetLevel >= assignerLevel) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot assign a role equal to or higher than your own" });
      }
      // Cannot change your own role
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change your own role" });
      }
      await db.updateUserRole(input.userId, input.role);
      await audit(ctx.user.id, "update_role", "user", input.userId, { newRole: input.role }, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Schools ─────────────────────────────────────────────────────────────
  schools: router({
    list: protectedProcedure.input(
      z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(25), search: z.string().optional() }).optional()
    ).query(async ({ input }) => {
      return db.listSchoolsPaginated(input?.page ?? 1, input?.pageSize ?? 25, input?.search);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getSchoolById(input.id);
    }),
    create: requirePermission(PERMISSIONS.SCHOOLS_MANAGE).input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        type: z.enum(["1AB", "1C", "2", "3"]).optional(),
        address: z.string().optional(),
        district: z.string().optional(),
        division: z.string().optional(),
        principalId: z.number().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await db.createSchool(input);
      await audit(ctx.user.id, "create", "school", id, input, ctx.req);
      return { id };
    }),
    update: requirePermission(PERMISSIONS.SCHOOLS_MANAGE).input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().optional(),
        type: z.enum(["1AB", "1C", "2", "3"]).optional(),
        address: z.string().optional(),
        district: z.string().optional(),
        division: z.string().optional(),
        principalId: z.number().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateSchool(id, data);
      await audit(ctx.user.id, "update", "school", id, data, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Departments ─────────────────────────────────────────────────────────
  departments: router({
    list: protectedProcedure.query(async () => {
      return db.listDepartments();
    }),
    listPaginated: requirePermission(PERMISSIONS.DEPARTMENTS_VIEW).input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }).optional()
    ).query(async ({ input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const result = await db.listDepartmentsPaginated(page, pageSize, { search: input?.search });
      // Attach staff counts and head names
      const staffCounts = await db.getDepartmentStaffCount();
      const headIds = result.data.filter(d => d.headId).map(d => d.headId!);
      let headMap = new Map<number, string>();
      if (headIds.length > 0) {
        const allStaff = await db.listStaffProfiles();
        headMap = new Map(allStaff.filter(s => headIds.includes(s.id)).map(s => [s.id, s.fullName]));
      }
      const data = result.data.map(d => ({
        ...d,
        staffCount: staffCounts.get(d.id) ?? 0,
        headName: d.headId ? headMap.get(d.headId) ?? null : null,
      }));
      return { ...result, data };
    }),
    getById: requirePermission(PERMISSIONS.DEPARTMENTS_VIEW).input(
      z.object({ id: z.number() })
    ).query(async ({ input }) => {
      const dept = await db.getDepartmentById(input.id);
      if (!dept) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found" });
      return dept;
    }),
    create: requirePermission(PERMISSIONS.DEPARTMENTS_MANAGE).input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        description: z.string().optional(),
        headId: z.number().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await db.createDepartment(input);
      await audit(ctx.user.id, "create", "department", id, input, ctx.req);
      return { id };
    }),
    update: requirePermission(PERMISSIONS.DEPARTMENTS_MANAGE).input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().optional(),
        description: z.string().optional(),
        headId: z.number().nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateDepartment(id, data as any);
      await audit(ctx.user.id, "update", "department", id, data, ctx.req);
      return { success: true };
    }),
    delete: requirePermission(PERMISSIONS.DEPARTMENTS_MANAGE).input(
      z.object({ id: z.number() })
    ).mutation(async ({ ctx, input }) => {
      await db.deleteDepartment(input.id);
      await audit(ctx.user.id, "delete", "department", input.id, {}, ctx.req);
      return { success: true };
    }),
    staff: requirePermission(PERMISSIONS.DEPARTMENTS_VIEW).input(
      z.object({
        departmentId: z.number(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    ).query(async ({ input }) => {
      return db.getStaffByDepartment(input.departmentId, input.page, input.pageSize);
    }),
  }),

  // ─── Staff Profiles ──────────────────────────────────────────────────────
  staff: router({
    list: requirePermission(PERMISSIONS.STAFF_VIEW_ALL).input(
      z.object({
        schoolId: z.number().optional(),
        departmentId: z.number().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
      }).optional()
    ).query(async ({ input }) => {
      return db.listStaffProfilesPaginated(
        input?.page ?? 1,
        input?.pageSize ?? 25,
        { schoolId: input?.schoolId, departmentId: input?.departmentId, search: input?.search }
      );
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const profile = await db.getStaffProfileById(input.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found" });
      // Also fetch service history and leave balance
      const [history, currentYearBalance] = await Promise.all([
        db.getServiceHistory(input.id),
        db.getLeaveBalance(input.id, new Date().getFullYear()),
      ]);
      return { ...profile, serviceHistory: history, leaveBalance: currentYearBalance };
    }),
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      return db.getStaffProfileByUserId(ctx.user.id);
    }),
    create: requirePermission(PERMISSIONS.STAFF_CREATE).input(
      z.object({
        userId: z.number(),
        fullName: z.string().min(1),
        nic: z.string().optional(),
        initials: z.string().optional(),
        dateOfBirth: z.date().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        personalEmail: z.string().email().optional(),
        designation: z.string().optional(),
        subjectSpecialization: z.string().optional(),
        schoolId: z.number().optional(),
        departmentId: z.number().optional(),
        appointmentDate: z.date().optional(),
        epfNumber: z.string().optional(),
        etfNumber: z.string().optional(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await db.createStaffProfile(input as any);
      await audit(ctx.user.id, "create", "staff_profile", id, { fullName: input.fullName }, ctx.req);
      return { id };
    }),
    update: requirePermission(PERMISSIONS.STAFF_EDIT).input(
      z.object({
        id: z.number(),
        fullName: z.string().min(1).optional(),
        initials: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        personalEmail: z.string().email().optional(),
        designation: z.string().optional(),
        subjectSpecialization: z.string().optional(),
        schoolId: z.number().optional(),
        departmentId: z.number().optional(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateStaffProfile(id, data as any);
      await audit(ctx.user.id, "update", "staff_profile", id, data, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Service History ─────────────────────────────────────────────────────
  serviceHistory: router({
    list: requirePermission(PERMISSIONS.SERVICE_VIEW).input(
      z.object({ staffId: z.number() })
    ).query(async ({ input }) => {
      return db.getServiceHistory(input.staffId);
    }),
    create: requirePermission(PERMISSIONS.SERVICE_MANAGE).input(
      z.object({
        staffId: z.number(),
        eventType: z.enum(["appointment", "transfer", "promotion", "confirmation", "increment", "disciplinary", "training", "award", "other"]),
        title: z.string().min(1),
        description: z.string().optional(),
        effectiveDate: z.date(),
        endDate: z.date().optional(),
        fromSchoolId: z.number().optional(),
        toSchoolId: z.number().optional(),
        fromDesignation: z.string().optional(),
        toDesignation: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await db.createServiceRecord({ ...input, recordedBy: ctx.user.id } as any);
      await audit(ctx.user.id, "create", "service_history", id, input, ctx.req);
      return { id };
    }),
  }),

  // ─── Leave Management ────────────────────────────────────────────────────
  leave: router({
    list: protectedProcedure.input(
      z.object({
        staffId: z.number().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const userRole = ctx.user.role as ZeoRole;
      if (!hasPermission(userRole, PERMISSIONS.LEAVE_VIEW_ALL)) {
        const profile = await db.getStaffProfileByUserId(ctx.user.id);
        if (profile) return db.listLeaveRequestsPaginated(input?.page ?? 1, input?.pageSize ?? 25, { staffId: profile.id });
        return { data: [], total: 0, page: 1, pageSize: 25 };
      }
      return db.listLeaveRequestsPaginated(input?.page ?? 1, input?.pageSize ?? 25, {
        staffId: input?.staffId,
        status: input?.status,
        search: input?.search,
      });
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getLeaveRequestById(input.id);
    }),
    getBalance: protectedProcedure.input(
      z.object({ staffId: z.number(), year: z.number() })
    ).query(async ({ input }) => {
      return db.getLeaveBalance(input.staffId, input.year);
    }),
    // B8: Expose leave balance management
    setBalance: requirePermission(PERMISSIONS.LEAVE_APPROVE_ZONE).input(
      z.object({
        staffId: z.number(),
        year: z.number(),
        casualTotal: z.number().optional(),
        sickTotal: z.number().optional(),
        annualTotal: z.number().optional(),
        dutyTotal: z.number().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const existing = await db.getLeaveBalance(input.staffId, input.year);
      await db.upsertLeaveBalance({
        staffId: input.staffId,
        year: input.year,
        casualTotal: input.casualTotal ?? existing?.casualTotal ?? 7,
        casualUsed: existing?.casualUsed ?? 0,
        sickTotal: input.sickTotal ?? existing?.sickTotal ?? 21,
        sickUsed: existing?.sickUsed ?? 0,
        annualTotal: input.annualTotal ?? existing?.annualTotal ?? 14,
        annualUsed: existing?.annualUsed ?? 0,
        dutyTotal: input.dutyTotal ?? existing?.dutyTotal ?? 0,
        dutyUsed: existing?.dutyUsed ?? 0,
      });
      await audit(ctx.user.id, "set_leave_balance", "leave_balance", undefined, input, ctx.req);
      return { success: true };
    }),
    create: requirePermission(PERMISSIONS.LEAVE_APPLY).input(
      z.object({
        leaveType: z.enum(["casual", "sick", "annual", "maternity", "paternity", "duty", "study", "no_pay", "other"]),
        startDate: z.date(),
        endDate: z.date(),
        numberOfDays: z.number().min(1),
        reason: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const profile = await db.getStaffProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found" });

      // B3: Validate numberOfDays against date range
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (end < start) throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date" });
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
      if (input.numberOfDays !== diffDays) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Number of days (${input.numberOfDays}) must match date range (${diffDays} days)`,
        });
      }

      // B2: Check leave balance before submission
      const balanceFields = LEAVE_BALANCE_FIELD_MAP[input.leaveType];
      if (balanceFields) {
        const year = start.getFullYear();
        const balance = await db.getLeaveBalance(profile.id, year);
        if (!balance) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Leave balance not configured for ${year}. Please contact administration.`,
          });
        }
        const total = (balance as any)[balanceFields.total] as number;
        const used = (balance as any)[balanceFields.used] as number;
        const remaining = total - used;
        if (input.numberOfDays > remaining) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient ${input.leaveType} leave balance. Remaining: ${remaining}, Requested: ${input.numberOfDays}`,
          });
        }
      }

      const id = await db.createLeaveRequest({
        ...input,
        staffId: profile.id,
        status: "pending",
        appliedAt: new Date(),
      } as any);
      await audit(ctx.user.id, "submit_leave", "leave_request", id, input, ctx.req);
      return { id };
    }),
    approve: requirePermission(PERMISSIONS.LEAVE_APPROVE_SCHOOL).input(
      z.object({ id: z.number(), comment: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      const userRole = ctx.user.role as ZeoRole;
      const isZoneLevel = hasPermission(userRole, PERMISSIONS.LEAVE_APPROVE_ZONE);
      const leaveReq = await db.getLeaveRequestById(input.id);
      if (!leaveReq) throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found" });

      const newStatus = isZoneLevel ? "approved" : "approved_by_principal";
      await db.updateLeaveRequest(input.id, {
        status: newStatus,
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        reviewerComment: input.comment ?? null,
        ...(isZoneLevel ? { approvedBy: ctx.user.id, approvedAt: new Date(), approverComment: input.comment ?? null } : {}),
      } as any);

      // B1: Update leave balance on final approval
      if (isZoneLevel) {
        const balanceFields = LEAVE_BALANCE_FIELD_MAP[leaveReq.leaveType];
        if (balanceFields) {
          await db.incrementLeaveUsed(leaveReq.staffId, leaveReq.startDate.getFullYear(), balanceFields.used, leaveReq.numberOfDays);
        }
      }

      // B4: Notify the staff member about leave status
      const staffProfile = await db.getStaffProfileById(leaveReq.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(
            staffUser.id,
            `Leave ${newStatus === "approved" ? "Approved" : "Approved by Principal"}`,
            `Your ${leaveReq.leaveType} leave request from ${leaveReq.startDate.toLocaleDateString()} has been ${newStatus === "approved" ? "approved" : "approved by your principal and forwarded for zone approval"}.`,
            "leave_update",
            "leave_request",
            input.id,
          );
        }
      }

      await audit(ctx.user.id, "approve", "leave_request", input.id, { comment: input.comment }, ctx.req);
      return { success: true };
    }),
    reject: requirePermission(PERMISSIONS.LEAVE_APPROVE_SCHOOL).input(
      z.object({ id: z.number(), comment: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      const leaveReq = await db.getLeaveRequestById(input.id);
      if (!leaveReq) throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found" });

      await db.updateLeaveRequest(input.id, {
        status: "rejected",
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        reviewerComment: input.comment ?? null,
      } as any);

      // B4: Notify the staff member about rejection
      const staffProfile = await db.getStaffProfileById(leaveReq.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(
            staffUser.id,
            "Leave Rejected",
            `Your ${leaveReq.leaveType} leave request from ${leaveReq.startDate.toLocaleDateString()} has been rejected.${input.comment ? ` Reason: ${input.comment}` : ""}`,
            "leave_update",
            "leave_request",
            input.id,
          );
        }
      }

      await audit(ctx.user.id, "reject", "leave_request", input.id, { comment: input.comment }, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Transfer Requests ───────────────────────────────────────────────────
  transfers: router({
    list: protectedProcedure.input(
      z.object({
        staffId: z.number().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const userRole = ctx.user.role as ZeoRole;
      if (!hasPermission(userRole, PERMISSIONS.TRANSFER_VIEW_ALL)) {
        const profile = await db.getStaffProfileByUserId(ctx.user.id);
        if (profile) return db.listTransferRequestsPaginated(input?.page ?? 1, input?.pageSize ?? 25, { staffId: profile.id });
        return { data: [], total: 0, page: 1, pageSize: 25 };
      }
      // B9: Transfer list now joins school names
      return db.listTransferRequestsPaginated(input?.page ?? 1, input?.pageSize ?? 25, {
        staffId: input?.staffId,
        status: input?.status,
        search: input?.search,
      });
    }),
    submit: requirePermission(PERMISSIONS.TRANSFER_APPLY).input(
      z.object({
        requestedSchoolId: z.number().optional(),
        reason: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const profile = await db.getStaffProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found" });
      if (!profile.schoolId) throw new TRPCError({ code: "BAD_REQUEST", message: "No current school assigned" });
      const id = await db.createTransferRequest({
        staffId: profile.id,
        currentSchoolId: profile.schoolId,
        requestedSchoolId: input.requestedSchoolId ?? null,
        reason: input.reason ?? null,
        status: "pending",
      } as any);
      await audit(ctx.user.id, "submit_transfer", "transfer_request", id, input, ctx.req);
      return { id };
    }),
    recommend: requirePermission(PERMISSIONS.TRANSFER_RECOMMEND).input(
      z.object({ id: z.number(), recommendation: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      const transfer = await db.getTransferRequestById(input.id);
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND", message: "Transfer request not found" });

      await db.updateTransferRequest(input.id, {
        status: "recommended_by_principal",
        principalRecommendation: input.recommendation ?? null,
        principalRecommendedAt: new Date(),
        workflowState: "principal_recommended",
      } as any);

      // B5: Notify staff about recommendation
      const staffProfile = await db.getStaffProfileById(transfer.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(staffUser.id, "Transfer Recommended", "Your transfer request has been recommended by the principal.", "transfer_update", "transfer_request", input.id);
        }
      }

      await audit(ctx.user.id, "recommend", "transfer_request", input.id, input, ctx.req);
      return { success: true };
    }),
    // B6: Branch head can now review forward OR reject
    review: requirePermission(PERMISSIONS.TRANSFER_REVIEW).input(
      z.object({ id: z.number(), review: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      const transfer = await db.getTransferRequestById(input.id);
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND", message: "Transfer request not found" });

      await db.updateTransferRequest(input.id, {
        status: "reviewed_by_branch",
        branchReview: input.review ?? null,
        branchReviewedAt: new Date(),
        workflowState: "branch_reviewed",
      } as any);

      // B5: Notify staff
      const staffProfile = await db.getStaffProfileById(transfer.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(staffUser.id, "Transfer Reviewed", "Your transfer request has been reviewed by the branch head.", "transfer_update", "transfer_request", input.id);
        }
      }

      await audit(ctx.user.id, "review", "transfer_request", input.id, input, ctx.req);
      return { success: true };
    }),
    // B6: Branch head reject capability
    rejectByBranch: requirePermission(PERMISSIONS.TRANSFER_REVIEW).input(
      z.object({ id: z.number(), comment: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      const transfer = await db.getTransferRequestById(input.id);
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND", message: "Transfer request not found" });

      await db.updateTransferRequest(input.id, {
        status: "rejected",
        branchReview: input.comment ?? null,
        branchReviewedAt: new Date(),
        workflowState: "rejected_by_branch",
      } as any);

      const staffProfile = await db.getStaffProfileById(transfer.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(staffUser.id, "Transfer Rejected", `Your transfer request has been rejected by the branch head.${input.comment ? ` Reason: ${input.comment}` : ""}`, "transfer_update", "transfer_request", input.id);
        }
      }

      await audit(ctx.user.id, "reject_by_branch", "transfer_request", input.id, input, ctx.req);
      return { success: true };
    }),
    approve: requirePermission(PERMISSIONS.TRANSFER_APPROVE).input(
      z.object({ id: z.number(), comment: z.string().optional(), effectiveDate: z.date().optional() })
    ).mutation(async ({ ctx, input }) => {
      const transfer = await db.getTransferRequestById(input.id);
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND", message: "Transfer request not found" });

      await db.updateTransferRequest(input.id, {
        status: "approved",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
        approverComment: input.comment ?? null,
        effectiveDate: input.effectiveDate ?? null,
        workflowState: "approved",
      } as any);

      // B5: Notify staff
      const staffProfile = await db.getStaffProfileById(transfer.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(staffUser.id, "Transfer Approved", "Your transfer request has been approved by the Zonal Director.", "transfer_update", "transfer_request", input.id);
        }
      }

      await audit(ctx.user.id, "approve", "transfer_request", input.id, input, ctx.req);
      return { success: true };
    }),
    reject: requirePermission(PERMISSIONS.TRANSFER_APPROVE).input(
      z.object({ id: z.number(), comment: z.string().optional() })
    ).mutation(async ({ ctx, input }) => {
      const transfer = await db.getTransferRequestById(input.id);
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND", message: "Transfer request not found" });

      await db.updateTransferRequest(input.id, {
        status: "rejected",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
        approverComment: input.comment ?? null,
        workflowState: "rejected",
      } as any);

      const staffProfile = await db.getStaffProfileById(transfer.staffId);
      if (staffProfile) {
        const staffUser = await db.getUserById(staffProfile.userId);
        if (staffUser) {
          await notify(staffUser.id, "Transfer Rejected", `Your transfer request has been rejected.${input.comment ? ` Reason: ${input.comment}` : ""}`, "transfer_update", "transfer_request", input.id);
        }
      }

      await audit(ctx.user.id, "reject", "transfer_request", input.id, input, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Professional Development ────────────────────────────────────────────
  professionalDev: router({
    list: protectedProcedure.input(z.object({ staffId: z.number() })).query(async ({ input }) => {
      return db.listProfessionalDevelopment(input.staffId);
    }),
    // S4: Add permission guard
    create: requirePermission(PERMISSIONS.STAFF_EDIT).input(
      z.object({
        staffId: z.number(),
        programName: z.string().min(1),
        programType: z.enum(["workshop", "seminar", "conference", "course", "certification", "other"]),
        provider: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        durationHours: z.number().optional(),
        description: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await db.createProfessionalDevelopment(input as any);
      await audit(ctx.user.id, "create", "professional_development", id, input, ctx.req);
      return { id };
    }),
    listPaginated: protectedProcedure.input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        staffId: z.number().optional(),
        programType: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    ).query(async ({ input }) => {
      return db.listProfessionalDevelopmentPaginated(
        input?.page ?? 1,
        input?.pageSize ?? 25,
        { staffId: input?.staffId, programType: input?.programType, search: input?.search }
      );
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getProfessionalDevelopmentById(input.id);
    }),
    update: requirePermission(PERMISSIONS.STAFF_EDIT).input(
      z.object({
        id: z.number(),
        programName: z.string().min(1).optional(),
        programType: z.enum(["workshop", "seminar", "conference", "course", "certification", "other"]).optional(),
        provider: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        durationHours: z.number().optional(),
        description: z.string().optional(),
        certificateUrl: z.string().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateProfessionalDevelopment(id, data as any);
      await audit(ctx.user.id, "update", "professional_development", id, data, ctx.req);
      return { success: true };
    }),
    delete: requirePermission(PERMISSIONS.STAFF_EDIT).input(
      z.object({ id: z.number() })
    ).mutation(async ({ ctx, input }) => {
      await db.deleteProfessionalDevelopment(input.id);
      await audit(ctx.user.id, "delete", "professional_development", input.id, {}, ctx.req);
      return { success: true };
    }),
    stats: protectedProcedure.query(async () => {
      return db.getProfessionalDevelopmentStats();
    }),
  }),

  // ─── Announcements ──────────────────────────────────────────────────────
  announcements: router({
    list: protectedProcedure.input(
      z.object({
        category: z.string().optional(),
        isPublished: z.boolean().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
      }).optional()
    ).query(async ({ input }) => {
      return db.listAnnouncementsPaginated(input?.page ?? 1, input?.pageSize ?? 25, {
        category: input?.category,
        isPublished: input?.isPublished ?? true,
        search: input?.search,
      });
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const announcement = await db.getAnnouncementById(input.id);
      if (announcement) await db.markAnnouncementRead(input.id, ctx.user.id);
      return announcement;
    }),
    create: requirePermission(PERMISSIONS.ANNOUNCEMENTS_CREATE).input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.enum(["general", "urgent", "circular", "event", "holiday", "exam", "training", "other"]).optional(),
        priority: z.enum(["low", "normal", "high", "critical"]).optional(),
        targetAudience: z.array(z.string()).optional(),
        isPublished: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        expiresAt: z.date().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const id = await db.createAnnouncement({
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.isPublished ? new Date() : null,
        targetAudience: input.targetAudience ?? null,
        targetSchoolIds: null,
      } as any);
      await audit(ctx.user.id, "create", "announcement", id, { title: input.title }, ctx.req);
      return { id };
    }),
    update: requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE).input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.enum(["general", "urgent", "circular", "event", "holiday", "exam", "training", "other"]).optional(),
        priority: z.enum(["low", "normal", "high", "critical"]).optional(),
        isPublished: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        expiresAt: z.date().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.isPublished) (data as any).publishedAt = new Date();
      await db.updateAnnouncement(id, data as any);
      await audit(ctx.user.id, "update", "announcement", id, data, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Notifications ──────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listNotifications(ctx.user.id, input?.limit ?? 50);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Messages ────────────────────────────────────────────────────────────
  messages: router({
    threads: protectedProcedure.query(async ({ ctx }) => {
      return db.listUserThreads(ctx.user.id);
    }),
    getMessages: protectedProcedure.input(z.object({ threadId: z.number() })).query(async ({ input }) => {
      return db.getThreadMessages(input.threadId);
    }),
    createThread: protectedProcedure.input(
      z.object({
        subject: z.string().optional(),
        participantIds: z.array(z.number()),
      })
    ).mutation(async ({ ctx, input }) => {
      const allParticipants = Array.from(new Set([ctx.user.id, ...input.participantIds]));
      const id = await db.createThread(
        { subject: input.subject ?? null, createdBy: ctx.user.id, lastMessageAt: new Date() } as any,
        allParticipants,
      );
      return { id };
    }),
    send: protectedProcedure.input(
      z.object({ threadId: z.number(), content: z.string().min(1) })
    ).mutation(async ({ ctx, input }) => {
      const participants = await db.getThreadParticipants(input.threadId);
      const isParticipant = participants.some(p => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      const id = await db.sendMessage({ threadId: input.threadId, senderId: ctx.user.id, content: input.content });
      for (const p of participants) {
        if (p.userId !== ctx.user.id) {
          await notify(p.userId, "New Message", input.content.substring(0, 100), "message", "message_thread", input.threadId);
        }
      }
      return { id };
    }),
    // Search users for message compose
    searchUsers: protectedProcedure.input(
      z.object({ query: z.string().min(1) })
    ).query(async ({ input }) => {
      return db.searchUsersForMessages(input.query);
    }),
  }),

  // ─── Analytics (S2: Add permission guard) ───────────────────────────────
  analytics: router({
    overview: requirePermission(PERMISSIONS.ANALYTICS_VIEW_SCHOOL).query(async () => {
      const [staffCount, schoolCount, pendingLeaves, pendingTransfers, announcementCount, staffByDesignation, leaveByType] = await Promise.all([
        db.getStaffCount(),
        db.getSchoolCount(),
        db.getPendingLeaveCount(),
        db.getPendingTransferCount(),
        db.getAnnouncementCount(),
        db.getStaffByDesignation(),
        db.getLeaveByType(),
      ]);
      return { staffCount, schoolCount, pendingLeaves, pendingTransfers, announcementCount, staffByDesignation, leaveByType };
    }),
    dashboardExtended: requirePermission(PERMISSIONS.ANALYTICS_VIEW_SCHOOL).query(async () => {
      const [budgetSummary, transactionBreakdown, inspectionStats, improvementStats, procurementStats, studentCount, recentActivity] = await Promise.all([
        db.getDashboardBudgetSummary(),
        db.getDashboardTransactionBreakdown(),
        db.getDashboardInspectionStats(),
        db.getDashboardImprovementPlanStats(),
        db.getDashboardProcurementStats(),
        db.getStudentCount(),
        db.getDashboardRecentActivity(10),
      ]);
      return { budgetSummary, transactionBreakdown, inspectionStats, improvementStats, procurementStats, studentCount, recentActivity };
    }),
  }),

  // ─── Audit Logs ──────────────────────────────────────────────────────────
  auditLogs: router({
    list: requirePermission(PERMISSIONS.AUDIT_VIEW).input(
      z.object({
        userId: z.number().optional(),
        entityType: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      }).optional()
    ).query(async ({ input }) => {
      return db.listAuditLogsPaginated(input?.page ?? 1, input?.pageSize ?? 50, {
        userId: input?.userId,
        entityType: input?.entityType,
      });
    }),
   }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — Student Information System (SIS)
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Students ──────────────────────────────────────────────────────────────
  students: router({
    list: requirePermission(PERMISSIONS.STUDENT_VIEW).input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        schoolId: z.number().optional(),
      }).optional()
    ).query(async ({ input }) => {
      return db.getStudents({
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
        search: input?.search,
        schoolId: input?.schoolId,
      });
    }),

    getById: requirePermission(PERMISSIONS.STUDENT_VIEW).input(
      z.object({ id: z.number() })
    ).query(async ({ input }) => {
      const student = await db.getStudentById(input.id);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
      return student;
    }),

    create: requirePermission(PERMISSIONS.STUDENT_MANAGE).input(
      z.object({
        admissionNumber: z.string().optional(),
        fullName: z.string().min(1),
        nameWithInitials: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        nationality: z.string().optional(),
        religion: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        parentGuardianInfo: z.any().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        healthRecords: z.any().optional(),
        previousSchool: z.string().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      await db.createStudent({
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      });
      await audit(ctx.user.id, "create", "student", undefined, { fullName: input.fullName }, ctx.req);
      return { success: true };
    }),

    update: requirePermission(PERMISSIONS.STUDENT_MANAGE).input(
      z.object({
        id: z.number(),
        fullName: z.string().optional(),
        nameWithInitials: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        parentGuardianInfo: z.any().optional(),
        healthRecords: z.any().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      const { id, dateOfBirth, ...rest } = input;
      await db.updateStudent(id, {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      });
      await audit(ctx.user.id, "update", "student", id, rest, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Enrollments ───────────────────────────────────────────────────────────
  enrollments: router({
    list: requirePermission(PERMISSIONS.STUDENT_VIEW).input(
      z.object({
        studentId: z.number().optional(),
        schoolId: z.number().optional(),
        academicYear: z.number().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }).optional()
    ).query(async ({ input }) => {
      return db.getEnrollments({
        studentId: input?.studentId,
        schoolId: input?.schoolId,
        academicYear: input?.academicYear,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
      });
    }),

    enroll: requirePermission(PERMISSIONS.STUDENT_MANAGE).input(
      z.object({
        studentId: z.number(),
        schoolId: z.number(),
        academicYear: z.number(),
        grade: z.string().min(1),
        classSection: z.string().optional(),
        medium: z.enum(["sinhala", "tamil", "english"]).optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      await db.createEnrollment({
        ...input,
        status: "active",
        enrollmentDate: new Date(),
      });
      await audit(ctx.user.id, "enroll", "enrollment", undefined, input, ctx.req);
      return { success: true };
    }),

    updateStatus: requirePermission(PERMISSIONS.STUDENT_MANAGE).input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "transferred", "graduated", "dropped_out", "suspended"]),
        leavingReason: z.string().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      const updates: any = { status: input.status };
      if (input.status !== "active") {
        updates.leavingDate = new Date();
        updates.leavingReason = input.leavingReason;
      }
      await db.updateEnrollment(input.id, updates);
      await audit(ctx.user.id, "update_status", "enrollment", input.id, input, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Attendance ────────────────────────────────────────────────────────────
  attendance: router({
    markBulk: requirePermission(PERMISSIONS.ATTENDANCE_MARK).input(
      z.object({
        schoolId: z.number(),
        date: z.string(),
        records: z.array(z.object({
          studentId: z.number(),
          status: z.enum(["present", "absent", "late", "excused"]),
          remarks: z.string().optional(),
        })),
      })
    ).mutation(async ({ input, ctx }) => {
      const attendanceData = input.records.map(r => ({
        studentId: r.studentId,
        schoolId: input.schoolId,
        date: new Date(input.date),
        status: r.status,
        markedBy: ctx.user.id,
        remarks: r.remarks ?? null,
      }));
      await db.markAttendance(attendanceData);
      await audit(ctx.user.id, "mark_bulk", "attendance", undefined, { schoolId: input.schoolId, date: input.date, count: input.records.length }, ctx.req);
      return { success: true, count: input.records.length };
    }),

    getByDate: requirePermission(PERMISSIONS.ATTENDANCE_VIEW).input(
      z.object({
        schoolId: z.number(),
        date: z.string(),
        grade: z.string().optional(),
      })
    ).query(async ({ input }) => {
      return db.getAttendanceByDate(input);
    }),

    studentSummary: requirePermission(PERMISSIONS.ATTENDANCE_VIEW).input(
      z.object({
        studentId: z.number(),
        academicYear: z.number(),
      })
    ).query(async ({ input }) => {
      return db.getStudentAttendanceSummary(input.studentId, input.academicYear);
    }),

    schoolSummary: requirePermission(PERMISSIONS.ATTENDANCE_VIEW).input(
      z.object({
        schoolId: z.number(),
        date: z.string(),
      })
    ).query(async ({ input }) => {
      return db.getSchoolAttendanceSummary(input.schoolId, input.date);
    }),
  }),

  // ─── Subjects ──────────────────────────────────────────────────────────────
  subjects: router({
    list: protectedProcedure.input(
      z.object({ gradeLevel: z.string().optional() }).optional()
    ).query(async ({ input }) => {
      return db.getSubjects({ gradeLevel: input?.gradeLevel });
    }),

    create: requirePermission(PERMISSIONS.STUDENT_MANAGE).input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        medium: z.enum(["sinhala", "tamil", "english"]).optional(),
        gradeLevel: z.string().optional(),
        isCompulsory: z.boolean().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      await db.createSubject(input);
      await audit(ctx.user.id, "create", "subject", undefined, input, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Grades / Marks ────────────────────────────────────────────────────────
  studentGrades: router({
    list: requirePermission(PERMISSIONS.GRADE_VIEW).input(
      z.object({
        studentId: z.number().optional(),
        subjectId: z.number().optional(),
        academicYear: z.number().optional(),
        term: z.enum(["term_1", "term_2", "term_3"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }).optional()
    ).query(async ({ input }) => {
      return db.getGrades({
        studentId: input?.studentId,
        subjectId: input?.subjectId,
        academicYear: input?.academicYear,
        term: input?.term,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
      });
    }),

    enter: requirePermission(PERMISSIONS.GRADE_MANAGE).input(
      z.object({
        studentId: z.number(),
        subjectId: z.number(),
        academicYear: z.number(),
        term: z.enum(["term_1", "term_2", "term_3"]),
        assessmentType: z.enum(["class_test", "term_exam", "practical", "assignment", "project", "other"]),
        assessmentName: z.string().optional(),
        maxMarks: z.number().min(1).default(100),
        obtainedMarks: z.number().min(0),
        gradeSymbol: z.string().optional(),
        remarks: z.string().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      if (input.obtainedMarks > input.maxMarks) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Obtained marks cannot exceed max marks" });
      }
      await db.createGrade({
        ...input,
        enteredBy: ctx.user.id,
      });
      await audit(ctx.user.id, "enter", "grade", undefined, input, ctx.req);
      return { success: true };
    }),

    update: requirePermission(PERMISSIONS.GRADE_MANAGE).input(
      z.object({
        id: z.number(),
        obtainedMarks: z.number().min(0).optional(),
        gradeSymbol: z.string().optional(),
        remarks: z.string().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      const { id, ...rest } = input;
      await db.updateGrade(id, rest);
      await audit(ctx.user.id, "update", "grade", id, rest, ctx.req);
      return { success: true };
    }),

    studentSummary: requirePermission(PERMISSIONS.GRADE_VIEW).input(
      z.object({
        studentId: z.number(),
        academicYear: z.number(),
      })
    ).query(async ({ input }) => {
      return db.getStudentGradeSummary(input.studentId, input.academicYear);
    }),
  }),

  // ─── Scholarships ──────────────────────────────────────────────────────────
  scholarships: router({
    programs: router({
      list: requirePermission(PERMISSIONS.SCHOLARSHIP_VIEW).input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(20),
          isActive: z.boolean().optional(),
        }).optional()
      ).query(async ({ input }) => {
        return db.getScholarshipPrograms({
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 20,
          isActive: input?.isActive,
        });
      }),

      create: requirePermission(PERMISSIONS.SCHOLARSHIP_MANAGE).input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          provider: z.string().optional(),
          eligibilityCriteria: z.string().optional(),
          amount: z.number().optional(),
          frequency: z.enum(["one_time", "monthly", "annual"]).optional(),
          academicYear: z.number().optional(),
          applicationDeadline: z.string().optional(),
          maxRecipients: z.number().optional(),
        })
      ).mutation(async ({ input, ctx }) => {
        await db.createScholarshipProgram({
          ...input,
          applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : undefined,
          createdBy: ctx.user.id,
        });
        await audit(ctx.user.id, "create", "scholarship_program", undefined, input, ctx.req);
        return { success: true };
      }),
    }),

    applications: router({
      list: requirePermission(PERMISSIONS.SCHOLARSHIP_VIEW).input(
        z.object({
          programId: z.number().optional(),
          studentId: z.number().optional(),
          status: z.string().optional(),
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(20),
        }).optional()
      ).query(async ({ input }) => {
        return db.getScholarshipApplications({
          programId: input?.programId,
          studentId: input?.studentId,
          status: input?.status,
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 20,
        });
      }),

      submit: requirePermission(PERMISSIONS.SCHOLARSHIP_APPLY).input(
        z.object({
          programId: z.number(),
          studentId: z.number(),
          schoolId: z.number(),
          supportingDocuments: z.any().optional(),
        })
      ).mutation(async ({ input, ctx }) => {
        await db.createScholarshipApplication({
          ...input,
          status: "applied",
          applicationDate: new Date(),
        });
        await audit(ctx.user.id, "apply", "scholarship_application", undefined, input, ctx.req);
        return { success: true };
      }),

      review: requirePermission(PERMISSIONS.SCHOLARSHIP_MANAGE).input(
        z.object({
          id: z.number(),
          status: z.enum(["under_review", "shortlisted", "awarded", "rejected"]),
          reviewComment: z.string().optional(),
          awardedAmount: z.number().optional(),
        })
      ).mutation(async ({ input, ctx }) => {
        const updates: any = {
          status: input.status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewComment: input.reviewComment,
        };
        if (input.status === "awarded") {
          updates.awardedAmount = input.awardedAmount;
          updates.awardedAt = new Date();
        }
        await db.updateScholarshipApplication(input.id, updates);
        await audit(ctx.user.id, "review", "scholarship_application", input.id, input, ctx.req);
        return { success: true };
      }),
    }),
  }),

  // ─── Report Cards ───────────────────────────────────────────────────────────
  reportCards: router({
    list: requirePermission(PERMISSIONS.GRADE_VIEW).input(
      z.object({
        studentId: z.number().optional(),
        academicYear: z.number().optional(),
        term: z.enum(["term_1", "term_2", "term_3"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }).optional()
    ).query(async ({ input }) => {
      return db.listReportCards({
        studentId: input?.studentId,
        academicYear: input?.academicYear,
        term: input?.term,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
      });
    }),

    upsert: requirePermission(PERMISSIONS.GRADE_MANAGE).input(
      z.object({
        studentId: z.number(),
        enrollmentId: z.number().optional(),
        academicYear: z.number(),
        term: z.enum(["term_1", "term_2", "term_3"]),
        classTeacherRemarks: z.string().optional(),
        principalRemarks: z.string().optional(),
        attendanceRate: z.number().min(0).max(100).optional(),
        totalMarks: z.number().min(0).optional(),
        averageMarks: z.number().min(0).optional(),
        gradePointAverage: z.number().min(0).optional(),
        rankInClass: z.number().min(1).optional(),
        isPublished: z.boolean().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      await db.createOrUpdateReportCard({ ...input, generatedBy: ctx.user.id, publishedAt: input.isPublished ? new Date() : undefined });
      await audit(ctx.user.id, "upsert", "report_card", undefined, input, ctx.req);
      return { success: true };
    }),
  }),

  // ─── Parent Portal (SIS read-only child access) ──────────────────────────
  parentPortal: router({
    linkChild: requirePermission(PERMISSIONS.STUDENT_MANAGE).input(
      z.object({
        parentUserId: z.number(),
        studentId: z.number(),
        relationship: z.enum(["father", "mother", "guardian", "other"]).optional(),
        isPrimary: z.boolean().optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      await db.linkParentToStudent({ ...input, isActive: true });
      await audit(ctx.user.id, "link", "parent_student", undefined, input, ctx.req);
      return { success: true };
    }),

    myChildren: protectedProcedure.query(async ({ ctx }) => {
      return db.listChildrenForParent(ctx.user.id);
    }),

    childProfile: protectedProcedure.input(z.object({ studentId: z.number() })).query(async ({ input, ctx }) => {
      const data = await db.getParentChildProfile(ctx.user.id, input.studentId);
      if (!data) throw new TRPCError({ code: "FORBIDDEN", message: "Student not linked to this parent" });
      return data;
    }),

    childAttendanceSummary: protectedProcedure.input(
      z.object({ studentId: z.number(), academicYear: z.number() })
    ).query(async ({ input, ctx }) => {
      const data = await db.getParentChildAttendanceSummary(ctx.user.id, input.studentId, input.academicYear);
      if (!data) throw new TRPCError({ code: "FORBIDDEN", message: "Student not linked to this parent" });
      return data;
    }),

    childGradeSummary: protectedProcedure.input(
      z.object({ studentId: z.number(), academicYear: z.number() })
    ).query(async ({ input, ctx }) => {
      const data = await db.getParentChildGradeSummary(ctx.user.id, input.studentId, input.academicYear);
      if (!data) throw new TRPCError({ code: "FORBIDDEN", message: "Student not linked to this parent" });
      return data;
    }),

    childReportCards: protectedProcedure.input(
      z.object({ studentId: z.number(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }).optional()
    ).query(async ({ input, ctx }) => {
      const studentId = input?.studentId;
      if (!studentId) return { data: [], total: 0 };
      const linked = await db.getParentChildProfile(ctx.user.id, studentId);
      if (!linked) throw new TRPCError({ code: "FORBIDDEN", message: "Student not linked to this parent" });
      return db.listReportCards({ studentId, page: input?.page ?? 1, pageSize: input?.pageSize ?? 20 });
    }),
  }),

  // ─── SIS Analytics ─────────────────────────────────────────────────────────
  sisAnalytics: router({
    overview: requirePermission(PERMISSIONS.ANALYTICS_VIEW).query(async () => {
      const [studentCount, enrollmentsByGrade] = await Promise.all([
        db.getStudentCount(),
        db.getEnrollmentsByGrade(),
      ]);
      return { studentCount, enrollmentsByGrade };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — FINANCE & PROCUREMENT
  // ═══════════════════════════════════════════════════════════════════════════
  finance: router({
    // ─── Budgets ─────────────────────────────────────────────────────────
    budgets: router({
      list: requirePermission(PERMISSIONS.BUDGET_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), schoolId: z.number().optional(), academicYear: z.string().optional(), status: z.string().optional() })
      ).query(({ input }) => db.listBudgets(input)),

      getById: requirePermission(PERMISSIONS.BUDGET_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getBudgetById(input.id)),

      create: requirePermission(PERMISSIONS.BUDGET_MANAGE).input(
        z.object({ schoolId: z.number().nullable().optional(), academicYear: z.string(), totalAllocation: z.number().min(0), notes: z.string().optional() })
      ).mutation(async ({ input, ctx }) => {
        await db.createBudget({ ...input, remainingBalance: input.totalAllocation, createdBy: ctx.user.id });
        await audit(ctx.user.id, "create", "budget", undefined, input, ctx.req);
        return { success: true };
      }),

      update: requirePermission(PERMISSIONS.BUDGET_MANAGE).input(
        z.object({ id: z.number(), totalAllocation: z.number().optional(), status: z.string().optional(), notes: z.string().optional() })
      ).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        if (data.status === "approved") {
          (data as any).approvedBy = ctx.user.id;
          (data as any).approvedAt = new Date();
        }
        await db.updateBudget(id, data as any);
        await audit(ctx.user.id, "update", "budget", id, input, ctx.req);
        return { success: true };
      }),
    }),

    // ─── Transactions ───────────────────────────────────────────────────
    transactions: router({
      list: requirePermission(PERMISSIONS.TRANSACTION_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), budgetId: z.number().optional(), type: z.string().optional(), category: z.string().optional(), search: z.string().optional() })
      ).query(({ input }) => db.listTransactions(input)),

      create: requirePermission(PERMISSIONS.TRANSACTION_CREATE).input(
        z.object({ budgetId: z.number(), type: z.enum(["income", "expenditure"]), category: z.enum(["salary", "stationery", "maintenance", "utilities", "transport", "equipment", "training", "grants", "fees", "donations", "other"]), amount: z.number().min(1), description: z.string().min(1), referenceNumber: z.string().optional(), transactionDate: z.coerce.date() })
      ).mutation(async ({ input, ctx }) => {
        await db.createTransaction({ ...input, recordedBy: ctx.user.id });
        await audit(ctx.user.id, "create", "transaction", undefined, input, ctx.req);
        return { success: true };
      }),

      summary: requirePermission(PERMISSIONS.TRANSACTION_VIEW).input(z.object({ budgetId: z.number() })).query(({ input }) => db.getTransactionSummary(input.budgetId)),
    }),

    // ─── Salary Records ─────────────────────────────────────────────────
    salary: router({
      list: requirePermission(PERMISSIONS.SALARY_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), staffId: z.number().optional(), month: z.number().optional(), year: z.number().optional(), status: z.string().optional() })
      ).query(({ input }) => db.listSalaryRecords(input)),

      create: requirePermission(PERMISSIONS.SALARY_MANAGE).input(
        z.object({ staffId: z.number(), month: z.number().min(1).max(12), year: z.number(), grossPay: z.number().min(0), epfDeduction: z.number().min(0).default(0), etfDeduction: z.number().min(0).default(0), taxDeduction: z.number().min(0).default(0), otherDeductions: z.number().min(0).default(0), netPay: z.number().min(0) })
      ).mutation(async ({ input, ctx }) => {
        await db.createSalaryRecord({ ...input, processedBy: ctx.user.id });
        await audit(ctx.user.id, "create", "salary_record", undefined, input, ctx.req);
        return { success: true };
      }),
    }),

    // ─── Vendors ─────────────────────────────────────────────────────────
    vendors: router({
      list: requirePermission(PERMISSIONS.VENDOR_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), category: z.string().optional(), search: z.string().optional(), isActive: z.boolean().optional() })
      ).query(({ input }) => db.listVendors(input)),

      getById: requirePermission(PERMISSIONS.VENDOR_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getVendorById(input.id)),

      create: requirePermission(PERMISSIONS.VENDOR_MANAGE).input(
        z.object({ name: z.string().min(1), registrationNumber: z.string().optional(), contactPerson: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional(), address: z.string().optional(), category: z.enum(["stationery", "equipment", "furniture", "construction", "services", "food", "transport", "other"]) })
      ).mutation(async ({ input, ctx }) => {
        await db.createVendor({ ...input, createdBy: ctx.user.id });
        await audit(ctx.user.id, "create", "vendor", undefined, input, ctx.req);
        return { success: true };
      }),
    }),

    // ─── Procurement ────────────────────────────────────────────────────
    procurement: router({
      list: requirePermission(PERMISSIONS.PROCUREMENT_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), schoolId: z.number().optional(), status: z.string().optional(), search: z.string().optional() })
      ).query(({ input }) => db.listPurchaseRequisitions(input)),

      getById: requirePermission(PERMISSIONS.PROCUREMENT_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getPurchaseRequisitionById(input.id)),

      create: requirePermission(PERMISSIONS.PROCUREMENT_CREATE).input(
        z.object({ schoolId: z.number().nullable().optional(), budgetId: z.number().nullable().optional(), title: z.string().min(1), description: z.string().optional(), items: z.array(z.object({ name: z.string(), quantity: z.number(), unitPrice: z.number(), total: z.number() })), totalEstimatedCost: z.number().min(0), justification: z.string().optional() })
      ).mutation(async ({ input, ctx }) => {
        await db.createPurchaseRequisition({ ...input, submittedBy: ctx.user.id, status: "submitted" });
        await audit(ctx.user.id, "create", "purchase_requisition", undefined, input, ctx.req);
        return { success: true };
      }),

      review: requirePermission(PERMISSIONS.PROCUREMENT_APPROVE).input(
        z.object({ id: z.number(), status: z.enum(["approved", "rejected", "bid_invited", "bid_evaluated", "awarded", "completed", "cancelled"]), reviewComment: z.string().optional(), vendorId: z.number().optional(), actualCost: z.number().optional() })
      ).mutation(async ({ input, ctx }) => {
        const updates: any = { status: input.status, reviewedBy: ctx.user.id, reviewedAt: new Date(), reviewComment: input.reviewComment };
        if (input.status === "approved") { updates.approvedBy = ctx.user.id; updates.approvedAt = new Date(); }
        if (input.vendorId) updates.vendorId = input.vendorId;
        if (input.actualCost) updates.actualCost = input.actualCost;
        if (input.status === "completed") updates.completedAt = new Date();
        await db.updatePurchaseRequisition(input.id, updates);
        await audit(ctx.user.id, "review", "purchase_requisition", input.id, input, ctx.req);
        return { success: true };
      }),
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — SCHOOL SUPERVISION & QA
  // ═══════════════════════════════════════════════════════════════════════════
  supervision: router({
    // ─── Inspection Templates ────────────────────────────────────────────
    templates: router({
      list: requirePermission(PERMISSIONS.INSPECTION_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), category: z.string().optional(), isActive: z.boolean().optional() })
      ).query(({ input }) => db.listInspectionTemplates(input)),

      getById: requirePermission(PERMISSIONS.INSPECTION_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getInspectionTemplateById(input.id)),

      create: requirePermission(PERMISSIONS.INSPECTION_MANAGE).input(
        z.object({ name: z.string().min(1), description: z.string().optional(), category: z.enum(["curriculum", "infrastructure", "safety", "administration", "teaching_quality", "general"]), formSchema: z.any() })
      ).mutation(async ({ input, ctx }) => {
        await db.createInspectionTemplate({ ...input, createdBy: ctx.user.id });
        await audit(ctx.user.id, "create", "inspection_template", undefined, input, ctx.req);
        return { success: true };
      }),
    }),

    // ─── Inspections ────────────────────────────────────────────────────
    inspections: router({
      list: requirePermission(PERMISSIONS.INSPECTION_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), schoolId: z.number().optional(), supervisorId: z.number().optional(), status: z.string().optional() })
      ).query(({ input }) => db.listInspections(input)),

      getById: requirePermission(PERMISSIONS.INSPECTION_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getInspectionById(input.id)),

      schedule: requirePermission(PERMISSIONS.INSPECTION_CONDUCT).input(
        z.object({ schoolId: z.number(), templateId: z.number(), scheduledDate: z.coerce.date() })
      ).mutation(async ({ input, ctx }) => {
        await db.createInspection({ ...input, supervisorId: ctx.user.id });
        await audit(ctx.user.id, "schedule", "inspection", undefined, input, ctx.req);
        return { success: true };
      }),

      submit: requirePermission(PERMISSIONS.INSPECTION_CONDUCT).input(
        z.object({ id: z.number(), formData: z.any(), overallScore: z.number().min(0).max(100), summary: z.string().optional(), recommendations: z.string().optional() })
      ).mutation(async ({ input, ctx }) => {
        await db.updateInspection(input.id, { formData: input.formData, overallScore: input.overallScore, summary: input.summary, recommendations: input.recommendations, status: "completed", completedDate: new Date() });
        await audit(ctx.user.id, "submit", "inspection", input.id, input, ctx.req);
        return { success: true };
      }),

      acknowledge: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
        await db.updateInspection(input.id, { principalAcknowledged: true, acknowledgedAt: new Date() });
        await audit(ctx.user.id, "acknowledge", "inspection", input.id, {}, ctx.req);
        return { success: true };
      }),
    }),

    // ─── Improvement Plans ──────────────────────────────────────────────
    plans: router({
      list: requirePermission(PERMISSIONS.IMPROVEMENT_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), schoolId: z.number().optional(), status: z.string().optional() })
      ).query(({ input }) => db.listImprovementPlans(input)),

      getById: requirePermission(PERMISSIONS.IMPROVEMENT_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getImprovementPlanById(input.id)),

      create: requirePermission(PERMISSIONS.IMPROVEMENT_MANAGE).input(
        z.object({ schoolId: z.number(), inspectionId: z.number().nullable().optional(), title: z.string().min(1), description: z.string().optional(), recommendations: z.array(z.object({ id: z.string(), action: z.string(), responsible: z.string(), deadline: z.string(), status: z.string(), progress: z.number() })), startDate: z.coerce.date().optional(), targetDate: z.coerce.date().optional() })
      ).mutation(async ({ input, ctx }) => {
        await db.createImprovementPlan({ ...input, createdBy: ctx.user.id, status: "active" });
        await audit(ctx.user.id, "create", "improvement_plan", undefined, input, ctx.req);
        return { success: true };
      }),

      update: requirePermission(PERMISSIONS.IMPROVEMENT_MANAGE).input(
        z.object({ id: z.number(), recommendations: z.any().optional(), status: z.string().optional(), overallProgress: z.number().optional() })
      ).mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        if (data.status === "completed") (data as any).completedDate = new Date();
        await db.updateImprovementPlan(id, data as any);
        await audit(ctx.user.id, "update", "improvement_plan", id, input, ctx.req);
        return { success: true };
      }),
    }),

    // ─── School Scorecards ──────────────────────────────────────────────
    scorecards: router({
      list: requirePermission(PERMISSIONS.SCORECARD_VIEW).input(
        z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20), schoolId: z.number().optional(), academicYear: z.string().optional() })
      ).query(({ input }) => db.listSchoolScorecards(input)),

      getById: requirePermission(PERMISSIONS.SCORECARD_VIEW).input(z.object({ id: z.number() })).query(({ input }) => db.getSchoolScorecardById(input.id)),

      create: requirePermission(PERMISSIONS.SCORECARD_MANAGE).input(
        z.object({ schoolId: z.number(), academicYear: z.string(), overallScore: z.number().min(0).max(100), componentScores: z.any(), inspectionCount: z.number().default(0), improvementPlanCount: z.number().default(0), rank: z.number().optional(), notes: z.string().optional() })
      ).mutation(async ({ input, ctx }) => {
        await db.createSchoolScorecard({ ...input, generatedBy: ctx.user.id });
        await audit(ctx.user.id, "create", "school_scorecard", undefined, input, ctx.req);
        return { success: true };
      }),
    }),
  }),
});
export type AppRouter = typeof appRouter;
