import { Router } from "express";
import {
  deleteMyDocument,
  getMyDocument,
  listMyDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadDocumentFile } from "../middlewares/upload.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("student"), uploadDocumentFile, uploadDocument);
router.get("/my", authMiddleware, roleMiddleware("student"), listMyDocuments);
router.get("/:id", authMiddleware, roleMiddleware("student"), getMyDocument);
router.delete("/:id", authMiddleware, roleMiddleware("student"), deleteMyDocument);

export default router;
