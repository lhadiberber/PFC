import { Router } from "express";
import {
  createAdminController,
  getSuperAdminDashboard,
  listAdmins,
  listUsers,
  updateAdminController,
  updateAdminStatusController,
  updateUserRoleController,
  updateUserStatusController,
} from "../controllers/superAdmin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();
const onlySuperAdmin = roleMiddleware("super_admin");

router.use(authMiddleware, onlySuperAdmin);

router.get("/dashboard", getSuperAdminDashboard);
router.get("/admins", listAdmins);
router.post("/admins", createAdminController);
router.patch("/admins/:id/status", updateAdminStatusController);
router.patch("/admins/:id", updateAdminController);
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRoleController);
router.patch("/users/:id/status", updateUserStatusController);

export default router;
