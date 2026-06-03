import jwt from "jsonwebtoken";
import { findUserById } from "../models/user.model.js";

function getTokenFromHeader(authHeader = "") {
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function authMiddleware(request, _response, next) {
  // Verifie le token envoye par le frontend.
  const token = getTokenFromHeader(request.headers.authorization);

  if (!token) {
    const error = new Error("Acces non autorise");
    error.statusCode = 401;
    next(error);
    return;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error("Configuration serveur invalide.");
    error.statusCode = 500;
    next(error);
    return;
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (jwtError) {
    const error = new Error("Acces non autorise");
    error.statusCode = 401;
    error.cause = jwtError;
    next(error);
    return;
  }

  try {
    const user = await findUserById(decodedToken.id);

    if (!user) {
      const error = new Error("Acces non autorise");
      error.statusCode = 401;
      next(error);
      return;
    }

    if (!user.is_active) {
      const error = new Error("Compte desactive");
      error.statusCode = 403;
      next(error);
      return;
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (databaseError) {
    next(databaseError);
  }
}
