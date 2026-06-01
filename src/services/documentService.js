import {
  API_BASE_URL,
  ApiError,
  apiRequest,
  getAuthToken,
  readJsonResponse,
} from "./authService";

export async function uploadStudentDocument({ typeDocument, file, applicationId }) {
  const token = getAuthToken();

  if (!token) {
    throw new ApiError("Session absente ou expirée. Veuillez vous reconnecter.", 401);
  }

  const formData = new FormData();
  formData.append("type_document", typeDocument);
  formData.append("document", file);

  if (applicationId) {
    formData.append("application_id", applicationId);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/documents`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (_error) {
    throw new ApiError("Backend indisponible. Vérifiez que le serveur est lancé.");
  }

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Impossible de déposer le document.",
      response.status,
      payload
    );
  }

  if (!payload?.document) {
    throw new ApiError("Réponse invalide du serveur.", response.status, payload);
  }

  return payload.document;
}

export async function listMyDocuments() {
  const response = await apiRequest("/documents/my");
  return response.documents || [];
}

export async function deleteStudentDocument(id) {
  if (!id) {
    return null;
  }

  const response = await apiRequest(`/documents/${id}`, {
    method: "DELETE",
  });

  return response.document || null;
}
