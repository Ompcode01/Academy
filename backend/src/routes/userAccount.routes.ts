import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

import {

createUserAccount,
getUserAccounts,
getUserAccountById,
deleteUserAccount

} from "../controllers/userAccount.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  createUserAccount
);

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getUserAccounts
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getUserAccountById
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  deleteUserAccount
);

export default router;