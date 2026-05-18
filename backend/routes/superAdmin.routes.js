import { Router } from "express";
import {
  createAdminController,
  listAdmins,
  updateAdminController,
  updateAdminStatusController,
} from "../controllers/superAdmin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();
const onlySuperAdmin = roleMiddleware("super_admin");

router.use(authMiddleware, onlySuperAdmin);

router.get("/admins", listAdmins);
router.post("/admins", createAdminController);
router.patch("/admins/:id/status", updateAdminStatusController);
router.patch("/admins/:id", updateAdminController);

export default router;
