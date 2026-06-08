import { ApiError, apiRequest, getApiFallbackUrls, getAuthToken } from "./authService";

export async function getAdminDashboard() {
  const response = await apiRequest("/admin/dashboard");

  return {
    stats: response.stats || {},
    applications: response.applications || [],
    recentApplications: response.recentApplications || [],
    statusDistribution: response.statusDistribution || {
      enAttente: 0,
      acceptees: 0,
      refusees: 0,
    },
    documentsToReview: response.documentsToReview || {
      total: 0,
      items: [],
    },
    recentActivity: response.recentActivity || [],
  };
}

export async function listAdminApplications() {
  const response = await apiRequest("/admin/applications");
  return response.applications || [];
}

export async function getAdminApplication(id) {
  const response = await apiRequest(`/admin/applications/${id}`);
  return response.application || null;
}

export async function updateAdminApplicationStatus(id, payload) {
  const response = await apiRequest(`/admin/applications/${id}/status`, {
    method: "PATCH",
    body: payload,
  });

  return response.application || null;
}

export async function listAdminStudents() {
  const response = await apiRequest("/admin/students");
  return response.students || [];
}

export async function getAdminStudent(id) {
  const response = await apiRequest(`/admin/students/${id}`);
  return response.student || null;
}

export async function listAdminDocuments() {
  const response = await apiRequest("/admin/documents");
  return response.documents || [];
}

export async function getAdminDocument(id) {
  const response = await apiRequest(`/admin/documents/${id}`);
  return response.document || null;
}

export async function updateAdminDocumentStatus(id, payload) {
  const response = await apiRequest(`/admin/documents/${id}/status`, {
    method: "PATCH",
    body: payload,
  });

  return response.document || null;
}

export async function listSelectionRules() {
  const response = await apiRequest("/admin/selection-rules");
  return response.rules || [];
}

export async function createSelectionRule(ruleData) {
  const response = await apiRequest("/admin/selection-rules", {
    method: "POST",
    body: ruleData,
  });

  return response.rule || null;
}

export async function updateSelectionRule(id, ruleData) {
  const response = await apiRequest(`/admin/selection-rules/${id}`, {
    method: "PUT",
    body: ruleData,
  });

  return response.rule || null;
}

export async function deleteSelectionRule(id) {
  await apiRequest(`/admin/selection-rules/${id}`, {
    method: "DELETE",
  });
}

function normalizeEndpoint(endpoint) {
  const normalizedEndpoint = String(endpoint || "").trim();
  return normalizedEndpoint.startsWith("/") ? normalizedEndpoint : `/${normalizedEndpoint}`;
}

function readFileNameFromDisposition(disposition, fallback) {
  const match = String(disposition || "").match(/filename="?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export async function fetchAdminDocumentFile(id, mode = "view") {
  const endpoint = normalizeEndpoint(`/admin/documents/${id}/${mode}`);
  const token = getAuthToken();
  const urls = getApiFallbackUrls();
  let lastError = null;

  for (const baseUrl of urls) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        let message = "Fichier introuvable ou inaccessible.";
        try {
          const payload = await response.json();
          message = payload?.message || message;
        } catch {
          // La réponse peut être un flux ou une erreur non JSON.
        }
        throw new ApiError(message, response.status);
      }

      const blob = await response.blob();
      const fileName = readFileNameFromDisposition(
        response.headers.get("Content-Disposition"),
        `document-${id}`
      );

      return { blob, fileName, objectUrl: URL.createObjectURL(blob) };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError || new ApiError("Fichier introuvable ou inaccessible.", 0);
}
