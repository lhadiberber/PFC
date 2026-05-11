export function notFoundMiddleware(request, _response, next) {
  const error = new Error(`Route introuvable: ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorMiddleware(error, _request, response, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && statusCode === 500 ? "Erreur interne du serveur." : error.message;

  response.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction ? { stack: error.stack } : {}),
  });
}
