import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import notificationService from "./notification.service";
import { serializeBigInt } from "../../utils/prismaSerializer";

function extractUserId(req: AuthRequest): bigint {
  const candidate = req.user?.employeeId || req.user?.userId || req.user?.id;
  if (!candidate || candidate === "undefined" || candidate === "null") {
    return BigInt(1);
  }
  try {
    return BigInt(candidate);
  } catch {
    return BigInt(1);
  }
}

/**
 * GET /api/notifications
 * Query: ?limit=20&page=1&unreadOnly=true
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = extractUserId(req);
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const page = req.query.page ? Number(req.query.page) : 1;
    const unreadOnly = req.query.unreadOnly === "true";

    const { notifications, total } = await notificationService.getForUser(userId, {
      limit,
      page,
      unreadOnly,
    });

    res.json({
      success: true,
      data: serializeBigInt(notifications || []),
      pagination: {
        total: total || 0,
        page,
        limit,
        hasMore: page * limit < (total || 0),
      },
    });
  } catch (error: any) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch notifications" });
  }
};

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = extractUserId(req);
    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count: count || 0 } });
  } catch (error: any) {
    console.error("Error in getUnreadCount:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to count unread notifications" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id as string);
    const userId = extractUserId(req);

    // Ownership check: only the recipient can mark their own notification as read
    const notification = await notificationService.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (notification.userId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied: you can only manage your own notifications" });
    }

    await notificationService.markAsRead(id);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = extractUserId(req);
    await notificationService.markAllAsRead(userId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id as string);
    const userId = extractUserId(req);

    // Ownership check: only the recipient can delete their own notification
    const notification = await notificationService.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (notification.userId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied: you can only manage your own notifications" });
    }

    await notificationService.deleteNotification(id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
