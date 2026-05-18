import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/ui/EmptyState";
import { clearAuthSession } from "../../services/authService";
import { listManagedAdmins } from "../../services/superAdminService";
import "../../index.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      try {
        const adminRows = await listManagedAdmins();
        if (isActive) {
          setAdmins(adminRows);
        }
      } catch (loadError) {
        if (isActive) {
          if (loadError.status === 401) {
            clearAuthSession();
            navigate("/login", {
              replace: true,
              state: { message: "Session expiree. Veuillez vous reconnecter." },
            });
            return;
          }

          setError(loadError.message || "Impossible de charger les administrateurs.");
        }
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

  return (
    <AdminLayout
      title="Espace super administrateur"
      subtitle="Gestion globale de la plateforme et des administrateurs."
      showSearch={false}
    >
      {error ? (
        <div className="auth-feedback auth-feedback-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="admin-primary-stats-grid">
        <div className="admin-primary-stat-card admin-primary-stat-card-info">
          <span className="admin-stat-label">Administrateurs</span>
          <strong>{isLoading ? "..." : stats.total}</strong>
          <small>Total des comptes admin</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-positive">
          <span className="admin-stat-label">Admins actifs</span>
          <strong>{isLoading ? "..." : stats.active}</strong>
          <small>Acces autorise</small>
        </div>
        <div className="admin-primary-stat-card admin-primary-stat-card-warning">
          <span className="admin-stat-label">Admins desactives</span>
          <strong>{isLoading ? "..." : stats.inactive}</strong>
          <small>Connexion bloquee</small>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Acces reserve</span>
            <h2>Super administrateur</h2>
            <p>Retrouvez ici les actions utiles pour administrer les comptes admin.</p>
          </div>
        </div>

        {isLoading ? (
          <EmptyState
            title="Chargement des administrateurs..."
            description="Les indicateurs seront disponibles dans un instant."
            className="admin-empty-state"
          />
        ) : null}

        <div className="admin-quick-actions-grid">
          <Link
            to="/super-admin/admins"
            className="admin-quick-action-card admin-quick-action-card-positive"
          >
            <div className="admin-quick-action-body">
              <strong>Gestion des administrateurs</strong>
              <span>Creer, activer ou desactiver un compte admin.</span>
            </div>
          </Link>
          <Link to="/admin" className="admin-quick-action-card admin-quick-action-card-info">
            <div className="admin-quick-action-body">
              <strong>Acceder au tableau de bord admin</strong>
              <span>Consulter les candidatures, les etudiants et les documents.</span>
            </div>
          </Link>
        </div>
      </section>
    </AdminLayout>
  );
}
