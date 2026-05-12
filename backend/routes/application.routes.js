import { Router } from "express";
import {
  getMyApplication,
  listMyApplications,
  submitApplication,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("student"), submitApplication);
router.get("/my", authMiddleware, roleMiddleware("student"), listMyApplications);
router.get("/:id", authMiddleware, roleMiddleware("student"), getMyApplication);

export default router;
