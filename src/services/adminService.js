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
