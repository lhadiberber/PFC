export const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
const API_REQUEST_TIMEOUT_MS = 12000;

function normalizeApiUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function isBrowserRuntime() {
  return typeof window !== "undefined";
}

function isLocalHostname(hostname) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function normalizeEndpoint(endpoint) {
  const normalizedEndpoint = String(endpoint || "").trim();
  return normalizedEndpoint.startsWith("/") ? normalizedEndpoint : `/${normalizedEndpoint}`;
}

function getRuntimeApiUrls() {
  if (!isBrowserRuntime()) {
    return [];
  }

  const { protocol, hostname, origin } = window.location;

  if (!hostname) {
    return [];
  }

  const urls = [];

  if (!API_BASE_URL.startsWith("http")) {
    urls.push(`${origin}${API_BASE_URL}`);
  }

  if (isLocalHostname(hostname)) {
    urls.push("http://127.0.0.1:5000/api");
    urls.push("http://localhost:5000/api");
    return urls;
  }

  if (protocol === "https:") {
    urls.push(`https://${hostname}:5000/api`);
    return urls;
  }

  urls.push(`http://${hostname}:5000/api`);

  return urls;
}

function getLocalApiFallbackUrls() {
  if (isBrowserRuntime() && !isLocalHostname(window.location.hostname)) {
    return [];
  }

  return ["http://127.0.0.1:5000/api", "http://localhost:5000/api"];
}

export function getApiFallbackUrls() {
  return [
    API_BASE_URL,
    ...getRuntimeApiUrls(),
    ...getLocalApiFallbackUrls(),
  ]
    .map(normalizeApiUrl)
    .filter((url, index, urls) => url && urls.indexOf(url) === index);
}

const AUTH_STORAGE_KEYS = {
  token: "token",
  user: "user",
  role: "userRole",
  email: "userEmail",
};

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function isNetworkUnavailableError(error) {
  const message = String(error?.message || "").trim().toLowerCase();
  return (
    error?.status === 0 ||
    error instanceof TypeError ||
    error?.name === "AbortError" ||
    message === "failed to fetch"
  );
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (isNetworkUnavailableError(error)) {
    return "Backend indisponible. Lancez le serveur backend sur le port 5000 puis reessayez.";
  }

  const message = String(error?.message || "").trim();
  return message || fallbackMessage;
}

export async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  if (!contentType.includes("application/json")) {
    throw new ApiError("Réponse invalide du serveur. Vérifiez l'URL de l'API.", response.status, {
      contentType,
    });
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new ApiError("Réponse invalide du serveur.", response.status);
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  const { signal, ...requestOptions } = options;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...requestOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchApi(endpoint, options = {}) {
  let lastNetworkError = null;
  let lastInvalidResponse = null;
  const triedUrls = [];
  const normalizedEndpoint = normalizeEndpoint(endpoint);

  for (const baseUrl of getApiFallbackUrls()) {
    const requestUrl = `${baseUrl}${normalizedEndpoint}`;
    triedUrls.push(requestUrl);

    try {
      const response = await fetchWithTimeout(requestUrl, options);
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json") && response.status !== 204) {
        lastInvalidResponse = {
          url: requestUrl,
          status: response.status,
          contentType,
        };
        continue;
      }

      return response;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (lastInvalidResponse && !lastNetworkError) {
    throw new ApiError(
      "Reponse API invalide. Verifiez que le frontend pointe vers le backend Express.",
      lastInvalidResponse.status,
      {
        triedUrls,
        lastInvalidResponse,
      }
    );
  }

  throw new ApiError("Backend indisponible. Lancez le serveur backend sur le port 5000 puis reessayez.", 0, {
    triedUrls,
    error:
      lastNetworkError?.name === "AbortError"
        ? `Timeout apres ${API_REQUEST_TIMEOUT_MS / 1000}s`
        : lastNetworkError?.message || "Network error",
  });
}

export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, token } = options;
  const headers = {
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = token || getAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetchApi(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    throw new ApiError(
      payload?.message || "Une erreur est survenue pendant la requête.",
      response.status,
      payload
    );
  }

  if (!payload) {
    return { success: true };
  }

  return payload;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.token);
}

export function getAuthSession() {
  const token = getAuthToken();
  const role = localStorage.getItem(AUTH_STORAGE_KEYS.role);
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);

  if (!token || !role) {
    return null;
  }

  try {
    return {
      token,
      user: rawUser ? JSON.parse(rawUser) : null,
      role,
    };
  } catch (_error) {
    return {
      token,
      user: null,
      role,
    };
  }
}

export function saveAuthSession({ token, user }) {
  if (!token || !user?.role) {
    throw new ApiError("Session invalide reçue du serveur.");
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_KEYS.role, user.role);
  localStorage.setItem(AUTH_STORAGE_KEYS.email, user.email || "");
  window.dispatchEvent(new Event("auth:session-updated"));
}

export function clearAuthSession() {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("auth:session-updated"));
}

export async function registerStudent(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: {
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      telephone: payload.telephone,
      password: payload.password,
    },
  });
}

export async function loginUser({ email, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
}

export async function getCurrentUser(token) {
  return apiRequest("/auth/me", { token });
}
