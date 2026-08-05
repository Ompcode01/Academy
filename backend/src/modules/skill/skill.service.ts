import skillRepository, {
  CreateUserSkillData,
  UpdateUserSkillData,
  CreateUserProjectData,
  UpdateUserProjectData,
} from "./skill.repository";
import { ApprovalStatus } from "@prisma/client";
import { serializeBigInt } from "../../utils/prismaSerializer";
import auditService from "../audit/audit.service";

class SkillService {
  async getCatalogSkills() {
    await skillRepository.seedDefaultSkills();
    const skills = await skillRepository.getCatalogSkills();
    return serializeBigInt(skills);
  }

  async getUserSkills(userId: bigint, statusFilter?: ApprovalStatus) {
    const userSkills = await skillRepository.getUserSkills(userId, statusFilter);
    return serializeBigInt(userSkills);
  }

  async createUserSkill(data: CreateUserSkillData) {
    const created = await skillRepository.createUserSkill(data);
    return serializeBigInt(created);
  }

  async updateUserSkill(id: bigint, data: UpdateUserSkillData) {
    const updated = await skillRepository.updateUserSkill(id, data);
    return serializeBigInt(updated);
  }

  async resubmitUserSkill(id: bigint, data: UpdateUserSkillData) {
    // Reset status back to PENDING and clear rejectionReason
    const updated = await skillRepository.updateUserSkill(id, {
      ...data,
      status: ApprovalStatus.PENDING,
      rejectionReason: null,
    });
    return serializeBigInt(updated);
  }

  async deleteUserSkill(id: bigint) {
    const deleted = await skillRepository.deleteUserSkill(id);
    return serializeBigInt(deleted);
  }

  // User Projects
  async getUserProjects(userId: bigint, statusFilter?: ApprovalStatus) {
    const userProjects = await skillRepository.getUserProjects(userId, statusFilter);
    return serializeBigInt(userProjects);
  }

  async createUserProject(data: CreateUserProjectData) {
    const created = await skillRepository.createUserProject(data);
    return serializeBigInt(created);
  }

  async updateUserProject(id: bigint, data: UpdateUserProjectData) {
    const updated = await skillRepository.updateUserProject(id, data);
    return serializeBigInt(updated);
  }

  async resubmitUserProject(id: bigint, data: UpdateUserProjectData) {
    const updated = await skillRepository.updateUserProject(id, {
      ...data,
      status: ApprovalStatus.PENDING,
      rejectionReason: null,
    });
    return serializeBigInt(updated);
  }

  async deleteUserProject(id: bigint) {
    const deleted = await skillRepository.deleteUserProject(id);
    return serializeBigInt(deleted);
  }

  // Approval Management (Admin)
  async getApprovalRequests(
    filters: { status?: ApprovalStatus; search?: string },
    userContext?: { role?: string; departmentId?: bigint | null }
  ) {
    const requests = await skillRepository.getAllSkillRequests(filters, userContext);
    return serializeBigInt(requests);
  }

  async handleApprovalAction(
    id: bigint,
    requestKind: "SKILL" | "PROJECT",
    action: "APPROVE" | "REJECT",
    reason: string | null,
    reviewerName: string,
    reviewerContext?: { role?: string; departmentId?: bigint | null }
  ) {
    const status = action === "APPROVE" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    if (requestKind === "SKILL") {
      const existing = await skillRepository.getUserSkillById(id);
      if (!existing) {
        throw new Error("Skill request not found");
      }
      if (existing.status !== ApprovalStatus.PENDING) {
        throw new Error("This request has already been finalized and cannot be modified.");
      }

      // Department scoping check for non-SUPER_ADMIN reviewers
      if (reviewerContext && reviewerContext.role !== "SUPER_ADMIN" && reviewerContext.departmentId) {
        const submitter = await skillRepository.getEmployeeById(existing.userId);
        if (submitter && submitter.departmentId !== reviewerContext.departmentId) {
          throw new Error("Access denied: You can only approve or reject skill requests for your own department.");
        }
      }

      const updated = await skillRepository.updateSkillApproval(id, status, reason, reviewerName);

      // Emit Real-Time System Audit Log
      await auditService.recordAuditLog({
        actorName: reviewerName,
        action: `Skill Request ${action}D`,
        detail: `${reviewerName} ${action.toLowerCase()}d skill request #${id} (${existing.skillName})${reason ? ` with comment: "${reason}"` : ''}`,
        type: "role",
      });

      return serializeBigInt(updated);
    } else {
      const existing = await skillRepository.getUserProjectById(id);
      if (!existing) {
        throw new Error("Project request not found");
      }
      if (existing.status !== ApprovalStatus.PENDING) {
        throw new Error("This request has already been finalized and cannot be modified.");
      }

      // Department scoping check for non-SUPER_ADMIN reviewers
      if (reviewerContext && reviewerContext.role !== "SUPER_ADMIN" && reviewerContext.departmentId) {
        const submitter = await skillRepository.getEmployeeById(existing.userId);
        if (submitter && submitter.departmentId !== reviewerContext.departmentId) {
          throw new Error("Access denied: You can only approve or reject project requests for your own department.");
        }
      }

      const updated = await skillRepository.updateProjectApproval(id, status, reason, reviewerName);

      // Emit Real-Time System Audit Log
      await auditService.recordAuditLog({
        actorName: reviewerName,
        action: `Project Request ${action}D`,
        detail: `${reviewerName} ${action.toLowerCase()}d project request #${id} (${existing.projectName})${reason ? ` with comment: "${reason}"` : ''}`,
        type: "role",
      });

      return serializeBigInt(updated);
    }
  }

  // Learner Overview Stats
  async getUserOverviewStats(userId: bigint) {
    const stats = await skillRepository.getUserOverviewStats(userId);
    return serializeBigInt(stats);
  }
}

export default new SkillService();
