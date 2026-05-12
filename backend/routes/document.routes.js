import { Router } from "express";
import {
  deleteMyDocument,
  getMyDocument,
  listMyDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("student"), uploadDocument);
router.get("/my", authMiddleware, roleMiddleware("student"), listMyDocuments);
router.get("/:id", authMiddleware, roleMiddleware("student"), getMyDocument);
router.delete("/:id", authMiddleware, roleMiddleware("student"), deleteMyDocument);

export default router;
