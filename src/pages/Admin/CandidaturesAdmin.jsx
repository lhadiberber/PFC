import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import { listAdminApplications } from "../../services/adminService";
import { downloadCsv } from "../../utils/exportCsv";
import { downloadPdfReport } from "../../utils/exportPdf";
import {
  formatAdminDate,
  getApplicationAgeInDays,
  getAdminPriorityMeta,
  getAdminProgress,
  getAdminStats,
  toAdminApplication,
} from "../../utils/adminApplications";
import "../../index.css";

function normalize(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

function isToday(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function sortCandidatures(items, sortField, sortDirection) {
  const factor = sortDirection === "asc" ? 1 : -1;

  return [...items].sort((first, second) => {
    switch (sortField) {
      case "nom":
        return normalize(first.nom).localeCompare(normalize(second.nom)) * factor;
      case "universite":
        return normalize(first.universite).localeCompare(normalize(second.universite)) * factor;
      case "statut":
        return normalize(first.statut).localeCompare(normalize(second.statut)) * factor;
      case "specialite":
        return normalize(first.specialite).localeCompare(normalize(second.specialite)) * factor;
      case "priorite":
        return (
          getAdminPriorityMeta(first.adminMeta?.internalPriority).weight -
          getAdminPriorityMeta(second.adminMeta?.internalPriority).weight
        ) * factor;
      case "miseajour":
        return (
          new Date(first.adminMeta?.lastUpdatedAt || first.dateDepot) -
          new Date(second.adminMeta?.lastUpdatedAt || second.dateDepot)
        ) * factor;
      case "date":
      default:
        return (new Date(first.dateDepot) - new Date(second.dateDepot)) * factor;
    }
  });
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

export default function CandidaturesAdmin() {
  const navigate = useNavigate();
  const [adminApplicationsData, setAdminApplicationsData] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "tous");
  const [filterUniversity, setFilterUniversity] = useState(searchParams.get("university") || "toutes");
  const [filterSpecialite, setFilterSpecialite] = useState(searchParams.get("specialite") || "toutes");
  const [filterCompletion, setFilterCompletion] = useState(searchParams.get("completion") || "tous");
  const [filterQueue, setFilterQueue] = useState(searchParams.get("queue") || "tous");
  const [filterManualPriority, setFilterManualPriority] = useState(
    searchParams.get("manualPriority") || "toutes"
  );
  const [filterAssignedTo, setFilterAssignedTo] = useState(searchParams.get("owner") || "tous");
  const [filterInternalStatus, setFilterInternalStatus] = useState(
    searchParams.get("internalStatus") || "tous"
  );
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadApplications() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expiree. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsLoadingApplications(true);
      setApplicationsError("");

      try {
        const data = await listAdminApplications();
        if (isActive) {
          setAdminApplicationsData(data);
        }
      } catch (error) {
        if (!isActive) return;

        if (error.status === 401) {
          const message = "Session expiree. Veuillez vous reconnecter.";
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setApplicationsError(
          error.status === 403
            ? "Acces refuse. Cette page est reservee aux administrateurs."
            : error.message || "Impossible de charger les candidatures."
        );
      } finally {
        if (isActive) {
          setIsLoadingApplications(false);
        }
      }
    }

    loadApplications();

    return () => {
      isActive = false;
    };
  }, [navigate, reloadKey]);

  useEffect(() => {
    setSearchQuery(searchParams.get("query") || "");
    setFilterStatus(searchParams.get("status") || "tous");
    setFilterUniversity(searchParams.get("university") || "toutes");
    setFilterSpecialite(searchParams.get("specialite") || "toutes");
    setFilterCompletion(searchParams.get("completion") || "tous");
    setFilterQueue(searchParams.get("queue") || "tous");
    setFilterManualPriority(searchParams.get("manualPriority") || "toutes");
    setFilterAssignedTo(searchParams.get("owner") || "tous");
    setFilterInternalStatus(searchParams.get("internalStatus") || "tous");
  }, [searchParams]);

  const updateRouteParams = (overrides = {}) => {
    const params = new URLSearchParams();
    const nextValues = {
      query: searchQuery,
      status: filterStatus,
      university: filterUniversity,
      specialite: filterSpecialite,
      completion: filterCompletion,
      queue: filterQueue,
      manualPriority: filterManualPriority,
      owner: filterAssignedTo,
      internalStatus: filterInternalStatus,
      ...overrides,
    };

    if (nextValues.query) {
      params.set("query", nextValues.query);
    }
    if (nextValues.status && nextValues.status !== "tous") {
      params.set("status", nextValues.status);
    }
    if (nextValues.university && nextValues.university !== "toutes") {
      params.set("university", nextValues.university);
    }
    if (nextValues.specialite && nextValues.specialite !== "toutes") {
      params.set("specialite", nextValues.specialite);
    }
    if (nextValues.completion && nextValues.completion !== "tous") {
      params.set("completion", nextValues.completion);
    }
    if (nextValues.queue && nextValues.queue !== "tous") {
      params.set("queue", nextValues.queue);
    }
    if (nextValues.manualPriority && nextValues.manualPriority !== "toutes") {
      params.set("manualPriority", nextValues.manualPriority);
    }
    if (nextValues.owner && nextValues.owner !== "tous") {
      params.set("owner", nextValues.owner);
    }
    if (nextValues.internalStatus && nextValues.internalStatus !== "tous") {
      params.set("internalStatus", nextValues.internalStatus);
    }

    setSearchParams(params, { replace: true });
  };

  const applicationsSource = adminApplicationsData;
  const adminApplications = useMemo(
    () => applicationsSource.map(toAdminApplication),
    [applicationsSource]
  );
  const adminStats = useMemo(() => getAdminStats(adminApplications), [adminApplications]);
  const universityOptions = useMemo(
    () => [...new Set(adminApplications.map((item) => item.universite))].sort(),
    [adminApplications]
  );
  const specialiteOptions = useMemo(
    () => [...new Set(adminApplications.map((item) => item.specialite).filter(Boolean))].sort(),
    [adminApplications]
  );
  const assignedToOptions = useMemo(
    () =>
      [
        ...new Set(
          adminApplications
            .map((item) => item.adminMeta?.assignedTo)
            .filter((value) => value && value.trim() !== "")
        ),
      ].sort(),
    [adminApplications]
  );

  const filteredCandidatures = useMemo(() => {
    const query = normalize(searchQuery);

    return adminApplications.filter((candidature) => {
      const progress = getAdminProgress(candidature);
      const isComplete =
        progress.profil === 100 && progress.documents === 100 && progress.academique === 100;
      const ageDays = getApplicationAgeInDays(candidature);
      const isPending = candidature.statut === "En attente";
      const isRecentSubmission = isPending && ageDays <= 1;
      const isUnderReview = isPending && isComplete && !isRecentSubmission && ageDays <= 5;
      const isReadyDecision = isPending && isComplete && ageDays > 5;
      const isDelayed = isPending && ageDays > 7;
      const isReceivedToday = isToday(candidature.submittedAt || candidature.dateDepot || candidature.date);

      const matchesSearch =
        !query ||
        [
          candidature.nom,
          candidature.universite,
          candidature.specialite,
          candidature.numeroDossier,
          candidature.details?.email,
        ].some((value) => normalize(value).includes(query));

      const matchesStatus =
        filterStatus === "tous" ||
        (filterStatus === "finalisees" &&
          (candidature.statut === "Acceptee" || candidature.statut === "Rejetee")) ||
        (filterStatus === "attente" && candidature.statut === "En attente") ||
        (filterStatus === "acceptee" && candidature.statut === "Acceptee") ||
        (filterStatus === "refusee" && candidature.statut === "Rejetee");

      const matchesUniversity =
        filterUniversity === "toutes" || candidature.universite === filterUniversity;
      const matchesSpecialite =
        filterSpecialite === "toutes" || candidature.specialite === filterSpecialite;

      const matchesCompletion =
        filterCompletion === "tous" ||
        (filterCompletion === "complets" && isComplete) ||
        (filterCompletion === "incomplets" && !isComplete);

      const matchesQueue =
        filterQueue === "tous" ||
        (filterQueue === "retard" && isDelayed) ||
        (filterQueue === "pret" && isReadyDecision) ||
        (filterQueue === "review" && isUnderReview) ||
        (filterQueue === "recent" && isRecentSubmission) ||
        (filterQueue === "today" && isReceivedToday);
      const matchesManualPriority =
        filterManualPriority === "toutes" ||
        candidature.adminMeta?.internalPriority === filterManualPriority;
      const matchesAssignedTo =
        filterAssignedTo === "tous" ||
        (filterAssignedTo === "non-assigne" &&
          (!candidature.adminMeta?.assignedTo || candidature.adminMeta.assignedTo.trim() === "")) ||
        candidature.adminMeta?.assignedTo === filterAssignedTo;
      const matchesInternalStatus =
        filterInternalStatus === "tous" ||
        candidature.adminMeta?.internalStatus === filterInternalStatus;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesUniversity &&
        matchesSpecialite &&
        matchesCompletion &&
        matchesQueue &&
        matchesManualPriority &&
        matchesAssignedTo &&
        matchesInternalStatus
      );
    });
  }, [
    adminApplications,
    filterAssignedTo,
    filterCompletion,
    filterInternalStatus,
    filterManualPriority,
    filterQueue,
    filterSpecialite,
    filterStatus,
    filterUniversity,
    searchQuery,
  ]);

  const sortedCandidatures = useMemo(
    () => sortCandidatures(filteredCandidatures, sortField, sortDirection),
    [filteredCandidatures, sortDirection, sortField]
  );

  const totalPages = Math.max(1, Math.ceil(sortedCandidatures.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedCandidatures = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedCandidatures.slice(start, start + pageSize);
  }, [pageSize, safePage, sortedCandidatures]);

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    filterAssignedTo,
    filterCompletion,
    filterInternalStatus,
    filterManualPriority,
    filterQueue,
    filterSpecialite,
    filterStatus,
    filterUniversity,
    sortField,
    sortDirection,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    updateRouteParams({ query: value });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("tous");
    setFilterUniversity("toutes");
    setFilterSpecialite("toutes");
    setFilterCompletion("tous");
    setFilterQueue("tous");
    setFilterManualPriority("toutes");
    setFilterAssignedTo("tous");
    setFilterInternalStatus("tous");
    setSortField("date");
    setSortDirection("desc");
    setPageSize(10);
    setShowAdvancedFilters(false);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const counters = {
    tous: adminStats.totalCandidatures,
    attente: adminStats.enAttente,
    acceptee: adminStats.acceptees,
    refusee: adminStats.refusees,
    finalisees: adminStats.finalisees,
  };
  const advancedFilterSummary = [
    filterUniversity !== "toutes" ? `Universite : ${filterUniversity}` : null,
    filterSpecialite !== "toutes" ? `Specialite : ${filterSpecialite}` : null,
    filterCompletion !== "tous"
      ? `Completude : ${filterCompletion === "complets" ? "Complets" : "Incomplets"}`
      : null,
    filterQueue !== "tous"
      ? `File : ${
          {
            recent: "Soumis recemment",
            review: "En cours d'etude",
            retard: "Retard > 7 j",
            pret: "Prets a decider",
            today: "Soumissions du jour",
          }[filterQueue]
        }`
      : null,
    filterManualPriority !== "toutes" ? `Priorite : ${filterManualPriority}` : null,
    filterAssignedTo !== "tous"
      ? `Affectation : ${
          filterAssignedTo === "non-assigne" ? "Non assignes" : filterAssignedTo
        }`
      : null,
    filterInternalStatus !== "tous"
      ? `Statut interne : ${
          {
            qualification: "Qualification",
            instruction: "Instruction",
            commission: "Commission",
            decision: "Decision",
            "decision-finalisee": "Decision finalisee",
          }[filterInternalStatus]
        }`
      : null,
    sortField !== "date"
      ? `Tri : ${
          {
            date: "Date",
            nom: "Nom",
            universite: "Universite",
            specialite: "Specialite",
            statut: "Statut",
            priorite: "Priorite interne",
            miseajour: "Derniere mise a jour",
          }[sortField]
        }`
      : null,
    sortDirection !== "desc" ? "Ordre : Croissant" : null,
    pageSize !== 10 ? `${pageSize} par page` : null,
  ].filter(Boolean);
  const advancedFilterCount = advancedFilterSummary.length;

  const exportColumns = [
    { label: "Nom", getValue: (item) => item.nom },
    { label: "Numero de dossier", getValue: (item) => item.numeroDossier },
    { label: "Universite", getValue: (item) => item.universite },
    { label: "Specialite", getValue: (item) => item.specialite },
    { label: "Date de depot", getValue: (item) => formatAdminDate(item.date) },
    { label: "Statut", getValue: (item) => item.statut },
    {
      label: "Priorite interne",
      getValue: (item) => item.adminMeta?.internalPriorityLabel || "Moyenne",
    },
    {
      label: "Statut interne",
      getValue: (item) => item.adminMeta?.internalStatusLabel || "Qualification",
    },
    { label: "Affecte a", getValue: (item) => item.adminMeta?.assignedTo || "Non assigne" },
    {
      label: "Derniere mise a jour",
      getValue: (item) => formatAdminDate(item.adminMeta?.lastUpdatedAt),
    },
    { label: "Email", getValue: (item) => item.details?.email || "" },
  ];

  const handleExportCsv = () => {
    downloadCsv("candidatures-admin.csv", exportColumns, sortedCandidatures);
  };

  const handleExportPdf = () => {
    downloadPdfReport({
      title: "Rapport des candidatures",
      subtitle: "Version imprimable du filtre admin courant",
      columns: exportColumns,
      items: sortedCandidatures,
    });
  };

  const startIndex = sortedCandidatures.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(sortedCandidatures.length, safePage * pageSize);

  return (
    <AdminLayout
      title="Gestion des candidatures"
      subtitle="Consultez, triez et exportez les dossiers remontes du parcours etudiant"
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Rechercher un dossier, un etudiant ou une universite..."
    >
      {isLoadingApplications ? (
        <div className="student-profile-feedback">Chargement des candidatures...</div>
      ) : null}

      {applicationsError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {applicationsError}
          <Button
            className="admin-filter-tab"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
          >
            Reessayer
          </Button>
        </div>
      ) : null}

      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Filtres rapides</h2>
          <p>Statut visible en premier plan, criteres avances accessibles sur demande</p>
        </div>

        <div className="admin-filter-tabs">
            {[
              { id: "tous", label: "Tous" },
              { id: "attente", label: "En attente" },
              { id: "acceptee", label: "Acceptees" },
              { id: "refusee", label: "Refusees" },
              { id: "finalisees", label: "Finalisees" },
            ].map((tab) => (
            <Button
              key={tab.id}
              className={`admin-filter-tab ${filterStatus === tab.id ? "active" : ""}`}
              onClick={() => {
                setFilterStatus(tab.id);
                updateRouteParams({ status: tab.id });
              }}
            >
              {tab.label} ({counters[tab.id]})
            </Button>
          ))}
        </div>

        <div className="admin-candidatures-toolbar">
          <div className="admin-candidatures-toolbar-summary">
            <span className="admin-page-context neutral">
              {sortedCandidatures.length} dossier(s) correspondent a la vue courante
            </span>
            {advancedFilterCount > 0 ? (
              advancedFilterSummary.slice(0, 3).map((item) => (
                <span key={item} className="admin-page-context info">
                  {item}
                </span>
              ))
            ) : (
              <span className="admin-page-context positive">Aucun filtre avance actif</span>
            )}
            {advancedFilterCount > 3 ? (
              <span className="admin-page-context warning">
                +{advancedFilterCount - 3} autre(s) filtre(s)
              </span>
            ) : null}
          </div>

          <div className="admin-candidatures-toolbar-actions">
            <Button
              className={`admin-filter-tab admin-advanced-filter-toggle ${
                showAdvancedFilters ? "active" : ""
              }`}
              onClick={() => setShowAdvancedFilters((current) => !current)}
            >
              <span className="admin-advanced-filter-toggle-icon">
                <FilterIcon />
              </span>
              {advancedFilterCount > 0 ? `Filtres (${advancedFilterCount})` : "Filtres"}
            </Button>
            <Button className="admin-filter-tab admin-pdf-btn" onClick={handleExportPdf}>
              Export PDF
            </Button>
            <Button className="campus-btn-primary admin-export-btn" onClick={handleExportCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        {showAdvancedFilters ? (
          <div className="admin-candidatures-advanced-panel">
            <div className="admin-toolbar">
              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesUniversity">
                  Universite
                </label>
                <select
                  id="candidaturesUniversity"
                  className="admin-toolbar-select"
                  value={filterUniversity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterUniversity(value);
                    updateRouteParams({ university: value });
                  }}
                >
                  <option value="toutes">Toutes</option>
                  {universityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesSpecialite">
                  Specialite
                </label>
                <select
                  id="candidaturesSpecialite"
                  className="admin-toolbar-select"
                  value={filterSpecialite}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterSpecialite(value);
                    updateRouteParams({ specialite: value });
                  }}
                >
                  <option value="toutes">Toutes</option>
                  {specialiteOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesCompletion">
                  Completude
                </label>
                <select
                  id="candidaturesCompletion"
                  className="admin-toolbar-select"
                  value={filterCompletion}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterCompletion(value);
                    updateRouteParams({ completion: value });
                  }}
                >
                  <option value="tous">Tous</option>
                  <option value="complets">Complets</option>
                  <option value="incomplets">Incomplets</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesQueue">
                  File
                </label>
                <select
                  id="candidaturesQueue"
                  className="admin-toolbar-select"
                  value={filterQueue}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterQueue(value);
                    updateRouteParams({ queue: value });
                  }}
                >
                  <option value="tous">Toutes</option>
                  <option value="recent">Soumis recemment</option>
                  <option value="review">En cours d'etude</option>
                  <option value="retard">Retard {'>'} 7 j</option>
                  <option value="pret">Prets a decider</option>
                  <option value="today">Soumissions du jour</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesManualPriority">
                  Priorite manuelle
                </label>
                <select
                  id="candidaturesManualPriority"
                  className="admin-toolbar-select"
                  value={filterManualPriority}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterManualPriority(value);
                    updateRouteParams({ manualPriority: value });
                  }}
                >
                  <option value="toutes">Toutes</option>
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="critique">Critique</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesAssignedTo">
                  Affectation
                </label>
                <select
                  id="candidaturesAssignedTo"
                  className="admin-toolbar-select"
                  value={filterAssignedTo}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterAssignedTo(value);
                    updateRouteParams({ owner: value });
                  }}
                >
                  <option value="tous">Toutes</option>
                  <option value="non-assigne">Non assignes</option>
                  {assignedToOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="candidaturesInternalStatus">
                  Statut interne
                </label>
                <select
                  id="candidaturesInternalStatus"
                  className="admin-toolbar-select"
                  value={filterInternalStatus}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterInternalStatus(value);
                    updateRouteParams({ internalStatus: value });
                  }}
                >
                  <option value="tous">Tous</option>
                  <option value="qualification">Qualification</option>
                  <option value="instruction">Instruction</option>
                  <option value="commission">Commission</option>
                  <option value="decision">Decision</option>
                  <option value="decision-finalisee">Decision finalisee</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="sortField">
                  Trier par
                </label>
                <select
                  id="sortField"
                  className="admin-toolbar-select"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="nom">Nom</option>
                  <option value="universite">Universite</option>
                  <option value="specialite">Specialite</option>
                  <option value="statut">Statut</option>
                  <option value="priorite">Priorite interne</option>
                  <option value="miseajour">Derniere mise a jour</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="sortDirection">
                  Ordre
                </label>
                <select
                  id="sortDirection"
                  className="admin-toolbar-select"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value)}
                >
                  <option value="desc">Decroissant</option>
                  <option value="asc">Croissant</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="pageSize">
                  Par page
                </label>
                <select
                  id="pageSize"
                  className="admin-toolbar-select"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="admin-toolbar-actions">
                <Button className="admin-filter-tab" onClick={handleResetFilters}>
                  Reinitialiser
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Liste des candidatures</h2>
          <p>
            Affichage {startIndex}-{endIndex} sur {sortedCandidatures.length} dossier(s)
          </p>
        </div>

        <div className="admin-table-container">
          <table className="admin-table mobile-cards">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Dossier</th>
                <th>Universite</th>
                <th>Specialite</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Pilotage</th>
                <th>Progression</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCandidatures.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <EmptyState
                      title="Aucune candidature"
                      description="Aucun dossier ne correspond aux filtres choisis."
                      className="admin-empty-state"
                    />
                  </td>
                </tr>
              ) : (
                paginatedCandidatures.map((candidature) => {
                  const progress = getAdminProgress(candidature);

                  return (
                    <tr
                      key={candidature.id}
                      className="row-clickable"
                      onClick={() => navigate(`/admin/candidatures/${candidature.id}`)}
                    >
                      <td data-label="Nom">{candidature.nom}</td>
                      <td data-label="Dossier">{candidature.numeroDossier}</td>
                      <td data-label="Universite">{candidature.universite}</td>
                      <td data-label="Specialite">{candidature.specialite}</td>
                      <td data-label="Date">{formatAdminDate(candidature.date)}</td>
                      <td data-label="Statut">
                        <StatusBadge status={candidature.statut} />
                      </td>
                      <td data-label="Pilotage">
                        <div className="admin-table-meta">
                          <span
                            className={`admin-queue-pill ${candidature.adminMeta.internalPriorityTone}`}
                          >
                            {candidature.adminMeta.internalPriorityLabel}
                          </span>
                          <span
                            className={`admin-queue-pill ${candidature.adminMeta.internalStatusTone}`}
                          >
                            {candidature.adminMeta.internalStatusLabel}
                          </span>
                          <span className="admin-table-meta-text">
                            {candidature.adminMeta.assignedTo || "Non assigne"}
                          </span>
                          <span className="admin-table-meta-subtext">
                            Mis a jour {formatAdminDate(candidature.adminMeta.lastUpdatedAt)}
                          </span>
                        </div>
                      </td>
                      <td data-label="Progression">
                        <div className="progress-group">
                          <div className="progress-item">
                            <span>Profil</span>
                            <ProgressBar value={progress.profil} label={`${progress.profil}%`} compact />
                          </div>
                          <div className="progress-item">
                            <span>Docs</span>
                            <ProgressBar value={progress.documents} label={`${progress.documents}%`} compact />
                          </div>
                        </div>
                      </td>
                      <td data-label="Action">
                        <Button
                          className="campus-btn-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/admin/candidatures/${candidature.id}`);
                          }}
                        >
                          Ouvrir
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <span className="admin-pagination-info">
            Page {safePage} / {totalPages}
          </span>
          <div className="admin-pagination-buttons">
            <Button
              className="admin-filter-tab"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
            >
              Precedent
            </Button>
            <Button
              className="admin-filter-tab"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
