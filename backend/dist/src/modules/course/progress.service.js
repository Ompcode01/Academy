"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const serializer_1 = require("../../utils/serializer");
class ProgressService {
    async getLearnerCourseProgress(userId, courseId) {
        // 1. Get existing enrollment (Do NOT auto-create)
        const enrollment = await prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        // 2. Get completed lessons
        const completedLessons = await prisma_1.default.userLessonProgress.findMany({
            where: { userId, courseId, isCompleted: true },
            select: { contentId: true },
        });
        const completedLessonIds = completedLessons.map((l) => Number(l.contentId));
        // 3. Get quiz/assessment submissions
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: { userId, courseId },
            orderBy: { submittedAt: "desc" },
        });
        // 4. Get issued certificate if exists
        const certificate = await prisma_1.default.issuedCertificate.findFirst({
            where: { userId, courseId },
        });
        return (0, serializer_1.serialize)({
            enrollment,
            completedLessonIds,
            submissions,
            certificate,
        });
    }
    async updateLessonProgress(userId, courseId, contentId, isCompleted, additionalSeconds = 0) {
        // 1. Upsert lesson completion
        if (isCompleted) {
            await prisma_1.default.userLessonProgress.upsert({
                where: { userId_contentId: { userId, contentId } },
                update: { isCompleted: true, completedAt: new Date() },
                create: { userId, courseId, contentId, isCompleted: true },
            });
        }
        else {
            await prisma_1.default.userLessonProgress.deleteMany({
                where: { userId, contentId },
            });
        }
        // 2. Calculate course total lessons & completed count
        const sections = await prisma_1.default.courseSection.findMany({
            where: { courseId },
            include: { contents: true },
        });
        const totalLessons = sections.reduce((sum, sec) => sum + sec.contents.length, 0);
        const completedCount = await prisma_1.default.userLessonProgress.count({
            where: { userId, courseId, isCompleted: true },
        });
        const calculatedProgress = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;
        // 3. Update Enrollment
        let enrollment = await prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        const isNowCompleted = calculatedProgress >= 100;
        const updatedStatus = isNowCompleted ? "COMPLETED" : "IN_PROGRESS";
        const completedAtDate = isNowCompleted ? (enrollment?.completedAt || new Date()) : null;
        enrollment = await prisma_1.default.enrollment.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: {
                progress: calculatedProgress,
                status: updatedStatus,
                completedAt: completedAtDate,
                timeSpentSeconds: { increment: Math.max(0, additionalSeconds) },
            },
            create: {
                userId,
                courseId,
                progress: calculatedProgress,
                status: updatedStatus,
                completedAt: completedAtDate,
                timeSpentSeconds: Math.max(0, additionalSeconds),
            },
        });
        // 4. Auto Issue Certificate if completed
        let issuedCert = null;
        if (isNowCompleted) {
            issuedCert = await this.checkAndIssueCertificate(userId, courseId);
        }
        return (0, serializer_1.serialize)({
            enrollment,
            calculatedProgress,
            issuedCert,
        });
    }
    async recordQuizSubmission(userId, courseId, contentId, score, maxScore, answersJson) {
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "F";
        // Get attempt count
        const attemptCount = await prisma_1.default.assessmentSubmission.count({
            where: { userId, courseId, contentId: contentId ?? undefined },
        });
        const submission = await prisma_1.default.assessmentSubmission.create({
            data: {
                userId,
                courseId,
                contentId: contentId ?? null,
                submissionType: "QUIZ",
                answersJson: answersJson || null,
                score,
                maxScore,
                percentage,
                grade,
                attemptNumber: attemptCount + 1,
            },
        });
        // Check certificate issuance
        const cert = await this.checkAndIssueCertificate(userId, courseId);
        return (0, serializer_1.serialize)({ submission, cert });
    }
    async checkAndIssueCertificate(userId, courseId) {
        // Check template
        const template = await prisma_1.default.certificateTemplate.findUnique({
            where: { courseId },
        });
        if (template && !template.enableCertificate) {
            return null;
        }
        // Check existing certificate
        const existing = await prisma_1.default.issuedCertificate.findFirst({
            where: { userId, courseId },
        });
        if (existing)
            return (0, serializer_1.serialize)(existing);
        // Get Course details
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseId },
        });
        // Get Employee details
        const emp = await prisma_1.default.employee.findUnique({
            where: { id: userId },
        });
        const recipientName = emp ? `${emp.firstName} ${emp.lastName}` : "Learner";
        const courseTitle = course ? course.title : "Course Completion";
        const certCode = `HARB-${new Date().getFullYear()}-X${Math.floor(1000 + Math.random() * 9000)}`;
        const createdCert = await prisma_1.default.issuedCertificate.create({
            data: {
                certificateCode: certCode,
                userId,
                courseId,
                recipientName,
                courseTitle,
                issuedAt: new Date(),
            },
        });
        return (0, serializer_1.serialize)(createdCert);
    }
    // Admin Progress Reports & Analytics
    async getAdminLearnerProgressMatrix() {
        const enrollments = await prisma_1.default.enrollment.findMany({
            orderBy: { createdAt: "desc" },
        });
        const userIds = Array.from(new Set(enrollments.map((e) => e.userId)));
        const courseIds = Array.from(new Set(enrollments.map((e) => e.courseId)));
        const [employees, courses, submissions, certs] = await Promise.all([
            prisma_1.default.employee.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
            }),
            prisma_1.default.course.findMany({
                where: { id: { in: courseIds } },
                select: { id: true, title: true },
            }),
            prisma_1.default.assessmentSubmission.findMany({
                where: { userId: { in: userIds }, courseId: { in: courseIds } },
                orderBy: { submittedAt: "desc" },
            }),
            prisma_1.default.issuedCertificate.findMany({
                where: { userId: { in: userIds }, courseId: { in: courseIds } },
            }),
        ]);
        const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
        const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));
        const matrix = enrollments.map((en) => {
            const emp = empMap.get(en.userId.toString());
            const course = courseMap.get(en.courseId.toString());
            const userSubmissions = submissions.filter((s) => s.userId.toString() === en.userId.toString() && s.courseId.toString() === en.courseId.toString());
            const latestSub = userSubmissions[0] || null;
            const cert = certs.find((c) => c.userId.toString() === en.userId.toString() && c.courseId.toString() === en.courseId.toString());
            return {
                id: en.id,
                userId: en.userId,
                courseId: en.courseId,
                employeeName: emp ? `${emp.firstName} ${emp.lastName}` : `User #${en.userId}`,
                employeeCode: emp ? emp.employeeCode : "EMP-NA",
                designation: emp ? emp.designation : "Learner",
                courseTitle: course ? course.title : `Course #${en.courseId}`,
                progress: Number(en.progress),
                status: en.status,
                timeSpentSeconds: en.timeSpentSeconds || 0,
                enrolledAt: en.enrolledAt,
                completedAt: en.completedAt,
                latestScore: latestSub ? latestSub.score : null,
                latestMaxScore: latestSub ? latestSub.maxScore : null,
                latestPercentage: latestSub ? latestSub.percentage : null,
                grade: latestSub ? latestSub.grade : null,
                feedback: latestSub ? latestSub.feedback : null,
                submissionId: latestSub ? latestSub.id : null,
                hasCertificate: Boolean(cert),
                certificateCode: cert ? cert.certificateCode : null,
            };
        });
        return (0, serializer_1.serialize)(matrix);
    }
    async recordAssignmentSubmission(userId, courseId, contentId, submissionText, fileUrl) {
        const attemptCount = await prisma_1.default.assessmentSubmission.count({
            where: { userId, courseId, contentId: contentId ?? undefined, submissionType: "ASSIGNMENT" },
        });
        const submission = await prisma_1.default.assessmentSubmission.create({
            data: {
                userId,
                courseId,
                contentId: contentId ?? null,
                submissionType: "ASSIGNMENT",
                submissionText,
                fileUrl: fileUrl || null,
                status: "SUBMITTED",
                score: 0,
                maxScore: 100,
                attemptNumber: attemptCount + 1,
            },
        });
        return (0, serializer_1.serialize)(submission);
    }
    async getTeacherSubmissions(teacherEmployeeId, userRole) {
        let courseIds = undefined;
        if (userRole === "TEACHER" && teacherEmployeeId) {
            const assigned = await prisma_1.default.courseTeacher.findMany({
                where: { teacherId: teacherEmployeeId },
                select: { courseId: true },
            });
            const created = await prisma_1.default.course.findMany({
                where: { creatorId: teacherEmployeeId },
                select: { id: true },
            });
            courseIds = Array.from(new Set([...assigned.map((a) => a.courseId), ...created.map((c) => c.id)]));
        }
        const submissions = await prisma_1.default.assessmentSubmission.findMany({
            where: {
                submissionType: "ASSIGNMENT",
                ...(courseIds ? { courseId: { in: courseIds } } : {}),
            },
            orderBy: { submittedAt: "desc" },
        });
        const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
        const cIds = Array.from(new Set(submissions.map((s) => s.courseId)));
        const [employees, courses] = await Promise.all([
            prisma_1.default.employee.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
            }),
            prisma_1.default.course.findMany({
                where: { id: { in: cIds } },
                select: { id: true, title: true },
            }),
        ]);
        const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
        const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));
        const result = submissions.map((sub) => {
            const emp = empMap.get(sub.userId.toString());
            const course = courseMap.get(sub.courseId.toString());
            return {
                ...sub,
                studentName: emp ? `${emp.firstName} ${emp.lastName}` : `User #${sub.userId}`,
                studentCode: emp ? emp.employeeCode : "EMP-NA",
                studentEmail: emp ? emp.officialEmail : "",
                courseTitle: course ? course.title : `Course #${sub.courseId}`,
            };
        });
        return (0, serializer_1.serialize)(result);
    }
    async gradeAssessmentSubmission(submissionId, grade, score, feedback, graderName) {
        const sub = await prisma_1.default.assessmentSubmission.findUnique({
            where: { id: submissionId },
        });
        if (!sub)
            throw new Error("Assessment submission not found");
        const maxScore = sub.maxScore || 100;
        const percentage = Math.round((score / maxScore) * 100);
        const updated = await prisma_1.default.assessmentSubmission.update({
            where: { id: submissionId },
            data: {
                status: "GRADED",
                grade,
                score,
                percentage,
                feedback,
                gradedBy: graderName,
                gradedAt: new Date(),
            },
        });
        return (0, serializer_1.serialize)(updated);
    }
}
exports.ProgressService = ProgressService;
exports.default = new ProgressService();
