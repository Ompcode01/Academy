"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../config/prisma"));
class CourseRepository {
    async findAll(filters = {}, scopeWhere = {}) {
        const { search, categoryId, status, departmentId, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = { isActive: true, ...scopeWhere };
        if (search) {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { title: { contains: search } },
                        { shortDescription: { contains: search } },
                    ],
                },
            ];
        }
        if (categoryId) {
            where.categoryId = BigInt(categoryId);
        }
        if (status) {
            where.status = status;
        }
        if (departmentId) {
            where.departmentId = departmentId;
        }
        const [courses, total] = await Promise.all([
            prisma_1.default.course.findMany({
                where,
                include: {
                    category: true,
                    department: true,
                    teachers: {
                        include: {
                            teacher: {
                                select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
                            },
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            employeeCode: true,
                        },
                    },
                    sections: {
                        where: { isActive: true },
                        orderBy: { sectionOrder: "asc" },
                        include: {
                            contents: {
                                where: { isActive: true },
                                orderBy: { contentOrder: "asc" },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma_1.default.course.count({ where }),
        ]);
        return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findById(id) {
        return prisma_1.default.course.findFirst({
            where: { id, isActive: true },
            include: {
                category: true,
                department: true,
                teachers: {
                    include: {
                        teacher: {
                            select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
                sections: {
                    where: { isActive: true },
                    orderBy: { sectionOrder: "asc" },
                    include: {
                        contents: {
                            where: { isActive: true },
                            orderBy: { contentOrder: "asc" },
                        },
                    },
                },
            },
        });
    }
    async create(data) {
        return prisma_1.default.course.create({
            data: {
                categoryId: data.categoryId,
                creatorId: data.creatorId,
                departmentId: data.departmentId ?? null,
                title: data.title,
                shortDescription: data.shortDescription,
                description: data.description,
                thumbnail: data.thumbnail,
                duration: data.duration,
                level: data.level,
                language: data.language,
                status: data.status ?? "DRAFT",
                enrollmentType: data.enrollmentType ?? "SELF",
            },
            include: {
                category: true,
                department: true,
                teachers: {
                    include: {
                        teacher: {
                            select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
        });
    }
    async update(id, data) {
        return prisma_1.default.course.update({
            where: { id },
            data,
            include: {
                category: true,
                department: true,
                teachers: {
                    include: {
                        teacher: {
                            select: { id: true, firstName: true, lastName: true, employeeCode: true, officialEmail: true },
                        },
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
            },
        });
    }
    async softDelete(id) {
        return prisma_1.default.course.update({
            where: { id },
            data: { isActive: false },
        });
    }
    // Section operations
    async createSection(data) {
        return prisma_1.default.courseSection.create({
            data: {
                courseId: data.courseId,
                title: data.title,
                description: data.description,
                sectionOrder: data.sectionOrder,
                isPublished: data.isPublished ?? false,
            },
        });
    }
    async updateSection(sectionId, data) {
        return prisma_1.default.courseSection.update({
            where: { id: sectionId },
            data,
        });
    }
    async deleteSection(sectionId) {
        return prisma_1.default.courseSection.update({
            where: { id: sectionId },
            data: { isActive: false },
        });
    }
    // Content operations
    async createContent(data) {
        return prisma_1.default.learningContent.create({
            data: {
                sectionId: data.sectionId,
                title: data.title,
                contentType: data.contentType,
                contentUrl: data.contentUrl,
                description: data.description,
                duration: data.duration,
                contentOrder: data.contentOrder,
                isMandatory: data.isMandatory ?? false,
                isPublished: data.isPublished ?? false,
                quizConfigJson: data.quizConfigJson || null,
                assignmentConfigJson: data.assignmentConfigJson || null,
            },
        });
    }
    async updateContent(contentId, data) {
        return prisma_1.default.learningContent.update({
            where: { id: contentId },
            data,
        });
    }
    async deleteContent(contentId) {
        return prisma_1.default.learningContent.update({
            where: { id: contentId },
            data: { isActive: false },
        });
    }
}
exports.default = new CourseRepository();
