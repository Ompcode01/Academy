import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import notificationService from "./notification.service";
import { serializeBigInt } from "../../utils/prismaSerializer";

/**
 * GET /api/notifications
 * Query: ?limit=20&unreadOnly=true
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.employeeId
      ? BigInt(req.user.employeeId)
      : BigInt(1);
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const notifications = await notificationService.getForUser(userId, {
      limit,
      unreadOnly,
    });

    res.json({
      success: true,
      data: serializeBigInt(notifications),
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
    await notificationService.deleteNotification(id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
