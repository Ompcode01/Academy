"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const guestGrant_controller_1 = require("../controllers/guestGrant.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// List grants (SA, Admin, Guest)
router.get("/", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN", "GUEST"), guestGrant_controller_1.getGuestGrants);
// Create grant (SA, Admin)
router.post("/", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN"), guestGrant_controller_1.createGuestGrant);
// Revoke grant (SA, Admin)
router.delete("/:id", (0, role_middleware_1.authorizeRoles)("SUPER_ADMIN", "ADMIN"), guestGrant_controller_1.revokeGuestGrant);
exports.default = router;
