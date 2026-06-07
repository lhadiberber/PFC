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
import {
  createSelectionRuleController,
  deleteSelectionRuleController,
  listSelectionRules,
  updateSelectionRuleController,
} from "../controllers/selectionRule.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();
const adminOrSuperAdmin = roleMiddleware("admin", "super_admin");

router.get("/dashboard", authMiddleware, adminOrSuperAdmin, getAdminDashboard);
router.get("/applications", authMiddleware, adminOrSuperAdmin, listAdminApplications);
router.get("/applications/:id", authMiddleware, adminOrSuperAdmin, getAdminApplication);
router.patch(
  "/applications/:id/status",
  authMiddleware,
  adminOrSuperAdmin,
  updateAdminApplicationStatusController
);
router.get("/documents", authMiddleware, adminOrSuperAdmin, listAdminDocuments);
router.patch(
  "/documents/:id/status",
  authMiddleware,
  adminOrSuperAdmin,
  updateAdminDocumentStatusController
);
router.get("/documents/:id", authMiddleware, adminOrSuperAdmin, getAdminDocument);
router.get("/students", authMiddleware, adminOrSuperAdmin, listAdminStudents);
router.get("/students/:id", authMiddleware, adminOrSuperAdmin, getAdminStudent);
router.get("/overview", authMiddleware, adminOrSuperAdmin, getAdminOverview);
router.get("/selection-rules", authMiddleware, adminOrSuperAdmin, listSelectionRules);
router.post("/selection-rules", authMiddleware, adminOrSuperAdmin, createSelectionRuleController);
router.put("/selection-rules/:id", authMiddleware, adminOrSuperAdmin, updateSelectionRuleController);
router.delete("/selection-rules/:id", authMiddleware, adminOrSuperAdmin, deleteSelectionRuleController);

export default router;
