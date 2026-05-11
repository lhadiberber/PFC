import {
  createApplication,
  findApplicationById,
  findApplicationsByUserId,
} from "../models/application.model.js";

export async function listApplications(request, response, next) {
  try {
    const applications = await findApplicationsByUserId(request.user.id);
    response.json({ success: true, applications });
  } catch (error) {
    next(error);
  }
}

export async function getApplication(request, response, next) {
  try {
    const application = await findApplicationById(request.params.id);

    if (!application || application.user_id !== request.user.id) {
      response.status(404).json({
        success: false,
        message: "Candidature introuvable.",
      });
      return;
    }

    response.json({ success: true, application });
  } catch (error) {
    next(error);
  }
}

export async function submitApplication(request, response, next) {
  try {
    const application = await createApplication(request.user.id, request.body);
    response.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
}
