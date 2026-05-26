import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { registerRateLimit } from "../middlewares/registerRateLimit.middleware.js";

const router = Router();

router.post("/register", registerRateLimit, register);
router.post("/login", login);
router.get("/me", authMiddleware, me);

export default router;
