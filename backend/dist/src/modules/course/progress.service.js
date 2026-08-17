"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const serializer_1 = require("../../utils/serializer");
const notification_service_1 = __importDefault(require("../notification/notification.service"));
class ProgressService {
    async syncLearnerSubmissionsProgress(userId) {
        try {
            const submissions = await prisma_1.default.assessmentSubmission.findMany({
                where: { userId, contentId: { not: null } },
            });
            for (const sub of submissions) {
                if (!sub.contentId)
                    continue;
                try {
                    await prisma_1.default.userLessonProgress.upsert({
                        where: {
                            userId_contentId: {
                                userId,
                                contentId: sub.contentId,
                            },
                        },
                        update: { isCompleted: true },
                        create: {
                            userId,
                            courseId: sub.courseId,
                            contentId: sub.contentId,
                            isCompleted: true,
                        },
                    });
                }
                catch { }
            }
            // Recalculate progress for all enrollments of this user
            const enrollments = await prisma_1.default.enrollment.findMany({
                where: { userId },
            });
            for (const en of enrollments) {
                const sections = await prisma_1.default.courseSection.findMany({
                    where: { courseId: en.courseId, isActive: true },
                    include: { contents: { where: { isActive: true } } },
                });
                const activeContentIds = sections.flatMap((sec) => sec.contents.map((c) => c.id));
                const totalLessons = activeContentIds.length;
                if (totalLessons === 0)
                    continue;
                const completedCount = await prisma_1.default.userLessonProgress.count({
                    where: {
                        userId,
                        courseId: en.courseId,
                        isCompleted: true,
                        contentId: { in: activeContentIds },
                    },
                });
                const calculatedProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
                const isNowCompleted = calculatedProgress >= 100;
                const newStatus = isNowCompleted ? "COMPLETED" : (en.status === "COMPLETED" ? "COMPLETED" : en.status);
                const finalProgress = isNowCompleted ? 100 : Math.max(Number(en.progress || 0), calculatedProgress);
                if (finalProgress !== Number(en.progress) || newStatus !== en.status) {
                    await prisma_1.default.enrollment.update({
                        where: { id: en.id },
                        data: {
                            progress: finalProgress,
                            status: newStatus,
                            completedAt: isNowCompleted ? (en.completedAt || new Date()) : en.completedAt,
                        },
                    });
                }
            }
        }
        catch (err) {
            console.error("Failed to sync learner submissions progress:", err);
        }
    }
    async getLearnerCourseProgress(userId, courseId) {
        // 0. Auto-sync any quiz, assignment, or feedback submissions to UserLessonProgress
        await this.syncLearnerSubmissionsProgress(userId);
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
    async getMyEnrollments(userId) {
        // Auto-sync any quiz, assignment, or feedback submissions to UserLessonProgress
        await this.syncLearnerSubmissionsProgress(userId);
        const enrollments = await prisma_1.default.enrollment.findMany({
            where: {
                userId,
                course: {
                    isActive: true,
                },
            },
            include: {
                course: {
                    include: {
                        category: true,
                    },
                },
            },
        });
        return (0, serializer_1.serialize)(enrollments);
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
        // 2. Calculate course total active lessons & completed count
        const sections = await prisma_1.default.courseSection.findMany({
            where: { courseId, isActive: true },
            include: {
                contents: {
                    where: { isActive: true },
                },
            },
        });
        const activeContentIds = sections.flatMap((sec) => sec.contents.map((c) => c.id));
        const totalLessons = activeContentIds.length;
        const completedCount = await prisma_1.default.userLessonProgress.count({
            where: {
                userId,
                courseId,
                isCompleted: true,
                contentId: { in: activeContentIds },
            },
        });
        const calculatedProgress = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;
        // 3. Update Enrollment using High-Water Mark rule & 100% Permanence
        let enrollment = await prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        const currentProgress = Number(enrollment?.progress || 0);
        const currentStatus = enrollment?.status;
        // High-Water Mark: Progress can ONLY increase, never decrease!
        // Once 100% or COMPLETED, lock at 100% permanently.
        const isCompletedBefore = currentStatus === "COMPLETED" || currentProgress >= 100;
        const finalProgress = isCompletedBefore ? 100 : Math.max(currentProgress, calculatedProgress);
        const isNowCompleted = finalProgress >= 100;
        const updatedStatus = isNowCompleted ? "COMPLETED" : (currentStatus || "IN_PROGRESS");
        const completedAtDate = isNowCompleted ? (enrollment?.completedAt || new Date()) : null;
        // Don't accumulate duplicate timeSpentSeconds if course is already completed
        const timeDelta = isCompletedBefore ? 0 : Math.max(0, additionalSeconds);
        enrollment = await prisma_1.default.enrollment.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: {
                progress: finalProgress,
                status: updatedStatus,
                completedAt: completedAtDate,
                timeSpentSeconds: { increment: timeDelta },
            },
            create: {
                userId,
                courseId,
                progress: finalProgress,
                status: updatedStatus,
                completedAt: completedAtDate,
                timeSpentSeconds: timeDelta,
            },
        });
        // 4. Auto Issue Certificate and Create Skill Cloud Entry if completed
        let issuedCert = null;
        let autoSkill = null;
        if (isNowCompleted) {
            issuedCert = await this.checkAndIssueCertificate(userId, courseId);
            autoSkill = await this.checkAndCreateSkillCloudEntry(userId, courseId);
        }
        return (0, serializer_1.serialize)({
            enrollment,
            calculatedProgress,
            issuedCert,
            autoSkill,
        });
    }
    async recordQuizSubmission(userId, courseId, contentId, score, maxScore, answersJson) {
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "F";
        // Remove previous older attempts for this learner and quiz item so only recent attempt is saved
        if (contentId) {
            try {
                await prisma_1.default.assessmentSubmission.deleteMany({
                    where: { userId, courseId, contentId, submissionType: "QUIZ" },
                });
            }
            catch (delErr) {
                console.error("Failed to cleanup previous quiz attempts:", delErr);
            }
        }
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
                attemptNumber: 1,
            },
        });
        // Mark lesson progress as completed for this quiz content item
        let progressResult = null;
        if (contentId) {
            try {
                progressResult = await this.updateLessonProgress(userId, courseId, contentId, true, 0);
            }
            catch (pErr) {
                console.error("Failed to update lesson progress on quiz submission:", pErr);
            }
        }
        // Check certificate issuance
        const cert = await this.checkAndIssueCertificate(userId, courseId);
        return (0, serializer_1.serialize)({ submission, progressResult, cert });
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
    async checkAndCreateSkillCloudEntry(userId, courseId) {
        try {
            const course = await prisma_1.default.course.findUnique({
                where: { id: courseId },
                include: { category: true },
            });
            if (!course)
                return null;
            const skillName = course.title;
            const categoryName = course.category?.name || "Course Skill";
            // Check if user already has a UserSkill entry for this course skill
            const existingSkill = await prisma_1.default.userSkill.findFirst({
                where: {
                    userId,
                    skillName,
                },
            });
            if (existingSkill) {
                return (0, serializer_1.serialize)(existingSkill);
            }
            // Determine Proficiency Level & Star Rating based on Course Level
            const courseLevelUpper = (course.level || "BEGINNER").toUpperCase();
            let proficiencyLevel = "Beginner";
            let rating = 2; // Default 2 stars for beginner
            if (courseLevelUpper.includes("INTERMEDIATE") || courseLevelUpper.includes("MEDIUM")) {
                proficiencyLevel = "Intermediate";
                rating = 3;
            }
            else if (courseLevelUpper.includes("ADVANCED")) {
                proficiencyLevel = "Advanced";
                rating = 4;
            }
            else if (courseLevelUpper.includes("EXPERT") || courseLevelUpper.includes("MASTER")) {
                proficiencyLevel = "Expert";
                rating = 5;
            }
            else {
                proficiencyLevel = "Beginner";
                rating = 2;
            }
            // Create PENDING UserSkill record for Admin / SA Approval
            const userSkill = await prisma_1.default.userSkill.create({
                data: {
                    userId,
                    skillName,
                    category: categoryName,
                    skillType: "Course Completion Skill",
                    proficiencyLevel,
                    rating,
                    yearsOfExp: 1.0,
                    description: `Auto-submitted upon 100% course completion of "${course.title}". Course Level: ${course.level || "Beginner"}.`,
                    status: "PENDING",
                },
            });
            // Notify Admin and Super Admin that skill approval is required
            try {
                await notification_service_1.default.notifySkillSubmitted({
                    id: userSkill.id,
                    skillName: userSkill.skillName,
                    userId,
                });
            }
            catch (err) {
                console.error("Failed to send skill notification:", err);
            }
            return (0, serializer_1.serialize)(userSkill);
        }
        catch (err) {
            console.error("Failed to auto-create skill cloud entry on completion:", err);
            return null;
        }
    }
    // Admin Progress Reports & Analytics
    async getAdminLearnerProgressMatrix() {
        const enrollments = await prisma_1.default.enrollment.findMany({
            where: {
                course: {
                    isActive: true,
                },
            },
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
        const isFeedback = submissionText?.includes('"type":"FEEDBACK"');
        const submissionType = isFeedback ? "FEEDBACK" : "ASSIGNMENT";
        const attemptCount = await prisma_1.default.assessmentSubmission.count({
            where: { userId, courseId, contentId: contentId ?? undefined, submissionType },
        });
        const submission = await prisma_1.default.assessmentSubmission.create({
            data: {
                userId,
                courseId,
                contentId: contentId ?? null,
                submissionType,
                submissionText,
                fileUrl: fileUrl || null,
                status: isFeedback ? "GRADED" : "SUBMITTED",
                score: isFeedback ? 100 : 0,
                maxScore: 100,
                percentage: isFeedback ? 100 : 0,
                grade: isFeedback ? "COMPLETED" : null,
                feedback: isFeedback ? "Feedback Survey Received" : null,
                attemptNumber: attemptCount + 1,
            },
        });
        // Notify assigned teachers of new assignment submission if it requires grading
        if (!isFeedback) {
            try {
                const emp = await prisma_1.default.employee.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
                const course = await prisma_1.default.course.findUnique({ where: { id: courseId }, select: { title: true } });
                let contentTitle = "Assignment Task";
                if (contentId) {
                    const cnt = await prisma_1.default.learningContent.findUnique({ where: { id: contentId }, select: { title: true } });
                    if (cnt)
                        contentTitle = cnt.title;
                }
                await notification_service_1.default.notifySubmissionCreated({
                    learnerId: userId,
                    learnerName: emp ? `${emp.firstName} ${emp.lastName}` : "Learner",
                    courseId,
                    courseTitle: course?.title || "Course",
                    contentTitle,
                    submissionType: "ASSIGNMENT",
                });
            }
            catch (err) {
                console.error("Failed to trigger assignment submission notification:", err);
            }
        }
        // Mark lesson progress as completed for this assignment / feedback content item
        if (contentId) {
            try {
                await this.updateLessonProgress(userId, courseId, contentId, true, 0);
            }
            catch (pErr) {
                console.error("Failed to update lesson progress on assignment submission:", pErr);
            }
        }
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
        const allSubmissions = await prisma_1.default.assessmentSubmission.findMany({
            where: {
                ...(courseIds ? { courseId: { in: courseIds } } : {}),
            },
            orderBy: { submittedAt: "desc" },
        });
        // Keep ONLY the latest attempt for each learner per content item so teachers evaluate current work
        const latestSubmissionsMap = new Map();
        for (const sub of allSubmissions) {
            const key = `${sub.userId.toString()}_${sub.courseId.toString()}_${sub.contentId ? sub.contentId.toString() : sub.submissionType}`;
            if (!latestSubmissionsMap.has(key)) {
                latestSubmissionsMap.set(key, sub);
            }
        }
        const submissions = Array.from(latestSubmissionsMap.values());
        const userIds = Array.from(new Set(submissions.map((s) => s.userId)));
        const cIds = Array.from(new Set(submissions.map((s) => s.courseId)));
        const contentIds = Array.from(new Set(submissions.map((s) => s.contentId).filter(Boolean)));
        const [employees, courses, contents] = await Promise.all([
            prisma_1.default.employee.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
            }),
            prisma_1.default.course.findMany({
                where: { id: { in: cIds } },
                select: { id: true, title: true },
            }),
            prisma_1.default.learningContent.findMany({
                where: { id: { in: contentIds } },
                select: { id: true, title: true, contentType: true },
            }),
        ]);
        const empMap = new Map(employees.map((e) => [e.id.toString(), e]));
        const courseMap = new Map(courses.map((c) => [c.id.toString(), c]));
        const contentMap = new Map(contents.map((cnt) => [cnt.id.toString(), cnt]));
        const result = submissions.map((sub) => {
            const emp = empMap.get(sub.userId.toString());
            const course = courseMap.get(sub.courseId.toString());
            const cnt = sub.contentId ? contentMap.get(sub.contentId.toString()) : null;
            const isFb = sub.submissionType === "FEEDBACK" || sub.submissionText?.includes('"type":"FEEDBACK"');
            return {
                ...sub,
                status: isFb ? "GRADED" : sub.status,
                score: isFb ? (sub.maxScore || 100) : sub.score,
                percentage: isFb ? 100 : sub.percentage,
                grade: isFb ? "COMPLETED" : sub.grade,
                feedback: isFb ? "Survey Completed" : sub.feedback,
                gradedByRole: sub.gradedBy?.includes("[SUPER_ADMIN]") ? "SUPER_ADMIN" : sub.gradedBy?.includes("[ADMIN]") ? "ADMIN" : sub.gradedBy?.includes("[TEACHER]") ? "TEACHER" : null,
                studentName: emp ? `${emp.firstName} ${emp.lastName}` : `User #${sub.userId}`,
                studentCode: emp ? emp.employeeCode : "EMP-NA",
                studentEmail: emp ? emp.officialEmail : "",
                courseTitle: course ? course.title : `Course #${sub.courseId}`,
                contentTitle: cnt ? cnt.title : sub.submissionType === "QUIZ" ? "Quiz Assessment" : "Assignment Task",
            };
        });
        return (0, serializer_1.serialize)(result);
    }
    async gradeAssessmentSubmission(submissionId, grade, score, feedback, graderName, status = "GRADED", userRole) {
        const sub = await prisma_1.default.assessmentSubmission.findUnique({
            where: { id: submissionId },
        });
        if (!sub)
            throw new Error("Assessment submission not found");
        // Permission Enforcement: If previously graded by SUPER_ADMIN, non-SUPER_ADMIN cannot modify
        if (sub.gradedBy?.includes("[SUPER_ADMIN]") && userRole !== "SUPER_ADMIN") {
            throw new Error("Permission Denied: Only Super Admin can modify grades assigned by Super Admin.");
        }
        const maxScore = sub.maxScore || 100;
        const percentage = Math.round((score / maxScore) * 100);
        const formattedGraderName = userRole ? `${graderName} [${userRole}]` : graderName;
        const updated = await prisma_1.default.assessmentSubmission.update({
            where: { id: submissionId },
            data: {
                status: status || "GRADED",
                grade: grade || "N/A",
                score,
                percentage,
                feedback: feedback || null,
                gradedBy: formattedGraderName,
                gradedAt: new Date(),
            },
        });
        // Auto-update lesson progress & course completion if graded
        if ((status === "GRADED" || percentage >= 50) && sub.contentId) {
            try {
                await this.updateLessonProgress(sub.userId, sub.courseId, sub.contentId, true, 0);
            }
            catch (pErr) {
                console.error("Failed to auto-update lesson progress on evaluation:", pErr);
            }
        }
        // Notify learner of evaluation outcome
        const course = await prisma_1.default.course.findUnique({ where: { id: sub.courseId } });
        let contentTitle = "Assessment";
        if (sub.contentId) {
            const cnt = await prisma_1.default.learningContent.findUnique({ where: { id: sub.contentId } });
            if (cnt)
                contentTitle = cnt.title;
        }
        notification_service_1.default.notifySubmissionEvaluated({
            userId: sub.userId,
            courseId: sub.courseId,
            courseTitle: course?.title || "Course",
            contentTitle,
            teacherName: graderName,
            status: updated.status,
            grade: updated.grade,
            score: updated.score,
            feedback: updated.feedback,
        });
        return (0, serializer_1.serialize)(updated);
    }
}
exports.ProgressService = ProgressService;
exports.default = new ProgressService();
