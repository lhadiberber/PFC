import {
  findStudentProfileByUserId,
  upsertStudentProfile,
} from "../models/profile.model.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateProfilePayload(payload) {
  const errors = {};
  const email = normalizeText(payload.email);
  const anneeBac = normalizeText(payload.annee_bac || payload.annee_obtention);
  const moyenneBac = normalizeText(payload.moyenne_bac || payload.moyenne);
  const currentYear = new Date().getFullYear();

  if (!normalizeText(payload.nom)) errors.nom = "Le nom est obligatoire.";
  if (!normalizeText(payload.prenom)) errors.prenom = "Le prénom est obligatoire.";
  if (!normalizeText(payload.date_naissance)) {
    errors.date_naissance = "La date de naissance est obligatoire.";
  }
  if (!normalizeText(payload.telephone)) errors.telephone = "Le téléphone est obligatoire.";
  if (!normalizeText(payload.wilaya)) errors.wilaya = "La wilaya est obligatoire.";
  if (!normalizeText(payload.serie_bac)) errors.serie_bac = "La série du bac est obligatoire.";
  if (!normalizeText(payload.numero_inscription_bac)) {
    errors.numero_inscription_bac = "Le numéro d'inscription au bac est obligatoire.";
  }
  if (!email) {
    errors.email = "L'email est obligatoire.";
  } else if (!isValidEmail(email)) {
    errors.email = "Format d'email invalide.";
  }

  if (!anneeBac) {
    errors.annee_bac = "L'année du bac est obligatoire.";
  } else if (!/^\d{4}$/.test(anneeBac) || Number(anneeBac) < 1980 || Number(anneeBac) > currentYear + 1) {
    errors.annee_bac = "L'année du bac est invalide.";
  }

  if (!moyenneBac) {
    errors.moyenne_bac = "La moyenne générale est obligatoire.";
  } else {
    const numericAverage = Number(moyenneBac);

    if (Number.isNaN(numericAverage) || numericAverage < 0 || numericAverage > 20) {
      errors.moyenne_bac = "La moyenne doit être comprise entre 0 et 20.";
    }
  }

  return errors;
}

// lecture du profil de l'etudiant connecte
export async function getMyProfile(request, response, next) {
  try {
    const profile = await findStudentProfileByUserId(request.user.id);

    if (!profile) {
      response.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

// mise a jour du profil de l'etudiant
export async function updateMyProfile(request, response, next) {
  try {
    const errors = validateProfilePayload(request.body);

    if (Object.keys(errors).length > 0) {
      response.status(400).json({
        success: false,
        message: "Certaines informations du profil sont invalides.",
        errors,
      });
      return;
    }

    const profile = await upsertStudentProfile(request.user.id, request.body);

    response.json({
      success: true,
      message: "Profil mis à jour avec succès.",
      profile,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      response.status(409).json({
        success: false,
        message: "Cette adresse email est déjà utilisée.",
      });
      return;
    }

    next(error);
  }
}
