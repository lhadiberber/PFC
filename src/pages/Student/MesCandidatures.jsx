import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { listMyApplications } from "../../services/applicationService";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import "../../index.css";

const PROFILE_FIELDS = [
  "nom",
  "prenom",
  "dateNaiss",
  "lieuNaiss",
  "sexe",
  "nationalite",
  "telephone",
  "email",
  "adresse",
];

const ACADEMIC_FIELDS = [
  "diplomeActuel",
  "etablissementActuel",
  "pays",
  "anneeBac",
  "moyenneBac",
  "specialiteActuelle",
  "specialite",
  "universite",
  "niveauDemande",
];

const DOCUMENT_FIELDS = [
  { key: "copieBac", label: "Copie du bac ou diplome" },
  { key: "releveNotes", label: "Releve de notes" },
  { key: "carteIdentite", label: "Carte d'identite ou passeport" },
  { key: "photo", label: "Photo d'identite" },
  { key: "residence", label: "Justificatif de residence" },
  { key: "cv", label: "CV" },
];

function hasValue(value) {
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function formatDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  switch (status) {
    case "Acceptée":
    case "Acceptee":
      return "Acceptee";
    case "Refusée":
    case "Refusee":
    case "Rejetee":
      return "Rejetee";
    default:
      return "En attente";
  }
}

