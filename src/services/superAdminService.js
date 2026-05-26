import { apiRequest } from "./authService";

export async function getAdmins() {
  const response = await apiRequest("/super-admin/admins");
  return response.admins || [];
}

export async function getUsers() {
  const response = await apiRequest("/super-admin/users");
  return response.users || [];
}

export async function createAdmin(adminData) {
  const response = await apiRequest("/super-admin/admins", {
    method: "POST",
    body: {
      nom: adminData.nom,
      prenom: adminData.prenom,
      email: adminData.email,
      password: adminData.password,
    },
  });

  return response.admin || null;
}

export async function updateAdmin(id, adminData) {
  const response = await apiRequest(`/super-admin/admins/${id}`, {
    method: "PATCH",
    body: {
      nom: adminData.nom,
      prenom: adminData.prenom,
      email: adminData.email,
    },
  });

  return response.admin || null;
}

export async function updateAdminStatus(id, isActive) {
  const response = await apiRequest(`/super-admin/admins/${id}/status`, {
    method: "PATCH",
    body: { is_active: isActive },
  });

  return response.admin || null;
}

export async function updateUserRole(id, role) {
  const response = await apiRequest(`/super-admin/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });

  return response.user || null;
}

export async function updateUserStatus(id, isActive) {
  const response = await apiRequest(`/super-admin/users/${id}/status`, {
    method: "PATCH",
    body: { is_active: isActive },
  });

  return response.user || null;
}

export async function getSuperAdminDashboard() {
  const response = await apiRequest("/super-admin/dashboard");
  return response.stats || {};
}
