"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const event_controller_1 = require("../modules/event/event.controller");
const router = (0, express_1.Router)();
// Allow reading calendar events for all logged-in users with role/department context
router.get("/", auth_middleware_1.authenticate, event_controller_1.getEvents);
// Only SUPER_ADMIN and ADMIN can create, update, or delete events
router.post("/", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN"), event_controller_1.createEvent);
router.put("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN"), event_controller_1.updateEvent);
router.delete("/:id", auth_middleware_1.authenticate, (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN"), event_controller_1.deleteEvent);
exports.default = router;
