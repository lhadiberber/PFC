import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { clearAuthSession } from "../../services/authService";
import {
  createManagedAdmin,
  listManagedAdmins,
  updateManagedAdminStatus,
} from "../../services/superAdminService";
import { formatAdminDate } from "../../utils/adminApplications";
import "../../index.css";

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  password: "",
};

export default function AdminsManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingAdminId, setUpdatingAdminId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const stats = useMemo(() => {
    const active = admins.filter((admin) => admin.is_active).length;

    return {
      total: admins.length,
      active,
      inactive: admins.length - active,
    };
  }, [admins]);

  useEffect(() => {
    let isActive = true;

    async function loadAdmins() {
      setIsLoading(true);
      setError("");

      try {
        const adminRows = await listManagedAdmins();
        if (isActive) {
          setAdmins(adminRows);
        }
      } catch (loadError) {
        if (!isActive) return;

        if (loadError.status === 401) {
          clearAuthSession();
          navigate("/login", {
            replace: true,
            state: { message: "Session expiree. Veuillez vous reconnecter." },
          });
          return;
        }

        setError(loadError.message || "Impossible de charger les administrateurs.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadAdmins();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
    setSuccessMessage("");
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdAdmin = await createManagedAdmin(formData);
      if (createdAdmin) {
        setAdmins((current) => [createdAdmin, ...current]);
      }
      setFormData(emptyForm);
      setSuccessMessage("Administrateur cree avec succes.");
    } catch (createError) {
      setError(createError.message || "Impossible de creer l'administrateur.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const nextStatus = !admin.is_active;
    const actionLabel = nextStatus ? "activer" : "desactiver";

    if (!window.confirm(`Confirmer pour ${actionLabel} cet administrateur ?`)) {
      return;
    }

    setUpdatingAdminId(admin.id);
    setError("");
    setSuccessMessage("");

    try {
      const updatedAdmin = await updateManagedAdminStatus(admin.id, nextStatus);
      if (updatedAdmin) {
        setAdmins((current) =>
          current.map((adminRow) => (adminRow.id === admin.id ? updatedAdmin : adminRow))
        );
      }
      setSuccessMessage(nextStatus ? "Administrateur active." : "Administrateur desactive.");
    } catch (statusError) {
      setError(statusError.message || "Impossible de mettre a jour le statut.");
    } finally {
      setUpdatingAdminId(null);
    }
  };

  return (
    <AdminLayout
      title="Gestion des administrateurs"
      subtitle="Creer, consulter et desactiver les comptes administrateurs."
      showSearch={false}
    >
      <section className="admin-primary-stats-grid">
        <div className="admin-primary-stat-card admin-primary-stat-card-info">
          <span className="admin-stat-label">Administrateurs</span>
          <strong>{stats.total}</strong>
          <small>Total des comptes admin</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-positive">
          <span className="admin-stat-label">Actifs</span>
          <strong>{stats.active}</strong>
          <small>Peuvent se connecter</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-warning">
          <span className="admin-stat-label">Desactives</span>
          <strong>{stats.inactive}</strong>
          <small>Acces bloque</small>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Nouveau compte</span>
            <h2>Creer un administrateur</h2>
            <p>Le role est force cote backend sur admin.</p>
          </div>
        </div>

        {error ? (
          <div className="auth-feedback auth-feedback-error" role="alert">
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="auth-feedback auth-feedback-success" role="status">
            {successMessage}
          </div>
        ) : null}

        <form className="admin-toolbar admin-dashboard-toolbar" onSubmit={handleCreateAdmin}>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleFieldChange}
            placeholder="Nom"
            className="admin-search-input"
            disabled={isCreating}
          />
          <input
            type="text"
            name="prenom"
            value={formData.prenom}
            onChange={handleFieldChange}
            placeholder="Prenom"
            className="admin-search-input"
            disabled={isCreating}
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleFieldChange}
            placeholder="Email"
            className="admin-search-input"
            disabled={isCreating}
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleFieldChange}
            placeholder="Mot de passe"
            className="admin-search-input"
            disabled={isCreating}
          />
          <Button type="submit" className="admin-table-action-button" disabled={isCreating}>
            {isCreating ? "Creation..." : "Creer"}
          </Button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context neutral">Comptes admin</span>
            <h2>Administrateurs</h2>
            <p>Liste des administrateurs classiques de la plateforme.</p>
          </div>
        </div>

        {isLoading ? (
          <EmptyState
            title="Chargement des administrateurs..."
            description="Veuillez patienter quelques instants."
            className="admin-empty-state"
          />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table mobile-cards">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Statut</th>
                  <th>Date creation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title="Aucun administrateur pour le moment."
                        description="Creez le premier compte admin depuis le formulaire."
                        className="admin-empty-state"
                      />
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id}>
                      <td data-label="Nom">
                        <div className="admin-table-meta">
                          <span className="admin-table-meta-text">
                            {[admin.prenom, admin.nom].filter(Boolean).join(" ")}
                          </span>
                          <span className="admin-table-meta-subtext">ID {admin.id}</span>
                        </div>
                      </td>
                      <td data-label="Email">{admin.email}</td>
                      <td data-label="Role">{admin.role}</td>
                      <td data-label="Statut">
                        <StatusBadge status={admin.is_active ? "Actif" : "Inactif"} />
                      </td>
                      <td data-label="Date creation">{formatAdminDate(admin.created_at)}</td>
                      <td data-label="Action">
                        <Button
                          className="admin-table-action-button"
                          onClick={() => handleToggleStatus(admin)}
                          disabled={updatingAdminId === admin.id}
                        >
                          {updatingAdminId === admin.id
                            ? "Mise a jour..."
                            : admin.is_active
                              ? "Desactiver"
                              : "Activer"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
