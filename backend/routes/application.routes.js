import { Router } from "express";
import {
  getApplication,
  listApplications,
  submitApplication,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("student"), listApplications);
router.post("/", authMiddleware, roleMiddleware("student"), submitApplication);
router.get("/:id", authMiddleware, roleMiddleware("student"), getApplication);

export default router;
