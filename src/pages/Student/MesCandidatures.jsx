import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import CustomSelect from "../../components/ui/CustomSelect";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { listMyApplications } from "../../services/applicationService";
import { clearAuthSession, getApiErrorMessage, getAuthToken } from "../../services/authService";
import { listMyDocuments } from "../../services/documentService";
import { fetchMyProfile } from "../../services/profileService";
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
  "wilaya",
  "commune",
];

const ACADEMIC_FIELDS = [
  "anneeBac",
  "moyenneBac",
  "serieBac",
  "filiere",
  "etablissement",
  "niveauDemande",
];

const DOCUMENT_FIELDS = [
  { key: "releveNotes", label: "Relevé de notes du baccalauréat", required: true },
  { key: "attestationReussite", label: "Attestation de réussite au bac", required: true },
  { key: "carteIdentite", label: "Pièce d'identité nationale", required: true },
  { key: "photo", label: "Photo d'identité", required: true },
  { key: "residence", label: "Certificat de résidence", required: true },
  { key: "justificatifParticulier", label: "Justificatif particulier", required: false },
];

const REQUIRED_DOCUMENT_FIELDS = DOCUMENT_FIELDS.filter((document) => document.required);

const DOCUMENT_FIELD_BY_TYPE = {
  diplome: "attestationReussite",
  "attestation de reussite au baccalaureat": "attestationReussite",
  "copie du bac ou diplome": "attestationReussite",
  "releve de notes": "releveNotes",
  "releve de notes du baccalaureat": "releveNotes",
  "passeport / carte d'identite": "carteIdentite",
  "carte d'identite ou passeport": "carteIdentite",
  "piece d'identite": "carteIdentite",
  "photo d'identite": "photo",
  "lettre de motivation": "photo",
  "certificat de residence": "residence",
  "certificat de langue": "residence",
  cv: "justificatifParticulier",
  "justificatif particulier": "justificatifParticulier",
};

function hasValue(value) {
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

function formatDate(value) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  const cleanStatus = String(status || "").trim();
  const normalizedStatus = normalizeKey(cleanStatus);

  if (normalizedStatus.startsWith("accept")) {
    return "Acceptee";
  }

  if (normalizedStatus.startsWith("refus") || normalizedStatus.startsWith("rejet")) {
    return "Rejetee";
  }

  return "En attente";
}

