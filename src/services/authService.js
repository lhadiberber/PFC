const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  ""
);

const AUTH_STORAGE_KEYS = {
  token: "token",
  user: "user",
  role: "userRole",
  email: "userEmail",
};

class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch (_error) {
    throw new ApiError("Reponse invalide du serveur.", response.status);
  }
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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_error) {
    throw new ApiError("Backend indisponible. Verifiez que le serveur est lance.");
  }

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Une erreur est survenue pendant la requete.",
      response.status,
      payload
    );
  }

  if (!payload) {
    throw new ApiError("Reponse invalide du serveur.", response.status);
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
    throw new ApiError("Session invalide recue du serveur.");
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
