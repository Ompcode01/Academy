import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getCatalogSkills,
  getUserSkills,
  createUserSkill,
  updateUserSkill,
  deleteUserSkill,
  getUserProjects,
  createUserProject,
  updateUserProject,
  deleteUserProject,
  getApprovalRequests,
  handleApprovalAction,
  getUserOverviewStats,
} from "../modules/skill/skill.controller";

const router = Router();

// Catalog
router.get("/catalog", getCatalogSkills);

// Learner Overview
router.get("/overview", authenticate, getUserOverviewStats);

// Learner Skills
router.get("/my-skills", authenticate, getUserSkills);
router.post("/my-skills", authenticate, createUserSkill);
router.put("/my-skills/:id", authenticate, updateUserSkill);
router.delete("/my-skills/:id", authenticate, deleteUserSkill);

// Learner Projects
router.get("/my-projects", authenticate, getUserProjects);
router.post("/my-projects", authenticate, createUserProject);
router.put("/my-projects/:id", authenticate, updateUserProject);
router.delete("/my-projects/:id", authenticate, deleteUserProject);

// Admin Approval Queue
router.get("/approvals", authenticate, getApprovalRequests);
router.post("/approvals/:id/action", authenticate, handleApprovalAction);

export default router;
