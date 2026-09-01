import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent, markAttendance } from "../modules/event/event.controller";

const router = Router();

// Allow reading calendar events for all logged-in users with role/department context
router.get("/", authenticate, getEvents);
router.get("/:id", authenticate, getEventById);

// Allow SUPER_ADMIN and ADMIN ONLY to create, update, delete events & mark attendance
router.post("/", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), createEvent);
router.post("/:id/attendance", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), markAttendance);
router.put("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), updateEvent);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), deleteEvent);

export default router;
