import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import { clearAuthSession, getApiErrorMessage } from "../../services/authService";
import {
  createAdmin,
  getAdmins,
  updateAdmin,
  updateAdminStatus,
} from "../../services/superAdminService";
import { formatAdminDate } from "../../utils/adminApplications";
import "../../index.css";

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const emptyEditForm = {
  nom: "",
  prenom: "",
  email: "",
};

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function AdminsManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingAdminId, setUpdatingAdminId] = useState(null);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
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
        const adminRows = await getAdmins();
        if (isActive) {
          setAdmins(adminRows);
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

        setError(getApiErrorMessage(loadError, "Impossible de charger les administrateurs."));
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

  const validateCreateForm = () => {
    const nom = formData.nom.trim();
    const prenom = formData.prenom.trim();
    const email = formData.email.trim();

    if (!nom || !prenom || !email || !formData.password || !formData.confirmPassword) {
      return "Veuillez remplir tous les champs.";
    }

    if (!isValidEmail(email)) {
      return "Email invalide.";
    }

    if (formData.password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Les mots de passe ne correspondent pas.";
    }

    return "";
  };

  const validateEditForm = () => {
    const nom = editForm.nom.trim();
    const prenom = editForm.prenom.trim();
    const email = editForm.email.trim();

    if (!nom || !prenom || !email) {
      return "Nom, prénom et email sont obligatoires.";
    }

    if (!isValidEmail(email)) {
      return "Email invalide.";
    }

    return "";
  };

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
    const validationMessage = validateCreateForm();

    if (validationMessage) {
      setError(validationMessage);
      setSuccessMessage("");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdAdmin = await createAdmin({
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      if (createdAdmin) {
        setAdmins((current) => [createdAdmin, ...current]);
      }
      setFormData(emptyForm);
      setSuccessMessage("Administrateur créé avec succès.");
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Impossible de créer l'administrateur."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditFieldChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
    setSuccessMessage("");
  };

  const handleStartEdit = (admin) => {
    setEditingAdminId(admin.id);
    setEditForm({
      nom: admin.nom || "",
      prenom: admin.prenom || "",
      email: admin.email || "",
    });
    setError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setEditingAdminId(null);
    setEditForm(emptyEditForm);
  };

  const handleSaveEdit = async (adminId) => {
    const validationMessage = validateEditForm();

    if (validationMessage) {
      setError(validationMessage);
      setSuccessMessage("");
      return;
    }

    setIsSavingEdit(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedAdmin = await updateAdmin(adminId, {
        nom: editForm.nom.trim(),
        prenom: editForm.prenom.trim(),
        email: editForm.email.trim(),
      });

      if (updatedAdmin) {
        setAdmins((current) =>
          current.map((adminRow) => (adminRow.id === adminId ? updatedAdmin : adminRow))
        );
      }

      setEditingAdminId(null);
      setEditForm(emptyEditForm);
      setSuccessMessage("Modification enregistrée.");
    } catch (editError) {
      setError(getApiErrorMessage(editError, "Impossible de modifier l'administrateur."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    const nextStatus = !admin.is_active;
    const actionLabel = nextStatus ? "activer" : "désactiver";

    if (!window.confirm(`Confirmer pour ${actionLabel} cet administrateur ?`)) {
      return;
    }

    setUpdatingAdminId(admin.id);
    setError("");
    setSuccessMessage("");

    try {
      const updatedAdmin = await updateAdminStatus(admin.id, nextStatus);
      if (updatedAdmin) {
        setAdmins((current) =>
          current.map((adminRow) => (adminRow.id === admin.id ? updatedAdmin : adminRow))
        );
      }
      setSuccessMessage(nextStatus ? "Administrateur activé." : "Administrateur désactivé.");
    } catch (statusError) {
      setError(getApiErrorMessage(statusError, "Impossible de mettre à jour le statut."));
    } finally {
      setUpdatingAdminId(null);
    }
  };

  return (
    <AdminLayout
      title="Gestion des administrateurs"
      subtitle="Créer, consulter et désactiver les comptes administrateurs."
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
          <span className="admin-stat-label">Désactivés</span>
          <strong>{stats.inactive}</strong>
          <small>Accès bloqué</small>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Nouveau compte</span>
            <h2>Créer un administrateur</h2>
            <p>Ajoutez un compte administrateur pour gérer les dossiers.</p>
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
            placeholder="Prénom"
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
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleFieldChange}
            placeholder="Confirmation du mot de passe"
            className="admin-search-input"
            disabled={isCreating}
          />
          <Button type="submit" className="admin-table-action-button" disabled={isCreating}>
            {isCreating ? "Création..." : "Créer l'administrateur"}
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
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Statut</th>
                  <th>Date création</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title="Aucun administrateur pour le moment."
                        description="Créez le premier compte admin depuis le formulaire."
                        className="admin-empty-state"
                      />
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => {
                    const isEditing = editingAdminId === admin.id;

                    return (
                      <tr key={admin.id}>
                        <td data-label="Nom">
                          {isEditing ? (
                            <input
                              type="text"
                              name="nom"
                              value={editForm.nom}
                              onChange={handleEditFieldChange}
                              className="admin-search-input"
                              disabled={isSavingEdit}
                            />
                          ) : (
                            <div className="admin-table-meta">
                              <span className="admin-table-meta-text">{admin.nom}</span>
                              <span className="admin-table-meta-subtext">ID {admin.id}</span>
                            </div>
                          )}
                        </td>
                        <td data-label="Prénom">
                          {isEditing ? (
                            <input
                              type="text"
                              name="prenom"
                              value={editForm.prenom}
                              onChange={handleEditFieldChange}
                              className="admin-search-input"
                              disabled={isSavingEdit}
                            />
                          ) : (
                            admin.prenom
                          )}
                        </td>
                        <td data-label="Email">
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={editForm.email}
                              onChange={handleEditFieldChange}
                              className="admin-search-input"
                              disabled={isSavingEdit}
                            />
                          ) : (
                            admin.email
                          )}
                        </td>
                        <td data-label="Role">{admin.role}</td>
                        <td data-label="Statut">
                          <StatusBadge status={admin.is_active ? "Actif" : "Inactif"} />
                        </td>
                        <td data-label="Date création">{formatAdminDate(admin.created_at)}</td>
                        <td data-label="Action">
                          {isEditing ? (
                            <>
                              <Button
                                className="admin-table-action-button"
                                onClick={() => handleSaveEdit(admin.id)}
                                disabled={isSavingEdit}
                              >
                                {isSavingEdit ? "Enregistrement..." : "Enregistrer"}
                              </Button>
                              <Button
                                className="admin-table-action-button"
                                onClick={handleCancelEdit}
                                disabled={isSavingEdit}
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                className="admin-table-action-button"
                                onClick={() => handleStartEdit(admin)}
                              >
                                Modifier
                              </Button>
                              <Button
                                className="admin-table-action-button"
                                onClick={() => handleToggleStatus(admin)}
                                disabled={updatingAdminId === admin.id}
                              >
                                {updatingAdminId === admin.id
                                  ? "Mise à jour..."
                                  : admin.is_active
                                    ? "Désactiver"
                                    : "Activer"}
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
