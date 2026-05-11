import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserById } from "../models/user.model.js";

const SALT_ROUNDS = 10;

function signAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

export async function register(request, response, next) {
  try {
    const { email, password, role = "student" } = request.body;

    if (!email || !password) {
      response.status(400).json({
        success: false,
        message: "Email et mot de passe sont obligatoires.",
      });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      response.status(409).json({
        success: false,
        message: "Un compte existe deja avec cet email.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ email, passwordHash, role });
    const token = signAuthToken(user);

    response.status(201).json({ success: true, user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      response.status(400).json({
        success: false,
        message: "Email et mot de passe sont obligatoires.",
      });
      return;
    }

    const user = await findUserByEmail(email);
    const isPasswordValid = user
      ? await bcrypt.compare(password, user.password_hash)
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
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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

    response.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}
