import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement,
  createEscalation,
} from "../modules/notification/notification.controller";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications?limit=20&unreadOnly=true
router.get("/", getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// POST /api/notifications/announcements
router.post("/announcements", createAnnouncement);

// POST /api/notifications/escalate
router.post("/escalate", createEscalation);

// PATCH /api/notifications/read-all  (must come before /:id to avoid route collision)
router.patch("/read-all", markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id
router.delete("/:id", deleteNotification);

export default router;
