import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import eventService from "./event.service";

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userContext = req.user
      ? {
          role: req.user.role,
          employeeId: req.user.employeeId ? BigInt(req.user.employeeId) : null,
          departmentId: req.user.departmentId ? BigInt(req.user.departmentId) : null,
        }
      : undefined;

    const events = await eventService.getAllEvents(userContext);
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, eventDate, eventTime, url, eventType, courseId, departmentId } = req.body;
    if (!title || !eventDate) {
      return res.status(400).json({ success: false, message: "Title and Event Date are required." });
    }

    const creatorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    const creatorId = req.user?.employeeId ? BigInt(req.user.employeeId) : null;

    // Admin inherits their department automatically unless explicit
    let targetDeptId: bigint | null = null;
    if (departmentId && departmentId !== "all" && departmentId !== "global") {
      targetDeptId = BigInt(departmentId);
    } else if (req.user?.role === "ADMIN" && req.user.departmentId) {
      targetDeptId = BigInt(req.user.departmentId);
    }

    const event = await eventService.createEvent({
      title,
      description,
      eventDate: new Date(eventDate),
      eventTime,
      url,
      eventType: eventType || "site",
      courseId: courseId ? BigInt(courseId) : null,
      departmentId: targetDeptId,
      creatorId,
      creatorName,
    });

    res.json({ success: true, message: "Event created successfully", data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(String(req.params.id));
    const { title, description, eventDate, eventTime, url, eventType } = req.body;
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";

    const updated = await eventService.updateEvent(
      id,
      {
        title,
        description,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        eventTime,
        url,
        eventType,
      },
      actorName
    );

    res.json({ success: true, message: "Event updated successfully", data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(String(req.params.id));
    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";

    const deleted = await eventService.deleteEvent(id, actorName);
    res.json({ success: true, message: "Event deleted successfully", data: deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
