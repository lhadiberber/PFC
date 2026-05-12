import { apiRequest } from "./authService";

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
