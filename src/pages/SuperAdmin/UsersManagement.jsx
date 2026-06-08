import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { clearAuthSession, getApiErrorMessage } from "../../services/authService";
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../../services/superAdminService";
import { formatAdminDate } from "../../utils/adminApplications";
import "../../index.css";

function getRoleLabel(role) {
  if (role === "super_admin") return "Super admin";
  if (role === "admin") return "Admin";
  return "Étudiant";
}

function normalizeSearchValue(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [errorCanRetry, setErrorCanRetry] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const stats = useMemo(() => {
    const students = users.filter((user) => user.role === "student").length;
    const admins = users.filter((user) => user.role === "admin").length;
    const inactive = users.filter((user) => !user.is_active).length;

    return {
      total: users.length,
      students,
      admins,
      inactive,
    };
  }, [users]);

  // recherche dans les comptes utilisateurs
  const filteredUsers = useMemo(() => {
    const query = normalizeSearchValue(searchQuery);

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const statusLabel = user.is_active ? "actif" : "inactif";
      const searchableValue = [
        user.id,
        user.nom,
        user.prenom,
        user.email,
        user.role,
        getRoleLabel(user.role),
        statusLabel,
        user.university_scope,
        user.assigned_department,
      ]
        .map(normalizeSearchValue)
        .join(" ");

      return searchableValue.includes(query);
    });
  }, [searchQuery, users]);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsLoading(true);
      setError("");
      setErrorCanRetry(false);

      try {
        const rows = await getUsers();
        if (isActive) {
          setUsers(rows);
        }
      } catch (loadError) {
        if (!isActive) return;

        if (loadError.status === 401) {
          clearAuthSession();
          navigate("/login", {
            replace: true,
            state: { message: "Session expirée. Veuillez vous reconnecter." },
          });
          return;
        }

        setError(getApiErrorMessage(loadError, "Impossible de charger les utilisateurs."));
        setErrorCanRetry(true);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [navigate, reloadKey]);

  const updateUserInList = (updatedUser) => {
    if (!updatedUser) return;

    setUsers((current) =>
      current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  // attribution des roles admin et etudiant
  const handleRoleChange = async (user, role) => {
    setUpdatingUserId(user.id);
    setError("");
    setErrorCanRetry(false);
    setSuccessMessage("");

    try {
      const updatedUser = await updateUserRole(user.id, role);
      updateUserInList(updatedUser);
      setSuccessMessage("Modification enregistrée.");
    } catch (roleError) {
      setError(getApiErrorMessage(roleError, "Impossible de modifier le rôle."));
      setErrorCanRetry(false);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // activation ou desactivation d'un compte
  const handleStatusChange = async (user) => {
    const nextStatus = !user.is_active;

    setUpdatingUserId(user.id);
    setError("");
    setErrorCanRetry(false);
    setSuccessMessage("");

    try {
      const updatedUser = await updateUserStatus(user.id, nextStatus);
      updateUserInList(updatedUser);
      setSuccessMessage("Modification enregistrée.");
    } catch (statusError) {
      setError(getApiErrorMessage(statusError, "Impossible de modifier le statut."));
      setErrorCanRetry(false);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <AdminLayout
      title="Utilisateurs et comptes"
      subtitle="Consultez les comptes inscrits, gérez les rôles et les accès."
      showSearch={false}
    >
      <section className="admin-primary-stats-grid super-admin-users-stats-grid">
        <div className="admin-primary-stat-card admin-primary-stat-card-info">
          <span className="admin-stat-label">Utilisateurs</span>
          <strong>{stats.total}</strong>
          <small>Total des comptes</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-neutral">
          <span className="admin-stat-label">Étudiants</span>
          <strong>{stats.students}</strong>
          <small>Comptes candidats</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-positive">
          <span className="admin-stat-label">Admins</span>
          <strong>{stats.admins}</strong>
          <small>Comptes administrateurs</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-warning">
          <span className="admin-stat-label">Désactivés</span>
          <strong>{stats.inactive}</strong>
          <small>Comptes bloqués</small>
        </div>
      </section>

      <section className="admin-card super-admin-users-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Comptes</span>
            <h2>Utilisateurs inscrits</h2>
            <p>Le super administrateur peut promouvoir un étudiant ou désactiver un compte.</p>
          </div>
        </div>

        <div className="admin-toolbar admin-dashboard-toolbar">
          <label className="admin-toolbar-label" htmlFor="superAdminUsersSearch">
            Recherche
          </label>
          <input
            id="superAdminUsersSearch"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher par nom, prenom, email, role, statut ou ID"
            className="admin-search-input"
            autoComplete="off"
          />
          <span className="admin-table-meta-subtext">
            {searchQuery.trim()
              ? `${filteredUsers.length} resultat(s) sur ${users.length}`
              : `${users.length} compte(s) au total`}
          </span>
          {searchQuery ? (
            <Button
              type="button"
              className="admin-filter-tab"
              onClick={() => setSearchQuery("")}
            >
              Effacer
            </Button>
          ) : null}
        </div>

        {error ? (
          <div className="auth-feedback auth-feedback-error" role="alert">
            {error}
            {errorCanRetry ? (
              <Button
                className="admin-filter-tab"
                onClick={() => setReloadKey((currentKey) => currentKey + 1)}
              >
                Réessayer
              </Button>
            ) : null}
          </div>
        ) : null}
        {successMessage ? (
          <div className="auth-feedback auth-feedback-success" role="status">
            {successMessage}
          </div>
        ) : null}

        {isLoading ? (
          <EmptyState
            title="Chargement des utilisateurs..."
            description="Veuillez patienter quelques instants."
            className="admin-empty-state"
          />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table mobile-cards">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Date inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title={
                          searchQuery.trim()
                            ? "Aucun utilisateur trouve."
                            : "Aucune donnée pour le moment."
                        }
                        description={
                          searchQuery.trim()
                            ? "Essayez avec un nom, un prenom, un email, un role, un statut ou un identifiant."
                            : "Les comptes apparaîtront après les premières inscriptions."
                        }
                        className="admin-empty-state"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSuperAdmin = user.role === "super_admin";
                    const isUpdating = updatingUserId === user.id;

                    return (
                      <tr key={user.id}>
                        <td data-label="Nom">
                          <div className="admin-table-meta">
                            <span className="admin-table-meta-text">{user.nom}</span>
                            <span className="admin-table-meta-subtext">ID {user.id}</span>
                          </div>
                        </td>
                        <td data-label="Prénom">{user.prenom}</td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Rôle">{getRoleLabel(user.role)}</td>
                        <td data-label="Statut">
                          <StatusBadge status={user.is_active ? "Actif" : "Inactif"} />
                        </td>
                        <td data-label="Date inscription">{formatAdminDate(user.created_at)}</td>
                        <td data-label="Actions">
                          {isSuperAdmin ? (
                            <span className="admin-table-meta-subtext">Compte protégé</span>
                          ) : (
                            <>
                              {user.role === "student" ? (
                                <Button
                                  className="admin-table-action-button"
                                  onClick={() => handleRoleChange(user, "admin")}
                                  disabled={isUpdating}
                                >
                                  Promouvoir en admin
                                </Button>
                              ) : (
                                <Button
                                  className="admin-table-action-button"
                                  onClick={() => handleRoleChange(user, "student")}
                                  disabled={isUpdating}
                                >
                                  Retirer le rôle admin
                                </Button>
                              )}
                              <Button
                                className="admin-table-action-button"
                                onClick={() => handleStatusChange(user)}
                                disabled={isUpdating}
                              >
                                {isUpdating
                                  ? "Mise à jour..."
                                  : user.is_active
                                    ? "Désactiver"
                                    : "Réactiver"}
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
