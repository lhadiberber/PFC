import {
  createSelectionRule,
  deleteSelectionRule,
  findSelectionRules,
  updateSelectionRule,
} from "../models/selectionRule.model.js";

function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRulePayload(body = {}) {
  return {
    filiere: String(body.filiere || "").trim(),
    moyenne_min: Number(body.moyenne_min || 0),
    series_acceptees: normalizeArrayInput(body.series_acceptees),
    documents_obligatoires: normalizeArrayInput(body.documents_obligatoires),
    university_scope: String(body.university_scope || "").trim(),
    assigned_department: String(body.assigned_department || "").trim(),
  };
}

function validateRulePayload(payload) {
  if (!payload.filiere) {
    return "La filière est obligatoire.";
  }

  if (!Number.isFinite(payload.moyenne_min) || payload.moyenne_min < 0 || payload.moyenne_min > 20) {
    return "La moyenne minimale doit être comprise entre 0 et 20.";
  }

  return "";
}

export async function listSelectionRules(request, response, next) {
  try {
    const rules = await findSelectionRules(request.user);
    response.json({ success: true, rules });
  } catch (error) {
    next(error);
  }
}

export async function createSelectionRuleController(request, response, next) {
  try {
    const payload = buildRulePayload(request.body);
    const validationMessage = validateRulePayload(payload);

    if (validationMessage) {
      response.status(400).json({ success: false, message: validationMessage });
      return;
    }

    const rule = await createSelectionRule(request.user, payload);
    response.status(201).json({
      success: true,
      message: "Règle de présélection créée.",
      rule,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSelectionRuleController(request, response, next) {
  try {
    const payload = buildRulePayload(request.body);
    const validationMessage = validateRulePayload(payload);

    if (validationMessage) {
      response.status(400).json({ success: false, message: validationMessage });
      return;
    }

    const rule = await updateSelectionRule(request.params.id, request.user, payload);

    if (!rule) {
      response.status(404).json({ success: false, message: "Règle introuvable." });
      return;
    }

    response.json({
      success: true,
      message: "Règle de présélection mise à jour.",
      rule,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSelectionRuleController(request, response, next) {
  try {
    const deleted = await deleteSelectionRule(request.params.id, request.user);

    if (!deleted) {
      response.status(404).json({ success: false, message: "Règle introuvable." });
      return;
    }

    response.json({
      success: true,
      message: "Règle de présélection supprimée.",
    });
  } catch (error) {
    next(error);
  }
}
