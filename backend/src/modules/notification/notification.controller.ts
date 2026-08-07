import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import notificationService from "./notification.service";
import { serializeBigInt } from "../../utils/prismaSerializer";

/**
 * GET /api/notifications
 * Query: ?limit=20&page=1&unreadOnly=true
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.employeeId
      ? BigInt(req.user.employeeId)
      : BigInt(1);
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
      data: serializeBigInt(notifications),
      pagination: {
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.employeeId
      ? BigInt(req.user.employeeId)
      : BigInt(1);

    const count = await notificationService.getUnreadCount(userId);

    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id as string);
    const userId = req.user?.employeeId
      ? BigInt(req.user.employeeId)
      : BigInt(1);

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
    const userId = req.user?.employeeId
      ? BigInt(req.user.employeeId)
      : BigInt(1);

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
    const userId = req.user?.employeeId
      ? BigInt(req.user.employeeId)
      : BigInt(1);

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
