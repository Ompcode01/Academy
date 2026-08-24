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
  return hasRole(role, ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER);
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

/**
 * Helper to check whether a specific user can edit a specific course.
 * Super Admin & Admin can edit any course.
 * Teachers can only edit courses where they are the creator or an assigned teacher.
 */
export function canUserEditCourse(
  user: { role?: string; employeeId?: number | string | bigint } | null | undefined,
  course: any
): boolean {
  if (!user || !user.role) return false;
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.TEACHER) {
    if (!course) return false;
    const empId = user.employeeId ? Number(user.employeeId) : null;
    if (!empId) return false;

    const isCreator = course.creatorId ? Number(course.creatorId) === empId : false;
    const isAssignedTeacher = (course.teachers || []).some(
      (t: any) => Number(t.teacherId || t.teacher?.id || t.id) === empId
    );
    return isCreator || isAssignedTeacher;
  }
  return false;
}

