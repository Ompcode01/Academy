import { Router } from "express";
import { testPrismaConnection } from "../controllers/prisma-test.controller";

const router = Router();

router.get("/", testPrismaConnection);

export default router;