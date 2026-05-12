import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
export const DOCUMENT_UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

if (!fs.existsSync(DOCUMENT_UPLOAD_DIR)) {
  fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
}

function createUploadError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function fileFilter(_request, file, callback) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(createUploadError("Format de fichier non accepte. Utilisez PDF, JPG, JPEG ou PNG."));
    return;
  }

  callback(null, true);
}

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, DOCUMENT_UPLOAD_DIR);
  },
  filename(_request, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

export const uploadDocumentFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE,
  },
}).single("document");

export function getUploadRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}

export function resolveUploadedFilePath(relativePath) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const uploadDir = DOCUMENT_UPLOAD_DIR.toLowerCase();
  const normalizedPath = absolutePath.toLowerCase();

  if (!normalizedPath.startsWith(`${uploadDir}${path.sep}`)) {
    throw createUploadError("Chemin de fichier upload invalide.");
  }

  return absolutePath;
}
