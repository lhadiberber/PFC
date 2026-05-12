import { apiRequest } from "./authService";

export async function fetchMyProfile() {
  const response = await apiRequest("/profile/me");
  return response.profile;
}

export async function saveMyProfile(profile) {
  const response = await apiRequest("/profile/me", {
    method: "PUT",
    body: profile,
  });

  return response.profile;
}

export function profileFromApi(apiProfile = {}, currentPersonal = {}, currentAcademic = {}) {
  return {
    personal: {
      ...currentPersonal,
      nom: apiProfile.nom || "",
      prenom: apiProfile.prenom || "",
      dateNaiss: apiProfile.date_naissance || currentPersonal.dateNaiss || "",
      nationalite: apiProfile.nationalite || "",
      email: apiProfile.email || "",
      telephone: apiProfile.telephone || "",
      adresse: apiProfile.adresse || "",
    },
    academic: {
      ...currentAcademic,
      diplomeActuel: apiProfile.diplome_actuel || "",
      etablissementActuel: apiProfile.etablissement || "",
      specialiteActuelle: apiProfile.specialite_actuelle || "",
      anneeBac: apiProfile.annee_obtention || "",
      moyenneBac: apiProfile.moyenne || "",
    },
  };
}

export function profileToApi(personalForm, academicForm) {
  return {
    nom: personalForm.nom,
    prenom: personalForm.prenom,
    email: personalForm.email,
    telephone: personalForm.telephone,
    date_naissance: personalForm.dateNaiss,
    nationalite: personalForm.nationalite,
    adresse: personalForm.adresse,
    diplome_actuel: academicForm.diplomeActuel,
    etablissement: academicForm.etablissementActuel,
    specialite_actuelle: academicForm.specialiteActuelle,
    annee_obtention: academicForm.anneeBac,
    moyenne: academicForm.moyenneBac,
  };
}
