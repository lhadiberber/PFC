import { Router } from "express";
import { getStudentDashboard } from "../controllers/student.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/dashboard", authMiddleware, roleMiddleware("student"), getStudentDashboard);

export default router;