function buildNumeroDossier(application) {
  const date = new Date(application.date_depot || application.dateDepot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function countCompleted(details, fields) {
  return fields.filter((field) => hasValue(details?.[field])).length;
}

function getCompletionColor(percentage) {
  if (percentage >= 90) return "#059669";
  if (percentage >= 65) return "#2563eb";
  if (percentage >= 40) return "#d97706";
  return "#dc2626";
}

function getCompletionLabel(percentage) {
  if (percentage >= 90) return "Dossier complet";
  if (percentage >= 65) return "Dossier avancé";
  return "Dossier à compléter";
}

function mapApiProfileToDetails(profile = {}) {
  return {
    nom: profile.nom || "",
    prenom: profile.prenom || "",
    dateNaiss: profile.date_naissance || "",
    lieuNaiss: profile.lieu_naissance || "",
    sexe: profile.sexe || "",
    nationalite: profile.nationalite || "",
    telephone: profile.telephone || "",
    email: profile.email || "",
    adresse: profile.adresse || "",
    wilaya: profile.wilaya || "",
    commune: profile.commune || "",
    diplomeActuel: profile.serie_bac || profile.diplome_actuel || "",
    typeBac: profile.serie_bac || profile.diplome_actuel || "",
    etablissementActuel: profile.lycee_origine || profile.etablissement || "",
    anneeBac: profile.annee_bac || profile.annee_obtention || "",
    moyenneBac: profile.moyenne_bac || profile.moyenne || "",
    mention: profile.mention_bac || "",
    serieBac: profile.serie_bac || profile.diplome_actuel || "",
    numeroInscriptionBac: profile.numero_inscription_bac || "",
    lyceeOrigine: profile.lycee_origine || profile.etablissement || "",
    wilayaLycee: profile.wilaya_lycee || "",
  };
}

function mapApiDocumentsToDetails(documents = [], applicationId) {
  return documents.reduce((details, document) => {
    if (
      document.application_id &&
      String(document.application_id) !== String(applicationId)
    ) {
      return details;
    }

    const fieldName = DOCUMENT_FIELD_BY_TYPE[normalizeKey(document.type_document)];
    if (fieldName && !details[fieldName]) {
      details[fieldName] = document.nom_fichier || "";
    }

    return details;
  }, {});
}

function mapApiApplication(application, profileDetails = {}, documentDetails = {}) {
  const statut = normalizeStatus(application.statut);
  const etablissement = application.etablissement || application.universite || "";
  const filiere = application.filiere || application.formation || "";

  return {
    id: application.id,
    universite: etablissement,
    etablissement,
    specialite: filiere,
    filiere,
    domaine: application.domaine || "",
    faculteInstitut: application.faculte_institut || "",
    wilayaEtablissement: application.wilaya_etablissement || "",
    typeEtablissement: application.type_etablissement || "",
    niveauDemande: application.niveau || "",
    motivation: application.motivation || "",
    statut,
    dateDepot: application.date_depot,
    submittedAt: application.date_depot,
    numeroDossier: buildNumeroDossier(application),
    commentaireAdmin: application.commentaire_admin || "",
    details: {
      ...profileDetails,
      ...documentDetails,
      universite: etablissement,
      etablissement,
      specialite: filiere,
      filiere,
      domaine: application.domaine || "",
      faculteInstitut: application.faculte_institut || "",
      wilayaEtablissement: application.wilaya_etablissement || "",
      typeEtablissement: application.type_etablissement || "",
      niveauDemande: application.niveau || "",
      motivation: application.motivation || "",
    },
  };
}

function buildApplicationMetrics(application) {
  const details = application.details || {};
  const profileCompletion = toPercent(countCompleted(details, PROFILE_FIELDS), PROFILE_FIELDS.length);
  const academicCompletion = toPercent(
    countCompleted(details, ACADEMIC_FIELDS),
    ACADEMIC_FIELDS.length
  );
  const documentsCount = countCompleted(
    details,
    REQUIRED_DOCUMENT_FIELDS.map((document) => document.key)
  );
  const documentsCompletion = toPercent(documentsCount, REQUIRED_DOCUMENT_FIELDS.length);

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
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("toutes");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // chargement des candidatures, documents et profil etudiant
  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      const token = getAuthToken();
      if (!token) {
        navigate("/login", {
          replace: true,
          state: { message: "Session expirée. Veuillez vous reconnecter." },
        });
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const [applicationsResult, documentsResult, profileResult] = await Promise.allSettled([
          listMyApplications(),
          listMyDocuments(),
          fetchMyProfile(),
        ]);

        const authError = [applicationsResult, documentsResult, profileResult].find(
          (result) => result.status === "rejected" && result.reason?.status === 401
        );

        if (authError) {
          throw authError.reason;
        }

        if (applicationsResult.status === "rejected") {
          throw applicationsResult.reason;
        }

        const applicationsResponse = applicationsResult.value;
        const documentsResponse =
          documentsResult.status === "fulfilled" ? documentsResult.value : [];
        const profileResponse = profileResult.status === "fulfilled" ? profileResult.value : {};
        const profileDetails = mapApiProfileToDetails(profileResponse);

        if (isMounted) {
          setApplications(
            applicationsResponse.map((application) =>
              mapApiApplication(
                application,
                profileDetails,
                mapApiDocumentsToDetails(documentsResponse, application.id)
              )
            )
          );
        }
      } catch (error) {
        if (isMounted) {
          const message = getApiErrorMessage(
            error,
            "Impossible de charger vos candidatures. Réessayez ultérieurement."
          );
          setLoadError(message);
          if (error.status === 401) {
            clearAuthSession();
            navigate("/login", { replace: true, state: { message } });
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, [navigate, reloadKey]);

  // calcul de la progression de chaque dossier
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

  // recherche et filtrage dans les candidatures de l'etudiant
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

      return matchesStatus && (normalizedQuery === "" || searchableText.includes(normalizedQuery));
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
    { id: "acceptee", label: "Acceptées", count: summary.accepted },
    { id: "rejetee", label: "Refusées", count: summary.refused },
  ];

  const statCards = [
    {
      id: "total",
      label: "Total",
      value: summary.total,
      detail:
        summary.total > 0
          ? `${summary.incomplete} dossier(s) à compléter`
          : "Aucune candidature déposée",
      icon: "total",
      tone: "total",
      filter: "toutes",
    },
    {
      id: "pending",
      label: "En attente",
      value: summary.pending,
      detail: "Dossiers en cours d'examen",
      icon: "pending",
      tone: "attente",
      filter: "attente",
    },
    {
      id: "accepted",
      label: "Acceptées",
      value: summary.accepted,
      detail: "Décisions favorables",
      icon: "accepted",
      tone: "acceptee",
      filter: "acceptee",
    },
    {
      id: "refused",
      label: "Refusées",
      value: summary.refused,
      detail: "Décisions défavorables",
      icon: "refused",
      tone: "refusee",
      filter: "rejetee",
    },
  ];

  return (
    <div className="student-candidatures-shell">
      <section className="student-dashboard-hero student-candidatures-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Espace étudiant</span>
          <h1>Mes candidatures</h1>
          <p className="student-dashboard-subtitle">
            Consultez et suivez l'état de vos dossiers de candidature.
          </p>
          <p className="student-dashboard-welcome">
            Retrouvez ici l'ensemble de vos candidatures, leur niveau de complétude et les
            actions nécessaires pour finaliser votre parcours d'admission.
          </p>
        </div>

        <div className="student-dashboard-hero-meta">
          <span className="admin-page-context info">
            {summary.total} candidature(s) déposée(s)
          </span>
          <span className={`admin-page-context ${summary.incomplete > 0 ? "warning" : "positive"}`}>
            {summary.incomplete > 0
              ? `${summary.incomplete} dossier(s) à compléter`
              : "Tous vos dossiers sont complets"}
          </span>
          <span className="admin-page-context neutral">
            Dernier dépôt :{" "}
            {latestApplication
              ? formatShortDate(latestApplication.submittedAt || latestApplication.dateDepot)
              : "-"}
          </span>
        </div>
      </section>

      {isLoading && (
        <div className="student-profile-feedback student-profile-feedback-info" role="status">
          Chargement de vos candidatures...
        </div>
      )}

      {loadError && (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {loadError}
          <Button
            className="student-application-button student-application-button-secondary"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
          >
            Réessayer
          </Button>
        </div>
      )}

      <section className="campus-section-container student-dashboard-panel">
        <div className="campus-section-header student-dashboard-section-head">
          <div>
            <h2>Vue d'ensemble</h2>
            <p>Indicateurs clés de vos candidatures en cours.</p>
          </div>
        </div>

        <div className="admin-primary-stats-grid student-candidatures-stats">
          {statCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`admin-primary-stat-card admin-primary-stat-card-${card.tone} student-summary-card`}
              onClick={() => setStatusFilter(card.filter)}
              aria-pressed={statusFilter === card.filter}
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
            <p>Recherchez et consultez le détail de chacun de vos dossiers.</p>
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
              placeholder="Rechercher par filière, établissement, numéro de dossier..."
            />
          </label>
        </div>

        <div
          className="admin-filter-tabs student-candidatures-filter-tabs"
          role="tablist"
          aria-label="Filtrer par statut"
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.id}
              className={`admin-filter-tab ${statusFilter === tab.id ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {!isLoading && !loadError && filteredApplications.length === 0 ? (
          <EmptyState
            title={
              applicationsWithMetrics.length === 0
                ? "Aucune candidature pour le moment"
                : "Aucun résultat"
            }
            description={
              applicationsWithMetrics.length === 0
                ? "Vous n'avez encore déposé aucune candidature. Commencez votre premier dossier pour lancer votre parcours d'admission."
                : "Aucune candidature ne correspond à votre recherche ou au filtre sélectionné."
            }
            actionLabel="Déposer une candidature"
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
                          <h3>{application.specialite || "Filière non renseignée"}</h3>
                          <p>{application.universite || "Établissement non renseigné"}</p>
                        </div>
                        <div className="student-candidature-status-block">
                          <StatusBadge status={application.statut} />
                          <span
                            className={`student-candidature-readiness ${
                              application.metrics.overallCompletion >= 90
                                ? "is-complete"
                                : "is-incomplete"
                            }`}
                          >
                            {application.metrics.readinessLabel}
                          </span>
                        </div>
                      </div>

                      <div className="student-candidature-meta-grid">
                        <div className="student-candidature-meta-item">
                          <span>Numéro de dossier</span>
                          <strong>{application.numeroDossier}</strong>
                        </div>
                        <div className="student-candidature-meta-item">
                          <span>Filière</span>
                          <strong>{application.specialite || "-"}</strong>
                        </div>
                        <div className="student-candidature-meta-item">
                          <span>Date de dépôt</span>
                          <strong>{formatDate(application.submittedAt || application.dateDepot)}</strong>
                        </div>
                        <div className="student-candidature-meta-item">
                          <span>Niveau demandé</span>
                          <strong>{application.niveauDemande || "-"}</strong>
                        </div>
                      </div>

                      <div className="student-candidature-progress-grid">
                        {[
                          { label: "Profil personnel", value: application.metrics.profileCompletion },
                          { label: "Pièces justificatives", value: application.metrics.documentsCompletion },
                          { label: "Validation finale", value: application.metrics.finalCompletion },
                        ].map(({ label, value }) => (
                          <div key={label} className="student-candidature-progress-card">
                            <div className="student-candidature-progress-head">
                              <span>{label}</span>
                              <strong>{value}%</strong>
                            </div>
                            <ProgressBar
                              value={value}
                              color={getCompletionColor(value)}
                              label={`${value}%`}
                              compact
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="student-candidature-card-side">
                      <div className="student-candidature-side-summary">
                        <span>Complétude globale</span>
                        <strong>{application.metrics.overallCompletion}%</strong>
                        <small>
                          {application.metrics.documentsCount}/{REQUIRED_DOCUMENT_FIELDS.length} pièce(s) déposée(s)
                        </small>
                      </div>

                      <Button
                        className="admin-table-action-button"
                        onClick={() =>
                          setExpandedId((currentId) =>
                            currentId === application.id ? null : application.id
                          )
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Réduire" : "Voir le détail"}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="student-candidature-detail-panel">
                        <div className="student-candidature-detail-grid">
                          <section className="student-candidature-detail-card">
                            <h4>Informations personnelles</h4>
                            <div className="student-candidature-detail-list">
                              {[
                                ["Nom", application.details.nom],
                                ["Prénom", application.details.prenom],
                                ["Date de naissance", application.details.dateNaiss],
                                ["Lieu de naissance", application.details.lieuNaiss],
                                ["Nationalité", application.details.nationalite],
                                ["Téléphone", application.details.telephone],
                                ["Adresse e-mail", application.details.email],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <span>{label}</span>
                                  <strong>{value || "Non renseigné"}</strong>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="student-candidature-detail-card">
                            <h4>Informations académiques</h4>
                            <div className="student-candidature-detail-list">
                              {[
                                ["Série du baccalauréat", application.details.serieBac || application.details.typeBac],
                                ["Année d'obtention", application.details.anneeBac],
                                [
                                  "Moyenne générale",
                                  application.details.moyenneBac
                                    ? `${application.details.moyenneBac} / 20`
                                    : null,
                                ],
                                ["Mention", application.details.mention],
                                ["Filière souhaitée", application.filiere || application.specialite],
                                ["Établissement choisi", application.etablissement || application.universite],
                                ["Niveau demandé", application.niveauDemande],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <span>{label}</span>
                                  <strong>{value || "Non renseigné"}</strong>
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>

                        {application.commentaireAdmin ? (
                          <section className="student-candidature-detail-card student-candidature-documents-card">
                            <h4>Remarque de l'administration</h4>
                            <p>{application.commentaireAdmin}</p>
                          </section>
                        ) : null}

                        {application.motivation ? (
                          <section className="student-candidature-detail-card student-candidature-documents-card">
                            <h4>Observations / Motivation</h4>
                            <p>{application.motivation}</p>
                          </section>
                        ) : null}

                        <section className="student-candidature-detail-card student-candidature-documents-card">
                          <div className="student-candidature-documents-head">
                            <h4>Pièces justificatives</h4>
                            <span
                              className={`admin-page-context ${
                                application.metrics.documentsCompletion === 100
                                  ? "positive"
                                  : "warning"
                              }`}
                            >
                              {application.metrics.documentsCount}/{REQUIRED_DOCUMENT_FIELDS.length} pièces obligatoires déposées
                            </span>
                          </div>

                          <div className="student-candidature-documents-list">
                            {DOCUMENT_FIELDS.map((document) => {
                              const isSubmitted = hasValue(application.details[document.key]);
                              return (
                                <div key={document.key} className="student-candidature-document-row">
                                  <div className="student-candidature-document-copy">
                                    <strong>
                                      {document.label}
                                      {document.required && <span aria-label="Obligatoire"> *</span>}
                                    </strong>
                                    <span>
                                      {isSubmitted
                                        ? "Document déposé."
                                        : document.required
                                          ? "Document obligatoire manquant."
                                          : "Document optionnel non fourni."}
                                    </span>
                                  </div>
                                  <span
                                    className={`student-document-status ${
                                      isSubmitted ? "is-submitted" : "is-missing"
                                    }`}
                                  >
                                    {isSubmitted ? "Déposé" : "Manquant"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="admin-pagination student-candidatures-pagination">
              <span className="admin-pagination-info">
                {paginatedApplications.length} candidature(s) affichée(s) sur{" "}
                {filteredApplications.length}
              </span>

              <div className="student-candidatures-pagination-controls">
                <label className="student-candidatures-page-size">
                  <span>Par page :</span>
                  <CustomSelect
                    value={itemsPerPage}
                    onChange={(event) => setItemsPerPage(Number(event.target.value))}
                    className="student-candidatures-page-size-select"
                  >
                    {[10, 25, 50].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </CustomSelect>
                </label>

                {totalPages > 1 && (
                  <div className="admin-pagination-buttons">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`admin-pagination-page-button ${
                          currentPageSafe === pageNumber ? "active" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                        aria-current={currentPageSafe === pageNumber ? "page" : undefined}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <div className="student-candidatures-footer-action">
        <Link to="/student-step1" className="student-dashboard-link">
          Déposer une nouvelle candidature
        </Link>
      </div>
    </div>
  );
}
