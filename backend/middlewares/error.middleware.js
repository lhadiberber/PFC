export function notFoundMiddleware(request, _response, next) {
  const error = new Error(`Route introuvable: ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function isMulterError(error) {
  return error.name === "MulterError" || String(error.code || "").startsWith("LIMIT_");
}

function getUploadMessage(error) {
  if (error.code === "LIMIT_FILE_SIZE") {
    return "Fichier trop volumineux. Taille maximale autorisee: 5 Mo.";
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return "Champ fichier invalide. Utilisez le champ document.";
  }

  return error.message;
}

export function errorMiddleware(error, _request, response, _next) {
  const uploadError = isMulterError(error);
  const statusCode = error.statusCode || error.status || (uploadError ? 400 : 500);
  const isProduction = process.env.NODE_ENV === "production";
  const rawMessage = uploadError ? getUploadMessage(error) : error.message;
  const message = isProduction && statusCode === 500 ? "Erreur interne du serveur." : rawMessage;

  response.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction ? { stack: error.stack } : {}),
  });
}
