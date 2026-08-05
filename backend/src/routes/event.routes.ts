import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../modules/event/event.controller";

const router = Router();

// Allow reading calendar events for all logged-in users with role/department context
router.get("/", authenticate, getEvents);

// Only SUPER_ADMIN and ADMIN can create, update, or delete events
router.post("/", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), createEvent);
router.put("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), updateEvent);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), deleteEvent);

export default router;
