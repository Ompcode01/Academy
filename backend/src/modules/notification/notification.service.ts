import { PrismaClient } from "@prisma/client";
import notificationRepository, {
  CreateNotificationInput,
} from "./notification.repository";

const prisma = new PrismaClient();

const notificationService = {
  // ─── CRUD ──────────────────────────────────────────────

  async getForUser(
    userId: bigint,
    options: { limit?: number; unreadOnly?: boolean } = {}
  ) {
    return notificationRepository.getForUser(userId, options);
  },

  async getUnreadCount(userId: bigint) {
    return notificationRepository.getUnreadCount(userId);
  },

  async markAsRead(id: bigint) {
    return notificationRepository.markAsRead(id);
  },

  async markAllAsRead(userId: bigint) {
    return notificationRepository.markAllAsRead(userId);
  },

  async deleteNotification(id: bigint) {
    return notificationRepository.deleteOne(id);
  },

  // ─── TRIGGER HELPERS ───────────────────────────────────

  /**
   * Notify learners in the course's department (or all users if global)
   * that a new course has been created / published.
   */
  async notifyCourseCreated(course: {
    id: bigint;
    title: string;
    departmentId: bigint | null;
    creatorId: bigint;
  }) {
    try {
      // Find the creator name
      const creator = await prisma.employee.findUnique({
        where: { id: course.creatorId },
        select: { firstName: true, lastName: true },
      });
      const creatorName = creator
        ? `${creator.firstName} ${creator.lastName}`
        : "An instructor";

      // Determine recipients: all employees (excluding creator) in the same department, or all if global
      const whereClause: any = {
        id: { not: course.creatorId },
      };
      if (course.departmentId) {
        whereClause.departmentId = course.departmentId;
      }

      const recipients = await prisma.employee.findMany({
        where: whereClause,
        select: { id: true },
      });

      if (recipients.length === 0) return;

      const notifications: CreateNotificationInput[] = recipients.map((r) => ({
        userId: r.id,
        type: "COURSE_CREATED",
        title: "New Course Available",
        message: `${creatorName} published a new course: "${course.title}"`,
        link: `/courses/${course.id}/preview`,
        metadata: { courseId: Number(course.id) },
      }));

      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send course creation notifications:", err);
    }
  },

  /**
   * Notify all ADMIN + SUPER_ADMIN that a skill was submitted for review.
   */
  async notifySkillSubmitted(skill: {
    id: bigint;
    skillName: string;
    userId: bigint;
  }) {
    try {
      const submitter = await prisma.employee.findUnique({
        where: { id: skill.userId },
        select: { firstName: true, lastName: true, departmentId: true },
      });
      const submitterName = submitter
        ? `${submitter.firstName} ${submitter.lastName}`
        : "A user";

      const admins = await this._getAdminEmployeeIds(submitter?.departmentId);

      if (admins.length === 0) return;

      const notifications: CreateNotificationInput[] = admins.map((adminId) => ({
        userId: adminId,
        type: "SKILL_SUBMITTED",
        title: "Skill Approval Required",
        message: `${submitterName} submitted skill "${skill.skillName}" for approval.`,
        link: "/skill-cloud",
        metadata: { userSkillId: Number(skill.id) },
      }));

      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send skill submission notifications:", err);
    }
  },

  /**
   * Notify the submitter that their skill was approved.
   */
  async notifySkillApproved(userId: bigint, skillName: string) {
    try {
      await notificationRepository.create({
        userId,
        type: "SKILL_APPROVED",
        title: "Skill Approved ✓",
        message: `Your skill "${skillName}" has been approved by an administrator.`,
        link: "/skill-cloud",
      });
    } catch (err) {
      console.error("Failed to send skill approval notification:", err);
    }
  },

  /**
   * Notify the submitter that their skill was rejected.
   */
  async notifySkillRejected(
    userId: bigint,
    skillName: string,
    reason: string | null
  ) {
    try {
      await notificationRepository.create({
        userId,
        type: "SKILL_REJECTED",
        title: "Skill Rejected",
        message: `Your skill "${skillName}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
        link: "/skill-cloud",
      });
    } catch (err) {
      console.error("Failed to send skill rejection notification:", err);
    }
  },

  /**
   * Notify all ADMIN (of same department) + SUPER_ADMIN that a project was submitted for review.
   */
  async notifyProjectSubmitted(project: {
    id: bigint;
    projectName: string;
    userId: bigint;
  }) {
    try {
      const submitter = await prisma.employee.findUnique({
        where: { id: project.userId },
        select: { firstName: true, lastName: true, departmentId: true },
      });
      const submitterName = submitter
        ? `${submitter.firstName} ${submitter.lastName}`
        : "A user";

      const admins = await this._getAdminEmployeeIds(submitter?.departmentId);

      if (admins.length === 0) return;

      const notifications: CreateNotificationInput[] = admins.map((adminId) => ({
        userId: adminId,
        type: "PROJECT_SUBMITTED",
        title: "Project Approval Required",
        message: `${submitterName} submitted project "${project.projectName}" for approval.`,
        link: "/skill-cloud",
        metadata: { userProjectId: Number(project.id) },
      }));

      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send project submission notifications:", err);
    }
  },

  /**
   * Notify the submitter that their project was approved.
   */
  async notifyProjectApproved(userId: bigint, projectName: string) {
    try {
      await notificationRepository.create({
        userId,
        type: "PROJECT_APPROVED",
        title: "Project Approved ✓",
        message: `Your project "${projectName}" has been approved by an administrator.`,
        link: "/skill-cloud",
      });
    } catch (err) {
      console.error("Failed to send project approval notification:", err);
    }
  },

  /**
   * Notify the submitter that their project was rejected.
   */
  async notifyProjectRejected(
    userId: bigint,
    projectName: string,
    reason: string | null
  ) {
    try {
      await notificationRepository.create({
        userId,
        type: "PROJECT_REJECTED",
        title: "Project Rejected",
        message: `Your project "${projectName}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
        link: "/skill-cloud",
      });
    } catch (err) {
      console.error("Failed to send project rejection notification:", err);
    }
  },

  // ─── INTERNAL HELPERS ──────────────────────────────────

  /**
   * Get employee IDs for all SUPER_ADMIN users AND ADMIN users belonging to departmentId.
   */
  async _getAdminEmployeeIds(departmentId?: bigint | null): Promise<bigint[]> {
    const adminRoles = await prisma.userRole.findMany({
      where: {
        role: {
          roleCode: { in: ["ADMIN", "SUPER_ADMIN"] },
        },
        isActive: true,
      },
      select: {
        employeeId: true,
        role: { select: { roleCode: true } },
        employee: { select: { departmentId: true } },
      },
    });

    const matchingIds: bigint[] = [];
    for (const r of adminRoles) {
      if (r.role.roleCode === "SUPER_ADMIN") {
        matchingIds.push(r.employeeId);
      } else if (r.role.roleCode === "ADMIN") {
        if (!departmentId || r.employee.departmentId === departmentId) {
          matchingIds.push(r.employeeId);
        }
      }
    }

    return [...new Set(matchingIds)];
  },
};

export default notificationService;
