import { apiRequest } from "./authService";

export async function getAdmins() {
  const response = await apiRequest("/super-admin/admins");
  return response.admins || [];
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

export async function getSuperAdminDashboard() {
  const [admins, dashboard] = await Promise.all([
    getAdmins(),
    apiRequest("/admin/dashboard"),
  ]);

  return {
    admins,
    stats: dashboard.stats || {},
  };
}
