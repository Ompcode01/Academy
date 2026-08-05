"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const skill_controller_1 = require("../modules/skill/skill.controller");
const router = (0, express_1.Router)();
// Catalog
router.get("/catalog", skill_controller_1.getCatalogSkills);
// Learner Overview
router.get("/overview", auth_middleware_1.authenticate, skill_controller_1.getUserOverviewStats);
// Learner Skills
router.get("/my-skills", auth_middleware_1.authenticate, skill_controller_1.getUserSkills);
router.post("/my-skills", auth_middleware_1.authenticate, skill_controller_1.createUserSkill);
router.put("/my-skills/:id", auth_middleware_1.authenticate, skill_controller_1.updateUserSkill);
router.delete("/my-skills/:id", auth_middleware_1.authenticate, skill_controller_1.deleteUserSkill);
// Learner Projects
router.get("/my-projects", auth_middleware_1.authenticate, skill_controller_1.getUserProjects);
router.post("/my-projects", auth_middleware_1.authenticate, skill_controller_1.createUserProject);
router.put("/my-projects/:id", auth_middleware_1.authenticate, skill_controller_1.updateUserProject);
router.delete("/my-projects/:id", auth_middleware_1.authenticate, skill_controller_1.deleteUserProject);
// Admin Approval Queue
router.get("/approvals", auth_middleware_1.authenticate, skill_controller_1.getApprovalRequests);
router.post("/approvals/:id/action", auth_middleware_1.authenticate, skill_controller_1.handleApprovalAction);
exports.default = router;
