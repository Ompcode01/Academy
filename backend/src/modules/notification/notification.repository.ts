import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateNotificationInput {
  userId: bigint;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
  roleTarget?: string | null;
}

const notificationRepository = {
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata: data.metadata || undefined,
        roleTarget: data.roleTarget || null,
      },
    });
  },

  async createMany(items: CreateNotificationInput[]) {
    return prisma.notification.createMany({
      data: items.map((d) => ({
        userId: d.userId,
        type: d.type,
        title: d.title,
        message: d.message,
        link: d.link || null,
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
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    const { limit = 20, page = 1, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

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
  },

  async getUnreadCount(userId: bigint) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async markAsRead(id: bigint) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: bigint) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async deleteOne(id: bigint) {
    return prisma.notification.delete({
      where: { id },
    });
  },
};

export default notificationRepository;
