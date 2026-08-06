"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const notification_repository_1 = __importDefault(require("./notification.repository"));
const prisma = new client_1.PrismaClient();
const notificationService = {
    // ─── CRUD ──────────────────────────────────────────────
    async getForUser(userId, options = {}) {
        return notification_repository_1.default.getForUser(userId, options);
    },
    async getUnreadCount(userId) {
        return notification_repository_1.default.getUnreadCount(userId);
    },
    async markAsRead(id) {
        return notification_repository_1.default.markAsRead(id);
    },
    async markAllAsRead(userId) {
        return notification_repository_1.default.markAllAsRead(userId);
    },
    async deleteNotification(id) {
        return notification_repository_1.default.deleteOne(id);
    },
    // ─── TRIGGER HELPERS ───────────────────────────────────
    /**
     * Notify learners in the course's department (or all users if global)
     * that a new course has been created / published.
     */
    async notifyCourseCreated(course) {
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
            const whereClause = {
                id: { not: course.creatorId },
            };
            if (course.departmentId) {
                whereClause.departmentId = course.departmentId;
            }
            const recipients = await prisma.employee.findMany({
                where: whereClause,
                select: { id: true },
            });
            if (recipients.length === 0)
                return;
            const notifications = recipients.map((r) => ({
                userId: r.id,
                type: "COURSE_CREATED",
                title: "New Course Available",
                message: `${creatorName} published a new course: "${course.title}"`,
                link: `/courses/${course.id}/preview`,
                metadata: { courseId: Number(course.id) },
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send course creation notifications:", err);
        }
    },
    /**
     * Notify all ADMIN + SUPER_ADMIN that a skill was submitted for review.
     */
    async notifySkillSubmitted(skill) {
        try {
            const submitter = await prisma.employee.findUnique({
                where: { id: skill.userId },
                select: { firstName: true, lastName: true, departmentId: true },
            });
            const submitterName = submitter
                ? `${submitter.firstName} ${submitter.lastName}`
                : "A user";
            const admins = await this._getAdminEmployeeIds(submitter?.departmentId);
            if (admins.length === 0)
                return;
            const notifications = admins.map((adminId) => ({
                userId: adminId,
                type: "SKILL_SUBMITTED",
                title: "Skill Approval Required",
                message: `${submitterName} submitted skill "${skill.skillName}" for approval.`,
                link: "/skill-cloud",
                metadata: { userSkillId: Number(skill.id) },
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send skill submission notifications:", err);
        }
    },
    /**
     * Notify the submitter that their skill was approved.
     */
    async notifySkillApproved(userId, skillName) {
        try {
            await notification_repository_1.default.create({
                userId,
                type: "SKILL_APPROVED",
                title: "Skill Approved ✓",
                message: `Your skill "${skillName}" has been approved by an administrator.`,
                link: "/skill-cloud",
            });
        }
        catch (err) {
            console.error("Failed to send skill approval notification:", err);
        }
    },
    /**
     * Notify the submitter that their skill was rejected.
     */
    async notifySkillRejected(userId, skillName, reason) {
        try {
            await notification_repository_1.default.create({
                userId,
                type: "SKILL_REJECTED",
                title: "Skill Rejected",
                message: `Your skill "${skillName}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
                link: "/skill-cloud",
            });
        }
        catch (err) {
            console.error("Failed to send skill rejection notification:", err);
        }
    },
    /**
     * Notify all ADMIN (of same department) + SUPER_ADMIN that a project was submitted for review.
     */
    async notifyProjectSubmitted(project) {
        try {
            const submitter = await prisma.employee.findUnique({
                where: { id: project.userId },
                select: { firstName: true, lastName: true, departmentId: true },
            });
            const submitterName = submitter
                ? `${submitter.firstName} ${submitter.lastName}`
                : "A user";
            const admins = await this._getAdminEmployeeIds(submitter?.departmentId);
            if (admins.length === 0)
                return;
            const notifications = admins.map((adminId) => ({
                userId: adminId,
                type: "PROJECT_SUBMITTED",
                title: "Project Approval Required",
                message: `${submitterName} submitted project "${project.projectName}" for approval.`,
                link: "/skill-cloud",
                metadata: { userProjectId: Number(project.id) },
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send project submission notifications:", err);
        }
    },
    /**
     * Notify the submitter that their project was approved.
     */
    async notifyProjectApproved(userId, projectName) {
        try {
            await notification_repository_1.default.create({
                userId,
                type: "PROJECT_APPROVED",
                title: "Project Approved ✓",
                message: `Your project "${projectName}" has been approved by an administrator.`,
                link: "/skill-cloud",
            });
        }
        catch (err) {
            console.error("Failed to send project approval notification:", err);
        }
    },
    /**
     * Notify the submitter that their project was rejected.
     */
    async notifyProjectRejected(userId, projectName, reason) {
        try {
            await notification_repository_1.default.create({
                userId,
                type: "PROJECT_REJECTED",
                title: "Project Rejected",
                message: `Your project "${projectName}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
                link: "/skill-cloud",
            });
        }
        catch (err) {
            console.error("Failed to send project rejection notification:", err);
        }
    },
    // ─── INTERNAL HELPERS ──────────────────────────────────
    /**
     * Get employee IDs for all SUPER_ADMIN users AND ADMIN users belonging to departmentId.
     */
    async _getAdminEmployeeIds(departmentId) {
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
        const matchingIds = [];
        for (const r of adminRoles) {
            if (r.role.roleCode === "SUPER_ADMIN") {
                matchingIds.push(r.employeeId);
            }
            else if (r.role.roleCode === "ADMIN") {
                if (!departmentId || r.employee.departmentId === departmentId) {
                    matchingIds.push(r.employeeId);
                }
            }
        }
        return [...new Set(matchingIds)];
    },
};
exports.default = notificationService;
