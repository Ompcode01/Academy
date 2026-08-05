import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import skillService from "./skill.service";
import { ApprovalStatus } from "@prisma/client";
import prisma from "../../config/prisma";

const getAuthUserId = (req: AuthRequest): bigint => {
  const idVal = req.user?.employeeId || req.user?.userId || req.user?.id;
  if (!idVal) {
    throw new Error("Authentication required: invalid or missing user credentials");
  }
  return BigInt(idVal);
};

export const getCatalogSkills = async (req: AuthRequest, res: Response) => {
  try {
    const skills = await skillService.getCatalogSkills();
    res.json({ success: true, data: skills });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserSkills = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const status = req.query.status ? (String(req.query.status) as ApprovalStatus) : undefined;
    const userSkills = await skillService.getUserSkills(userId, status);
    res.json({ success: true, data: userSkills });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUserSkill = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { skillName, category, subCategory, skillType, proficiencyLevel, rating, yearsOfExp, description } = req.body;

    if (!skillName || !category) {
      return res.status(400).json({ success: false, message: "Skill Name and Category are required" });
    }

    const created = await skillService.createUserSkill({
      userId,
      skillName,
      category,
      subCategory,
      skillType,
      proficiencyLevel,
      rating: Number(rating) || 3,
      yearsOfExp: yearsOfExp ? Number(yearsOfExp) : undefined,
      description,
    });

    res.status(201).json({ success: true, message: "Skill submitted for approval", data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserSkill = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const isResubmit = req.query.resubmit === "true";
    const updateData = req.body;

    let result;
    if (isResubmit) {
      result = await skillService.resubmitUserSkill(BigInt(id), updateData);
    } else {
      result = await skillService.updateUserSkill(BigInt(id), updateData);
    }

    res.json({ success: true, message: isResubmit ? "Skill resubmitted for approval" : "Skill updated", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUserSkill = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await skillService.deleteUserSkill(BigInt(id));
    res.json({ success: true, message: "Skill deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const status = req.query.status ? (String(req.query.status) as ApprovalStatus) : undefined;
    const projects = await skillService.getUserProjects(userId, status);
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUserProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { projectName, projectType, organization, startDate, endDate, isCurrent, roleName, responsibilities, technologies } = req.body;

    if (!projectName) {
      return res.status(400).json({ success: false, message: "Project Name is required" });
    }

    const created = await skillService.createUserProject({
      userId,
      projectName,
      projectType,
      organization,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isCurrent: Boolean(isCurrent),
      roleName,
      responsibilities,
      technologies,
    });

    res.status(201).json({ success: true, message: "Project submitted for approval", data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProject = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const isResubmit = req.query.resubmit === "true";
    const updateData = req.body;

    let result;
    if (isResubmit) {
      result = await skillService.resubmitUserProject(BigInt(id), updateData);
    } else {
      result = await skillService.updateUserProject(BigInt(id), updateData);
    }

    res.json({ success: true, message: isResubmit ? "Project resubmitted for approval" : "Project updated", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUserProject = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await skillService.deleteUserProject(BigInt(id));
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApprovalRequests = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status ? (String(req.query.status) as ApprovalStatus) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const requests = await skillService.getApprovalRequests({ status, search });
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleApprovalAction = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { requestKind, action, reason } = req.body;

    if (!requestKind || !action) {
      return res.status(400).json({ success: false, message: "requestKind and action are required" });
    }

    if (action === "REJECT" && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: "A reason or comment is required when rejecting a request" });
    }

    let reviewerName = "Department Admin";
    if (req.user) {
      const userRole = req.user.role || "ADMIN";
      let fullName = req.user.username || "Admin";

      if (req.user.employeeId) {
        try {
          const emp = await prisma.employee.findUnique({
            where: { id: BigInt(req.user.employeeId) },
            select: { firstName: true, lastName: true },
          });
          if (emp) {
            fullName = `${emp.firstName} ${emp.lastName}`;
          }
        } catch (e) {
          console.error("Error looking up reviewer employee:", e);
        }
      }

      reviewerName = `${fullName} (${userRole})`;
    }

    const result = await skillService.handleApprovalAction(
      BigInt(id),
      requestKind,
      action,
      reason || null,
      reviewerName
    );

    res.json({
      success: true,
      message: `Request ${action.toLowerCase()}d successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserOverviewStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const stats = await skillService.getUserOverviewStats(userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
