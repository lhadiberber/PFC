import { Router } from "express";
import { getAdminOverview } from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/overview", authMiddleware, roleMiddleware("admin"), getAdminOverview);

export default router;
