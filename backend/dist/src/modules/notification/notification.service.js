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
    async findById(id) {
        return notification_repository_1.default.findById(id);
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
                roleTarget: "LEARNER",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send course creation notifications:", err);
        }
    },
    /**
     * Notify a learner that they have been enrolled in a course.
     */
    async notifyEnrollment(enrollment) {
        try {
            const enrollerLabel = enrollment.enrolledBy || "An administrator";
            await notification_repository_1.default.create({
                userId: enrollment.userId,
                type: "ENROLLMENT",
                title: "Course Enrollment",
                message: `${enrollerLabel} enrolled you in the course: "${enrollment.courseTitle}"`,
                link: `/courses/${enrollment.courseId}/preview`,
                metadata: { courseId: Number(enrollment.courseId) },
                roleTarget: "LEARNER",
            });
        }
        catch (err) {
            console.error("Failed to send enrollment notification:", err);
        }
    },
    /**
     * Notify admins when a learner completes a course.
     */
    async notifyCourseCompleted(data) {
        try {
            const admins = await this._getAdminEmployeeIds(data.departmentId);
            if (admins.length === 0)
                return;
            const notifications = admins.map((adminId) => ({
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
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send course completion notifications:", err);
        }
    },
    /**
     * Notify enrolled learners when a teacher updates course contents.
     */
    async notifyCourseUpdated(data) {
        try {
            const course = await prisma.course.findUnique({
                where: { id: data.courseId },
                select: { departmentId: true, creatorId: true },
            });
            // 1. Gather all Learner IDs: enrolled users + department employees
            const recipientLearnerIds = new Set();
            const enrollments = await prisma.enrollment.findMany({
                where: { courseId: data.courseId },
                select: { userId: true },
            });
            enrollments.forEach((e) => recipientLearnerIds.add(e.userId));
            const deptWhere = {};
            if (course?.departmentId) {
                deptWhere.departmentId = course.departmentId;
            }
            const deptEmployees = await prisma.employee.findMany({
                where: deptWhere,
                select: { id: true },
            });
            deptEmployees.forEach((emp) => recipientLearnerIds.add(emp.id));
            const typeLabel = data.contentType ? ` (${data.contentType})` : "";
            const notifications = Array.from(recipientLearnerIds).map((learnerId) => ({
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
                await notification_repository_1.default.createMany(notifications);
            }
        }
        catch (err) {
            console.error("Failed to send course update notifications:", err);
        }
    },
    /**
     * Notify assigned teachers when added to a course.
     */
    async notifyTeacherAssigned(data) {
        try {
            if (!data.teacherIds || data.teacherIds.length === 0)
                return;
            const notifications = data.teacherIds.map((tId) => ({
                userId: tId,
                type: "TEACHER_ASSIGNED",
                title: "Assigned as Course Instructor",
                message: `You have been assigned as the instructor for course '${data.courseTitle}'. You can now view and edit its curriculum.`,
                link: `/courses/${data.courseId}/preview`,
                metadata: { courseId: Number(data.courseId) },
                roleTarget: "TEACHER",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send teacher assignment notifications:", err);
        }
    },
    /**
     * Notify a learner when their submission is evaluated or marked for revision.
     */
    async notifySubmissionEvaluated(data) {
        try {
            const isRevision = data.status === "NEEDS_REVISION";
            const title = isRevision ? "Revision Required" : "Submission Evaluated";
            const message = `Your submission for "${data.contentTitle}" in course '${data.courseTitle}' was evaluated by Teacher ${data.teacherName}. Status: ${data.status}.${data.grade ? ` Grade: ${data.grade}.` : ""}${data.feedback ? ` Feedback: ${data.feedback}` : ""}`;
            await notification_repository_1.default.create({
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
        }
        catch (err) {
            console.error("Failed to send submission evaluation notification:", err);
        }
    },
    /**
     * Notify all SUPER_ADMIN users for system-level events
     * (e.g., new admin creation, platform settings changes).
     */
    async notifySystemEvent(event) {
        try {
            const superAdmins = await this._getSuperAdminEmployeeIds();
            if (superAdmins.length === 0)
                return;
            const notifications = superAdmins.map((adminId) => ({
                userId: adminId,
                type: event.type || "SYSTEM_EVENT",
                title: event.title,
                message: event.message,
                link: event.link || null,
                metadata: event.metadata || null,
                roleTarget: "SUPER_ADMIN",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send system event notifications:", err);
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
                roleTarget: "ADMIN",
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
                roleTarget: "LEARNER",
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
                roleTarget: "LEARNER",
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
                roleTarget: "ADMIN",
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
                roleTarget: "LEARNER",
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
                roleTarget: "LEARNER",
            });
        }
        catch (err) {
            console.error("Failed to send project rejection notification:", err);
        }
    },
    /**
     * Account Events: Created, activated/deactivated, role changed, security/password events.
     */
    async notifyAccountEvent(data) {
        try {
            await notification_repository_1.default.create({
                userId: data.userId,
                actorId: data.actorId,
                type: data.eventType,
                category: data.eventType.includes("PASSWORD") || data.eventType.includes("SECURITY") ? "SECURITY" : "ACCOUNT",
                priority: data.priority || "NORMAL",
                title: data.title,
                message: data.message,
                link: "/settings",
                entityType: "USER",
                entityId: data.userId,
                roleTarget: "LEARNER",
            });
        }
        catch (err) {
            console.error("Failed to send account event notification:", err);
        }
    },
    /**
     * Department Events: Created, updated, employee transferred.
     */
    async notifyDepartmentEvent(data) {
        try {
            const admins = await this._getAdminEmployeeIds(data.departmentId);
            if (admins.length === 0)
                return;
            const notifications = admins.map((adminId) => ({
                userId: adminId,
                actorId: data.actorId,
                type: "DEPARTMENT_EVENT",
                category: "DEPARTMENT",
                priority: "NORMAL",
                title: data.title,
                message: data.message,
                link: "/organization",
                entityType: "DEPARTMENT",
                entityId: data.departmentId,
                roleTarget: "ADMIN",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send department event notification:", err);
        }
    },
    /**
     * Learner submits a quiz or assignment task -> Notify assigned Course Teachers.
     */
    async notifySubmissionCreated(data) {
        try {
            // Find assigned teachers for this course
            const courseTeachers = await prisma.courseTeacher.findMany({
                where: { courseId: data.courseId },
                select: { teacherId: true },
            });
            let recipientTeacherIds = courseTeachers.map((ct) => ct.teacherId);
            if (recipientTeacherIds.length === 0) {
                // Fallback to course creator
                const course = await prisma.course.findUnique({
                    where: { id: data.courseId },
                    select: { creatorId: true },
                });
                if (course?.creatorId)
                    recipientTeacherIds = [course.creatorId];
            }
            if (recipientTeacherIds.length === 0)
                return;
            const notifications = recipientTeacherIds.map((tId) => ({
                userId: tId,
                actorId: data.learnerId,
                type: "SUBMISSION_RECEIVED",
                category: "EVALUATION",
                priority: "NORMAL",
                title: `New ${data.submissionType} Submission`,
                message: `Learner ${data.learnerName} submitted "${data.contentTitle}" in course '${data.courseTitle}'. Pending evaluation.`,
                link: `/reports`,
                entityType: data.submissionType,
                entityId: data.courseId,
                roleTarget: "TEACHER",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send submission received notification to teacher:", err);
        }
    },
    /**
     * Targeted Announcements (SA -> LMS wide, Admin -> Dept/Course, Teacher -> Assigned Course Enrolled Learners)
     */
    async notifyAnnouncement(data) {
        try {
            let recipientIds = [];
            if (data.courseId) {
                // Broadcast to enrolled learners of this course
                const enrollments = await prisma.enrollment.findMany({
                    where: { courseId: data.courseId },
                    select: { userId: true },
                });
                recipientIds = enrollments.map((e) => e.userId);
            }
            else if (data.departmentId) {
                // Broadcast to department employees
                const employees = await prisma.employee.findMany({
                    where: { departmentId: data.departmentId },
                    select: { id: true },
                });
                recipientIds = employees.map((e) => e.id);
            }
            else if (data.actorRole === "SUPER_ADMIN") {
                // LMS-wide role broadcast
                const whereClause = {};
                if (data.targetRole && data.targetRole !== "ALL") {
                    whereClause.assignedRoles = {
                        some: { role: { roleCode: data.targetRole }, isActive: true },
                    };
                }
                const employees = await prisma.employee.findMany({
                    where: whereClause,
                    select: { id: true },
                });
                recipientIds = employees.map((e) => e.id);
            }
            // Filter out actor
            recipientIds = recipientIds.filter((id) => id !== data.actorId);
            if (recipientIds.length === 0)
                return;
            const notifications = recipientIds.map((rId) => ({
                userId: rId,
                actorId: data.actorId,
                type: "ANNOUNCEMENT",
                category: "ANNOUNCEMENT",
                priority: data.priority || "NORMAL",
                title: data.title,
                message: data.message,
                link: data.courseId ? `/courses/${data.courseId}/preview` : "/dashboard",
                entityType: data.courseId ? "COURSE" : "ANNOUNCEMENT",
                entityId: data.courseId || undefined,
                roleTarget: data.targetRole || "LEARNER",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to broadcast announcement notification:", err);
        }
    },
    /**
     * Issue Escalations / Complaints: Notify SA and Admin, NEVER notify accused teacher.
     */
    async notifyEscalation(data) {
        try {
            const saAndAdmins = await this._getAdminEmployeeIds();
            // Explicit Rule 7: Complaints against a teacher MUST NOT notify that teacher
            const recipientIds = saAndAdmins.filter((id) => id !== data.accusedTeacherId && id !== data.actorId);
            if (recipientIds.length === 0)
                return;
            const notifications = recipientIds.map((adminId) => ({
                userId: adminId,
                actorId: data.actorId,
                type: "ESCALATION",
                category: "ESCALATION",
                priority: data.priority || "HIGH",
                title: `Escalation: ${data.title}`,
                message: data.message,
                link: "/admin/audit-logs",
                entityType: "ESCALATION",
                entityId: data.courseId || undefined,
                roleTarget: "ADMIN",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send escalation notification:", err);
        }
    },
    /**
     * Calendar Event Notifications: Audience matching logic.
     */
    async notifyCalendarEvent(data) {
        try {
            let recipientIds = [];
            if (data.eventType === "course" && data.courseId) {
                // Only enrolled learners & assigned teachers
                const enrollments = await prisma.enrollment.findMany({
                    where: { courseId: data.courseId },
                    select: { userId: true },
                });
                const teachers = await prisma.courseTeacher.findMany({
                    where: { courseId: data.courseId },
                    select: { teacherId: true },
                });
                recipientIds = [
                    ...enrollments.map((e) => e.userId),
                    ...teachers.map((t) => t.teacherId),
                ];
            }
            else if (data.eventType === "department" && data.departmentId) {
                const employees = await prisma.employee.findMany({
                    where: { departmentId: data.departmentId },
                    select: { id: true },
                });
                recipientIds = employees.map((e) => e.id);
            }
            else {
                // Site / Everyone
                const employees = await prisma.employee.findMany({ select: { id: true } });
                recipientIds = employees.map((e) => e.id);
            }
            recipientIds = [...new Set(recipientIds)].filter((id) => id !== data.actorId);
            if (recipientIds.length === 0)
                return;
            const actionText = data.action === "CREATED" ? "New Event Added" : `Calendar Event ${data.action}`;
            const dateStr = data.eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const notifications = recipientIds.map((rId) => ({
                userId: rId,
                actorId: data.actorId,
                type: `EVENT_${data.action}`,
                category: "EVENT",
                priority: "NORMAL",
                title: `${actionText}: ${data.title}`,
                message: `Event "${data.title}" is scheduled for ${dateStr}. Click to view calendar.`,
                link: "/events",
                entityType: "EVENT",
                entityId: data.eventId,
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to send calendar event notification:", err);
        }
    },
    /**
     * Auto-sync active course events when a learner enrolls in a course.
     */
    async syncLearnerCalendarEventsOnEnrollment(userId, courseId) {
        try {
            const activeCourseEvents = await prisma.event.findMany({
                where: {
                    courseId,
                    eventDate: { gte: new Date() },
                },
            });
            if (activeCourseEvents.length === 0)
                return;
            const notifications = activeCourseEvents.map((evt) => ({
                userId,
                type: "EVENT_ENROLLED_SYNC",
                category: "EVENT",
                priority: "NORMAL",
                title: `Upcoming Course Event: ${evt.title}`,
                message: `You have an upcoming event for your course: "${evt.title}" on ${evt.eventDate.toLocaleDateString()}.`,
                link: "/events",
                entityType: "EVENT",
                entityId: evt.id,
                roleTarget: "LEARNER",
            }));
            await notification_repository_1.default.createMany(notifications);
        }
        catch (err) {
            console.error("Failed to sync calendar events on enrollment:", err);
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
    /**
     * Get employee IDs for SUPER_ADMIN users only.
     */
    async _getSuperAdminEmployeeIds() {
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
exports.default = notificationService;
