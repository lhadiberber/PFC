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

  if (!normalizeText(payload.universite)) {
    errors.universite = "L'universite est obligatoire.";
  }

  if (!normalizeText(payload.formation)) {
    errors.formation = "La formation est obligatoire.";
  }

  if (!normalizeText(payload.niveau)) {
    errors.niveau = "Le niveau est obligatoire.";
  }

  if (!normalizeText(payload.motivation)) {
    errors.motivation = "La motivation est obligatoire.";
  }

  return errors;
}

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
