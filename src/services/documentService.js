import { API_BASE_URL, ApiError, apiRequest, getAuthToken } from "./authService";

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch (_error) {
    throw new ApiError("Reponse invalide du serveur.", response.status);
  }
}

export async function uploadStudentDocument({ typeDocument, file, applicationId }) {
  const token = getAuthToken();

  if (!token) {
    throw new ApiError("Session absente ou expiree. Veuillez vous reconnecter.", 401);
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
    throw new ApiError("Backend indisponible. Verifiez que le serveur est lance.");
  }

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Impossible de deposer le document.",
      response.status,
      payload
    );
  }

  if (!payload?.document) {
    throw new ApiError("Reponse invalide du serveur.", response.status, payload);
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
