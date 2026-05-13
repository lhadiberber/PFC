export function roleMiddleware(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user) {
      const error = new Error("Acces non autorise");
      error.statusCode = 401;
      next(error);
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      const error = new Error("Acces refuse");
      error.statusCode = 403;
      next(error);
      return;
    }

    next();
  };
}

export const requireRole = roleMiddleware;
