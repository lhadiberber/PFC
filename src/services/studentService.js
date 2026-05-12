import { apiRequest } from "./authService";

export async function getStudentDashboard() {
  const response = await apiRequest("/student/dashboard");

  return {
    user: response.user || null,
    profile: response.profile || null,
    applications: response.applications || null,
    documents: response.documents || null,
    globalStatus: response.globalStatus || "",
    recentActivity: response.recentActivity || [],
  };
}
