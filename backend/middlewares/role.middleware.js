export function roleMiddleware(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user) {
      const error = new Error("Utilisateur non authentifie.");
      error.statusCode = 401;
      next(error);
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      const error = new Error("Acces refuse pour ce role.");
      error.statusCode = 403;
      next(error);
      return;
    }

    next();
  };
}
