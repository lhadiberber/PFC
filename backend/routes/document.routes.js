import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { Router } from "express";
import {
  listDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();
const uploadDir = process.env.UPLOAD_DIR || "uploads";

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 80);

    callback(null, `${Date.now()}-${randomUUID()}-${baseName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get(
  "/:applicationId",
  authMiddleware,
  roleMiddleware("student", "admin"),
  listDocuments
);
router.post(
  "/:applicationId",
  authMiddleware,
  roleMiddleware("student"),
  upload.single("document"),
  uploadDocument
);

export default router;
