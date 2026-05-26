import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/ui/EmptyState";
import { clearAuthSession } from "../../services/authService";
import { getSuperAdminDashboard } from "../../services/superAdminService";
import "../../index.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardData = useMemo(() => {
    const totalAdmins = Number(platformStats.totalAdmins || 0);
    const active = Number(platformStats.adminsActifs || 0);
    const inactive = Number(platformStats.adminsDesactives || 0);
    const totalUsers = Number(platformStats.totalUtilisateurs || 0);
    const totalStudents = Number(platformStats.totalEtudiants || 0);
    const totalApplications = Number(platformStats.totalCandidatures || 0);

    return {
      cards: [
        {
          label: "Administrateurs",
          value: totalAdmins,
          helper: "Comptes admin créés",
          tone: "info",
        },
        {
          label: "Admins actifs",
          value: active,
          helper: "Accès autorisé",
          tone: "positive",
        },
        {
          label: "Admins désactivés",
          value: inactive,
          helper: "Connexion bloquée",
          tone: "warning",
        },
        {
          label: "Utilisateurs",
          value: totalUsers,
          helper: "Comptes inscrits",
          tone: "neutral",
        },
        {
          label: "Étudiants",
          value: totalStudents,
          helper: "Comptes étudiants",
          tone: "neutral",
        },
        {
          label: "Candidatures",
          value: totalApplications,
          helper: "Dossiers déposés",
          tone: "info",
        },
      ],
      watchItems: [
        {
          label: "Admins désactivés",
          value: inactive,
          helper: "À réactiver si besoin",
          tone: inactive > 0 ? "warning" : "positive",
        },
        {
          label: "Utilisateurs inscrits",
          value: totalUsers,
          helper: "À suivre depuis la gestion des comptes",
          tone: "info",
        },
        {
          label: "Candidatures déposées",
          value: totalApplications,
          helper: "À traiter dans l'espace admin",
          tone: totalApplications > 0 ? "warning" : "positive",
        },
      ],
    };
  }, [platformStats]);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const dashboard = await getSuperAdminDashboard();

        if (isActive) {
          setPlatformStats(dashboard);
        }
      } catch (loadError) {
        if (isActive) {
          if (loadError.status === 401) {
            clearAuthSession();
            navigate("/login", {
              replace: true,
              state: { message: "Session expirée. Veuillez vous reconnecter." },
            });
            return;
          }

          setError(loadError.message || "Impossible de charger les données du tableau de bord.");
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
      subtitle="Gérez les administrateurs, les comptes et l'activité globale de la plateforme."
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
            <span className="admin-page-context info">Accès réservé</span>
            <h2>Super administrateur</h2>
            <p>Retrouvez les raccourcis utiles pour piloter la plateforme.</p>
          </div>
        </div>

        {isLoading ? (
          <EmptyState
            title="Chargement du tableau de bord..."
            description="Les données seront disponibles dans un instant."
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
              <span>Créer, activer ou désactiver un compte admin.</span>
            </div>
          </Link>
          <Link
            to="/super-admin/users"
            className="admin-quick-action-card admin-quick-action-card-positive"
          >
            <div className="admin-quick-action-body">
              <strong>Utilisateurs inscrits</strong>
              <span>Promouvoir un étudiant ou gérer un compte.</span>
            </div>
          </Link>
          <Link to="/admin" className="admin-quick-action-card admin-quick-action-card-info">
            <div className="admin-quick-action-body">
              <strong>Accès espace admin</strong>
              <span>Ouvrir le tableau de bord administrateur.</span>
            </div>
          </Link>
          <Link
            to="/admin/candidatures"
            className="admin-quick-action-card admin-quick-action-card-warning"
          >
            <div className="admin-quick-action-body">
              <strong>Voir les candidatures</strong>
              <span>Suivre les dossiers déposés par les étudiants.</span>
            </div>
          </Link>
          <Link
            to="/admin/documents"
            className="admin-quick-action-card admin-quick-action-card-info"
          >
            <div className="admin-quick-action-body">
              <strong>Voir les documents</strong>
              <span>Consulter les pièces envoyées par les candidats.</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context warning">À surveiller</span>
            <h2>Points importants</h2>
            <p>Les éléments qui demandent une attention rapide.</p>
          </div>
        </div>

        {!isLoading && !platformStats.totalUtilisateurs && !platformStats.totalCandidatures ? (
          <EmptyState
            title="Aucune donnée disponible pour le moment."
            description="Les informations apparaîtront après la création des premiers comptes ou dossiers."
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
