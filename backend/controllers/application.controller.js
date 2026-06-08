import {
  createApplication,
  findApplicationByIdForStudent,
  findApplicationsByStudentId,
} from "../models/application.model.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function validateApplicationPayload(payload) {
  const errors = {};

  if (!normalizeText(payload.domaine)) {
    errors.domaine = "Le domaine d'études est obligatoire.";
  }

  if (!normalizeText(payload.filiere || payload.formation)) {
    errors.filiere = "La filière est obligatoire.";
  }

  if (!normalizeText(payload.annee_universitaire)) {
    errors.annee_universitaire = "L'année universitaire est obligatoire.";
  }

  if (!normalizeText(payload.etablissement || payload.universite)) {
    errors.etablissement = "L'établissement est obligatoire.";
  }

  if (!normalizeText(payload.faculte_institut)) {
    errors.faculte_institut = "La faculté ou l'institut est obligatoire.";
  }

  if (!normalizeText(payload.wilaya_etablissement)) {
    errors.wilaya_etablissement = "La wilaya de l'établissement est obligatoire.";
  }

  if (!normalizeText(payload.type_etablissement)) {
    errors.type_etablissement = "Le type d'établissement est obligatoire.";
  }

  return errors;
}

// creation d'une candidature etudiante
export async function submitApplication(request, response, next) {
  try {
    const errors = validateApplicationPayload(request.body);

    if (Object.keys(errors).length > 0) {
      response.status(400).json({
        success: false,
        message: "Certaines informations de candidature sont obligatoires.",
        errors,
      });
      return;
    }

    const application = await createApplication(request.user.id, request.body);

    response.status(201).json({
      success: true,
      message: "Candidature deposee avec succes.",
      application,
    });
  } catch (error) {
    next(error);
  }
}

// liste des candidatures de l'etudiant connecte
export async function listMyApplications(request, response, next) {
  try {
    const applications = await findApplicationsByStudentId(request.user.id);

    response.json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
}

// detail d'une candidature appartenant a l'etudiant
export async function getMyApplication(request, response, next) {
  try {
    const application = await findApplicationByIdForStudent(request.params.id, request.user.id);

    if (!application) {
      response.status(404).json({
        success: false,
        message: "Candidature introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
}
