import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateNotificationInput {
  userId: bigint;
  actorId?: bigint | null;
  type: string;
  category?: string;
  priority?: string;
  title: string;
  message: string;
  link?: string | null;
  entityType?: string | null;
  entityId?: bigint | null;
  metadata?: any;
  roleTarget?: string | null;
}

const notificationRepository = {
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId || null,
        type: data.type,
        category: data.category || "GENERAL",
        priority: data.priority || "NORMAL",
        title: data.title,
        message: data.message,
        link: data.link || null,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        metadata: data.metadata || undefined,
        roleTarget: data.roleTarget || null,
      },
    });
  },

  async createMany(items: CreateNotificationInput[]) {
    return prisma.notification.createMany({
      data: items.map((d) => ({
        userId: d.userId,
        actorId: d.actorId || null,
        type: d.type,
        category: d.category || "GENERAL",
        priority: d.priority || "NORMAL",
        title: d.title,
        message: d.message,
        link: d.link || null,
        entityType: d.entityType || null,
        entityId: d.entityId || null,
        metadata: d.metadata || undefined,
        roleTarget: d.roleTarget || null,
      })),
    });
  },

  async findById(id: bigint) {
    return prisma.notification.findUnique({
      where: { id },
    });
  },

  async getForUser(
    userId: bigint,
    options: { limit?: number; page?: number; unreadOnly?: boolean; category?: string } = {}
  ) {
    const { limit = 20, page = 1, unreadOnly = false, category } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
      ...(category && category !== "ALL" ? { category } : {}),
    };

    try {
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return { notifications, total };
    } catch (err) {
      console.error("Failed to query notifications for user:", err);
      return { notifications: [], total: 0 };
    }
  },

  async getUnreadCount(userId: bigint) {
    try {
      return await prisma.notification.count({
        where: { userId, isRead: false },
      });
    } catch (err) {
      console.error("Failed to count unread notifications:", err);
      return 0;
    }
  },

  async markAsRead(id: bigint, userId: bigint) {
    try {
      return await prisma.notification.deleteMany({
        where: { id, userId },
      });
    } catch (err) {
      console.error("Failed to clear notification for user:", err);
      return null;
    }
  },

  async markAllAsRead(userId: bigint) {
    try {
      return await prisma.notification.deleteMany({
        where: { userId },
      });
    } catch (err) {
      console.error("Failed to clear all notifications for user:", err);
      return null;
    }
  },

  async deleteOne(id: bigint) {
    return prisma.notification.delete({
      where: { id },
    });
  },
};

export default notificationRepository;
