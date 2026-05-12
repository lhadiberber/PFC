import { Router } from "express";
import {
  getAdminApplication,
  getAdminDashboard,
  getAdminDocument,
  getAdminOverview,
  getAdminStudent,
  listAdminApplications,
  listAdminDocuments,
  listAdminStudents,
  updateAdminApplicationStatusController,
  updateAdminDocumentStatusController,
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
router.get("/documents", authMiddleware, roleMiddleware("admin"), listAdminDocuments);
router.patch(
  "/documents/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateAdminDocumentStatusController
);
router.get("/documents/:id", authMiddleware, roleMiddleware("admin"), getAdminDocument);
router.get("/students", authMiddleware, roleMiddleware("admin"), listAdminStudents);
router.get("/students/:id", authMiddleware, roleMiddleware("admin"), getAdminStudent);
router.get("/overview", authMiddleware, roleMiddleware("admin"), getAdminOverview);

export default router;
