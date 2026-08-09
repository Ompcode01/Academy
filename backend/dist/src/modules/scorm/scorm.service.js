"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scormService = exports.ScormService = void 0;
const client_1 = require("@prisma/client");
const scormValidation_service_1 = require("./scormValidation.service");
const scormStorage_service_1 = require("./scormStorage.service");
const progress_service_1 = __importDefault(require("../course/progress.service"));
const audit_service_1 = __importDefault(require("../audit/audit.service"));
const notification_service_1 = __importDefault(require("../notification/notification.service"));
const prisma = new client_1.PrismaClient();
function serializeBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (_, value) => typeof value === "bigint" ? value.toString() : value));
}
class ScormService {
    /**
     * Validate uploaded SCORM ZIP package
     */
    async validatePackage(buffer, fileName) {
        const result = scormValidation_service_1.ScormValidationService.validateZipBuffer(buffer);
        return {
            ...result,
            zipFileName: fileName,
            fileSize: buffer.length,
        };
    }
    /**
     * Create SCORM Course with package extraction & enrollment configuration
     */
    async createScormCourse(creatorId, courseData, buffer, fileName) {
        // 1. Validate package
        const validation = scormValidation_service_1.ScormValidationService.validateZipBuffer(buffer);
        if (!validation.isValid) {
            throw new Error(`SCORM Package Validation Failed: ${validation.errors.join("; ")}`);
        }
        // 2. Create Course record
        const course = await prisma.course.create({
            data: {
                categoryId: BigInt(courseData.categoryId),
                departmentId: courseData.departmentId ? BigInt(courseData.departmentId) : null,
                creatorId: BigInt(creatorId),
                title: courseData.title || validation.title,
                shortDescription: courseData.shortDescription || "",
                description: courseData.description || `SCORM 1.2 Course: ${validation.title}`,
                thumbnail: courseData.thumbnail || null,
                level: courseData.level || "BEGINNER",
                language: courseData.language || "English",
                contentType: "SCORM",
                enrollmentType: courseData.enrollmentType || "SELF",
                isMandatory: courseData.isMandatory || false,
                status: courseData.status || "PUBLISHED",
            },
        });
        const courseId = course.id;
        // 3. Extract SCORM package to filesystem
        const { scormUrlPath } = scormStorage_service_1.ScormStorageService.extractPackage(courseId.toString(), buffer);
        const fullLaunchUrl = `${scormUrlPath}/${validation.launchFile}`;
        const fullManifestUrl = `${scormUrlPath}/imsmanifest.xml`;
        // 4. Create ScormPackage record
        const scormPackage = await prisma.scormPackage.create({
            data: {
                courseId,
                version: validation.version,
                packageTitle: validation.title,
                manifestPath: fullManifestUrl,
                launchPath: fullLaunchUrl,
                extractedPath: scormUrlPath,
                zipFileName: fileName,
                fileSize: BigInt(buffer.length),
                itemCount: validation.itemCount,
                status: "VALIDATED",
            },
        });
        // 5. Handle Auto/Department Enrollment if configured
        if (courseData.enrollmentType === "AUTO" ||
            courseData.enrollmentType === "DEPARTMENT") {
            const deptIdFilter = courseData.departmentId
                ? [BigInt(courseData.departmentId)]
                : courseData.targetDepartmentIds?.map((id) => BigInt(id)) || [];
            if (deptIdFilter.length > 0) {
                const eligibleEmployees = await prisma.employee.findMany({
                    where: { departmentId: { in: deptIdFilter }, employmentStatus: "ACTIVE" },
                });
                for (const emp of eligibleEmployees) {
                    await prisma.enrollment.upsert({
                        where: {
                            userId_courseId: {
                                userId: emp.id,
                                courseId,
                            },
                        },
                        create: {
                            userId: emp.id,
                            courseId,
                            status: "ENROLLED",
                            progress: 0,
                        },
                        update: {},
                    });
                }
            }
        }
        // 6. Log Audit Log
        try {
            await audit_service_1.default.recordAuditLog({
                actorName: "Admin/Teacher",
                actorId: creatorId,
                action: "SCORM_PACKAGE_UPLOADED",
                type: "COURSE",
                detail: `Uploaded SCORM package ${fileName} (${validation.version}) for course ${course.title}`,
            });
        }
        catch (err) {
            console.error("Audit log failed for SCORM creation:", err);
        }
        return serializeBigInt({
            course,
            scormPackage,
            validation,
        });
    }
    /**
     * Get SCORM Package and Course info
     */
    async getScormPackage(courseId) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                scormPackage: true,
                category: true,
                department: true,
            },
        });
        if (!course || course.contentType !== "SCORM" || !course.scormPackage) {
            return null;
        }
        return serializeBigInt(course);
    }
    /**
     * Get or initialize SCORM Attempt for a learner
     */
    async getOrInitScormAttempt(userId, courseId) {
        const scormPackage = await prisma.scormPackage.findUnique({
            where: { courseId },
        });
        if (!scormPackage) {
            throw new Error("SCORM Package not found for this course.");
        }
        let attempt = await prisma.scormAttempt.findFirst({
            where: {
                userId,
                courseId,
            },
            orderBy: { attemptNumber: "desc" },
        });
        if (!attempt) {
            attempt = await prisma.scormAttempt.create({
                data: {
                    scormPackageId: scormPackage.id,
                    userId,
                    courseId,
                    attemptNumber: 1,
                    lessonStatus: "not attempted",
                    entry: "ab-initio",
                    credit: "credit",
                    scoreMin: 0,
                    scoreMax: 100,
                    cmiDataJson: JSON.stringify({
                        "cmi.core.lesson_status": "not attempted",
                        "cmi.core.lesson_location": "",
                        "cmi.core.credit": "credit",
                        "cmi.core.entry": "ab-initio",
                        "cmi.core.score.raw": "0",
                        "cmi.core.score.min": "0",
                        "cmi.core.score.max": "100",
                        "cmi.suspend_data": "",
                    }),
                },
            });
            // Audit log SCORM course started
            try {
                await audit_service_1.default.recordAuditLog({
                    actorName: "Learner",
                    actorId: userId,
                    action: "SCORM_COURSE_STARTED",
                    type: "LEARNING",
                    detail: `Started SCORM Course ID ${courseId}`,
                });
            }
            catch (e) { }
        }
        return serializeBigInt(attempt);
    }
    /**
     * Commit SCORM 1.2 CMI tracking data from runtime LMSCommit
     */
    async commitScormTracking(userId, courseId, cmiValues) {
        const attempt = await prisma.scormAttempt.findFirst({
            where: { userId, courseId },
            orderBy: { attemptNumber: "desc" },
        });
        if (!attempt) {
            throw new Error("No active SCORM attempt found to commit tracking data.");
        }
        // Merge existing CMI values
        let currentCmi = {};
        try {
            if (attempt.cmiDataJson) {
                currentCmi = JSON.parse(attempt.cmiDataJson);
            }
        }
        catch (e) { }
        const updatedCmi = { ...currentCmi, ...cmiValues };
        // Extract key CMI attributes
        const lessonStatus = (updatedCmi["cmi.core.lesson_status"] ||
            attempt.lessonStatus ||
            "incomplete").toLowerCase();
        const lessonLocation = updatedCmi["cmi.core.lesson_location"] ?? attempt.lessonLocation;
        const suspendData = updatedCmi["cmi.suspend_data"] ?? attempt.suspendData;
        const scoreRaw = updatedCmi["cmi.core.score.raw"]
            ? parseFloat(updatedCmi["cmi.core.score.raw"])
            : attempt.scoreRaw;
        const sessionTime = updatedCmi["cmi.core.session_time"] ?? attempt.sessionTime;
        const exitMode = updatedCmi["cmi.core.exit"] ?? attempt.exitMode;
        const isCompletedOrPassed = lessonStatus === "completed" ||
            lessonStatus === "passed";
        const now = new Date();
        const updatedAttempt = await prisma.scormAttempt.update({
            where: { id: attempt.id },
            data: {
                lessonStatus,
                lessonLocation,
                suspendData,
                scoreRaw: isNaN(scoreRaw) ? 0 : scoreRaw,
                sessionTime,
                exitMode,
                entry: exitMode === "suspend" ? "resume" : "ab-initio",
                cmiDataJson: JSON.stringify(updatedCmi),
                lastAccessedAt: now,
                completedAt: isCompletedOrPassed && !attempt.completedAt ? now : attempt.completedAt,
            },
        });
        // If completed or passed, update LMS enrollment progress to 100%
        if (isCompletedOrPassed) {
            const enrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });
            if (enrollment && Number(enrollment.progress) < 100) {
                await prisma.enrollment.update({
                    where: { id: enrollment.id },
                    data: {
                        progress: 100,
                        status: "COMPLETED",
                        completedAt: now,
                    },
                });
                // Auto issue certificate & create Skill Cloud entry!
                await progress_service_1.default.checkAndIssueCertificate(userId, courseId);
                await progress_service_1.default.checkAndCreateSkillCloudEntry(userId, courseId);
                // Audit log SCORM completion
                try {
                    await audit_service_1.default.recordAuditLog({
                        actorName: "Learner",
                        actorId: userId,
                        action: "SCORM_COURSE_COMPLETED",
                        type: "LEARNING",
                        detail: `Completed SCORM Course ID ${courseId} with status ${lessonStatus}`,
                    });
                }
                catch (e) { }
                // Send notification
                try {
                    const emp = await prisma.employee.findUnique({ where: { id: userId } });
                    const course = await prisma.course.findUnique({ where: { id: courseId } });
                    await notification_service_1.default.notifyCourseCompleted({
                        userId,
                        learnerName: emp ? `${emp.firstName} ${emp.lastName}` : "Learner",
                        courseId,
                        courseTitle: course?.title || "SCORM Course",
                    });
                }
                catch (e) { }
            }
        }
        return serializeBigInt(updatedAttempt);
    }
    /**
     * Replace SCORM Package for an existing SCORM course
     */
    async replacePackage(courseId, buffer, fileName) {
        const validation = scormValidation_service_1.ScormValidationService.validateZipBuffer(buffer);
        if (!validation.isValid) {
            throw new Error(`SCORM Replacement Validation Failed: ${validation.errors.join("; ")}`);
        }
        const { scormUrlPath } = scormStorage_service_1.ScormStorageService.extractPackage(courseId.toString(), buffer);
        const fullLaunchUrl = `${scormUrlPath}/${validation.launchFile}`;
        const fullManifestUrl = `${scormUrlPath}/imsmanifest.xml`;
        const updatedPackage = await prisma.scormPackage.update({
            where: { courseId },
            data: {
                version: validation.version,
                packageTitle: validation.title,
                manifestPath: fullManifestUrl,
                launchPath: fullLaunchUrl,
                extractedPath: scormUrlPath,
                zipFileName: fileName,
                fileSize: BigInt(buffer.length),
                itemCount: validation.itemCount,
                status: "VALIDATED",
            },
        });
        return serializeBigInt(updatedPackage);
    }
}
exports.ScormService = ScormService;
exports.scormService = new ScormService();
