import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/ui/EmptyState";
import { clearAuthSession } from "../../services/authService";
import { getAdminDashboard } from "../../services/adminService";
import { listManagedAdmins } from "../../services/superAdminService";
import "../../index.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardData = useMemo(() => {
    const active = admins.filter((admin) => admin.is_active).length;
    const totalStudents = Number(platformStats.totalEtudiants || 0);
    const totalApplications = Number(platformStats.totalCandidatures || 0);
    const pendingApplications = Number(platformStats.enAttente || 0);
    const pendingDocuments = Number(platformStats.documentsEnAttente || 0);

    return {
      cards: [
        {
          label: "Administrateurs",
          value: admins.length,
          helper: "Comptes admin crees",
          tone: "info",
        },
        {
          label: "Admins actifs",
          value: active,
          helper: "Acces autorise",
          tone: "positive",
        },
        {
          label: "Admins desactives",
          value: admins.length - active,
          helper: "Connexion bloquee",
          tone: "warning",
        },
        {
          label: "Etudiants",
          value: totalStudents,
          helper: "Comptes etudiants",
          tone: "neutral",
        },
        {
          label: "Candidatures",
          value: totalApplications,
          helper: "Dossiers deposes",
          tone: "info",
        },
      ],
      watchItems: [
        {
          label: "Admins desactives",
          value: admins.length - active,
          helper: "A reactiver si besoin",
          tone: admins.length - active > 0 ? "warning" : "positive",
        },
        {
          label: "Candidatures en attente",
          value: pendingApplications,
          helper: "A traiter dans l'espace admin",
          tone: pendingApplications > 0 ? "warning" : "positive",
        },
        {
          label: "Documents en attente",
          value: pendingDocuments,
          helper: "A verifier par l'administration",
          tone: pendingDocuments > 0 ? "warning" : "positive",
        },
      ],
    };
  }, [admins, platformStats]);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [adminRows, adminDashboard] = await Promise.all([
          listManagedAdmins(),
          getAdminDashboard(),
        ]);

        if (isActive) {
          setAdmins(adminRows);
          setPlatformStats(adminDashboard.stats || {});
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

          setError(loadError.message || "Impossible de charger les donnees du tableau de bord.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  return (
    <AdminLayout
      title="Espace super administrateur"
      subtitle="Gerez les administrateurs et suivez l'activite globale de la plateforme."
      showSearch={false}
    >
      {error ? (
        <div className="auth-feedback auth-feedback-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="admin-primary-stats-grid">
        {dashboardData.cards.map((card) => (
          <div
            key={card.label}
            className={`admin-primary-stat-card admin-primary-stat-card-${card.tone}`}
          >
            <span className="admin-stat-label">{card.label}</span>
            <strong>{isLoading ? "..." : card.value}</strong>
            <small>{card.helper}</small>
          </div>
        ))}
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Acces reserve</span>
            <h2>Super administrateur</h2>
            <p>Retrouvez les raccourcis utiles pour piloter la plateforme.</p>
          </div>
        </div>

        {isLoading ? (
          <EmptyState
            title="Chargement du tableau de bord..."
            description="Les donnees seront disponibles dans un instant."
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
              <strong>Acces espace admin</strong>
              <span>Ouvrir le tableau de bord administrateur.</span>
            </div>
          </Link>
          <Link
            to="/admin/candidatures"
            className="admin-quick-action-card admin-quick-action-card-warning"
          >
            <div className="admin-quick-action-body">
              <strong>Voir les candidatures</strong>
              <span>Suivre les dossiers deposes par les etudiants.</span>
            </div>
          </Link>
          <Link
            to="/admin/documents"
            className="admin-quick-action-card admin-quick-action-card-info"
          >
            <div className="admin-quick-action-body">
              <strong>Voir les documents</strong>
              <span>Consulter les pieces envoyees par les candidats.</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context warning">A surveiller</span>
            <h2>Points importants</h2>
            <p>Les elements qui demandent une attention rapide.</p>
          </div>
        </div>

        {!isLoading && admins.length === 0 && !platformStats.totalCandidatures ? (
          <EmptyState
            title="Aucune donnee disponible pour le moment."
            description="Les informations apparaitront apres la creation des premiers comptes ou dossiers."
            className="admin-empty-state"
          />
        ) : (
          <div className="admin-quick-actions-grid">
            {dashboardData.watchItems.map((item) => (
              <div
                key={item.label}
                className={`admin-quick-action-card admin-quick-action-card-${item.tone}`}
              >
                <div className="admin-quick-action-body">
                  <strong>
                    {item.label} : {isLoading ? "..." : item.value}
                  </strong>
                  <span>{item.helper}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
