import { PrismaClient } from "@prisma/client";
import notificationRepository, {
  CreateNotificationInput,
} from "./notification.repository";

const prisma = new PrismaClient();

const notificationService = {
  // ─── CRUD ──────────────────────────────────────────────

  async getForUser(
    userId: bigint,
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    return notificationRepository.getForUser(userId, options);
  },

  async getUnreadCount(userId: bigint) {
    return notificationRepository.getUnreadCount(userId);
  },

  async findById(id: bigint) {
    return notificationRepository.findById(id);
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
        roleTarget: "LEARNER",
      }));

      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send course creation notifications:", err);
    }
  },

  /**
   * Notify a learner that they have been enrolled in a course.
   */
  async notifyEnrollment(enrollment: {
    userId: bigint;
    courseId: bigint;
    courseTitle: string;
    enrolledBy?: string;
  }) {
    try {
      const enrollerLabel = enrollment.enrolledBy || "An administrator";
      await notificationRepository.create({
        userId: enrollment.userId,
        type: "ENROLLMENT",
        title: "Course Enrollment",
        message: `${enrollerLabel} enrolled you in the course: "${enrollment.courseTitle}"`,
        link: `/courses/${enrollment.courseId}/preview`,
        metadata: { courseId: Number(enrollment.courseId) },
        roleTarget: "LEARNER",
      });
    } catch (err) {
      console.error("Failed to send enrollment notification:", err);
    }
  },

  /**
   * Notify admins when a learner completes a course.
   */
  async notifyCourseCompleted(data: {
    userId: bigint;
    courseId: bigint;
    courseTitle: string;
    learnerName: string;
    departmentId?: bigint | null;
  }) {
    try {
      const admins = await this._getAdminEmployeeIds(data.departmentId);
      if (admins.length === 0) return;

      const notifications: CreateNotificationInput[] = admins.map((adminId) => ({
        userId: adminId,
        type: "COURSE_COMPLETED",
        title: "Course Completed",
        message: `${data.learnerName} has completed the course: "${data.courseTitle}"`,
        link: `/courses/${data.courseId}/preview`,
        metadata: {
          courseId: Number(data.courseId),
          learnerId: Number(data.userId),
        },
        roleTarget: "ADMIN",
      }));

      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send course completion notifications:", err);
    }
  },

  /**
   * Notify enrolled learners when a teacher updates course contents.
   */
  async notifyCourseUpdated(data: {
    courseId: bigint;
    courseTitle: string;
    teacherName: string;
    addedOrUpdatedTitle: string;
    contentType?: string;
  }) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
        select: { departmentId: true, creatorId: true },
      });

      // 1. Gather all Learner IDs: enrolled users + department employees
      const recipientLearnerIds = new Set<bigint>();

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: data.courseId },
        select: { userId: true },
      });
      enrollments.forEach((e) => recipientLearnerIds.add(e.userId));

      const deptWhere: any = {};
      if (course?.departmentId) {
        deptWhere.departmentId = course.departmentId;
      }
      const deptEmployees = await prisma.employee.findMany({
        where: deptWhere,
        select: { id: true },
      });
      deptEmployees.forEach((emp) => recipientLearnerIds.add(emp.id));

      const typeLabel = data.contentType ? ` (${data.contentType})` : "";
      const notifications: CreateNotificationInput[] = Array.from(recipientLearnerIds).map((learnerId) => ({
        userId: learnerId,
        type: "COURSE_UPDATED",
        title: "Course Content Updated",
        message: `Your course '${data.courseTitle}' was updated by Teacher ${data.teacherName}. New content added: ${data.addedOrUpdatedTitle}${typeLabel}.`,
        link: `/courses/${data.courseId}/preview`,
        metadata: { courseId: Number(data.courseId) },
        roleTarget: "LEARNER",
      }));

      // 2. Notify Course Creator (Admin/SA) and Admins / Super Admins
      const adminEmployeeIds = await this._getAdminEmployeeIds(course?.departmentId);
      if (course?.creatorId && !adminEmployeeIds.includes(course.creatorId)) {
        adminEmployeeIds.push(course.creatorId);
      }

      for (const adminId of adminEmployeeIds) {
        notifications.push({
          userId: adminId,
          type: "TEACHER_COURSE_UPDATED",
          title: "Teacher Updated Course Content",
          message: `Teacher ${data.teacherName} added/updated content: "${data.addedOrUpdatedTitle}" in course '${data.courseTitle}'.`,
          link: `/courses/${data.courseId}/preview`,
          metadata: { courseId: Number(data.courseId) },
          roleTarget: "ADMIN",
        });
      }

      if (notifications.length > 0) {
        await notificationRepository.createMany(notifications);
      }
    } catch (err) {
      console.error("Failed to send course update notifications:", err);
    }
  },

  /**
   * Notify assigned teachers when added to a course.
   */
  async notifyTeacherAssigned(data: {
    courseId: bigint;
    courseTitle: string;
    teacherIds: bigint[];
  }) {
    try {
      if (!data.teacherIds || data.teacherIds.length === 0) return;
      const notifications: CreateNotificationInput[] = data.teacherIds.map((tId) => ({
        userId: tId,
        type: "TEACHER_ASSIGNED",
        title: "Assigned as Course Instructor",
        message: `You have been assigned as the instructor for course '${data.courseTitle}'. You can now view and edit its curriculum.`,
        link: `/courses/${data.courseId}/preview`,
        metadata: { courseId: Number(data.courseId) },
        roleTarget: "TEACHER",
      }));
      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send teacher assignment notifications:", err);
    }
  },

  /**
   * Notify a learner when their submission is evaluated or marked for revision.
   */
  async notifySubmissionEvaluated(data: {
    userId: bigint;
    courseId: bigint;
    courseTitle: string;
    contentTitle: string;
    teacherName: string;
    status: string;
    grade?: string | null;
    score?: number | null;
    feedback?: string | null;
  }) {
    try {
      const isRevision = data.status === "NEEDS_REVISION";
      const title = isRevision ? "Revision Required" : "Submission Evaluated";
      const message = `Your submission for "${data.contentTitle}" in course '${data.courseTitle}' was evaluated by Teacher ${data.teacherName}. Status: ${data.status}.${data.grade ? ` Grade: ${data.grade}.` : ""}${data.feedback ? ` Feedback: ${data.feedback}` : ""}`;

      await notificationRepository.create({
        userId: data.userId,
        type: isRevision ? "SUBMISSION_REVISION" : "SUBMISSION_GRADED",
        title,
        message,
        link: `/courses/${data.courseId}/preview`,
        metadata: {
          courseId: Number(data.courseId),
          status: data.status,
        },
        roleTarget: "LEARNER",
      });
    } catch (err) {
      console.error("Failed to send submission evaluation notification:", err);
    }
  },

  /**
   * Notify all SUPER_ADMIN users for system-level events
   * (e.g., new admin creation, platform settings changes).
   */
  async notifySystemEvent(event: {
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    try {
      const superAdmins = await this._getSuperAdminEmployeeIds();
      if (superAdmins.length === 0) return;

      const notifications: CreateNotificationInput[] = superAdmins.map((adminId) => ({
        userId: adminId,
        type: event.type || "SYSTEM_EVENT",
        title: event.title,
        message: event.message,
        link: event.link || null,
        metadata: event.metadata || null,
        roleTarget: "SUPER_ADMIN",
      }));

      await notificationRepository.createMany(notifications);
    } catch (err) {
      console.error("Failed to send system event notifications:", err);
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
        roleTarget: "ADMIN",
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
        roleTarget: "LEARNER",
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
        roleTarget: "LEARNER",
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
        roleTarget: "ADMIN",
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
        roleTarget: "LEARNER",
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
        roleTarget: "LEARNER",
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

  /**
   * Get employee IDs for SUPER_ADMIN users only.
   */
  async _getSuperAdminEmployeeIds(): Promise<bigint[]> {
    const superAdminRoles = await prisma.userRole.findMany({
      where: {
        role: {
          roleCode: "SUPER_ADMIN",
        },
        isActive: true,
      },
      select: {
        employeeId: true,
      },
    });

    return [...new Set(superAdminRoles.map((r) => r.employeeId))];
  },
};

export default notificationService;
