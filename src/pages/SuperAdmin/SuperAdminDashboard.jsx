import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/ui/EmptyState";
import { clearAuthSession } from "../../services/authService";
import { getSuperAdminDashboard } from "../../services/superAdminService";
import "../../index.css";

function DashboardIcon({ name }) {
  const commonProps = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-1.5A3.5 3.5 0 0 0 12.5 16h-5A3.5 3.5 0 0 0 4 19.5V21" />
          <circle cx="10" cy="8" r="4" />
          <path d="M20 21v-1a3 3 0 0 0-2.5-2.95" />
          <path d="M17.5 4.3a3 3 0 0 1 0 5.4" />
        </svg>
      );
    case "file":
      return (
        <svg {...commonProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );
    case "alert":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...commonProps} width="20" height="20">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      );
    default:
      return null;
  }
}

DashboardIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

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
          id: "admins",
          label: "Administrateurs",
          value: totalAdmins,
          helper: "Comptes admin créés",
          tone: "info",
          icon: "shield",
        },
        {
          id: "active-admins",
          label: "Admins actifs",
          value: active,
          helper: "Accès autorisé",
          tone: "positive",
          icon: "users",
        },
        {
          id: "inactive-admins",
          label: "Admins désactivés",
          value: inactive,
          helper: "Connexion bloquée",
          tone: inactive > 0 ? "warning" : "neutral",
          icon: "alert",
        },
        {
          id: "users",
          label: "Utilisateurs",
          value: totalUsers,
          helper: "Comptes inscrits",
          tone: "neutral",
          icon: "users",
        },
        {
          id: "students",
          label: "Étudiants",
          value: totalStudents,
          helper: "Comptes étudiants",
          tone: "neutral",
          icon: "users",
        },
        {
          id: "applications",
          label: "Candidatures",
          value: totalApplications,
          helper: "Dossiers déposés",
          tone: "info",
          icon: "file",
        },
      ],
      actions: [
        {
          id: "admins-management",
          title: "Gestion des administrateurs",
          description: "Créer, activer ou désactiver un compte admin",
          icon: "shield",
          tone: "positive",
          to: "/super-admin/admins",
        },
        {
          id: "users-management",
          title: "Utilisateurs inscrits",
          description: "Promouvoir un étudiant ou gérer un compte",
          icon: "users",
          tone: "positive",
          to: "/super-admin/users",
        },
        {
          id: "admin-dashboard",
          title: "Accès espace admin",
          description: "Ouvrir le tableau de bord administrateur",
          icon: "shield",
          tone: "info",
          to: "/admin",
        },
        {
          id: "applications",
          title: "Voir les candidatures",
          description: "Suivre les dossiers déposés par les étudiants",
          icon: "file",
          tone: "warning",
          to: "/admin/candidatures",
        },
        {
          id: "documents",
          title: "Voir les documents",
          description: "Consulter les pièces envoyées par les candidats",
          icon: "file",
          tone: "info",
          to: "/admin/documents",
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
      title="Tableau de bord super administrateur"
      subtitle="Gérez les administrateurs, les utilisateurs et l'activité globale de la plateforme"
      showSearch={false}
    >
      {error ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Statistiques clés</h2>
          <p>Vue synthétique des comptes, administrateurs et dossiers de la plateforme</p>
        </div>

        <div className="admin-primary-stats-grid">
          {dashboardData.cards.map((card) => (
            <article
              key={card.id}
              className={`admin-primary-stat-card admin-primary-stat-card-${card.tone}`}
            >
              <div className="admin-primary-stat-head">
                <span className={`admin-primary-stat-icon admin-primary-stat-icon-${card.tone}`}>
                  <DashboardIcon name={card.icon} />
                </span>
              </div>

              <div className="admin-primary-stat-body">
                <strong className="admin-primary-stat-value">
                  {isLoading ? "..." : card.value}
                </strong>
                <h3 className="admin-primary-stat-label">{card.label}</h3>
                <p className="admin-primary-stat-detail">{card.helper}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-section-container">
        <div className="campus-section-header">
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
          {dashboardData.actions.map((action) => (
            <Link
              key={action.id}
              to={action.to}
              className={`admin-quick-action-card admin-quick-action-card-${action.tone}`}
            >
              <span className={`admin-primary-stat-icon admin-primary-stat-icon-${action.tone}`}>
                <DashboardIcon name={action.icon} />
              </span>
              <div className="admin-quick-action-body">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </div>
              <DashboardIcon name="arrow" />
            </Link>
          ))}
        </div>
      </section>

      <section className="campus-section-container">
        <div className="campus-section-header">
          <div>
            <span className="admin-page-context warning">À surveiller</span>
            <h2>Points importants</h2>
            <p>Les éléments qui demandent une attention rapide.</p>
          </div>
        </div>

        {!isLoading && !platformStats.totalUtilisateurs && !platformStats.totalCandidatures ? (
          <EmptyState
            title="Aucune donnée disponible pour le moment"
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
