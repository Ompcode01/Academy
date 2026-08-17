"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeAssessmentSubmission = exports.getTeacherSubmissions = exports.recordAssignmentSubmission = exports.getAdminLearnerProgressMatrix = exports.recordQuizSubmission = exports.updateLessonProgress = exports.getMyEnrollments = exports.getLearnerProgress = void 0;
const progress_service_1 = __importDefault(require("./progress.service"));
const getLearnerProgress = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.json({
                success: true,
                data: {
                    progressPercent: 0,
                    completedLessonIds: [],
                    isEnrolled: false,
                    isGuest: true,
                    sessionsCount: 0,
                    timeSpentSeconds: 0,
                },
            });
        }
        const courseId = BigInt(String(req.params.id));
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const data = await progress_service_1.default.getLearnerCourseProgress(userId, courseId);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLearnerProgress = getLearnerProgress;
const getMyEnrollments = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.json({ success: true, data: [] });
        }
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const data = await progress_service_1.default.getMyEnrollments(userId);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyEnrollments = getMyEnrollments;
const updateLessonProgress = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.status(403).json({ success: false, message: "Guest accounts cannot track lesson completion or progress." });
        }
        const courseId = BigInt(String(req.params.id));
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const { contentId, isCompleted, additionalSeconds } = req.body;
        if (!contentId) {
            return res.status(400).json({ success: false, message: "contentId is required" });
        }
        const data = await progress_service_1.default.updateLessonProgress(userId, courseId, BigInt(contentId), Boolean(isCompleted), Number(additionalSeconds) || 0);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateLessonProgress = updateLessonProgress;
const recordQuizSubmission = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.status(403).json({ success: false, message: "Guest accounts cannot attempt quizzes." });
        }
        const courseId = BigInt(String(req.params.id));
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const { contentId, score, maxScore, answersJson } = req.body;
        const data = await progress_service_1.default.recordQuizSubmission(userId, courseId, contentId ? BigInt(contentId) : null, Number(score) || 0, Number(maxScore) || 100, answersJson);
        res.json({ success: true, message: "Quiz submitted successfully", data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.recordQuizSubmission = recordQuizSubmission;
const getAdminLearnerProgressMatrix = async (req, res) => {
    try {
        const matrix = await progress_service_1.default.getAdminLearnerProgressMatrix();
        res.json({ success: true, data: matrix });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAdminLearnerProgressMatrix = getAdminLearnerProgressMatrix;
const recordAssignmentSubmission = async (req, res) => {
    try {
        if (req.user?.role === "GUEST") {
            return res.status(403).json({ success: false, message: "Guest accounts cannot submit assignments." });
        }
        const courseId = BigInt(String(req.params.id));
        const userId = req.user?.employeeId || req.user?.userId || req.user?.id ? BigInt(req.user.employeeId || req.user.userId || req.user.id) : BigInt(1);
        const { contentId, submissionText, fileUrl } = req.body;
        const data = await progress_service_1.default.recordAssignmentSubmission(userId, courseId, contentId ? BigInt(contentId) : null, submissionText || "", fileUrl || "");
        res.json({ success: true, message: "Assignment submitted successfully and queued for grading", data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.recordAssignmentSubmission = recordAssignmentSubmission;
const getTeacherSubmissions = async (req, res) => {
    try {
        const teacherId = req.user?.employeeId ? BigInt(req.user.employeeId) : undefined;
        const data = await progress_service_1.default.getTeacherSubmissions(teacherId, req.user?.role);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTeacherSubmissions = getTeacherSubmissions;
const gradeAssessmentSubmission = async (req, res) => {
    try {
        const submissionId = BigInt(String(req.params.submissionId));
        const { grade, score, feedback, status } = req.body;
        const graderName = req.user ? `${req.user.username}` : "Instructor Admin";
        const data = await progress_service_1.default.gradeAssessmentSubmission(submissionId, grade || "Passed", Number(score) || 0, feedback || "", graderName, status || "GRADED", req.user?.role);
        res.json({ success: true, message: `Assessment ${status === 'NEEDS_REVISION' ? 'marked for revision' : 'graded'} successfully`, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.gradeAssessmentSubmission = gradeAssessmentSubmission;
