import { apiRequest } from "./authService";

export async function createApplication(application) {
  const response = await apiRequest("/applications", {
    method: "POST",
    body: {
      universite: application.universite,
      formation: application.formation,
      niveau: application.niveau,
      motivation: application.motivation,
    },
  });

  return response.application;
}

export async function listMyApplications() {
  const response = await apiRequest("/applications/my");
  return response.applications || [];
}

export async function getApplicationById(id) {
  const response = await apiRequest(`/applications/${id}`);
  return response.application;
}
