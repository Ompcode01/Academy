"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const serializer_1 = require("../../utils/serializer");
const guestGrant_service_1 = __importDefault(require("../../services/guestGrant.service"));
class EventService {
    async getAllEvents(userContext) {
        let whereClause = {};
        if (userContext?.role === "GUEST") {
            const empId = userContext.employeeId ? BigInt(userContext.employeeId) : undefined;
            const { isGlobal, departmentIds } = await guestGrant_service_1.default.getGuestPermittedDepartmentIds(empId);
            if (isGlobal) {
                whereClause = {};
            }
            else if (departmentIds.length > 0) {
                whereClause = {
                    OR: [
                        { departmentId: null },
                        { departmentId: { in: departmentIds } },
                    ],
                };
            }
            else {
                whereClause = { departmentId: null };
            }
        }
        else if (!userContext || userContext.role !== "SUPER_ADMIN") {
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
        // Dispatch Notifications to target audience
        try {
            const notificationService = (await Promise.resolve().then(() => __importStar(require("../notification/notification.service")))).default;
            await notificationService.notifyCalendarEvent({
                eventId: created.id,
                title: created.title,
                eventDate: created.eventDate,
                eventType: created.eventType,
                courseId: created.courseId,
                departmentId: created.departmentId,
                action: "CREATED",
                actorId: data.creatorId ? BigInt(data.creatorId) : undefined,
            });
        }
        catch (err) {
            console.error("Failed to trigger calendar event creation notification:", err);
        }
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
        try {
            const notificationService = (await Promise.resolve().then(() => __importStar(require("../notification/notification.service")))).default;
            await notificationService.notifyCalendarEvent({
                eventId: updated.id,
                title: updated.title,
                eventDate: updated.eventDate,
                eventType: updated.eventType,
                courseId: updated.courseId,
                departmentId: updated.departmentId,
                action: "UPDATED",
            });
        }
        catch (err) {
            console.error("Failed to trigger calendar event update notification:", err);
        }
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
        try {
            const notificationService = (await Promise.resolve().then(() => __importStar(require("../notification/notification.service")))).default;
            await notificationService.notifyCalendarEvent({
                eventId: deleted.id,
                title: deleted.title,
                eventDate: deleted.eventDate,
                eventType: deleted.eventType,
                courseId: deleted.courseId,
                departmentId: deleted.departmentId,
                action: "CANCELLED",
            });
        }
        catch (err) {
            console.error("Failed to trigger calendar event deletion notification:", err);
        }
        return (0, serializer_1.serialize)(deleted);
    }
}
exports.EventService = EventService;
exports.default = new EventService();
