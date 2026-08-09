"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const notificationRepository = {
    async create(data) {
        return prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link || null,
                metadata: data.metadata || undefined,
                ...(data.roleTarget ? { roleTarget: data.roleTarget } : {}),
            },
        });
    },
    async createMany(items) {
        return prisma.notification.createMany({
            data: items.map((d) => ({
                userId: d.userId,
                type: d.type,
                title: d.title,
                message: d.message,
                link: d.link || null,
                metadata: d.metadata || undefined,
                ...(d.roleTarget ? { roleTarget: d.roleTarget } : {}),
            })),
        });
    },
    async findById(id) {
        return prisma.notification.findUnique({
            where: { id },
        });
    },
    async getForUser(userId, options = {}) {
        const { limit = 20, page = 1, unreadOnly = false } = options;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(unreadOnly ? { isRead: false } : {}),
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
        }
        catch (err) {
            console.error("Failed to query notifications for user:", err);
            return { notifications: [], total: 0 };
        }
    },
    async getUnreadCount(userId) {
        try {
            return await prisma.notification.count({
                where: { userId, isRead: false },
            });
        }
        catch (err) {
            console.error("Failed to count unread notifications:", err);
            return 0;
        }
    },
    async markAsRead(id) {
        return prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    },
    async markAllAsRead(userId) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    },
    async deleteOne(id) {
        return prisma.notification.delete({
            where: { id },
        });
    },
};
exports.default = notificationRepository;
