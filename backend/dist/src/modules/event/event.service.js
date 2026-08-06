"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const serializer_1 = require("../../utils/serializer");
class EventService {
    async getAllEvents(userContext) {
        let whereClause = {};
        if (!userContext || userContext.role !== "SUPER_ADMIN") {
            const deptId = userContext?.departmentId;
            const empId = userContext?.employeeId;
            whereClause = {
                OR: [
                    { departmentId: null },
                    ...(deptId ? [{ departmentId: deptId }] : []),
                    ...(empId ? [{ creatorId: empId }] : []),
                ],
            };
        }
        const events = await prisma_1.default.event.findMany({
            where: whereClause,
            include: {
                department: {
                    select: { id: true, departmentName: true, departmentCode: true },
                },
            },
            orderBy: { eventDate: "asc" },
        });
        return (0, serializer_1.serialize)(events);
    }
    async createEvent(data) {
        const created = await prisma_1.default.event.create({
            data: {
                title: data.title,
                description: data.description || null,
                eventDate: data.eventDate,
                eventTime: data.eventTime || null,
                url: data.url || null,
                eventType: data.eventType || "site",
                courseId: data.courseId || null,
                departmentId: data.departmentId || null,
                creatorId: data.creatorId || null,
                creatorName: data.creatorName || "System Admin",
            },
        });
        // Automatically emit Audit Log entry
        await prisma_1.default.auditLog.create({
            data: {
                actorName: data.creatorName || "System Admin",
                action: "Calendar Event Created",
                detail: `Created event '${data.title}' scheduled for ${data.eventDate.toISOString().split("T")[0]}`,
                type: "course",
            },
        });
        return (0, serializer_1.serialize)(created);
    }
    async updateEvent(id, data, actorName) {
        const updated = await prisma_1.default.event.update({
            where: { id },
            data: {
                ...(data.title ? { title: data.title } : {}),
                ...(data.description !== undefined ? { description: data.description || null } : {}),
                ...(data.eventDate ? { eventDate: data.eventDate } : {}),
                ...(data.eventTime !== undefined ? { eventTime: data.eventTime || null } : {}),
                ...(data.url !== undefined ? { url: data.url || null } : {}),
                ...(data.eventType ? { eventType: data.eventType } : {}),
            },
        });
        await prisma_1.default.auditLog.create({
            data: {
                actorName: actorName || "System Admin",
                action: "Calendar Event Updated",
                detail: `Updated event '${updated.title}'`,
                type: "course",
            },
        });
        return (0, serializer_1.serialize)(updated);
    }
    async deleteEvent(id, actorName) {
        const deleted = await prisma_1.default.event.delete({
            where: { id },
        });
        await prisma_1.default.auditLog.create({
            data: {
                actorName: actorName || "System Admin",
                action: "Calendar Event Deleted",
                detail: `Deleted event '${deleted.title}'`,
                type: "course",
            },
        });
        return (0, serializer_1.serialize)(deleted);
    }
}
exports.EventService = EventService;
exports.default = new EventService();
