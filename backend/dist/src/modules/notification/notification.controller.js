"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const notification_service_1 = __importDefault(require("./notification.service"));
const prismaSerializer_1 = require("../../utils/prismaSerializer");
/**
 * GET /api/notifications
 * Query: ?limit=20&unreadOnly=true
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.employeeId
            ? BigInt(req.user.employeeId)
            : BigInt(1);
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const unreadOnly = req.query.unreadOnly === "true";
        const notifications = await notification_service_1.default.getForUser(userId, {
            limit,
            unreadOnly,
        });
        res.json({
            success: true,
            data: (0, prismaSerializer_1.serializeBigInt)(notifications),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getNotifications = getNotifications;
/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.employeeId
            ? BigInt(req.user.employeeId)
            : BigInt(1);
        const count = await notification_service_1.default.getUnreadCount(userId);
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const id = BigInt(req.params.id);
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
        const userId = req.user?.employeeId
            ? BigInt(req.user.employeeId)
            : BigInt(1);
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
        await notification_service_1.default.deleteNotification(id);
        res.json({ success: true, message: "Notification deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteNotification = deleteNotification;
