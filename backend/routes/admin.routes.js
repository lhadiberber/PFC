import { Router } from "express";
import {
  getAdminApplication,
  getAdminDashboard,
  getAdminOverview,
  getAdminStudent,
  listAdminApplications,
  listAdminStudents,
  updateAdminApplicationStatusController,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/dashboard", authMiddleware, roleMiddleware("admin"), getAdminDashboard);
router.get("/applications", authMiddleware, roleMiddleware("admin"), listAdminApplications);
router.get("/applications/:id", authMiddleware, roleMiddleware("admin"), getAdminApplication);
router.patch(
  "/applications/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateAdminApplicationStatusController
);
router.get("/students", authMiddleware, roleMiddleware("admin"), listAdminStudents);
router.get("/students/:id", authMiddleware, roleMiddleware("admin"), getAdminStudent);
router.get("/overview", authMiddleware, roleMiddleware("admin"), getAdminOverview);

export default router;
