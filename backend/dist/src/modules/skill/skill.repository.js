"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
class SkillRepository {
    // Predefined catalog skills
    async getCatalogSkills() {
        return prisma_1.default.skill.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        });
    }
    async seedDefaultSkills() {
        const existing = await prisma_1.default.skill.count();
        if (existing === 0) {
            await prisma_1.default.skill.createMany({
                data: [
                    { name: "Java", category: "Programming Language", subCategory: "Backend", skillType: "Technical Skill", description: "Core Java, OOP, Multithreading" },
                    { name: "Spring Boot", category: "Framework", subCategory: "Backend", skillType: "Technical Skill", description: "REST APIs, Microservices, Spring Data JPA" },
                    { name: "React.js", category: "Framework", subCategory: "Frontend", skillType: "Technical Skill", description: "Hooks, Redux, Next.js, SPA Development" },
                    { name: "PostgreSQL", category: "Database", subCategory: "Relational DB", skillType: "Technical Skill", description: "Complex queries, Indexing, Optimization" },
                    { name: "AWS", category: "Cloud Platform", subCategory: "DevOps", skillType: "Technical Skill", description: "EC2, S3, Lambda, CloudWatch, IAM" },
                    { name: "Docker", category: "Tool", subCategory: "Containerization", skillType: "Tool / Technology", description: "Dockerfiles, Compose, Container management" },
                    { name: "Kubernetes", category: "Tool", subCategory: "Orchestration", skillType: "Tool / Technology", description: "K8s clusters, Helm, Deployments" },
                    { name: "Agentic AI", category: "AI & ML", subCategory: "Generative AI", skillType: "Technical Skill", description: "Autonomous AI Agents, LangChain, LlamaIndex" },
                    { name: "Communication", category: "Soft Skills", subCategory: "Interpersonal", skillType: "Soft Skill", description: "Verbal and written workplace communication" },
                    { name: "Leadership", category: "Soft Skills", subCategory: "Management", skillType: "Soft Skill", description: "Team leadership, Delegation, Strategy" },
                ],
            });
        }
    }
    // User Skills
    async getUserSkills(userId, statusFilter) {
        const where = { userId };
        if (statusFilter) {
            where.status = statusFilter;
        }
        return prisma_1.default.userSkill.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        });
    }
    async getUserSkillById(id) {
        return prisma_1.default.userSkill.findUnique({
            where: { id },
        });
    }
    async createUserSkill(data) {
        return prisma_1.default.userSkill.create({
            data: {
                userId: data.userId,
                skillId: data.skillId ?? null,
                skillName: data.skillName,
                category: data.category,
                subCategory: data.subCategory ?? null,
                skillType: data.skillType ?? "Technical Skill",
                proficiencyLevel: data.proficiencyLevel ?? "Intermediate",
                rating: data.rating ?? 3,
                yearsOfExp: data.yearsOfExp ?? null,
                description: data.description ?? null,
                status: client_1.ApprovalStatus.PENDING,
            },
        });
    }
    async updateUserSkill(id, data) {
        return prisma_1.default.userSkill.update({
            where: { id },
            data,
        });
    }
    async deleteUserSkill(id) {
        return prisma_1.default.userSkill.delete({
            where: { id },
        });
    }
    // User Projects
    async getUserProjects(userId, statusFilter) {
        const where = { userId };
        if (statusFilter) {
            where.status = statusFilter;
        }
        return prisma_1.default.userProject.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        });
    }
    async getUserProjectById(id) {
        return prisma_1.default.userProject.findUnique({
            where: { id },
        });
    }
    async createUserProject(data) {
        return prisma_1.default.userProject.create({
            data: {
                userId: data.userId,
                projectName: data.projectName,
                projectType: data.projectType ?? "Internal Project",
                organization: data.organization ?? null,
                startDate: data.startDate ?? null,
                endDate: data.endDate ?? null,
                isCurrent: data.isCurrent ?? false,
                roleName: data.roleName ?? null,
                responsibilities: data.responsibilities ?? null,
                technologies: data.technologies ?? null,
                status: client_1.ApprovalStatus.PENDING,
            },
        });
    }
    async updateUserProject(id, data) {
        return prisma_1.default.userProject.update({
            where: { id },
            data,
        });
    }
    async deleteUserProject(id) {
        return prisma_1.default.userProject.delete({
            where: { id },
        });
    }
    // Approval Management (Admin View)
    async getAllSkillRequests(filters, userContext) {
        const { status, search } = filters;
        const skillWhere = {};
        const projectWhere = {};
        if (userContext && userContext.role !== "SUPER_ADMIN" && userContext.departmentId) {
            const deptEmployees = await prisma_1.default.employee.findMany({
                where: { departmentId: userContext.departmentId },
                select: { id: true },
            });
            const deptEmployeeIds = deptEmployees.map((e) => e.id);
            skillWhere.userId = { in: deptEmployeeIds };
            projectWhere.userId = { in: deptEmployeeIds };
        }
        if (status) {
            skillWhere.status = status;
            projectWhere.status = status;
        }
        if (search) {
            skillWhere.AND = [
                ...(skillWhere.userId ? [{ userId: skillWhere.userId }] : []),
                {
                    OR: [
                        { skillName: { contains: search } },
                        { category: { contains: search } },
                    ],
                },
            ];
            delete skillWhere.userId;
            projectWhere.AND = [
                ...(projectWhere.userId ? [{ userId: projectWhere.userId }] : []),
                {
                    OR: [
                        { projectName: { contains: search } },
                        { projectType: { contains: search } },
                    ],
                },
            ];
            delete projectWhere.userId;
        }
        const [skills, projects, employees] = await Promise.all([
            prisma_1.default.userSkill.findMany({
                where: skillWhere,
                orderBy: { updatedAt: "desc" },
            }),
            prisma_1.default.userProject.findMany({
                where: projectWhere,
                orderBy: { updatedAt: "desc" },
            }),
            prisma_1.default.employee.findMany({
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    officialEmail: true,
                    designation: true,
                    profileImage: true,
                    departmentId: true,
                },
            }),
        ]);
        const employeeMap = new Map(employees.map((e) => [e.id.toString(), e]));
        const formattedSkills = skills.map((s) => ({
            id: s.id,
            requestKind: "SKILL",
            userId: s.userId,
            employee: employeeMap.get(s.userId.toString()) || {
                firstName: "Team",
                lastName: "Member",
                designation: "Software Engineer",
            },
            title: s.skillName,
            category: s.category,
            subCategory: s.subCategory,
            type: s.skillType,
            proficiencyLevel: s.proficiencyLevel,
            rating: s.rating,
            status: s.status,
            rejectionReason: s.rejectionReason,
            verifiedBy: s.verifiedBy,
            verifiedAt: s.verifiedAt,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        }));
        const formattedProjects = projects.map((p) => ({
            id: p.id,
            requestKind: "PROJECT",
            userId: p.userId,
            employee: employeeMap.get(p.userId.toString()) || {
                firstName: "Team",
                lastName: "Member",
                designation: "Software Engineer",
            },
            title: p.projectName,
            category: p.projectType,
            subCategory: p.organization,
            type: "Project",
            proficiencyLevel: p.roleName || "Contributor",
            rating: 5,
            status: p.status,
            rejectionReason: p.rejectionReason,
            verifiedBy: p.verifiedBy,
            verifiedAt: p.verifiedAt,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));
        return [...formattedSkills, ...formattedProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    async updateSkillApproval(id, status, reason, reviewerName) {
        const updated = await prisma_1.default.userSkill.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === client_1.ApprovalStatus.REJECTED ? reason : null,
                verifiedBy: reviewerName,
                verifiedAt: new Date(),
            },
        });
        await prisma_1.default.skillApprovalLog.create({
            data: {
                requestType: "SKILL",
                requestId: id,
                action: status,
                actorName: reviewerName,
                comments: reason ?? `${status} by Admin`,
            },
        });
        return updated;
    }
    async updateProjectApproval(id, status, reason, reviewerName) {
        const updated = await prisma_1.default.userProject.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === client_1.ApprovalStatus.REJECTED ? reason : null,
                verifiedBy: reviewerName,
                verifiedAt: new Date(),
            },
        });
        await prisma_1.default.skillApprovalLog.create({
            data: {
                requestType: "PROJECT",
                requestId: id,
                action: status,
                actorName: reviewerName,
                comments: reason ?? `${status} by Admin`,
            },
        });
        return updated;
    }
    async getEmployeeById(id) {
        return prisma_1.default.employee.findUnique({
            where: { id },
            select: { id: true, departmentId: true },
        });
    }
    // Dashboard Overview metrics for a user
    async getUserOverviewStats(userId) {
        const [skills, projects] = await Promise.all([
            prisma_1.default.userSkill.findMany({ where: { userId } }),
            prisma_1.default.userProject.findMany({ where: { userId } }),
        ]);
        const totalSkills = skills.length;
        const approvedSkills = skills.filter((s) => s.status === client_1.ApprovalStatus.APPROVED).length;
        const pendingSkills = skills.filter((s) => s.status === client_1.ApprovalStatus.PENDING).length;
        const rejectedSkills = skills.filter((s) => s.status === client_1.ApprovalStatus.REJECTED).length;
        const totalProjects = projects.length;
        const currentProjects = projects.filter((p) => p.isCurrent || p.status === client_1.ApprovalStatus.APPROVED).length;
        // Distribution by category
        const categoryCount = {};
        skills.forEach((s) => {
            const cat = s.category || "Others";
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        const skillDistribution = Object.entries(categoryCount).map(([category, count]) => ({
            category,
            count,
            percentage: totalSkills > 0 ? Math.round((count / totalSkills) * 100) : 0,
        }));
        return {
            totalSkills,
            approvedSkills,
            pendingSkills,
            rejectedSkills,
            totalProjects,
            currentProjects,
            certificationsCount: 7, // Demo metrics
            skillDistribution,
            recentActivities: skills.slice(0, 5).map((s) => ({
                id: s.id.toString(),
                title: `${s.skillName} skill`,
                status: s.status,
                reason: s.rejectionReason,
                updatedAt: s.updatedAt,
            })),
        };
    }
}
exports.default = new SkillRepository();
