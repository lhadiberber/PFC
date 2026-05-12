import { Router } from "express";
import { getMyProfile, updateMyProfile } from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/me", authMiddleware, roleMiddleware("student"), getMyProfile);
router.put("/me", authMiddleware, roleMiddleware("student"), updateMyProfile);

export default router;
