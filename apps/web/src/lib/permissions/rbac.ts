import type { RoleName } from "@prisma/client";

type PermissionKey =
  | "manage:system"
  | "manage:users"
  | "manage:clients"
  | "manage:projects"
  | "manage:tasks"
  | "manage:baselines"
  | "manage:reports"
  | "comment:assigned-task"
  | "log-time:assigned-task"
  | "read:client-projects"
  | "read:assigned-work";

const rolePermissions: Record<RoleName, PermissionKey[]> = {
  ADMIN: [
    "manage:system",
    "manage:users",
    "manage:clients",
    "manage:projects",
    "manage:tasks",
    "manage:baselines",
    "manage:reports",
    "read:client-projects",
    "read:assigned-work"
  ],
  PROJECT_MANAGER: [
    "manage:projects",
    "manage:tasks",
    "manage:baselines",
    "manage:reports",
    "read:assigned-work"
  ],
  EMPLOYEE: ["comment:assigned-task", "log-time:assigned-task", "read:assigned-work"],
  CLIENT: ["read:client-projects"]
};

export function can(role: RoleName | string | undefined, permission: PermissionKey) {
  if (!role) return false;
  return rolePermissions[role as RoleName]?.includes(permission) ?? false;
}

export function canManageProject(role: RoleName | string | undefined) {
  return can(role, "manage:projects");
}

export function canManageTask(role: RoleName | string | undefined) {
  return can(role, "manage:tasks");
}
