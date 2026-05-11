import {
  createDocument,
  findDocumentsByApplicationId,
} from "../models/document.model.js";

export async function listDocuments(request, response, next) {
  try {
    const documents = await findDocumentsByApplicationId(request.params.applicationId);
    response.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
}

export async function uploadDocument(request, response, next) {
  try {
    if (!request.file) {
      response.status(400).json({
        success: false,
        message: "Aucun fichier recu.",
      });
      return;
    }

    const document = await createDocument(request.params.applicationId, {
      type: request.body.type || request.file.fieldname,
      originalName: request.file.originalname,
      fileName: request.file.filename,
      path: request.file.path,
      mimeType: request.file.mimetype,
      size: request.file.size,
    });

    response.status(201).json({ success: true, document });
  } catch (error) {
    next(error);
  }
}
