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
            })),
        });
    },
    async getForUser(userId, options = {}) {
        const { limit = 20, unreadOnly = false } = options;
        return prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { isRead: false } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    },
    async getUnreadCount(userId) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
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