function buildNumeroDossier(application) {
  const date = new Date(application.date_depot || application.dateDepot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function mapApiApplication(application) {
  const statut = normalizeStatus(application.statut);

  return {
    id: application.id,
    universite: application.universite || "",
    specialite: application.formation || "",
    niveauDemande: application.niveau || "",
    motivation: application.motivation || "",
    statut,
    dateDepot: application.date_depot,
    submittedAt: application.date_depot,
    numeroDossier: buildNumeroDossier(application),
    commentaireAdmin: application.commentaire_admin || "",
    details: {
      universite: application.universite || "",
      specialite: application.formation || "",
      niveauDemande: application.niveau || "",
      motivation: application.motivation || "",
    },
  };
}

function getCompletionColor(percentage) {
  if (percentage >= 90) {
    return "#059669";
  }

  if (percentage >= 65) {
    return "#2563eb";
  }

  if (percentage >= 40) {
    return "#d97706";
  }

  return "#dc2626";
}

function getCompletionLabel(percentage) {
  if (percentage >= 90) {
    return "Dossier complet";
  }

  if (percentage >= 65) {
    return "Dossier avance";
  }

  return "Dossier a completer";
}

function countCompleted(details, fields) {
  return fields.filter((field) => hasValue(details?.[field])).length;
}

function buildApplicationMetrics(application) {
  const details = application.details || {};
  const profileCompletion = toPercent(
    countCompleted(details, PROFILE_FIELDS),
    PROFILE_FIELDS.length
  );
  const academicCompletion = toPercent(
    countCompleted(details, ACADEMIC_FIELDS),
    ACADEMIC_FIELDS.length
  );
  const documentsCount = countCompleted(
    details,
    DOCUMENT_FIELDS.map((document) => document.key)
  );
  const documentsCompletion = toPercent(documentsCount, DOCUMENT_FIELDS.length);

  let finalCompletion = 45;
  if (application.statut === "Acceptee" || application.statut === "Rejetee") {
    finalCompletion = 100;
  } else if (documentsCompletion === 100 && profileCompletion >= 90 && academicCompletion >= 90) {
    finalCompletion = 78;
  } else if (documentsCompletion >= 60) {
    finalCompletion = 58;
  }

  const overallCompletion = Math.round(
    (profileCompletion + academicCompletion + documentsCompletion) / 3
  );

  return {
    profileCompletion,
    academicCompletion,
    documentsCompletion,
    documentsCount,
    finalCompletion,
    overallCompletion,
    readinessLabel: getCompletionLabel(overallCompletion),
  };
}

function StudentApplicationsIcon({ name }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "total":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M7 9h10" />
          <path d="M7 13h6" />
        </svg>
      );
    case "pending":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case "accepted":
      return (
        <svg {...commonProps}>
          <path d="M12 3l7 3v6c0 4.2-2.8 8.1-7 9-4.2-.9-7-4.8-7-9V6l7-3z" />
          <path d="M9.5 12.5l1.7 1.7 3.8-4.2" />
        </svg>
      );
    case "refused":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

StudentApplicationsIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

export default function MesCandidatures() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("toutes");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      const token = getAuthToken();

      if (!token) {
        navigate("/login", {
          replace: true,
          state: { message: "Session absente ou expiree. Veuillez vous reconnecter." },
        });
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const applicationsResponse = await listMyApplications();

        if (isMounted) {
          setApplications(applicationsResponse.map(mapApiApplication));
        }
      } catch (error) {
        if (isMounted) {
          const message = error.message || "Impossible de charger vos candidatures.";
          setLoadError(message);

          if (error.status === 401) {
            clearAuthSession();
            navigate("/login", { replace: true, state: { message } });
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const applicationsWithMetrics = useMemo(
    () =>
      [...applications]
        .map((application) => ({
          ...application,
          metrics: buildApplicationMetrics(application),
        }))
        .sort((first, second) => {
          const firstDate = new Date(first.submittedAt || first.dateDepot || 0);
          const secondDate = new Date(second.submittedAt || second.dateDepot || 0);
          return secondDate - firstDate;
        }),
    [applications]
  );

  const summary = useMemo(() => {
    const total = applicationsWithMetrics.length;
    const pending = applicationsWithMetrics.filter(
      (application) => application.statut === "En attente"
    ).length;
    const accepted = applicationsWithMetrics.filter(
      (application) => application.statut === "Acceptee"
    ).length;
    const refused = applicationsWithMetrics.filter(
      (application) => application.statut === "Rejetee"
    ).length;
    const incomplete = applicationsWithMetrics.filter(
      (application) => application.metrics.overallCompletion < 90
    ).length;

    return { total, pending, accepted, refused, incomplete };
  }, [applicationsWithMetrics]);

  const latestApplication = applicationsWithMetrics[0];

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return applicationsWithMetrics.filter((application) => {
      const matchesStatus =
        statusFilter === "toutes" ||
        (statusFilter === "attente" && application.statut === "En attente") ||
        (statusFilter === "acceptee" && application.statut === "Acceptee") ||
        (statusFilter === "rejetee" && application.statut === "Rejetee");

      const searchableText = [
        application.universite,
        application.specialite,
        application.statut,
        application.numeroDossier,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery === "" || searchableText.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [applicationsWithMetrics, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedApplications = filteredApplications.slice(
    (currentPageSafe - 1) * itemsPerPage,
    currentPageSafe * itemsPerPage
  );

  const statusTabs = [
    { id: "toutes", label: "Toutes", count: summary.total },
    { id: "attente", label: "En attente", count: summary.pending },
    { id: "acceptee", label: "Acceptees", count: summary.accepted },
    { id: "rejetee", label: "Refusees", count: summary.refused },
  ];

  const statCards = [
    {
      id: "total",
      label: "Total des candidatures",
      value: summary.total,
      detail:
        summary.total > 0
          ? `${summary.incomplete} dossier(s) restent a consolider`
          : "Aucune candidature deposee pour le moment",
      icon: "total",
      tone: "total",
      filter: "toutes",
    },
    {
      id: "pending",
      label: "En attente",
      value: summary.pending,
      detail: "Dossiers en cours de traitement administratif",
      icon: "pending",
      tone: "attente",
      filter: "attente",
    },
    {
      id: "accepted",
      label: "Acceptees",
      value: summary.accepted,
      detail: "Decisions favorables enregistrees",
      icon: "accepted",
      tone: "acceptee",
      filter: "acceptee",
    },
    {
      id: "refused",
      label: "Refusees",
      value: summary.refused,
      detail: "Decisions finales defavorables",
      icon: "refused",
      tone: "refusee",
      filter: "rejetee",
    },
  ];

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="student-candidatures-shell">
      <section className="student-dashboard-hero student-candidatures-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Suivi des candidatures</span>
          <h1>Mes candidatures</h1>
          <p className="student-dashboard-subtitle">
            Consultez et suivez l'etat de vos candidatures deposees.
          </p>
          <p className="student-dashboard-welcome">
            Retrouvez ici l'ensemble de vos dossiers, leur niveau de completude et les actions
            encore necessaires pour finaliser votre parcours d'admission.
          </p>
        </div>

        <div className="student-dashboard-hero-meta">
          <span className="admin-page-context info">
            {summary.total} candidature(s)
          </span>
          <span className={`admin-page-context ${summary.incomplete > 0 ? "warning" : "positive"}`}>
            {summary.incomplete > 0
              ? `${summary.incomplete} dossier(s) a completer`
              : "Tous les dossiers sont complets"}
          </span>
          <span className="admin-page-context neutral">
            Dernier depot{" "}
            {latestApplication
              ? formatShortDate(latestApplication.submittedAt || latestApplication.dateDepot)
              : "non disponible"}
          </span>
        </div>
      </section>

      {isLoading ? (
        <div className="student-profile-feedback student-profile-feedback-info" role="status">
          Chargement de vos candidatures...
        </div>
      ) : null}

      {loadError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {loadError}
        </div>
      ) : null}

      <section className="campus-section-container student-dashboard-panel">
        <div className="campus-section-header student-dashboard-section-head">
          <div>
            <h2>Resume rapide</h2>
            <p>Les indicateurs essentiels pour comprendre la situation de vos candidatures.</p>
          </div>
        </div>

        <div className="admin-primary-stats-grid student-candidatures-stats">
          {statCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`admin-primary-stat-card admin-primary-stat-card-${card.tone} student-summary-card`}
              onClick={() => setStatusFilter(card.filter)}
            >
              <div className="admin-primary-stat-head">
                <span className="admin-primary-stat-icon">
                  <StudentApplicationsIcon name={card.icon} />
                </span>
              </div>

              <div className="admin-primary-stat-body">
                <strong className="admin-primary-stat-value">{card.value}</strong>
                <h3 className="admin-primary-stat-label">{card.label}</h3>
                <p className="admin-primary-stat-detail">{card.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="campus-section-container student-dashboard-panel">
        <div className="student-candidatures-toolbar">
          <div className="student-candidatures-toolbar-copy">
            <h2>Liste des candidatures ({filteredApplications.length})</h2>
            <p>Recherchez, filtrez et ouvrez le detail de chacun de vos dossiers.</p>
          </div>

          <label className="admin-recent-search student-candidatures-search" htmlFor="studentApplicationsSearch">
            <span className="admin-recent-search-icon" aria-hidden="true">
              <StudentApplicationsIcon name="search" />
            </span>
            <input
              id="studentApplicationsSearch"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher une candidature..."
            />
          </label>
        </div>

        <div className="admin-filter-tabs student-candidatures-filter-tabs" role="tablist" aria-label="Filtrer mes candidatures par statut">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-filter-tab ${statusFilter === tab.id ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {isLoading || loadError ? null : filteredApplications.length === 0 ? (
          <EmptyState
            title={applicationsWithMetrics.length === 0 ? "Aucune candidature pour le moment" : "Aucun resultat"}
            description={
              applicationsWithMetrics.length === 0
                ? "Vous n'avez encore depose aucune candidature. Commencez votre premier dossier pour lancer votre parcours d'admission."
                : "Aucune candidature ne correspond a votre recherche ou au filtre selectionne."
            }
            actionLabel={applicationsWithMetrics.length === 0 ? "Deposer ma premiere candidature" : "Deposer une candidature"}
            actionTo="/student-step1"
            className="admin-empty-state student-candidatures-empty-state"
          />
        ) : (
          <>
            <div className="student-candidatures-list">
              {paginatedApplications.map((application) => {
                const isExpanded = expandedId === application.id;

                return (
                  <article key={application.id} className="student-candidature-card-v2">
                    <div className="student-candidature-card-main">
                      <div className="student-candidature-card-header">
                        <div className="student-candidature-title-block">
                          <h3>{application.specialite}</h3>
                          <p>{application.universite}</p>
                        </div>

                        <div className="student-candidature-status-block">
                          <StatusBadge status={application.statut} />
                          <span
                            className={`student-candidature-readiness ${
                              application.metrics.overallCompletion >= 90 ? "is-complete" : "is-incomplete"
                            }`}
                          >
                            {application.metrics.readinessLabel}
                          </span>
                        </div>
                      </div>

                      <div className="student-candidature-meta-grid">
                        <div className="student-candidature-meta-item">
                          <span>Universite</span>
                          <strong>{application.universite}</strong>
                        </div>
                        <div className="student-candidature-meta-item">
                          <span>Formation</span>
                          <strong>{application.specialite}</strong>
                        </div>
                        <div className="student-candidature-meta-item">
                          <span>Date de depot</span>
                          <strong>{formatDate(application.submittedAt || application.dateDepot)}</strong>
                        </div>
                        <div className="student-candidature-meta-item">
                          <span>Niveau</span>
                          <strong>{application.niveauDemande || "Non renseigne"}</strong>
                        </div>
                      </div>

                      <div className="student-candidature-progress-grid">
                        <div className="student-candidature-progress-card">
                          <div className="student-candidature-progress-head">
                            <span>Profil</span>
                            <strong>{application.metrics.profileCompletion}%</strong>
                          </div>
                          <ProgressBar
                            value={application.metrics.profileCompletion}
                            color={getCompletionColor(application.metrics.profileCompletion)}
                            label={`${application.metrics.profileCompletion}%`}
                            compact
                          />
                        </div>

                        <div className="student-candidature-progress-card">
                          <div className="student-candidature-progress-head">
                            <span>Documents</span>
                            <strong>{application.metrics.documentsCompletion}%</strong>
                          </div>
                          <ProgressBar
                            value={application.metrics.documentsCompletion}
                            color={getCompletionColor(application.metrics.documentsCompletion)}
                            label={`${application.metrics.documentsCompletion}%`}
                            compact
                          />
                        </div>

                        <div className="student-candidature-progress-card">
                          <div className="student-candidature-progress-head">
                            <span>Validation finale</span>
                            <strong>{application.metrics.finalCompletion}%</strong>
                          </div>
                          <ProgressBar
                            value={application.metrics.finalCompletion}
                            color={getCompletionColor(application.metrics.finalCompletion)}
                            label={`${application.metrics.finalCompletion}%`}
                            compact
                          />
                        </div>
                      </div>
                    </div>

                    <div className="student-candidature-card-side">
                      <div className="student-candidature-side-summary">
                        <span>Completude globale</span>
                        <strong>{application.metrics.overallCompletion}%</strong>
                        <small>
                          {application.metrics.documentsCount}/{DOCUMENT_FIELDS.length} document(s) deposes
                        </small>
                      </div>

                      <Button
                        className="admin-table-action-button"
                        onClick={() =>
                          setExpandedId((currentId) =>
                            currentId === application.id ? null : application.id
                          )
                        }
                      >
                        {isExpanded ? "Fermer" : "Consulter"}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="student-candidature-detail-panel">
                        <div className="student-candidature-detail-grid">
                          <section className="student-candidature-detail-card">
                            <h4>Informations personnelles</h4>
                            <div className="student-candidature-detail-list">
                              <div><span>Nom</span><strong>{application.details.nom || "Non renseigne"}</strong></div>
                              <div><span>Prenom</span><strong>{application.details.prenom || "Non renseigne"}</strong></div>
                              <div><span>Date de naissance</span><strong>{application.details.dateNaiss || "Non renseignee"}</strong></div>
                              <div><span>Lieu de naissance</span><strong>{application.details.lieuNaiss || "Non renseigne"}</strong></div>
                              <div><span>Nationalite</span><strong>{application.details.nationalite || "Non renseignee"}</strong></div>
                              <div><span>Telephone</span><strong>{application.details.telephone || "Non renseigne"}</strong></div>
                              <div><span>Email</span><strong>{application.details.email || "Non renseigne"}</strong></div>
                            </div>
                          </section>

                          <section className="student-candidature-detail-card">
                            <h4>Informations academiques</h4>
                            <div className="student-candidature-detail-list">
                              <div><span>Type du bac</span><strong>{application.details.typeBac || "Non renseigne"}</strong></div>
                              <div><span>Annee du bac</span><strong>{application.details.anneeBac || "Non renseignee"}</strong></div>
                              <div><span>Moyenne generale</span><strong>{application.details.moyenneBac || "Non renseignee"}</strong></div>
                              <div><span>Mention</span><strong>{application.details.mention || "Non precisee"}</strong></div>
                              <div><span>Formation</span><strong>{application.specialite || "Non renseignee"}</strong></div>
                              <div><span>Universite</span><strong>{application.universite || "Non renseignee"}</strong></div>
                              <div><span>Niveau demande</span><strong>{application.niveauDemande || "Non renseigne"}</strong></div>
                            </div>
                          </section>
                        </div>

                        {application.motivation ? (
                          <section className="student-candidature-detail-card student-candidature-documents-card">
                            <h4>Motivation</h4>
                            <p>{application.motivation}</p>
                          </section>
                        ) : null}

                        <section className="student-candidature-detail-card student-candidature-documents-card">
                          <div className="student-candidature-documents-head">
                            <h4>Documents du dossier</h4>
                            <span className={`admin-page-context ${application.metrics.documentsCompletion === 100 ? "positive" : "warning"}`}>
                              {application.metrics.documentsCount}/{DOCUMENT_FIELDS.length} pieces
                            </span>
                          </div>

                          <div className="student-candidature-documents-list">
                            {DOCUMENT_FIELDS.map((document) => {
                              const fileName = application.details[document.key];
                              const isSubmitted = hasValue(fileName);

                              return (
                                <div key={document.key} className="student-candidature-document-row">
                                  <div className="student-candidature-document-copy">
                                    <strong>{document.label}</strong>
                                    <span>{isSubmitted ? fileName : "Document non fourni"}</span>
                                  </div>
                                  <span
                                    className={`student-document-status ${
                                      isSubmitted ? "is-submitted" : "is-missing"
                                    }`}
                                  >
                                    {isSubmitted ? "Depose" : "Manquant"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="admin-pagination student-candidatures-pagination">
              <span className="admin-pagination-info">
                Affichage de {paginatedApplications.length} candidature(s) sur {filteredApplications.length}.
              </span>

              <div className="student-candidatures-pagination-controls">
                <label className="student-candidatures-page-size">
                  <span>Afficher</span>
                  <select
                    value={itemsPerPage}
                    onChange={(event) => setItemsPerPage(Number(event.target.value))}
                    className="student-candidatures-page-size-select"
                  >
                    {[10, 25, 50].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {totalPages > 1 ? (
                  <div className="admin-pagination-buttons">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`admin-pagination-page-button ${
                          currentPageSafe === pageNumber ? "active" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </section>

      <div className="student-candidatures-footer-action">
        <Link to="/student-step1" className="student-dashboard-link">
          Deposer une nouvelle candidature
        </Link>
      </div>
    </div>
  );
}
