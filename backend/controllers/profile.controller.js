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
  const anneeObtention = normalizeText(payload.annee_obtention);
  const moyenne = normalizeText(payload.moyenne);

  if (!normalizeText(payload.nom)) errors.nom = "Le nom est obligatoire.";
  if (!normalizeText(payload.prenom)) errors.prenom = "Le prenom est obligatoire.";
  if (!email) {
    errors.email = "L'email est obligatoire.";
  } else if (!isValidEmail(email)) {
    errors.email = "Format d'email invalide.";
  }

  if (anneeObtention && !/^\d{4}$/.test(anneeObtention)) {
    errors.annee_obtention = "L'annee d'obtention doit contenir 4 chiffres.";
  }

  if (moyenne) {
    const numericAverage = Number(moyenne);

    if (Number.isNaN(numericAverage) || numericAverage < 0 || numericAverage > 20) {
      errors.moyenne = "La moyenne doit etre comprise entre 0 et 20.";
    }
  }

  return errors;
}

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
      message: "Profil etudiant mis a jour.",
      profile,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      response.status(409).json({
        success: false,
        message: "Cette adresse email est deja utilisee.",
      });
      return;
    }

    next(error);
  }
}
