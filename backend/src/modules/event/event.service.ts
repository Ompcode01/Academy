import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";
import guestGrantService from "../../services/guestGrant.service";

export class EventService {
  async getAllEvents(userContext?: { role?: string; employeeId?: bigint | null; departmentId?: bigint | null }) {
    let whereClause: any = {};

    if (userContext?.role === "GUEST") {
      const empId = userContext.employeeId ? BigInt(userContext.employeeId) : undefined;
      const { isGlobal, departmentIds } = await guestGrantService.getGuestPermittedDepartmentIds(empId);

      if (isGlobal) {
        whereClause = {};
      } else if (departmentIds.length > 0) {
        whereClause = {
          OR: [
            { departmentId: null },
            { departmentId: { in: departmentIds } },
          ],
        };
      } else {
        whereClause = { departmentId: null };
      }
    } else if (!userContext || userContext.role !== "SUPER_ADMIN") {
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

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        department: {
          select: { id: true, departmentName: true, departmentCode: true },
        },
      },
      orderBy: { eventDate: "asc" },
    });
    return serialize(events);
  }

  async createEvent(data: {
    title: string;
    description?: string;
    eventDate: Date;
    eventTime?: string;
    url?: string;
    eventType?: string;
    courseId?: bigint | null;
    departmentId?: bigint | null;
    creatorId?: bigint | null;
    creatorName?: string;
  }) {
    const created = await prisma.event.create({
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
      } as any,
    });

    // Automatically emit Audit Log entry
    await prisma.auditLog.create({
      data: {
        actorName: data.creatorName || "System Admin",
        action: "Calendar Event Created",
        detail: `Created event '${data.title}' scheduled for ${data.eventDate.toISOString().split("T")[0]}`,
        type: "course",
      },
    });

    // Dispatch Notifications to target audience
    try {
      const notificationService = (await import("../notification/notification.service")).default;
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
    } catch (err) {
      console.error("Failed to trigger calendar event creation notification:", err);
    }

    return serialize(created);
  }

  async updateEvent(
    id: bigint,
    data: {
      title?: string;
      description?: string;
      eventDate?: Date;
      eventTime?: string;
      url?: string;
      eventType?: string;
    },
    actorName?: string
  ) {
    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.eventDate ? { eventDate: data.eventDate } : {}),
        ...(data.eventTime !== undefined ? { eventTime: data.eventTime || null } : {}),
        ...(data.url !== undefined ? { url: data.url || null } : {}),
        ...(data.eventType ? { eventType: data.eventType } : {}),
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        actorName: actorName || "System Admin",
        action: "Calendar Event Updated",
        detail: `Updated event '${updated.title}'`,
        type: "course",
      },
    });

    try {
      const notificationService = (await import("../notification/notification.service")).default;
      await notificationService.notifyCalendarEvent({
        eventId: updated.id,
        title: updated.title,
        eventDate: updated.eventDate,
        eventType: updated.eventType,
        courseId: updated.courseId,
        departmentId: updated.departmentId,
        action: "UPDATED",
      });
    } catch (err) {
      console.error("Failed to trigger calendar event update notification:", err);
    }

    return serialize(updated);
  }

  async deleteEvent(id: bigint, actorName?: string) {
    const deleted = await prisma.event.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorName: actorName || "System Admin",
        action: "Calendar Event Deleted",
        detail: `Deleted event '${deleted.title}'`,
        type: "course",
      },
    });

    try {
      const notificationService = (await import("../notification/notification.service")).default;
      await notificationService.notifyCalendarEvent({
        eventId: deleted.id,
        title: deleted.title,
        eventDate: deleted.eventDate,
        eventType: deleted.eventType,
        courseId: deleted.courseId,
        departmentId: deleted.departmentId,
        action: "CANCELLED",
      });
    } catch (err) {
      console.error("Failed to trigger calendar event deletion notification:", err);
    }

    return serialize(deleted);
  }
}

export default new EventService();
