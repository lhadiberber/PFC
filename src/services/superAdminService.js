import { apiRequest } from "./authService";

export async function listManagedAdmins() {
  const response = await apiRequest("/super-admin/admins");
  return response.admins || [];
}

export async function createManagedAdmin(payload) {
  const response = await apiRequest("/super-admin/admins", {
    method: "POST",
    body: payload,
  });

  return response.admin || null;
}

export async function updateManagedAdminStatus(id, isActive) {
  const response = await apiRequest(`/super-admin/admins/${id}/status`, {
    method: "PATCH",
    body: { is_active: isActive },
  });

  return response.admin || null;
}

export async function updateManagedAdmin(id, payload) {
  const response = await apiRequest(`/super-admin/admins/${id}`, {
    method: "PATCH",
    body: {
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
    },
  });

  return response.admin || null;
}
