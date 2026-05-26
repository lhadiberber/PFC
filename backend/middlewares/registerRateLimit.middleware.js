const attemptsByIp = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function getClientIp(request) {
  return (
    request.ip ||
    String(request.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

export function registerRateLimit(request, response, next) {
  const now = Date.now();
  const ip = getClientIp(request);
  const current = attemptsByIp.get(ip);

  if (!current || current.resetAt <= now) {
    attemptsByIp.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    next();
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    response.status(429).json({
      success: false,
      message: "Veuillez patienter avant de réessayer.",
    });
    return;
  }

  current.count += 1;
  attemptsByIp.set(ip, current);
  next();
}
