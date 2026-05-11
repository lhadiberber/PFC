import { findProfileByUserId, upsertProfile } from "../models/profile.model.js";

export async function getProfile(request, response, next) {
  try {
    const profile = await findProfileByUserId(request.user.id);
    response.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
}

export async function saveProfile(request, response, next) {
  try {
    const profile = await upsertProfile(request.user.id, request.body);
    response.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
}
