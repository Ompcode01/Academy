"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEscalation = exports.createAnnouncement = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const notification_service_1 = __importDefault(require("./notification.service"));
const prismaSerializer_1 = require("../../utils/prismaSerializer");
function extractUserId(req) {
    const candidate = req.user?.employeeId || req.user?.userId || req.user?.id;
    if (!candidate || candidate === "undefined" || candidate === "null") {
        return BigInt(1);
    }
    try {
        return BigInt(candidate);
    }
    catch {
        return BigInt(1);
    }
}
/**
 * GET /api/notifications
 * Query: ?limit=20&page=1&unreadOnly=true&category=COURSE
 */
const getNotifications = async (req, res) => {
    try {
        const userId = extractUserId(req);
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const page = req.query.page ? Number(req.query.page) : 1;
        const unreadOnly = req.query.unreadOnly === "true";
        const category = req.query.category ? String(req.query.category) : undefined;
        const { notifications, total } = await notification_service_1.default.getForUser(userId, {
            limit,
            page,
            unreadOnly,
            category,
        });
        res.json({
            success: true,
            data: (0, prismaSerializer_1.serializeBigInt)(notifications || []),
            pagination: {
                total: total || 0,
                page,
                limit,
                hasMore: page * limit < (total || 0),
            },
        });
    }
    catch (error) {
        console.error("Error in getNotifications:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to fetch notifications" });
    }
};
exports.getNotifications = getNotifications;
/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = extractUserId(req);
        const count = await notification_service_1.default.getUnreadCount(userId);
        res.json({ success: true, data: { count: count || 0 } });
    }
    catch (error) {
        console.error("Error in getUnreadCount:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to count unread notifications" });
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const id = BigInt(req.params.id);
        const userId = extractUserId(req);
        // Ownership check: only the recipient can mark their own notification as read
        const notification = await notification_service_1.default.findById(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }
        if (notification.userId !== userId) {
            return res.status(403).json({ success: false, message: "Access denied: you can only manage your own notifications" });
        }
        await notification_service_1.default.markAsRead(id);
        res.json({ success: true, message: "Notification marked as read" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAsRead = markAsRead;
/**
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = extractUserId(req);
        await notification_service_1.default.markAllAsRead(userId);
        res.json({ success: true, message: "All notifications marked as read" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const id = BigInt(req.params.id);
        const userId = extractUserId(req);
        // Ownership check: only the recipient can delete their own notification
        const notification = await notification_service_1.default.findById(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }
        if (notification.userId !== userId) {
            return res.status(403).json({ success: false, message: "Access denied: you can only manage your own notifications" });
        }
        await notification_service_1.default.deleteNotification(id);
        res.json({ success: true, message: "Notification deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * POST /api/notifications/announcements
 */
const createAnnouncement = async (req, res) => {
    try {
        const actorId = extractUserId(req);
        const actorRole = req.user?.role || "LEARNER";
        const { title, message, targetRole, courseId, departmentId, priority } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message are required" });
        }
        await notification_service_1.default.notifyAnnouncement({
            actorId,
            actorRole,
            title,
            message,
            targetRole,
            courseId: courseId ? BigInt(courseId) : undefined,
            departmentId: departmentId ? BigInt(departmentId) : undefined,
            priority: priority || "NORMAL",
        });
        res.json({ success: true, message: "Announcement broadcasted successfully" });
    }
    catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to broadcast announcement" });
    }
};
exports.createAnnouncement = createAnnouncement;
/**
 * POST /api/notifications/escalate
 */
const createEscalation = async (req, res) => {
    try {
        const actorId = extractUserId(req);
        const { title, message, courseId, accusedTeacherId, priority } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message are required for escalation" });
        }
        await notification_service_1.default.notifyEscalation({
            actorId,
            title,
            message,
            courseId: courseId ? BigInt(courseId) : undefined,
            accusedTeacherId: accusedTeacherId ? BigInt(accusedTeacherId) : undefined,
            priority: priority || "HIGH",
        });
        res.json({ success: true, message: "Issue escalated successfully to administration" });
    }
    catch (error) {
        console.error("Error creating escalation:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to escalate issue" });
    }
};
exports.createEscalation = createEscalation;
