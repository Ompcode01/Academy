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

export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = BigInt(rawId);
    const event = await eventService.getEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const parseCalendarDateNoonUTC = (dateInput: any): Date => {
  if (!dateInput) return new Date();
  const s = typeof dateInput === "string" ? dateInput : new Date(dateInput).toISOString();
  const datePart = s.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(Date.UTC(y, m, d, 12, 0, 0));
    }
  }
  return new Date(dateInput);
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, eventDate, eventTime, url, eventType, courseId, departmentId, enrollmentType, targetUserIds, certificateTemplateId } = req.body;
    if (!title || !eventDate) {
      return res.status(400).json({ success: false, message: "Title and Event Date are required." });
    }

    const parsedEventDate = parseCalendarDateNoonUTC(eventDate);

    // Past date & time validation (timezone-safe for server vs client offsets)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    yesterday.setHours(0, 0, 0, 0);

    if (parsedEventDate < yesterday) {
      return res.status(400).json({ success: false, message: "Event date cannot be in the past." });
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
      eventDate: parsedEventDate,
      eventTime,
      url,
      eventType: eventType || "site",
      courseId: courseId ? BigInt(courseId) : null,
      departmentId: targetDeptId,
      creatorId,
      creatorName,
      enrollmentType,
      targetUserIds: Array.isArray(targetUserIds) ? JSON.stringify(targetUserIds) : targetUserIds,
      certificateTemplateId,
    });

    res.json({ success: true, message: "Event created successfully", data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(String(req.params.id));
    const { attendanceRecords } = req.body;
    if (!Array.isArray(attendanceRecords)) {
      return res.status(400).json({ success: false, message: "attendanceRecords array is required." });
    }

    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";
    const updated = await eventService.markAttendance(id, attendanceRecords, actorName);
    res.json({ success: true, message: "Session attendance marked successfully", data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const id = BigInt(String(req.params.id));
    const { title, description, eventDate, eventTime, url, eventType, certificateTemplateId } = req.body;

    let parsedEventDate: Date | undefined = undefined;
    if (eventDate) {
      parsedEventDate = parseCalendarDateNoonUTC(eventDate);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterday.setHours(0, 0, 0, 0);

      if (parsedEventDate < yesterday) {
        return res.status(400).json({ success: false, message: "Event date cannot be in the past." });
      }
    }

    const actorName = req.user ? `${req.user.username} (${req.user.role || 'USER'})` : "System User";

    const updated = await eventService.updateEvent(
      id,
      {
        title,
        description,
        eventDate: parsedEventDate,
        eventTime,
        url,
        eventType,
        certificateTemplateId,
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
