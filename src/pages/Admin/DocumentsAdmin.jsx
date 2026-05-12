import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import { listAdminDocuments } from "../../services/adminService";
import { downloadCsv } from "../../utils/exportCsv";
import { formatAdminDate } from "../../utils/adminApplications";
import {
  filterAdminDocumentRows,
  getAdminDocumentStats,
  sortAdminDocumentRows,
} from "../../utils/adminDocuments";
import "../../index.css";

function SearchIcon() {
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
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function DocumentStatIcon({ name }) {
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
    case "submitted":
      return (
        <svg {...commonProps}>
          <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M14 3v5h5" />
        </svg>
      );
    case "validated":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.8 12.2l2.2 2.2 4.3-4.8" />
        </svg>
      );
    case "pending":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      );
    case "refused":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 9l6 6" />
          <path d="M15 9l-6 6" />
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

DocumentStatIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

function getVisiblePageNumbers(currentPage, totalPages) {
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + maxVisible - 1);
  const adjustedStart = Math.max(1, end - maxVisible + 1);

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

function buildNumeroDossier(application) {
  if (!application?.id) {
    return "Sans candidature";
  }

  const date = new Date(application.date_depot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function mapApiDocumentToRow(document) {
  const studentName =
    [document.student?.prenom, document.student?.nom].filter(Boolean).join(" ") ||
    document.student?.email ||
    "Etudiant non renseigne";
  const application = document.application || null;

  return {
    id: String(document.id),
    documentId: String(document.id),
    applicationId: application?.id ? String(application.id) : "",
    documentKey: String(document.id),
    studentName,
    university: application?.universite || "Candidature non liee",
    depositedAt: document.date_upload,
    depositedAtLabel: formatAdminDate(document.date_upload),
    status: document.statut || "En attente",
    fileName: document.nom_fichier || "Fichier indisponible",
    typeLabel: document.type_document || "Document",
    shortTypeLabel: document.type_document || "Document",
    numeroDossier: buildNumeroDossier(application),
    email: document.student?.email || "",
    programme: application?.formation || "",
    fileUrl: document.file_url || "",
  };
}

export default function DocumentsAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [filter, setFilter] = useState(searchParams.get("filter") || "tous");
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 10);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [documentsData, setDocumentsData] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  useEffect(() => {
    setSearchQuery(searchParams.get("query") || "");
    setFilter(searchParams.get("filter") || "tous");
    setPageSize(Number(searchParams.get("pageSize")) || 10);
    setPage(Number(searchParams.get("page")) || 1);
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadDocuments() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expiree. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsLoadingDocuments(true);
      setDocumentsError("");

      try {
        const documents = await listAdminDocuments();
        if (isActive) setDocumentsData(documents);
      } catch (error) {
        if (!isActive) return;

        if (error.status === 401) {
          const message = "Session expiree. Veuillez vous reconnecter.";
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setDocumentsError(
          error.status === 403
            ? "Acces refuse. Cette page est reservee aux administrateurs."
            : error.message || "Impossible de charger les documents."
        );
      } finally {
        if (isActive) setIsLoadingDocuments(false);
      }
    }

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const updateRouteParams = (overrides = {}) => {
    const params = new URLSearchParams();
    const nextValues = {
      query: searchQuery,
      filter,
      pageSize,
      page,
      ...overrides,
    };

    if (nextValues.query) {
      params.set("query", nextValues.query);
    }
    if (nextValues.filter && nextValues.filter !== "tous") {
      params.set("filter", nextValues.filter);
    }
    if (nextValues.pageSize && nextValues.pageSize !== 10) {
      params.set("pageSize", String(nextValues.pageSize));
    }
    if (nextValues.page && nextValues.page !== 1) {
      params.set("page", String(nextValues.page));
    }

    setSearchParams(params, { replace: true });
  };

  const allDocumentRows = useMemo(() => documentsData.map(mapApiDocumentToRow), [documentsData]);
  const searchScopedRows = useMemo(
    () => filterAdminDocumentRows(allDocumentRows, searchQuery, "tous"),
    [allDocumentRows, searchQuery]
  );
  const filteredRows = useMemo(
    () => filterAdminDocumentRows(allDocumentRows, searchQuery, filter),
    [allDocumentRows, filter, searchQuery]
  );
  const sortedRows = useMemo(() => sortAdminDocumentRows(filteredRows), [filteredRows]);

  const stats = useMemo(() => getAdminDocumentStats(allDocumentRows), [allDocumentRows]);
  const counters = useMemo(() => getAdminDocumentStats(searchScopedRows), [searchScopedRows]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [pageSize, safePage, sortedRows]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
      updateRouteParams({ page: totalPages });
    }
  }, [page, totalPages]);

  const startIndex = sortedRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(sortedRows.length, safePage * pageSize);
  const visiblePages = getVisiblePageNumbers(safePage, totalPages);

  const exportColumns = [
    { label: "Etudiant", getValue: (item) => item.studentName },
    { label: "Type de document", getValue: (item) => item.typeLabel },
    { label: "Universite", getValue: (item) => item.university },
    { label: "Date de depot", getValue: (item) => formatAdminDate(item.depositedAt) },
    { label: "Statut", getValue: (item) => item.status },
    { label: "Dossier", getValue: (item) => item.numeroDossier },
    { label: "Fichier", getValue: (item) => item.fileName },
  ];

  const handleExport = () => {
    downloadCsv("documents-admin.csv", exportColumns, sortedRows);
  };

  const statsCards = [
    {
      id: "submitted",
      label: "Documents soumis",
      value: stats.total,
      detail: "Pieces disponibles pour verification",
      tone: "total",
      icon: "submitted",
    },
    {
      id: "validated",
      label: "Documents valides",
      value: stats.valides,
      detail: "Verification terminee favorablement",
      tone: "acceptee",
      icon: "validated",
    },
    {
      id: "pending",
      label: "Documents en attente",
      value: stats.attente,
      detail: "Pieces a verifier par l'administration",
      tone: "attente",
      icon: "pending",
    },
    {
      id: "refused",
      label: "Documents refuses",
      value: stats.refuses,
      detail: "Pieces necessitant une relance ou un nouveau depot",
      tone: "refusee",
      icon: "refused",
    },
  ];

  return (
    <AdminLayout
      title="Gestion des documents"
      subtitle="Verification et validation des pieces soumises par les candidats"
      showSearch={false}
      headerAction={
        <Button className="admin-header-secondary-action" onClick={handleExport}>
          Telecharger la liste
        </Button>
      }
    >
      <section className="campus-section-container">
        <div className="admin-primary-stats-grid admin-documents-stats-grid">
          {statsCards.map((card) => (
            <article
              key={card.id}
              className={`admin-primary-stat-card admin-primary-stat-card-${card.tone}`}
            >
              <div className="admin-primary-stat-head">
                <span className={`admin-primary-stat-icon admin-primary-stat-icon-${card.tone}`}>
                  <DocumentStatIcon name={card.icon} />
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
        {documentsError ? (
          <div className="student-profile-feedback student-profile-feedback-error">
            {documentsError}
          </div>
        ) : null}
        {isLoadingDocuments ? (
          <div className="student-profile-feedback">Chargement des documents...</div>
        ) : null}

        <div className="admin-documents-panel">
          <div className="campus-section-header admin-documents-panel-header">
            <div>
              <h2>Liste des documents ({sortedRows.length})</h2>
              <p>Controle documentaire par etudiant, type de piece et universite</p>
            </div>
            <span className="admin-page-context neutral">
              {startIndex}-{endIndex} sur {sortedRows.length} document(s)
            </span>
          </div>

          <div className="admin-documents-search-wrap">
            <label className="admin-toolbar-label" htmlFor="adminDocumentsSearch">
              Recherche
            </label>
            <div className="admin-documents-search">
              <span className="admin-documents-search-icon">
                <SearchIcon />
              </span>
              <input
                id="adminDocumentsSearch"
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchQuery(value);
                  setPage(1);
                  updateRouteParams({ query: value, page: 1 });
                }}
                placeholder="Rechercher un etudiant ou un document..."
                className="admin-documents-search-input"
              />
            </div>
          </div>

          <div className="admin-filter-tabs admin-documents-filter-tabs">
            {[
              { id: "tous", label: "Tous", count: counters.total },
              { id: "attente", label: "En attente", count: counters.attente },
              { id: "valides", label: "Valides", count: counters.valides },
              { id: "refuses", label: "Refuses", count: counters.refuses },
            ].map((tab) => (
              <Button
                key={tab.id}
                className={`admin-filter-tab ${filter === tab.id ? "active" : ""}`}
                onClick={() => {
                  setFilter(tab.id);
                  setPage(1);
                  updateRouteParams({ filter: tab.id, page: 1 });
                }}
              >
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>

          <div className="admin-table-container">
            <table className="admin-table mobile-cards admin-documents-table">
              <thead>
                <tr>
                  <th>Etudiant</th>
                  <th>Type de document</th>
                  <th>Universite</th>
                  <th>Date de depot</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title="Aucun document trouve"
                        description="Aucun document ne correspond a la recherche ou au filtre courant."
                        className="admin-empty-state"
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="row-clickable"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/admin/documents/${encodeURIComponent(row.documentId)}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/admin/documents/${encodeURIComponent(row.documentId)}`);
                        }
                      }}
                    >
                      <td data-label="Etudiant">
                        <div className="admin-table-meta">
                          <span className="admin-table-meta-text">{row.studentName}</span>
                          <span className="admin-table-meta-subtext">{row.numeroDossier}</span>
                        </div>
                      </td>
                      <td data-label="Type de document">
                        <div className="admin-table-meta">
                          <span className="admin-table-meta-text">{row.shortTypeLabel}</span>
                          <span className="admin-table-meta-subtext">{row.fileName}</span>
                        </div>
                      </td>
                      <td data-label="Universite">{row.university}</td>
                      <td data-label="Date de depot">{formatAdminDate(row.depositedAt)}</td>
                      <td data-label="Statut">
                        <StatusBadge status={row.status} />
                      </td>
                      <td data-label="Action">
                        <Button
                          className="admin-table-action-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/admin/documents/${encodeURIComponent(row.documentId)}`);
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

          <div className="admin-documents-pagination">
            <div className="admin-documents-pagination-summary">
              <span className="admin-pagination-info">
                Affichage {startIndex}-{endIndex} sur {sortedRows.length} document(s)
              </span>

              <div className="admin-documents-page-size">
                <label className="admin-toolbar-label" htmlFor="documentsPageSize">
                  Afficher
                </label>
                <select
                  id="documentsPageSize"
                  className="admin-toolbar-select"
                  value={pageSize}
                  onChange={(event) => {
                    const nextPageSize = Number(event.target.value);
                    setPageSize(nextPageSize);
                    setPage(1);
                    updateRouteParams({ pageSize: nextPageSize, page: 1 });
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="admin-documents-page-list">
              <Button
                className="admin-pagination-page-button"
                onClick={() => {
                  const nextPage = Math.max(1, safePage - 1);
                  setPage(nextPage);
                  updateRouteParams({ page: nextPage });
                }}
                disabled={safePage === 1}
              >
                Precedent
              </Button>

              {visiblePages.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  className={`admin-pagination-page-button ${
                    pageNumber === safePage ? "active" : ""
                  }`}
                  onClick={() => {
                    setPage(pageNumber);
                    updateRouteParams({ page: pageNumber });
                  }}
                >
                  {pageNumber}
                </Button>
              ))}

              <Button
                className="admin-pagination-page-button"
                onClick={() => {
                  const nextPage = Math.min(totalPages, safePage + 1);
                  setPage(nextPage);
                  updateRouteParams({ page: nextPage });
                }}
                disabled={safePage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
