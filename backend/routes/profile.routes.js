import { Router } from "express";
import { getProfile, saveProfile } from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("student"), getProfile);
router.put("/", authMiddleware, roleMiddleware("student"), saveProfile);

export default router;
