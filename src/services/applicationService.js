import { apiRequest } from "./authService";

export async function createApplication(application) {
  const response = await apiRequest("/applications", {
    method: "POST",
    body: {
      domaine: application.domaine,
      filiere: application.filiere,
      annee_universitaire: application.annee_universitaire,
      niveau: application.niveau,
      etablissement: application.etablissement,
      faculte_institut: application.faculte_institut,
      wilaya_etablissement: application.wilaya_etablissement,
      type_etablissement: application.type_etablissement,
      universite: application.universite || application.etablissement,
      formation: application.formation || application.filiere,
      motivation: application.motivation || "",
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
