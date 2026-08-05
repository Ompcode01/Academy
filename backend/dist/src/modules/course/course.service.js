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
class CourseService {
    async getAllCourses(filters = {}, userContext) {
        // Build role-scoped where clause
        const scopeWhere = this.buildScopeFilter(userContext);
        return course_repository_1.default.findAll(filters, scopeWhere);
    }
    /**
     * Build Prisma where-clause additions based on the user's role:
     * - SUPER_ADMIN: all courses (no extra filter)
     * - ADMIN: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
     * - TEACHER: courses in their department OR created by SUPER_ADMIN / ADMIN OR global courses OR created by themselves
     * - LEARNER: PUBLISHED courses in their department OR created by SUPER_ADMIN / ADMIN OR global published courses
     * - GUEST: only PUBLISHED courses
     */
    buildScopeFilter(userContext) {
        if (!userContext)
            return {};
        const { role, employeeId, departmentId } = userContext;
        const superAdminOrAdminCourseCondition = {
            creator: {
                assignedRoles: {
                    some: {
                        role: {
                            roleCode: { in: ["SUPER_ADMIN", "ADMIN"] },
                        },
                        isActive: true,
                    },
                },
            },
        };
        switch (role) {
            case "SUPER_ADMIN":
                return {}; // No restrictions
            case "ADMIN":
                return {
                    OR: [
                        { departmentId: null },
                        ...(departmentId ? [{ departmentId }] : []),
                        ...(employeeId ? [{ creatorId: employeeId }] : []),
                        superAdminOrAdminCourseCondition,
                    ],
                };
            case "TEACHER":
                return {
                    OR: [
                        { departmentId: null },
                        ...(departmentId ? [{ departmentId }] : []),
                        ...(employeeId ? [{ creatorId: employeeId }] : []),
                        superAdminOrAdminCourseCondition,
                    ],
                };
            case "LEARNER":
                return {
                    status: "PUBLISHED",
                    OR: [
                        { departmentId: null },
                        ...(departmentId ? [{ departmentId }] : []),
                        superAdminOrAdminCourseCondition,
                    ],
                };
            case "GUEST":
                return { status: "PUBLISHED" };
            default:
                return { status: "PUBLISHED" };
        }
    }
    async getCourseById(id) {
        const course = await course_repository_1.default.findById(id);
        if (!course) {
            throw new Error("Course not found");
        }
        return course;
    }
    async createCourse(data) {
        const course = await course_repository_1.default.create(data);
        if (data.enrolledUserIds && data.enrolledUserIds.length > 0) {
            const uniqueUserIds = Array.from(new Set(data.enrolledUserIds));
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
        return course;
    }
    async updateCourse(id, data) {
        await this.getCourseById(id);
        const { enrolledUserIds, ...courseData } = data;
        const course = await course_repository_1.default.update(id, courseData);
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
        return course;
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
