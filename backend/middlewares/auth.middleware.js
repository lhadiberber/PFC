import jwt from "jsonwebtoken";

function getTokenFromHeader(authHeader = "") {
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function authMiddleware(request, _response, next) {
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

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (jwtError) {
    const error = new Error("Acces non autorise");
    error.statusCode = 401;
    error.cause = jwtError;
    next(error);
  }
}
