"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const course_repository_1 = __importDefault(require("./course.repository"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const XLSX = __importStar(require("xlsx"));
const notification_service_1 = __importDefault(require("../notification/notification.service"));
const guestGrant_service_1 = __importDefault(require("../../services/guestGrant.service"));
class CourseService {
    async getAllCourses(filters = {}, userContext) {
        // Build role-scoped where clause
        const scopeWhere = await this.buildScopeFilter(userContext);
        const result = await course_repository_1.default.findAll(filters, scopeWhere);
        // Enrich courses with creatorInfo for Guest/Learner/Admin UI
        const enrichedCourses = result.courses.map((course) => {
            const creatorRoles = course.creator?.assignedRoles?.map((r) => r.role?.roleCode) || [];
            const creatorRole = creatorRoles.includes("SUPER_ADMIN")
                ? "SUPER_ADMIN"
                : creatorRoles.includes("ADMIN")
                    ? "ADMIN"
                    : "TEACHER";
            const creatorName = course.creator
                ? `${course.creator.firstName} ${course.creator.lastName}`
                : "System Administrator";
            const creatorDepartment = course.department?.departmentName || course.creator?.department?.departmentName || "Global Organization";
            return {
                ...course,
                creatorInfo: {
                    creatorRole,
                    creatorName,
                    creatorDepartment,
                },
            };
        });
        return {
            ...result,
            courses: enrichedCourses,
        };
    }
    /**
     * Build Prisma where-clause additions based on the user's role:
     * - SUPER_ADMIN: all courses (no extra filter)
     * - ADMIN: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
     * - TEACHER: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
     * - LEARNER: PUBLISHED courses in their department OR created by SUPER_ADMIN / ADMIN OR global published courses
     * - GUEST: only PUBLISHED courses permitted by GuestAccessGrant
     */
    async buildScopeFilter(userContext) {
        if (!userContext)
            return {};
        const { role, employeeId, departmentId } = userContext;
        switch (role) {
            case "SUPER_ADMIN":
                return {}; // Super Admin sees all courses across all departments
            case "ADMIN":
                return {
                    OR: [
                        { departmentId: null },
                        ...(departmentId ? [{ departmentId }] : []),
                        ...(employeeId ? [{ creatorId: employeeId }] : []),
                        ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
                    ],
                };
            case "TEACHER":
                return {
                    OR: [
                        ...(employeeId ? [{ teachers: { some: { teacherId: employeeId } } }] : []),
                        ...(employeeId ? [{ creatorId: employeeId }] : []),
                    ],
                };
            case "LEARNER":
                return {
                    status: "PUBLISHED",
                    OR: [
                        { departmentId: null },
                        ...(departmentId ? [{ departmentId }] : []),
                        ...(employeeId ? [{ enrollments: { some: { userId: employeeId } } }] : []),
                    ],
                };
            case "GUEST": {
                const { isGlobal, departmentIds } = await guestGrant_service_1.default.getGuestPermittedDepartmentIds(employeeId);
                if (isGlobal) {
                    return { status: "PUBLISHED" };
                }
                if (departmentIds.length > 0) {
                    return {
                        status: "PUBLISHED",
                        OR: [
                            { departmentId: null },
                            { departmentId: { in: departmentIds } },
                        ],
                    };
                }
                // No grants active -> 0 courses allowed
                return { status: "PUBLISHED", id: BigInt(-1) };
            }
            default:
                return { status: "PUBLISHED" };
        }
    }
    async getCourseById(id, userContext) {
        const course = await course_repository_1.default.findById(id);
        if (!course) {
            throw new Error("Course not found");
        }
        // Determine creator role & info
        const creatorRoles = course.creator?.assignedRoles?.map((r) => r.role?.roleCode) || [];
        const creatorRole = creatorRoles.includes("SUPER_ADMIN")
            ? "SUPER_ADMIN"
            : creatorRoles.includes("ADMIN")
                ? "ADMIN"
                : "TEACHER";
        const creatorName = course.creator
            ? `${course.creator.firstName} ${course.creator.lastName}`
            : "System Administrator";
        const creatorDepartment = course.department
            ? course.department.departmentName
            : course.creator?.department?.departmentName || "Global Organization";
        const creatorInfo = {
            creatorRole,
            creatorName,
            creatorDepartment,
        };
        // If user is GUEST, enforce scope & sanitize sensitive content URLs & assessment payloads
        if (userContext?.role === "GUEST") {
            if (course.status !== "PUBLISHED") {
                throw new Error("Course is not available in Guest Preview mode.");
            }
            // Check Guest grant permission
            const { isGlobal, departmentIds } = await guestGrant_service_1.default.getGuestPermittedDepartmentIds(userContext.employeeId);
            if (!isGlobal) {
                const courseDeptId = course.departmentId;
                const isPermittedDept = courseDeptId ? departmentIds.some((d) => d.toString() === courseDeptId.toString()) : true;
                if (!isPermittedDept) {
                    throw new Error("Access Denied: Guest access permission not granted for this department's courses.");
                }
            }
            // Sanitize learning content items to prevent payload exposure
            const sanitizedSections = (course.sections || []).map((sec) => ({
                ...sec,
                contents: (sec.contents || []).map((cnt) => ({
                    ...cnt,
                    contentUrl: null,
                    quizConfigJson: null,
                    assignmentConfigJson: null,
                    metaData: null,
                    fileSize: null,
                    isLockedForGuest: true,
                })),
            }));
            return {
                ...course,
                sections: sanitizedSections,
                creatorInfo,
                isGuestPreview: true,
            };
        }
        return {
            ...course,
            creatorInfo,
        };
    }
    async createCourse(data) {
        const { teacherIds, enrolledUserIds, sections, ...createFields } = data;
        const course = await course_repository_1.default.create(createFields);
        if (sections && Array.isArray(sections) && sections.length > 0) {
            await this.saveCourseSectionsAndContents(course.id, sections);
        }
        if (teacherIds && teacherIds.length > 0) {
            await this.assignTeachers(course.id, teacherIds);
        }
        if (enrolledUserIds && enrolledUserIds.length > 0) {
            const uniqueUserIds = Array.from(new Set(enrolledUserIds));
            for (const uIdStr of uniqueUserIds) {
                try {
                    const uId = BigInt(uIdStr);
                    await prisma_1.default.enrollment.upsert({
                        where: {
                            userId_courseId: {
                                userId: uId,
                                courseId: course.id,
                            },
                        },
                        create: {
                            userId: uId,
                            courseId: course.id,
                            status: "IN_PROGRESS",
                            progress: 0,
                        },
                        update: {},
                    });
                }
                catch (e) {
                    console.error("Batch enrollment error for user:", uIdStr, e);
                }
            }
        }
        // Trigger course creation and enrollment notifications
        notification_service_1.default.notifyCourseCreated({
            id: course.id,
            title: course.title,
            departmentId: course.departmentId,
            creatorId: course.creatorId,
        });
        return this.getCourseById(course.id);
    }
    async saveCourseSectionsAndContents(courseId, sections) {
        if (!sections || !Array.isArray(sections) || sections.length === 0)
            return;
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
            const secData = sections[sIdx];
            const sectionTitle = secData.title || `Module ${sIdx + 1}`;
            const section = await prisma_1.default.courseSection.create({
                data: {
                    courseId,
                    title: sectionTitle,
                    description: secData.description || null,
                    sectionOrder: secData.sectionOrder || sIdx + 1,
                    isPublished: true,
                },
            });
            if (secData.contents && Array.isArray(secData.contents)) {
                for (let cIdx = 0; cIdx < secData.contents.length; cIdx++) {
                    const cntData = secData.contents[cIdx];
                    const quizJson = cntData.quizConfigJson || (cntData.questions ? JSON.stringify(cntData.questions) : null);
                    const assignmentJson = cntData.assignmentConfigJson ||
                        (cntData.contentType === "ASSIGNMENT"
                            ? JSON.stringify({
                                instructions: cntData.description || cntData.instructions || "Complete practical assignment.",
                                maxScore: cntData.maxScore || 100,
                                requiresGrading: true,
                            })
                            : null);
                    await prisma_1.default.learningContent.create({
                        data: {
                            sectionId: section.id,
                            title: cntData.title || `Content ${cIdx + 1}`,
                            contentType: cntData.contentType || "LESSON",
                            contentUrl: cntData.contentUrl || cntData.videoUrl || null,
                            description: cntData.description || null,
                            duration: cntData.duration || 10,
                            contentOrder: cntData.contentOrder || cIdx + 1,
                            isMandatory: true,
                            isPublished: true,
                            quizConfigJson: quizJson,
                            assignmentConfigJson: assignmentJson,
                        },
                    });
                }
            }
        }
    }
    async updateCourse(id, data, userContext) {
        const existing = await this.getCourseById(id);
        // Rule 11: Teacher MUST NOT be able to modify department, audience, enrollment config, ownership, teacher assignment
        if (userContext?.role === "TEACHER") {
            delete data.departmentId;
            delete data.enrolledUserIds;
            delete data.teacherIds;
            delete data.enrollmentType;
        }
        const { enrolledUserIds, teacherIds, sections, ...courseData } = data;
        const course = await course_repository_1.default.update(id, courseData);
        if (sections && Array.isArray(sections) && sections.length > 0) {
            // Soft-delete existing sections for clean update
            await prisma_1.default.courseSection.updateMany({
                where: { courseId: id },
                data: { isActive: false },
            });
            await this.saveCourseSectionsAndContents(id, sections);
        }
        if (teacherIds && userContext?.role !== "TEACHER") {
            await this.assignTeachers(id, teacherIds);
        }
        if (enrolledUserIds && enrolledUserIds.length > 0 && userContext?.role !== "TEACHER") {
            const uniqueUserIds = Array.from(new Set(enrolledUserIds));
            for (const uIdStr of uniqueUserIds) {
                try {
                    const uId = BigInt(uIdStr);
                    const isNew = !(await prisma_1.default.enrollment.findUnique({ where: { userId_courseId: { userId: uId, courseId: course.id } } }));
                    await prisma_1.default.enrollment.upsert({
                        where: {
                            userId_courseId: {
                                userId: uId,
                                courseId: course.id,
                            },
                        },
                        create: {
                            userId: uId,
                            courseId: course.id,
                            status: "IN_PROGRESS",
                            progress: 0,
                        },
                        update: {},
                    });
                    if (isNew) {
                        notification_service_1.default.notifyEnrollment({
                            userId: uId,
                            courseId: course.id,
                            courseTitle: course.title,
                            enrolledBy: userContext?.username || "Administrator",
                        });
                        notification_service_1.default.syncLearnerCalendarEventsOnEnrollment(uId, course.id);
                    }
                }
                catch (e) {
                    console.error("Batch enrollment error for user:", uIdStr, e);
                }
            }
        }
        // Rule 7, 8, 13: Notify enrolled learners & creators/admins about content updates
        const updaterName = userContext?.username || "Instructor";
        const updaterRole = userContext?.role || "TEACHER";
        notification_service_1.default.notifyCourseUpdated({
            courseId: id,
            courseTitle: course.title,
            updaterName,
            updaterRole,
            addedOrUpdatedTitle: data.title || "Curriculum & Lessons",
            contentType: "Course Update",
        });
        return this.getCourseById(id);
    }
    async assignTeachers(courseId, teacherIdStrs) {
        // Delete existing teachers not in list and insert new ones
        const teacherIds = teacherIdStrs.map((s) => BigInt(s));
        await prisma_1.default.courseTeacher.deleteMany({
            where: {
                courseId,
                teacherId: { notIn: teacherIds },
            },
        });
        for (const tId of teacherIds) {
            await prisma_1.default.courseTeacher.upsert({
                where: {
                    courseId_teacherId: {
                        courseId,
                        teacherId: tId,
                    },
                },
                create: {
                    courseId,
                    teacherId: tId,
                },
                update: {},
            });
        }
        // Notify assigned teachers
        const cObj = await prisma_1.default.course.findUnique({ where: { id: courseId }, select: { title: true } });
        if (cObj && teacherIds.length > 0) {
            notification_service_1.default.notifyTeacherAssigned({
                courseId,
                courseTitle: cObj.title,
                teacherIds,
            });
        }
    }
    async verifyUser(identifier) {
        const trimmed = identifier.trim();
        if (!trimmed) {
            throw new Error("Username or email is required");
        }
        const account = await prisma_1.default.userAccount.findFirst({
            where: {
                OR: [
                    { username: { equals: trimmed } },
                    { employee: { officialEmail: { equals: trimmed } } },
                    { employee: { employeeCode: { equals: trimmed } } },
                ],
            },
            include: {
                employee: true,
            },
        });
        if (!account) {
            throw new Error(`User '${trimmed}' not found in system database.`);
        }
        if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
            throw new Error(`User '${trimmed}' account is inactive.`);
        }
        return {
            userId: account.id.toString(),
            username: account.username,
            email: account.employee.officialEmail,
            name: `${account.employee.firstName} ${account.employee.lastName}`,
        };
    }
    async verifyBulkFile(fileBuffer) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const identifiers = [];
        rows.forEach((row) => {
            if (!row || row.length === 0)
                return;
            const cellVal = String(row[0] || "").trim();
            const lower = cellVal.toLowerCase();
            if (cellVal &&
                lower !== "username" &&
                lower !== "email" &&
                lower !== "employee username" &&
                lower !== "user name") {
                identifiers.push(cellVal);
            }
        });
        if (identifiers.length === 0) {
            const jsonRows = XLSX.utils.sheet_to_json(worksheet);
            jsonRows.forEach((row) => {
                const val = row.username || row.Username || row.email || row.Email || row.user || Object.values(row)[0];
                if (val) {
                    identifiers.push(String(val).trim());
                }
            });
        }
        const uniqueIdentifiers = Array.from(new Set(identifiers));
        let successCount = 0;
        let failedCount = 0;
        const enrolledUsers = [];
        const failedUsers = [];
        for (const rawId of uniqueIdentifiers) {
            const identifier = rawId.trim();
            if (!identifier)
                continue;
            const account = await prisma_1.default.userAccount.findFirst({
                where: {
                    OR: [
                        { username: { equals: identifier } },
                        { employee: { officialEmail: { equals: identifier } } },
                        { employee: { employeeCode: { equals: identifier } } },
                    ],
                },
                include: {
                    employee: true,
                },
            });
            if (!account) {
                failedCount++;
                failedUsers.push({
                    identifier,
                    reason: "User not found in database",
                });
                continue;
            }
            if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
                failedCount++;
                failedUsers.push({
                    identifier,
                    reason: "User account or employment status is inactive",
                });
                continue;
            }
            successCount++;
            enrolledUsers.push({
                userId: account.id.toString(),
                username: account.username,
                email: account.employee.officialEmail,
                name: `${account.employee.firstName} ${account.employee.lastName}`,
            });
        }
        return {
            totalProcessed: uniqueIdentifiers.length,
            successCount,
            failedCount,
            enrolledUsers,
            failedUsers,
        };
    }
    async deleteCourse(id) {
        await this.getCourseById(id);
        return course_repository_1.default.softDelete(id);
    }
    // Enrollment Operations
    async selfEnrollCourse(userId, courseId) {
        const course = await this.getCourseById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }
        if (course.enrollmentType === "ADMIN_ASSIGNED" || course.enrollmentType === "MANUAL") {
            const existing = await prisma_1.default.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });
            if (!existing) {
                throw new Error("Self-enrollment is restricted for this course. Access must be assigned by an Administrator.");
            }
        }
        let enrollment = await prisma_1.default.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });
        if (!enrollment) {
            enrollment = await prisma_1.default.enrollment.create({
                data: {
                    userId,
                    courseId,
                    status: "IN_PROGRESS",
                    progress: 0,
                },
            });
        }
        return enrollment;
    }
    async adminEnrollUser(courseId, identifier) {
        const course = await this.getCourseById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }
        const trimmed = identifier.trim();
        if (!trimmed) {
            throw new Error("Username or email is required");
        }
        const account = await prisma_1.default.userAccount.findFirst({
            where: {
                OR: [
                    { username: { equals: trimmed } },
                    { employee: { officialEmail: { equals: trimmed } } },
                    { employee: { employeeCode: { equals: trimmed } } },
                ],
            },
            include: {
                employee: true,
            },
        });
        if (!account) {
            throw new Error(`User with username or email '${trimmed}' not found in database.`);
        }
        if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
            throw new Error(`User '${trimmed}' is inactive in the system.`);
        }
        const existing = await prisma_1.default.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: account.id,
                    courseId,
                },
            },
        });
        if (existing) {
            return {
                alreadyEnrolled: true,
                user: {
                    userId: account.id.toString(),
                    username: account.username,
                    name: `${account.employee.firstName} ${account.employee.lastName}`,
                    email: account.employee.officialEmail,
                },
                message: `User '${account.employee.firstName} ${account.employee.lastName}' (${account.username}) is already enrolled.`,
            };
        }
        const newEnrollment = await prisma_1.default.enrollment.create({
            data: {
                userId: account.id,
                courseId,
                status: "IN_PROGRESS",
                progress: 0,
            },
        });
        return {
            alreadyEnrolled: false,
            enrollment: newEnrollment,
            user: {
                userId: account.id.toString(),
                username: account.username,
                name: `${account.employee.firstName} ${account.employee.lastName}`,
                email: account.employee.officialEmail,
            },
            message: `User '${account.employee.firstName} ${account.employee.lastName}' (${account.username}) successfully enrolled.`,
        };
    }
    async bulkEnrollUsers(courseId, fileBuffer) {
        const course = await this.getCourseById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const identifiers = [];
        // Extract identifiers from rows
        rows.forEach((row) => {
            if (!row || row.length === 0)
                return;
            const cellVal = String(row[0] || "").trim();
            const lower = cellVal.toLowerCase();
            if (cellVal &&
                lower !== "username" &&
                lower !== "email" &&
                lower !== "employee username" &&
                lower !== "user name") {
                identifiers.push(cellVal);
            }
        });
        // Fallback: json parsing if key columns exist
        if (identifiers.length === 0) {
            const jsonRows = XLSX.utils.sheet_to_json(worksheet);
            jsonRows.forEach((row) => {
                const val = row.username || row.Username || row.email || row.Email || row.user || Object.values(row)[0];
                if (val) {
                    identifiers.push(String(val).trim());
                }
            });
        }
        const uniqueIdentifiers = Array.from(new Set(identifiers));
        let successCount = 0;
        let failedCount = 0;
        const enrolledUsers = [];
        const failedUsers = [];
        for (const rawId of uniqueIdentifiers) {
            const identifier = rawId.trim();
            if (!identifier)
                continue;
            const account = await prisma_1.default.userAccount.findFirst({
                where: {
                    OR: [
                        { username: { equals: identifier } },
                        { employee: { officialEmail: { equals: identifier } } },
                        { employee: { employeeCode: { equals: identifier } } },
                    ],
                },
                include: {
                    employee: true,
                },
            });
            if (!account) {
                failedCount++;
                failedUsers.push({
                    identifier,
                    reason: "User not found in database",
                });
                continue;
            }
            if (!account.isActive || account.employee.employmentStatus !== "ACTIVE") {
                failedCount++;
                failedUsers.push({
                    identifier,
                    reason: "User account or employment status is inactive",
                });
                continue;
            }
            const existing = await prisma_1.default.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: account.id,
                        courseId,
                    },
                },
            });
            if (!existing) {
                await prisma_1.default.enrollment.create({
                    data: {
                        userId: account.id,
                        courseId,
                        status: "IN_PROGRESS",
                        progress: 0,
                    },
                });
            }
            successCount++;
            enrolledUsers.push({
                userId: account.id.toString(),
                username: account.username,
                email: account.employee.officialEmail,
                name: `${account.employee.firstName} ${account.employee.lastName}`,
            });
        }
        return {
            totalProcessed: uniqueIdentifiers.length,
            successCount,
            failedCount,
            enrolledUsers,
            failedUsers,
        };
    }
    // Section operations
    async createSection(data) {
        await this.getCourseById(data.courseId);
        return course_repository_1.default.createSection(data);
    }
    async updateSection(sectionId, data) {
        return course_repository_1.default.updateSection(sectionId, data);
    }
    async deleteSection(sectionId) {
        return course_repository_1.default.deleteSection(sectionId);
    }
    // Content operations
    async createContent(data) {
        return course_repository_1.default.createContent(data);
    }
    async updateContent(contentId, data) {
        return course_repository_1.default.updateContent(contentId, data);
    }
    async deleteContent(contentId) {
        return course_repository_1.default.deleteContent(contentId);
    }
}
exports.default = new CourseService();
