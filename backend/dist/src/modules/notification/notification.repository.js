"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const notificationRepository = {
    async create(data) {
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
    async createMany(items) {
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
    async findById(id) {
        return prisma.notification.findUnique({
            where: { id },
        });
    },
    async getForUser(userId, options = {}) {
        const { limit = 20, page = 1, unreadOnly = false, category } = options;
        const skip = (page - 1) * limit;
        const where = {
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
