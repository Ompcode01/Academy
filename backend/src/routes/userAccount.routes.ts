import { Router } from "express";

import {

createUserAccount,
getUserAccounts,
getUserAccountById,
deleteUserAccount

} from "../controllers/userAccount.controller";

const router = Router();

router.post("/", createUserAccount);

router.get("/", getUserAccounts);

router.get("/:id", getUserAccountById);

router.delete("/:id", deleteUserAccount);

export default router;