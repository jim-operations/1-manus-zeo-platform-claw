import { describe, expect, it } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleHigherOrEqual,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
} from "../shared/permissions";
import type { ZeoRole } from "../drizzle/schema";

describe("RBAC Permissions System", () => {
  describe("hasPermission", () => {
    it("admin has all permissions", () => {
      const allPerms = Object.values(PERMISSIONS);
      for (const perm of allPerms) {
        expect(hasPermission("admin", perm)).toBe(true);
      }
    });

    it("zonal_director has user management permissions", () => {
      expect(hasPermission("zonal_director", PERMISSIONS.USERS_VIEW)).toBe(true);
      expect(hasPermission("zonal_director", PERMISSIONS.USERS_MANAGE)).toBe(true);
      expect(hasPermission("zonal_director", PERMISSIONS.USERS_ASSIGN_ROLES)).toBe(true);
    });

    it("zonal_director can approve transfers", () => {
      expect(hasPermission("zonal_director", PERMISSIONS.TRANSFER_APPROVE)).toBe(true);
    });

    it("teacher can apply for leave but not approve", () => {
      expect(hasPermission("teacher", PERMISSIONS.LEAVE_APPLY)).toBe(true);
      expect(hasPermission("teacher", PERMISSIONS.LEAVE_APPROVE_SCHOOL)).toBe(false);
      expect(hasPermission("teacher", PERMISSIONS.LEAVE_APPROVE_ZONE)).toBe(false);
    });

    it("principal can approve school-level leave", () => {
      expect(hasPermission("principal", PERMISSIONS.LEAVE_APPROVE_SCHOOL)).toBe(true);
      expect(hasPermission("principal", PERMISSIONS.LEAVE_APPROVE_ZONE)).toBe(false);
    });

    it("teacher can apply for transfer but not recommend/approve", () => {
      expect(hasPermission("teacher", PERMISSIONS.TRANSFER_APPLY)).toBe(true);
      expect(hasPermission("teacher", PERMISSIONS.TRANSFER_RECOMMEND)).toBe(false);
      expect(hasPermission("teacher", PERMISSIONS.TRANSFER_APPROVE)).toBe(false);
    });

    it("principal can recommend transfers but not approve", () => {
      expect(hasPermission("principal", PERMISSIONS.TRANSFER_RECOMMEND)).toBe(true);
      expect(hasPermission("principal", PERMISSIONS.TRANSFER_APPROVE)).toBe(false);
    });

    it("branch_head can review transfers", () => {
      expect(hasPermission("branch_head", PERMISSIONS.TRANSFER_REVIEW)).toBe(true);
    });

    it("parent has limited permissions", () => {
      expect(hasPermission("parent", PERMISSIONS.ANNOUNCEMENTS_VIEW)).toBe(true);
      expect(hasPermission("parent", PERMISSIONS.MESSAGES_SEND)).toBe(true);
      expect(hasPermission("parent", PERMISSIONS.STAFF_VIEW_ALL)).toBe(false);
      expect(hasPermission("parent", PERMISSIONS.LEAVE_APPLY)).toBe(false);
    });

    it("student has most restricted permissions", () => {
      expect(hasPermission("student", PERMISSIONS.ANNOUNCEMENTS_VIEW)).toBe(true);
      expect(hasPermission("student", PERMISSIONS.NOTIFICATIONS_VIEW)).toBe(true);
      expect(hasPermission("student", PERMISSIONS.MESSAGES_SEND)).toBe(false);
      expect(hasPermission("student", PERMISSIONS.LEAVE_APPLY)).toBe(false);
    });

    it("user (default) can only view announcements and notifications", () => {
      expect(hasPermission("user", PERMISSIONS.ANNOUNCEMENTS_VIEW)).toBe(true);
      expect(hasPermission("user", PERMISSIONS.NOTIFICATIONS_VIEW)).toBe(true);
      expect(hasPermission("user", PERMISSIONS.MESSAGES_SEND)).toBe(false);
      expect(hasPermission("user", PERMISSIONS.STAFF_VIEW_ALL)).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true if role has at least one permission", () => {
      expect(
        hasAnyPermission("teacher", [PERMISSIONS.LEAVE_APPLY, PERMISSIONS.SYSTEM_ADMIN])
      ).toBe(true);
    });

    it("returns false if role has none of the permissions", () => {
      expect(
        hasAnyPermission("student", [PERMISSIONS.LEAVE_APPLY, PERMISSIONS.STAFF_CREATE])
      ).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true if role has all listed permissions", () => {
      expect(
        hasAllPermissions("teacher", [PERMISSIONS.LEAVE_APPLY, PERMISSIONS.TRANSFER_APPLY])
      ).toBe(true);
    });

    it("returns false if role is missing any permission", () => {
      expect(
        hasAllPermissions("teacher", [PERMISSIONS.LEAVE_APPLY, PERMISSIONS.LEAVE_APPROVE_SCHOOL])
      ).toBe(false);
    });
  });

  describe("isRoleHigherOrEqual", () => {
    it("admin is higher than all roles", () => {
      const roles: ZeoRole[] = [
        "zonal_director", "deputy_director", "branch_head", "isa",
        "principal", "teacher", "parent", "student", "user",
      ];
      for (const role of roles) {
        expect(isRoleHigherOrEqual("admin", role)).toBe(true);
      }
    });

    it("teacher is higher than parent and student", () => {
      expect(isRoleHigherOrEqual("teacher", "parent")).toBe(true);
      expect(isRoleHigherOrEqual("teacher", "student")).toBe(true);
    });

    it("teacher is not higher than principal", () => {
      expect(isRoleHigherOrEqual("teacher", "principal")).toBe(false);
    });

    it("same role is equal to itself", () => {
      expect(isRoleHigherOrEqual("principal", "principal")).toBe(true);
    });
  });

  describe("ROLE_DISPLAY_NAMES", () => {
    it("all roles have display names", () => {
      const roles: ZeoRole[] = [
        "admin", "zonal_director", "deputy_director", "branch_head",
        "isa", "principal", "teacher", "parent", "student", "user",
      ];
      for (const role of roles) {
        expect(ROLE_DISPLAY_NAMES[role]).toBeDefined();
        expect(ROLE_DISPLAY_NAMES[role].length).toBeGreaterThan(0);
      }
    });

    it("deputy_director is labeled as Development", () => {
      expect(ROLE_DISPLAY_NAMES.deputy_director).toBe("Deputy Director (Development)");
    });
  });

  describe("ROLE_HIERARCHY", () => {
    it("hierarchy values are in correct order", () => {
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.zonal_director);
      expect(ROLE_HIERARCHY.zonal_director).toBeGreaterThan(ROLE_HIERARCHY.deputy_director);
      expect(ROLE_HIERARCHY.deputy_director).toBeGreaterThan(ROLE_HIERARCHY.branch_head);
      expect(ROLE_HIERARCHY.branch_head).toBeGreaterThan(ROLE_HIERARCHY.isa);
      expect(ROLE_HIERARCHY.isa).toBeGreaterThan(ROLE_HIERARCHY.principal);
      expect(ROLE_HIERARCHY.principal).toBeGreaterThan(ROLE_HIERARCHY.teacher);
      expect(ROLE_HIERARCHY.teacher).toBeGreaterThan(ROLE_HIERARCHY.parent);
      expect(ROLE_HIERARCHY.parent).toBeGreaterThan(ROLE_HIERARCHY.student);
      expect(ROLE_HIERARCHY.student).toBeGreaterThan(ROLE_HIERARCHY.user);
    });
  });

  describe("ROLE_PERMISSIONS completeness", () => {
    it("all 10 roles are defined", () => {
      const roles: ZeoRole[] = [
        "admin", "zonal_director", "deputy_director", "branch_head",
        "isa", "principal", "teacher", "parent", "student", "user",
      ];
      for (const role of roles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it("admin permissions include all defined permissions", () => {
      const allPerms = Object.values(PERMISSIONS);
      expect(ROLE_PERMISSIONS.admin.length).toBe(allPerms.length);
    });
  });
});
