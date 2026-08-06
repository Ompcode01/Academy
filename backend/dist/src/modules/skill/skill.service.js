"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const skill_repository_1 = __importDefault(require("./skill.repository"));
const client_1 = require("@prisma/client");
const prismaSerializer_1 = require("../../utils/prismaSerializer");
const audit_service_1 = __importDefault(require("../audit/audit.service"));
class SkillService {
    async getCatalogSkills() {
        await skill_repository_1.default.seedDefaultSkills();
        const skills = await skill_repository_1.default.getCatalogSkills();
        return (0, prismaSerializer_1.serializeBigInt)(skills);
    }
    async getUserSkills(userId, statusFilter) {
        const userSkills = await skill_repository_1.default.getUserSkills(userId, statusFilter);
        return (0, prismaSerializer_1.serializeBigInt)(userSkills);
    }
    async createUserSkill(data) {
        const created = await skill_repository_1.default.createUserSkill(data);
        return (0, prismaSerializer_1.serializeBigInt)(created);
    }
    async updateUserSkill(id, data) {
        const updated = await skill_repository_1.default.updateUserSkill(id, data);
        return (0, prismaSerializer_1.serializeBigInt)(updated);
    }
    async resubmitUserSkill(id, data) {
        // Reset status back to PENDING and clear rejectionReason
        const updated = await skill_repository_1.default.updateUserSkill(id, {
            ...data,
            status: client_1.ApprovalStatus.PENDING,
            rejectionReason: null,
        });
        return (0, prismaSerializer_1.serializeBigInt)(updated);
    }
    async deleteUserSkill(id) {
        const deleted = await skill_repository_1.default.deleteUserSkill(id);
        return (0, prismaSerializer_1.serializeBigInt)(deleted);
    }
    // User Projects
    async getUserProjects(userId, statusFilter) {
        const userProjects = await skill_repository_1.default.getUserProjects(userId, statusFilter);
        return (0, prismaSerializer_1.serializeBigInt)(userProjects);
    }
    async createUserProject(data) {
        const created = await skill_repository_1.default.createUserProject(data);
        return (0, prismaSerializer_1.serializeBigInt)(created);
    }
    async updateUserProject(id, data) {
        const updated = await skill_repository_1.default.updateUserProject(id, data);
        return (0, prismaSerializer_1.serializeBigInt)(updated);
    }
    async resubmitUserProject(id, data) {
        const updated = await skill_repository_1.default.updateUserProject(id, {
            ...data,
            status: client_1.ApprovalStatus.PENDING,
            rejectionReason: null,
        });
        return (0, prismaSerializer_1.serializeBigInt)(updated);
    }
    async deleteUserProject(id) {
        const deleted = await skill_repository_1.default.deleteUserProject(id);
        return (0, prismaSerializer_1.serializeBigInt)(deleted);
    }
    // Approval Management (Admin)
    async getApprovalRequests(filters, userContext) {
        const requests = await skill_repository_1.default.getAllSkillRequests(filters, userContext);
        return (0, prismaSerializer_1.serializeBigInt)(requests);
    }
    async handleApprovalAction(id, requestKind, action, reason, reviewerName, reviewerContext) {
        const status = action === "APPROVE" ? client_1.ApprovalStatus.APPROVED : client_1.ApprovalStatus.REJECTED;
        if (requestKind === "SKILL") {
            const existing = await skill_repository_1.default.getUserSkillById(id);
            if (!existing) {
                throw new Error("Skill request not found");
            }
            if (existing.status !== client_1.ApprovalStatus.PENDING) {
                throw new Error("This request has already been finalized and cannot be modified.");
            }
            // Department scoping check for non-SUPER_ADMIN reviewers
            if (reviewerContext && reviewerContext.role !== "SUPER_ADMIN" && reviewerContext.departmentId) {
                const submitter = await skill_repository_1.default.getEmployeeById(existing.userId);
                if (submitter && submitter.departmentId !== reviewerContext.departmentId) {
                    throw new Error("Access denied: You can only approve or reject skill requests for your own department.");
                }
            }
            const updated = await skill_repository_1.default.updateSkillApproval(id, status, reason, reviewerName);
            // Emit Real-Time System Audit Log
            await audit_service_1.default.recordAuditLog({
                actorName: reviewerName,
                action: `Skill Request ${action}D`,
                detail: `${reviewerName} ${action.toLowerCase()}d skill request #${id} (${existing.skillName})${reason ? ` with comment: "${reason}"` : ''}`,
                type: "role",
            });
            return (0, prismaSerializer_1.serializeBigInt)(updated);
        }
        else {
            const existing = await skill_repository_1.default.getUserProjectById(id);
            if (!existing) {
                throw new Error("Project request not found");
            }
            if (existing.status !== client_1.ApprovalStatus.PENDING) {
                throw new Error("This request has already been finalized and cannot be modified.");
            }
            // Department scoping check for non-SUPER_ADMIN reviewers
            if (reviewerContext && reviewerContext.role !== "SUPER_ADMIN" && reviewerContext.departmentId) {
                const submitter = await skill_repository_1.default.getEmployeeById(existing.userId);
                if (submitter && submitter.departmentId !== reviewerContext.departmentId) {
                    throw new Error("Access denied: You can only approve or reject project requests for your own department.");
                }
            }
            const updated = await skill_repository_1.default.updateProjectApproval(id, status, reason, reviewerName);
            // Emit Real-Time System Audit Log
            await audit_service_1.default.recordAuditLog({
                actorName: reviewerName,
                action: `Project Request ${action}D`,
                detail: `${reviewerName} ${action.toLowerCase()}d project request #${id} (${existing.projectName})${reason ? ` with comment: "${reason}"` : ''}`,
                type: "role",
            });
            return (0, prismaSerializer_1.serializeBigInt)(updated);
        }
    }
    // Learner Overview Stats
    async getUserOverviewStats(userId) {
        const stats = await skill_repository_1.default.getUserOverviewStats(userId);
        return (0, prismaSerializer_1.serializeBigInt)(stats);
    }
}
exports.default = new SkillService();
