import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent, markAttendance } from "../modules/event/event.controller";

const router = Router();

// Allow reading calendar events for all logged-in users with role/department context
router.get("/", authenticate, getEvents);
router.get("/:id", authenticate, getEventById);

// Allow SUPER_ADMIN, ADMIN, and TEACHER to create, update, delete events & mark attendance
router.post("/", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"), createEvent);
router.post("/:id/attendance", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"), markAttendance);
router.put("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"), updateEvent);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"), deleteEvent);

export default router;
