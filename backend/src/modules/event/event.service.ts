import prisma from "../../config/prisma";
import { serialize } from "../../utils/serializer";

export class EventService {
  async getAllEvents() {
    const events = await prisma.event.findMany({
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

    return serialize(deleted);
  }
}

export default new EventService();
