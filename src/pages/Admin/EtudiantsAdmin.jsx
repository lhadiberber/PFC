import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdmissions } from "../../context/AdmissionsContext";
import { downloadCsv } from "../../utils/exportCsv";
import { downloadPdfReport } from "../../utils/exportPdf";
import { formatAdminDate, toAdminApplication } from "../../utils/adminApplications";
import {
  buildStudentRecords,
  getStudentStatusMeta,
  sortStudentRecords,
} from "../../utils/adminStudents";
import { showToast } from "../../utils/toast";
import "../../index.css";

function normalize(value) {
  return (value ?? "").toString().toLowerCase().trim();
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

function StudentStatIcon({ name }) {
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
    case "students":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-1.5A3.5 3.5 0 0 0 12.5 16h-1A3.5 3.5 0 0 0 8 19.5V21" />
          <circle cx="12" cy="9" r="3.5" />
          <path d="M20 21v-1a3 3 0 0 0-2.4-2.94" />
          <path d="M17.5 5.2a3 3 0 0 1 0 5.6" />
        </svg>
      );
    case "active":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "new":
      return (
        <svg {...commonProps}>
          <path d="M12 3v18" />
          <path d="M3 12h18" />
        </svg>
      );
    case "accepted":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.8 12.3l2.1 2.2 4.5-5" />
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

StudentStatIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

export default function EtudiantsAdmin() {
  const navigate = useNavigate();
  const { applications } = useAdmissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [filter, setFilter] = useState(searchParams.get("filter") || "tous");
  const [filterUniversity, setFilterUniversity] = useState(
    searchParams.get("university") || "toutes"
  );
  const [filterSpecialite, setFilterSpecialite] = useState(
    searchParams.get("specialite") || "toutes"
  );
  const [filterAssignedTo, setFilterAssignedTo] = useState(
    searchParams.get("owner") || "tous"
  );
  const [filterInternalStatus, setFilterInternalStatus] = useState(
    searchParams.get("internalStatus") || "tous"
  );
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("query") || "");
    setFilter(searchParams.get("filter") || "tous");
    setFilterUniversity(searchParams.get("university") || "toutes");
    setFilterSpecialite(searchParams.get("specialite") || "toutes");
    setFilterAssignedTo(searchParams.get("owner") || "tous");
    setFilterInternalStatus(searchParams.get("internalStatus") || "tous");
  }, [searchParams]);

  const updateRouteParams = (overrides = {}) => {
    const params = new URLSearchParams();
    const nextValues = {
      query: searchQuery,
      filter,
      university: filterUniversity,
      specialite: filterSpecialite,
      owner: filterAssignedTo,
      internalStatus: filterInternalStatus,
      ...overrides,
    };

    if (nextValues.query) {
      params.set("query", nextValues.query);
    }
    if (nextValues.filter && nextValues.filter !== "tous") {
      params.set("filter", nextValues.filter);
    }
    if (nextValues.university && nextValues.university !== "toutes") {
      params.set("university", nextValues.university);
    }
    if (nextValues.specialite && nextValues.specialite !== "toutes") {
      params.set("specialite", nextValues.specialite);
    }
    if (nextValues.owner && nextValues.owner !== "tous") {
      params.set("owner", nextValues.owner);
    }
    if (nextValues.internalStatus && nextValues.internalStatus !== "tous") {
      params.set("internalStatus", nextValues.internalStatus);
    }

    setSearchParams(params, { replace: true });
  };

  const adminApplications = useMemo(
    () => applications.map(toAdminApplication),
    [applications]
  );
  const studentRecords = useMemo(
    () =>
      buildStudentRecords(adminApplications).map((student) => ({
        ...student,
        statusMeta: getStudentStatusMeta(student),
      })),
    [adminApplications]
  );

  const universityOptions = useMemo(
    () =>
      [...new Set(studentRecords.map((student) => student.latestUniversite).filter(Boolean))].sort(),
    [studentRecords]
  );
  const specialiteOptions = useMemo(
    () =>
      [...new Set(studentRecords.map((student) => student.latestProgramme).filter(Boolean))].sort(),
    [studentRecords]
  );
  const assignedToOptions = useMemo(
    () =>
      [
        ...new Set(
          studentRecords
            .map((student) => student.latestApplication?.adminMeta?.assignedTo)
            .filter((value) => value && value.trim() !== "")
        ),
      ].sort(),
    [studentRecords]
  );

  const advancedScopedStudents = useMemo(
    () =>
      studentRecords.filter((student) => {
        const matchesUniversity =
          filterUniversity === "toutes" || student.latestUniversite === filterUniversity;
        const matchesSpecialite =
          filterSpecialite === "toutes" || student.latestProgramme === filterSpecialite;
        const latestAssignedTo = student.latestApplication?.adminMeta?.assignedTo || "";
        const latestInternalStatus = student.latestApplication?.adminMeta?.internalStatus || "";
        const matchesAssignedTo =
          filterAssignedTo === "tous" ||
          (filterAssignedTo === "non-assigne" && !latestAssignedTo.trim()) ||
          latestAssignedTo === filterAssignedTo;
        const matchesInternalStatus =
          filterInternalStatus === "tous" || latestInternalStatus === filterInternalStatus;

        return (
          matchesUniversity &&
          matchesSpecialite &&
          matchesAssignedTo &&
          matchesInternalStatus
        );
      }),
    [
      filterAssignedTo,
      filterInternalStatus,
      filterSpecialite,
      filterUniversity,
      studentRecords,
    ]
  );

  const filteredStudents = useMemo(() => {
    const query = normalize(searchQuery);

    return advancedScopedStudents.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.fullName,
          student.prenom,
          student.nom,
          student.email,
          student.latestUniversite,
          student.latestProgramme,
        ].some((value) => normalize(value).includes(query));

      const matchesFilter =
        filter === "tous" ||
        (filter === "actifs" && student.statusMeta.key === "actif") ||
        (filter === "acceptee" && student.statusMeta.key === "acceptee") ||
        (filter === "refusee" && student.statusMeta.key === "refusee") ||
        (filter === "attente" && student.statusMeta.key === "attente");

      return matchesSearch && matchesFilter;
    });
  }, [advancedScopedStudents, filter, searchQuery]);

  const sortedStudents = useMemo(
    () => sortStudentRecords(filteredStudents, sortField, sortDirection),
    [filteredStudents, sortDirection, sortField]
  );

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [pageSize, safePage, sortedStudents]);

  useEffect(() => {
    setPage(1);
  }, [
    filter,
    filterAssignedTo,
    filterInternalStatus,
    filterSpecialite,
    filterUniversity,
    searchQuery,
    sortDirection,
    sortField,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const quickStats = {
    total: studentRecords.length,
    active: studentRecords.filter((student) => student.statusMeta.key === "actif").length,
    newThisWeek: studentRecords.filter((student) => student.isNewThisWeek).length,
    accepted: studentRecords.filter((student) => student.statusMeta.key === "acceptee").length,
  };
  const counters = {
    tous: advancedScopedStudents.length,
    actifs: advancedScopedStudents.filter((student) => student.statusMeta.key === "actif").length,
    acceptee: advancedScopedStudents.filter((student) => student.statusMeta.key === "acceptee")
      .length,
    refusee: advancedScopedStudents.filter((student) => student.statusMeta.key === "refusee")
      .length,
    attente: advancedScopedStudents.filter((student) => student.statusMeta.key === "attente")
      .length,
  };
  const advancedFilterSummary = [
    filterUniversity !== "toutes" ? `Universite : ${filterUniversity}` : null,
    filterSpecialite !== "toutes" ? `Programme : ${filterSpecialite}` : null,
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
            date: "Date inscription",
            nom: "Nom",
            universite: "Universite",
            programme: "Programme",
            statut: "Statut",
          }[sortField]
        }`
      : null,
    sortDirection !== "desc" ? "Ordre : Croissant" : null,
    pageSize !== 10 ? `${pageSize} par page` : null,
  ].filter(Boolean);
  const advancedFilterCount = advancedFilterSummary.length;

  const exportColumns = [
    { label: "Nom", getValue: (item) => item.fullName },
    { label: "Email", getValue: (item) => item.email },
    { label: "Universite", getValue: (item) => item.latestUniversite },
    { label: "Programme", getValue: (item) => item.latestProgramme },
    { label: "Statut", getValue: (item) => item.statusMeta.label },
    { label: "Date inscription", getValue: (item) => formatAdminDate(item.firstDate) },
  ];

  const handleExportCsv = () => {
    downloadCsv("etudiants-admin.csv", exportColumns, sortedStudents);
  };

  const handleExportPdf = () => {
    downloadPdfReport({
      title: "Rapport des etudiants",
      subtitle: "Vue admin des profils etudiants selon les filtres courants",
      columns: exportColumns,
      items: sortedStudents,
    });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    updateRouteParams({ query: value });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilter("tous");
    setFilterUniversity("toutes");
    setFilterSpecialite("toutes");
    setFilterAssignedTo("tous");
    setFilterInternalStatus("tous");
    setSortField("date");
    setSortDirection("desc");
    setPageSize(10);
    setShowAdvancedFilters(false);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const startIndex = sortedStudents.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(sortedStudents.length, safePage * pageSize);

  return (
    <AdminLayout
      title="Etudiants"
      subtitle="Gestion et suivi des etudiants inscrits sur la plateforme"
      headerAction={
        <Button
          className="admin-header-primary-action"
          onClick={() => showToast("Ajout manuel d'etudiant bientot disponible.", "info")}
        >
          + Ajouter un etudiant
        </Button>
      }
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Rechercher un etudiant, un email, une universite ou un programme..."
    >
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Vue rapide des profils</h2>
          <p>Les indicateurs essentiels pour comprendre l'etat actuel de la base etudiante</p>
        </div>

        <div className="admin-primary-stats-grid admin-student-stats-grid">
          {[
            {
              id: "total",
              label: "Total etudiants",
              value: quickStats.total,
              detail: `${advancedScopedStudents.length} profil(s) visibles dans cette vue`,
              tone: "etudiants",
              icon: "students",
            },
            {
              id: "active",
              label: "Etudiants actifs",
              value: quickStats.active,
              detail: "Profils avec dossier en cours et complet",
              tone: "attente",
              icon: "active",
            },
            {
              id: "new",
              label: "Nouveaux cette semaine",
              value: quickStats.newThisWeek,
              detail: "Profils inscrits sur les 7 derniers jours",
              tone: "total",
              icon: "new",
            },
            {
              id: "accepted",
              label: "Etudiants acceptes",
              value: quickStats.accepted,
              detail: "Derniere candidature finalisee favorablement",
              tone: "acceptee",
              icon: "accepted",
            },
          ].map((card) => (
            <article
              key={card.id}
              className={`admin-primary-stat-card admin-primary-stat-card-${card.tone}`}
            >
              <div className="admin-primary-stat-head">
                <span className={`admin-primary-stat-icon admin-primary-stat-icon-${card.tone}`}>
                  <StudentStatIcon name={card.icon} />
                </span>
              </div>

              <div className="admin-primary-stat-body">
                <strong className="admin-primary-stat-value">{card.value}</strong>
                <h3 className="admin-primary-stat-label">{card.label}</h3>
                <p className="admin-primary-stat-detail">{card.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Filtres rapides</h2>
          <p>Les statuts principaux restent visibles, les criteres avances s'ouvrent sur demande</p>
        </div>

        <div className="admin-filter-tabs">
          {[
            { id: "tous", label: "Tous" },
            { id: "actifs", label: "Actifs" },
            { id: "acceptee", label: "Acceptes" },
            { id: "refusee", label: "Refuses" },
            { id: "attente", label: "En attente" },
          ].map((tab) => (
            <Button
              key={tab.id}
              className={`admin-filter-tab ${filter === tab.id ? "active" : ""}`}
              onClick={() => {
                setFilter(tab.id);
                updateRouteParams({ filter: tab.id });
              }}
            >
              {tab.label} ({counters[tab.id]})
            </Button>
          ))}
        </div>

        <div className="admin-candidatures-toolbar">
          <div className="admin-candidatures-toolbar-summary">
            <span className="admin-page-context neutral">
              {sortedStudents.length} profil(s) correspondent a la vue courante
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
            <Button className="admin-table-action-button" onClick={handleExportCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        {showAdvancedFilters ? (
          <div className="admin-candidatures-advanced-panel">
            <div className="admin-toolbar">
              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="studentsUniversity">
                  Universite
                </label>
                <select
                  id="studentsUniversity"
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
                <label className="admin-toolbar-label" htmlFor="studentsProgramme">
                  Programme
                </label>
                <select
                  id="studentsProgramme"
                  className="admin-toolbar-select"
                  value={filterSpecialite}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterSpecialite(value);
                    updateRouteParams({ specialite: value });
                  }}
                >
                  <option value="toutes">Tous</option>
                  {specialiteOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="studentsAssignedTo">
                  Affectation
                </label>
                <select
                  id="studentsAssignedTo"
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
                <label className="admin-toolbar-label" htmlFor="studentsInternalStatus">
                  Statut interne
                </label>
                <select
                  id="studentsInternalStatus"
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
                <label className="admin-toolbar-label" htmlFor="studentsSortField">
                  Trier par
                </label>
                <select
                  id="studentsSortField"
                  className="admin-toolbar-select"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value)}
                >
                  <option value="date">Date inscription</option>
                  <option value="nom">Nom</option>
                  <option value="universite">Universite</option>
                  <option value="programme">Programme</option>
                  <option value="statut">Statut</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="studentsSortDirection">
                  Ordre
                </label>
                <select
                  id="studentsSortDirection"
                  className="admin-toolbar-select"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value)}
                >
                  <option value="desc">Decroissant</option>
                  <option value="asc">Croissant</option>
                </select>
              </div>

              <div className="admin-toolbar-group">
                <label className="admin-toolbar-label" htmlFor="studentsPageSize">
                  Afficher
                </label>
                <select
                  id="studentsPageSize"
                  className="admin-toolbar-select"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
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
          <h2>Liste des etudiants ({sortedStudents.length})</h2>
          <p>
            Affichage {startIndex}-{endIndex} sur {sortedStudents.length} profil(s)
          </p>
        </div>

        <div className="admin-table-container">
          <table className="admin-table mobile-cards admin-students-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Universite</th>
                <th>Programme</th>
                <th>Statut</th>
                <th>Date inscription</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      title="Aucun etudiant"
                      description="Aucun profil ne correspond aux filtres ou a la recherche en cours."
                      className="admin-empty-state"
                    />
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.key}
                    className="row-clickable"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/etudiants/${student.latestApplicationId}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/admin/etudiants/${student.latestApplicationId}`);
                      }
                    }}
                  >
                    <td data-label="Nom">
                      <div className="admin-table-meta">
                        <span className="admin-table-meta-text">{student.fullName}</span>
                        <span className="admin-table-meta-subtext">{student.nationalite}</span>
                      </div>
                    </td>
                    <td data-label="Email">
                      <div className="admin-table-meta">
                        <span className="admin-table-meta-text">{student.email}</span>
                        <span className="admin-table-meta-subtext">{student.telephone}</span>
                      </div>
                    </td>
                    <td data-label="Universite">{student.latestUniversite}</td>
                    <td data-label="Programme">{student.latestProgramme}</td>
                    <td data-label="Statut">
                      <StatusBadge status={student.statusMeta.badgeStatus} />
                    </td>
                    <td data-label="Date inscription">{formatAdminDate(student.firstDate)}</td>
                    <td data-label="Action">
                      <Button
                        className="admin-table-action-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/admin/etudiants/${student.latestApplicationId}`);
                        }}
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))
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
