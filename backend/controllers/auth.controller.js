import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByBacRegistrationNumber,
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

async function isRecaptchaValid(token, ip) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  if (ip) {
    params.append("remoteip", ip);
  }

  try {
    const verifyResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const result = await verifyResponse.json();

    return result.success === true;
  } catch (error) {
    console.error("Erreur pendant la verification reCAPTCHA:", error);
    return false;
  }
}

function buildPublicUser(user) {
  return {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    is_active: Boolean(user.is_active),
    university_scope: user.university_scope || "",
    assigned_department: user.assigned_department || "",
    created_at: user.created_at,
  };
}

// inscription etudiant avec mot de passe hashe
export async function register(request, response, next) {
  try {
    const { nom, prenom, email, password, recaptchaToken } = request.body;
    const nomValue = String(nom || "").trim();
    const prenomValue = String(prenom || "").trim();
    const passwordValue = String(password || "");
    const normalizedEmail = normalizeEmail(email);

    if (!nomValue || !prenomValue || !normalizedEmail || !passwordValue) {
      response.status(400).json({
        success: false,
        message: "Nom, prénom, email et mot de passe sont obligatoires.",
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
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    const recaptchaIsValid = await isRecaptchaValid(recaptchaToken, request.ip);
    if (!recaptchaIsValid) {
      response.status(400).json({
        success: false,
        message: "Vérification anti-robot invalide.",
      });
      return;
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      response.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé.",
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
      message: "Compte étudiant créé avec succès.",
      token,
      user: buildPublicUser(user),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      response.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé.",
      });
      return;
    }

    next(error);
  }
}

// connexion par email ou numero d'inscription bac
export async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const passwordValue = String(password || "");
    const identifier = String(email || "").trim();

    if (!identifier || !passwordValue) {
      response.status(400).json({
        success: false,
        message: "Identifiant et mot de passe sont obligatoires.",
      });
      return;
    }

    const user = identifier.includes("@")
      ? await findUserByEmail(normalizeEmail(identifier))
      : await findUserByBacRegistrationNumber(identifier);
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

    if (user.is_active === 0 || user.is_active === false) {
      response.status(403).json({
        success: false,
        message: "Votre compte est desactive. Veuillez contacter l'administrateur.",
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

// renvoi de l'utilisateur connecte
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
