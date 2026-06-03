export const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

function normalizeApiUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function getRuntimeApiUrls() {
  if (typeof window === "undefined") {
    return [];
  }

  const { protocol, hostname } = window.location;

  if (!hostname) {
    return [];
  }

  const urls = [];

  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    urls.push(`${protocol}//${hostname}:5000/api`);
  }

  if (hostname === "localhost") {
    urls.push("http://127.0.0.1:5000/api");
  }

  if (hostname === "127.0.0.1") {
    urls.push("http://localhost:5000/api");
  }

  return urls;
}

export function getApiFallbackUrls() {
  return [
    API_BASE_URL,
    ...getRuntimeApiUrls(),
    "http://localhost:5000/api",
    "http://127.0.0.1:5000/api",
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

export async function fetchApi(endpoint, options = {}) {
  let lastNetworkError = null;
  const triedUrls = [];

  for (const baseUrl of getApiFallbackUrls()) {
    triedUrls.push(baseUrl);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, options);
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json") && response.status !== 204) {
        continue;
      }

      return response;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  throw new ApiError(
    "Backend indisponible. Lancez le serveur backend sur le port 5000 puis réessayez.",
    0,
    {
      triedUrls,
      error: lastNetworkError?.message || "Network error",
    }
  );
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
