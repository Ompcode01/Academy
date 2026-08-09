"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_controller_1 = require("../modules/notification/notification.controller");
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_middleware_1.authenticate);
// GET /api/notifications?limit=20&unreadOnly=true
router.get("/", notification_controller_1.getNotifications);
// GET /api/notifications/unread-count
router.get("/unread-count", notification_controller_1.getUnreadCount);
// POST /api/notifications/announcements
router.post("/announcements", notification_controller_1.createAnnouncement);
// POST /api/notifications/escalate
router.post("/escalate", notification_controller_1.createEscalation);
// PATCH /api/notifications/read-all  (must come before /:id to avoid route collision)
router.patch("/read-all", notification_controller_1.markAllAsRead);
// PATCH /api/notifications/:id/read
router.patch("/:id/read", notification_controller_1.markAsRead);
// DELETE /api/notifications/:id
router.delete("/:id", notification_controller_1.deleteNotification);
exports.default = router;
