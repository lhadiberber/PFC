import bcrypt from "bcrypt";
import {
  createAdmin,
  findAdmins,
  findUserByEmailForAdminManagement,
  findUserForAdminManagement,
  updateAdminInfo,
  updateAdminStatus,
} from "../models/superAdmin.model.js";
import { normalizeEmail } from "../models/user.model.js";

const SALT_ROUNDS = 10;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRequiredAdminValues(body) {
  return {
    nom: String(body.nom || "").trim(),
    prenom: String(body.prenom || "").trim(),
    email: normalizeEmail(body.email),
    password: String(body.password || ""),
  };
}

function isManagedAdmin(user) {
  return user && user.role === "admin";
}

export async function listAdmins(_request, response, next) {
  try {
    const admins = await findAdmins();

    response.json({
      success: true,
      admins,
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminController(request, response, next) {
  try {
    const { nom, prenom, email, password } = getRequiredAdminValues(request.body);

    if (!nom || !prenom || !email || !password) {
      response.status(400).json({
        success: false,
        message: "Champs obligatoires manquants.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      response.status(400).json({
        success: false,
        message: "Format d'email invalide.",
      });
      return;
    }

    if (password.length < 8) {
      response.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caracteres.",
      });
      return;
    }

    const existingUser = await findUserByEmailForAdminManagement(email);
    if (existingUser) {
      response.status(400).json({
        success: false,
        message: "Cet email est deja utilise.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await createAdmin({ nom, prenom, email, passwordHash });

    response.status(201).json({
      success: true,
      message: "Administrateur cree avec succes.",
      admin,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      response.status(400).json({
        success: false,
        message: "Cet email est deja utilise.",
      });
      return;
    }

    next(error);
  }
}

export async function updateAdminStatusController(request, response, next) {
  try {
    if (Number(request.params.id) === Number(request.user.id)) {
      response.status(400).json({
        success: false,
        message: "Vous ne pouvez pas desactiver votre propre compte.",
      });
      return;
    }

    const admin = await findUserForAdminManagement(request.params.id);

    if (!isManagedAdmin(admin)) {
      response.status(404).json({
        success: false,
        message: "Administrateur introuvable.",
      });
      return;
    }

    if (typeof request.body.is_active !== "boolean") {
      response.status(400).json({
        success: false,
        message: "Statut invalide.",
      });
      return;
    }

    const updatedAdmin = await updateAdminStatus(request.params.id, request.body.is_active);

    response.json({
      success: true,
      message: updatedAdmin.is_active
        ? "Administrateur active."
        : "Administrateur desactive.",
      admin: updatedAdmin,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminController(request, response, next) {
  try {
    const admin = await findUserForAdminManagement(request.params.id);

    if (!isManagedAdmin(admin)) {
      response.status(404).json({
        success: false,
        message: "Administrateur introuvable.",
      });
      return;
    }

    const nom = String(request.body.nom || "").trim();
    const prenom = String(request.body.prenom || "").trim();
    const email = normalizeEmail(request.body.email);

    if (!nom || !prenom || !email) {
      response.status(400).json({
        success: false,
        message: "Champs obligatoires manquants.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      response.status(400).json({
        success: false,
        message: "Format d'email invalide.",
      });
      return;
    }

    const userWithSameEmail = await findUserByEmailForAdminManagement(email);
    if (userWithSameEmail && Number(userWithSameEmail.id) !== Number(admin.id)) {
      response.status(400).json({
        success: false,
        message: "Cet email est deja utilise.",
      });
      return;
    }

    const updatedAdmin = await updateAdminInfo(request.params.id, { nom, prenom, email });

    response.json({
      success: true,
      message: "Administrateur mis a jour.",
      admin: updatedAdmin,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      response.status(400).json({
        success: false,
        message: "Cet email est deja utilise.",
      });
      return;
    }

    next(error);
  }
}
