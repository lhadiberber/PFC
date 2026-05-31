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
      lieuNaiss: apiProfile.lieu_naissance || currentPersonal.lieuNaiss || "",
      sexe: apiProfile.sexe || currentPersonal.sexe || "",
      nationalite: apiProfile.nationalite || "",
      email: apiProfile.email || "",
      telephone: apiProfile.telephone || "",
      adresse: apiProfile.adresse || "",
      wilaya: apiProfile.wilaya || currentPersonal.wilaya || "",
      commune: apiProfile.commune || currentPersonal.commune || "",
    },
    academic: {
      ...currentAcademic,
      anneeBac: apiProfile.annee_bac || apiProfile.annee_obtention || "",
      serieBac: apiProfile.serie_bac || apiProfile.diplome_actuel || "",
      moyenneBac: apiProfile.moyenne_bac || apiProfile.moyenne || "",
      mentionBac: apiProfile.mention_bac || "",
      numeroInscriptionBac: apiProfile.numero_inscription_bac || "",
      lyceeOrigine: apiProfile.lycee_origine || apiProfile.etablissement || "",
      wilayaLycee: apiProfile.wilaya_lycee || "",
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
    lieu_naissance: personalForm.lieuNaiss,
    sexe: personalForm.sexe,
    nationalite: personalForm.nationalite,
    adresse: personalForm.adresse,
    wilaya: personalForm.wilaya,
    commune: personalForm.commune,
    annee_bac: academicForm.anneeBac,
    serie_bac: academicForm.serieBac,
    moyenne_bac: academicForm.moyenneBac,
    mention_bac: academicForm.mentionBac,
    numero_inscription_bac: academicForm.numeroInscriptionBac,
    lycee_origine: academicForm.lyceeOrigine,
    wilaya_lycee: academicForm.wilayaLycee,
    diplome_actuel: academicForm.serieBac,
    etablissement: academicForm.lyceeOrigine,
    specialite_actuelle: academicForm.serieBac,
    annee_obtention: academicForm.anneeBac,
    moyenne: academicForm.moyenneBac,
  };
}
