import skillRepository, {
  CreateUserSkillData,
  UpdateUserSkillData,
  CreateUserProjectData,
  UpdateUserProjectData,
} from "./skill.repository";
import { ApprovalStatus } from "@prisma/client";
import { serializeBigInt } from "../../utils/prismaSerializer";

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
  async getApprovalRequests(filters: { status?: ApprovalStatus; search?: string }) {
    const requests = await skillRepository.getAllSkillRequests(filters);
    return serializeBigInt(requests);
  }

  async handleApprovalAction(
    id: bigint,
    requestKind: "SKILL" | "PROJECT",
    action: "APPROVE" | "REJECT",
    reason: string | null,
    reviewerName: string
  ) {
    const status = action === "APPROVE" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    if (requestKind === "SKILL") {
      const updated = await skillRepository.updateSkillApproval(id, status, reason, reviewerName);
      return serializeBigInt(updated);
    } else {
      const updated = await skillRepository.updateProjectApproval(id, status, reason, reviewerName);
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
