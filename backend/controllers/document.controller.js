import { unlink } from "node:fs/promises";
import {
  applicationBelongsToStudent,
  createDocument,
  deleteDocumentByIdForStudent,
  findDocumentByIdForStudent,
  findDocumentsByStudentId,
} from "../models/document.model.js";
import {
  getUploadRelativePath,
  resolveUploadedFilePath,
} from "../middlewares/upload.middleware.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function validateDocumentPayload(payload) {
  const errors = {};

  if (!normalizeText(payload.type_document)) {
    errors.type_document = "Le type de document est obligatoire.";
  }

  if (!normalizeText(payload.nom_fichier)) {
    errors.nom_fichier = "Le nom du fichier est obligatoire.";
  }

  if (!normalizeText(payload.chemin_fichier)) {
    errors.chemin_fichier = "Le chemin du fichier est obligatoire.";
  }

  return errors;
}

function buildDocumentPayload(request) {
  return {
    application_id: request.body.application_id,
    type_document: request.body.type_document,
    nom_fichier: request.file?.originalname,
    chemin_fichier: request.file ? getUploadRelativePath(request.file.path) : "",
  };
}

async function removeUploadedFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await unlink(resolveUploadedFilePath(filePath));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Impossible de supprimer le fichier upload:", error.message);
    }
  }
}

async function ensureOptionalApplicationAccess(applicationId, studentId, response) {
  if (!applicationId) {
    return true;
  }

  const hasAccess = await applicationBelongsToStudent(applicationId, studentId);

  if (!hasAccess) {
    response.status(404).json({
      success: false,
      message: "Candidature introuvable pour ce compte etudiant.",
    });
  }

  return hasAccess;
}

export async function uploadDocument(request, response, next) {
  const uploadedFilePath = request.file ? getUploadRelativePath(request.file.path) : "";

  try {
    if (!request.file) {
      response.status(400).json({
        success: false,
        message: "Le fichier du document est obligatoire.",
      });
      return;
    }

    const documentPayload = buildDocumentPayload(request);
    const errors = validateDocumentPayload(documentPayload);

    if (Object.keys(errors).length > 0) {
      await removeUploadedFile(uploadedFilePath);

      response.status(400).json({
        success: false,
        message: "Certaines informations du document sont obligatoires.",
        errors,
      });
      return;
    }

    const hasApplicationAccess = await ensureOptionalApplicationAccess(
      documentPayload.application_id,
      request.user.id,
      response
    );

    if (!hasApplicationAccess) {
      await removeUploadedFile(uploadedFilePath);
      return;
    }

    const document = await createDocument(request.user.id, documentPayload);

    response.status(201).json({
      success: true,
      message: "Document enregistre avec succes.",
      document,
    });
  } catch (error) {
    await removeUploadedFile(uploadedFilePath);
    next(error);
  }
}

export async function listMyDocuments(request, response, next) {
  try {
    const documents = await findDocumentsByStudentId(request.user.id);

    response.json({
      success: true,
      documents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyDocument(request, response, next) {
  try {
    const document = await findDocumentByIdForStudent(request.params.id, request.user.id);

    if (!document) {
      response.status(404).json({
        success: false,
        message: "Document introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      document,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyDocument(request, response, next) {
  try {
    const document = await deleteDocumentByIdForStudent(request.params.id, request.user.id);

    if (!document) {
      response.status(404).json({
        success: false,
        message: "Document introuvable.",
      });
      return;
    }

    await removeUploadedFile(document.chemin_fichier);

    response.json({
      success: true,
      message: "Document supprime.",
      document,
    });
  } catch (error) {
    next(error);
  }
}
