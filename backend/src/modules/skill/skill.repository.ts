import prisma from "../../config/prisma";
import { ApprovalStatus } from "@prisma/client";

export interface CreateUserSkillData {
  userId: bigint;
  skillId?: bigint;
  skillName: string;
  category: string;
  subCategory?: string;
  skillType?: string;
  proficiencyLevel?: string;
  rating?: number;
  yearsOfExp?: number;
  description?: string;
}

export interface UpdateUserSkillData {
  skillName?: string;
  category?: string;
  subCategory?: string;
  skillType?: string;
  proficiencyLevel?: string;
  rating?: number;
  yearsOfExp?: number;
  description?: string;
  status?: ApprovalStatus;
  rejectionReason?: string | null;
}

export interface CreateUserProjectData {
  userId: bigint;
  projectName: string;
  projectType?: string;
  organization?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
  roleName?: string;
  responsibilities?: string;
  technologies?: string;
}

export interface UpdateUserProjectData {
  projectName?: string;
  projectType?: string;
  organization?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
  roleName?: string;
  responsibilities?: string;
  technologies?: string;
  status?: ApprovalStatus;
  rejectionReason?: string | null;
}

class SkillRepository {
  // Predefined catalog skills
  async getCatalogSkills() {
    return prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async seedDefaultSkills() {
    const existing = await prisma.skill.count();
    if (existing === 0) {
      await prisma.skill.createMany({
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
  async getUserSkills(userId: bigint, statusFilter?: ApprovalStatus) {
    const where: any = { userId };
    if (statusFilter) {
      where.status = statusFilter;
    }
    return prisma.userSkill.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
  }

  async getUserSkillById(id: bigint) {
    return prisma.userSkill.findUnique({
      where: { id },
    });
  }

  async createUserSkill(data: CreateUserSkillData) {
    return prisma.userSkill.create({
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
        status: ApprovalStatus.PENDING,
      },
    });
  }

  async updateUserSkill(id: bigint, data: UpdateUserSkillData) {
    return prisma.userSkill.update({
      where: { id },
      data,
    });
  }

  async deleteUserSkill(id: bigint) {
    return prisma.userSkill.delete({
      where: { id },
    });
  }

  // User Projects
  async getUserProjects(userId: bigint, statusFilter?: ApprovalStatus) {
    const where: any = { userId };
    if (statusFilter) {
      where.status = statusFilter;
    }
    return prisma.userProject.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
  }

  async getUserProjectById(id: bigint) {
    return prisma.userProject.findUnique({
      where: { id },
    });
  }

  async createUserProject(data: CreateUserProjectData) {
    return prisma.userProject.create({
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
        status: ApprovalStatus.PENDING,
      },
    });
  }

  async updateUserProject(id: bigint, data: UpdateUserProjectData) {
    return prisma.userProject.update({
      where: { id },
      data,
    });
  }

  async deleteUserProject(id: bigint) {
    return prisma.userProject.delete({
      where: { id },
    });
  }

  // Approval Management (Admin View)
  async getAllSkillRequests(
    filters: { status?: ApprovalStatus; search?: string },
    userContext?: { role?: string; departmentId?: bigint | null }
  ) {
    const { status, search } = filters;

    const skillWhere: any = {};
    const projectWhere: any = {};

    if (userContext && userContext.role !== "SUPER_ADMIN" && userContext.departmentId) {
      const deptEmployees = await prisma.employee.findMany({
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
      prisma.userSkill.findMany({
        where: skillWhere,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.userProject.findMany({
        where: projectWhere,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.employee.findMany({
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
      requestKind: "SKILL" as const,
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
      requestKind: "PROJECT" as const,
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

    return [...formattedSkills, ...formattedProjects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async updateSkillApproval(
    id: bigint,
    status: ApprovalStatus,
    reason: string | null,
    reviewerName: string
  ) {
    const updated = await prisma.userSkill.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === ApprovalStatus.REJECTED ? reason : null,
        verifiedBy: reviewerName,
        verifiedAt: new Date(),
      },
    });

    await prisma.skillApprovalLog.create({
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

  async updateProjectApproval(
    id: bigint,
    status: ApprovalStatus,
    reason: string | null,
    reviewerName: string
  ) {
    const updated = await prisma.userProject.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === ApprovalStatus.REJECTED ? reason : null,
        verifiedBy: reviewerName,
        verifiedAt: new Date(),
      },
    });

    await prisma.skillApprovalLog.create({
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

  async getEmployeeById(id: bigint) {
    return prisma.employee.findUnique({
      where: { id },
      select: { id: true, departmentId: true },
    });
  }

  // Dashboard Overview metrics for a user
  async getUserOverviewStats(userId: bigint) {
    const [skills, projects] = await Promise.all([
      prisma.userSkill.findMany({ where: { userId } }),
      prisma.userProject.findMany({ where: { userId } }),
    ]);

    const totalSkills = skills.length;
    const approvedSkills = skills.filter((s) => s.status === ApprovalStatus.APPROVED).length;
    const pendingSkills = skills.filter((s) => s.status === ApprovalStatus.PENDING).length;
    const rejectedSkills = skills.filter((s) => s.status === ApprovalStatus.REJECTED).length;

    const totalProjects = projects.length;
    const currentProjects = projects.filter((p) => p.isCurrent || p.status === ApprovalStatus.APPROVED).length;

    // Distribution by category
    const categoryCount: Record<string, number> = {};
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

export default new SkillRepository();
