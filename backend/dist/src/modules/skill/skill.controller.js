"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserOverviewStats = exports.handleApprovalAction = exports.getApprovalRequests = exports.deleteUserProject = exports.updateUserProject = exports.createUserProject = exports.getUserProjects = exports.deleteUserSkill = exports.updateUserSkill = exports.createUserSkill = exports.getUserSkills = exports.getCatalogSkills = void 0;
const skill_service_1 = __importDefault(require("./skill.service"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const getAuthUserId = (req) => {
    const idVal = req.user?.employeeId || req.user?.userId || req.user?.id;
    if (!idVal) {
        throw new Error("Authentication required: invalid or missing user credentials");
    }
    return BigInt(idVal);
};
const getCatalogSkills = async (req, res) => {
    try {
        const skills = await skill_service_1.default.getCatalogSkills();
        res.json({ success: true, data: skills });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCatalogSkills = getCatalogSkills;
const getUserSkills = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const status = req.query.status ? String(req.query.status) : undefined;
        const userSkills = await skill_service_1.default.getUserSkills(userId, status);
        res.json({ success: true, data: userSkills });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserSkills = getUserSkills;
const createUserSkill = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { skillName, category, subCategory, skillType, proficiencyLevel, rating, yearsOfExp, description } = req.body;
        if (!skillName || !category) {
            return res.status(400).json({ success: false, message: "Skill Name and Category are required" });
        }
        const created = await skill_service_1.default.createUserSkill({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createUserSkill = createUserSkill;
const updateUserSkill = async (req, res) => {
    try {
        const id = String(req.params.id);
        const isResubmit = req.query.resubmit === "true";
        const updateData = req.body;
        let result;
        if (isResubmit) {
            result = await skill_service_1.default.resubmitUserSkill(BigInt(id), updateData);
        }
        else {
            result = await skill_service_1.default.updateUserSkill(BigInt(id), updateData);
        }
        res.json({ success: true, message: isResubmit ? "Skill resubmitted for approval" : "Skill updated", data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUserSkill = updateUserSkill;
const deleteUserSkill = async (req, res) => {
    try {
        const id = String(req.params.id);
        await skill_service_1.default.deleteUserSkill(BigInt(id));
        res.json({ success: true, message: "Skill deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteUserSkill = deleteUserSkill;
const getUserProjects = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const status = req.query.status ? String(req.query.status) : undefined;
        const projects = await skill_service_1.default.getUserProjects(userId, status);
        res.json({ success: true, data: projects });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserProjects = getUserProjects;
const createUserProject = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { projectName, projectType, organization, startDate, endDate, isCurrent, roleName, responsibilities, technologies } = req.body;
        if (!projectName) {
            return res.status(400).json({ success: false, message: "Project Name is required" });
        }
        const created = await skill_service_1.default.createUserProject({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createUserProject = createUserProject;
const updateUserProject = async (req, res) => {
    try {
        const id = String(req.params.id);
        const isResubmit = req.query.resubmit === "true";
        const updateData = req.body;
        let result;
        if (isResubmit) {
            result = await skill_service_1.default.resubmitUserProject(BigInt(id), updateData);
        }
        else {
            result = await skill_service_1.default.updateUserProject(BigInt(id), updateData);
        }
        res.json({ success: true, message: isResubmit ? "Project resubmitted for approval" : "Project updated", data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUserProject = updateUserProject;
const deleteUserProject = async (req, res) => {
    try {
        const id = String(req.params.id);
        await skill_service_1.default.deleteUserProject(BigInt(id));
        res.json({ success: true, message: "Project deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteUserProject = deleteUserProject;
const getApprovalRequests = async (req, res) => {
    try {
        const status = req.query.status ? String(req.query.status) : undefined;
        const search = req.query.search ? String(req.query.search) : undefined;
        const requests = await skill_service_1.default.getApprovalRequests({ status, search });
        res.json({ success: true, data: requests });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getApprovalRequests = getApprovalRequests;
const handleApprovalAction = async (req, res) => {
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
                    const emp = await prisma_1.default.employee.findUnique({
                        where: { id: BigInt(req.user.employeeId) },
                        select: { firstName: true, lastName: true },
                    });
                    if (emp) {
                        fullName = `${emp.firstName} ${emp.lastName}`;
                    }
                }
                catch (e) {
                    console.error("Error looking up reviewer employee:", e);
                }
            }
            reviewerName = `${fullName} (${userRole})`;
        }
        const result = await skill_service_1.default.handleApprovalAction(BigInt(id), requestKind, action, reason || null, reviewerName);
        res.json({
            success: true,
            message: `Request ${action.toLowerCase()}d successfully`,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.handleApprovalAction = handleApprovalAction;
const getUserOverviewStats = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const stats = await skill_service_1.default.getUserOverviewStats(userId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserOverviewStats = getUserOverviewStats;
