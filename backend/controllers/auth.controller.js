import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  normalizeEmail,
} from "../models/user.model.js";

const SALT_ROUNDS = 10;

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET n'est pas configure.");
  }

  return process.env.JWT_SECRET;
}

function signAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildPublicUser(user) {
  return {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

export async function register(request, response, next) {
  try {
    const { nom, prenom, email, password } = request.body;
    const nomValue = String(nom || "").trim();
    const prenomValue = String(prenom || "").trim();
    const passwordValue = String(password || "");
    const normalizedEmail = normalizeEmail(email);

    if (!nomValue || !prenomValue || !normalizedEmail || !passwordValue) {
      response.status(400).json({
        success: false,
        message: "Nom, prenom, email et mot de passe sont obligatoires.",
      });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      response.status(400).json({
        success: false,
        message: "Format d'email invalide.",
      });
      return;
    }

    if (passwordValue.length < 8) {
      response.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caracteres.",
      });
      return;
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      response.status(409).json({
        success: false,
        message: "Un compte existe deja avec cet email.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(passwordValue, SALT_ROUNDS);
    const user = await createUser({
      nom: nomValue,
      prenom: prenomValue,
      email: normalizedEmail,
      passwordHash,
      role: "student",
    });
    const token = signAuthToken(user);

    response.status(201).json({
      success: true,
      message: "Compte etudiant cree avec succes.",
      token,
      user: buildPublicUser(user),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      response.status(409).json({
        success: false,
        message: "Un compte existe deja avec cet email.",
      });
      return;
    }

    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const passwordValue = String(password || "");
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !passwordValue) {
      response.status(400).json({
        success: false,
        message: "Email et mot de passe sont obligatoires.",
      });
      return;
    }

    const user = await findUserByEmail(normalizedEmail);
    const isPasswordValid = user
      ? await bcrypt.compare(passwordValue, user.password_hash)
      : false;

    if (!user || !isPasswordValid) {
      response.status(401).json({
        success: false,
        message: "Identifiants invalides.",
      });
      return;
    }

    const token = signAuthToken(user);

    response.json({
      success: true,
      message: "Connexion reussie.",
      token,
      user: buildPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function me(request, response, next) {
  try {
    const user = await findUserById(request.user.id);

    if (!user) {
      response.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      user: buildPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}
