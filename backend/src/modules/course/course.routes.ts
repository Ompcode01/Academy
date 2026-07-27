import { Router } from "express";
import { getCourses } from "./course.controller";

const router = Router();

router.get("/", getCourses);

export default router;