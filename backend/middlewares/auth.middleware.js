import jwt from "jsonwebtoken";

export function authMiddleware(request, _response, next) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    const error = new Error("Token d'authentification manquant.");
    error.statusCode = 401;
    next(error);
    return;
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    next();
  } catch (_error) {
    const error = new Error("Token invalide ou expire.");
    error.statusCode = 401;
    next(error);
  }
}
