export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  LEARNER: "LEARNER",
  GUEST: "GUEST",
} as const;

export type UserRole = keyof typeof ROLES;

/**
 * Checks if the user's role matches any of the allowed roles
 */
export function hasRole(userRole: string | undefined, ...allowedRoles: string[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Helper to check course creation authorization
 */
export function canCreateCourse(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);
}

/**
 * Helper to check department management authorization
 */
export function canManageDepartments(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN);
}

/**
 * Helper to check user management authorization
 */
export function canManageUsers(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN);
}

/**
 * Helper to check course editing/deleting authorization
 */
export function canManageCourses(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);
}

/**
 * Helper to check reports viewing authorization
 */
export function canViewReports(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN);
}

/**
 * Helper to check platform settings management authorization
 */
export function canManageSettings(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN);
}

/**
 * Helper to check role assignment authorization
 */
export function canAssignRoles(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN);
}

/**
 * Helper to check if user is Super Admin
 */
export function isSuperAdmin(role: string | undefined): boolean {
  return hasRole(role, ROLES.SUPER_ADMIN);
}

