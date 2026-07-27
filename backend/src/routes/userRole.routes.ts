import { Router } from "express";

import {

assignRole,
getUserRoles,
getUserRoleById,
deleteUserRole

} from "../controllers/userRole.controller";

const router = Router();

router.post("/", assignRole);

router.get("/", getUserRoles);

router.get("/:id", getUserRoleById);

router.delete("/:id", deleteUserRole);

export default router;