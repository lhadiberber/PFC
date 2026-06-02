import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import { getAdminDocument, updateAdminDocumentStatus } from "../../services/adminService";
import { formatAdminDate, formatAdminDateTime } from "../../utils/adminApplications";
import { showToast } from "../../utils/toast";
import "../../index.css";

function buildNumeroDossier(application) {
  if (!application?.id) {
    return "Sans candidature";
  }

  const date = new Date(application.date_depot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function mapApiDocumentToDetail(document) {
  if (!document) {
    return null;
  }

  const application = document.application || null;
  const studentName =
    [document.student?.prenom, document.student?.nom].filter(Boolean).join(" ") ||
    document.student?.email ||
    "Étudiant non renseigné";

  return {
    id: String(document.id),
    applicationId: application?.id ? String(application.id) : "",
    studentName,
    email: document.student?.email || "",
    typeLabel: document.type_document || "Document",
    fileName: document.nom_fichier || "Fichier indisponible",
    fileUrl: document.file_url || "",
    status: document.statut || "En attente",
    depositedAt: document.date_upload,
    reviewUpdatedAt: "",
    university: application?.universite || "Candidature non liée",
    programme: application?.formation || "",
    niveau: application?.niveau || "",
    applicationStatus: application?.statut || "",
    numeroDossier: buildNumeroDossier(application),
  };
}

function getDocumentConfirmationMessage(status) {
  if (status === "Valide") {
    return "Êtes-vous sûr de vouloir valider ce document ?";
  }

  if (status === "Refuse") {
    return "Êtes-vous sûr de vouloir refuser ce document ?";
  }

  return "Êtes-vous sûr de vouloir remettre ce document en attente ?";
}

function getDocumentDisplayStatus(status) {
  if (status === "Valide") {
    return "Validé";
  }

  if (status === "Refuse") {
    return "Refusé";
  }

  return status;
}

function buildHistoryEntries(documentRow) {
  const entries = [
    {
      id: `${documentRow.id}-submitted`,
      title: "Document soumis",
      description: `${documentRow.typeLabel} déposé par ${documentRow.studentName}.`,
      occurredAt: documentRow.depositedAt,
      tone: "info",
    },
  ];

  if (documentRow.reviewUpdatedAt) {
    entries.unshift({
      id: `${documentRow.id}-review`,
      title:
        documentRow.status === "Valide"
          ? "Document validé"
          : documentRow.status === "Refuse"
            ? "Document refusé"
            : "Document remis en attente",
      description:
        documentRow.status === "Valide"
          ? "La pièce a été approuvée par l'administration."
          : documentRow.status === "Refuse"
            ? "La pièce nécessite un nouveau dépôt ou une vérification complémentaire."
            : "Le document attend une nouvelle vérification administrative.",
      occurredAt: documentRow.reviewUpdatedAt,
      tone:
        documentRow.status === "Valide"
          ? "positive"
          : documentRow.status === "Refuse"
            ? "danger"
            : "warning",
    });
  }

  return entries;
}

export default function DetailDocumentAdmin() {
  const navigate = useNavigate();
  const { documentId, applicationId, documentKey } = useParams();
  const resolvedDocumentId = documentId || documentKey || applicationId;
  const [documentData, setDocumentData] = useState(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [documentError, setDocumentError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadDocument() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expirée. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsLoadingDocument(true);
      setDocumentError("");

      try {
        const document = await getAdminDocument(resolvedDocumentId);
        if (isActive) setDocumentData(document);
      } catch (error) {
        if (!isActive) return;

        if (error.status === 401) {
          const message = "Session expirée. Veuillez vous reconnecter.";
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setDocumentError(
          error.status === 403
            ? "Accès refusé. Cette page est réservée aux administrateurs."
            : error.message || "Impossible de charger le document."
        );
      } finally {
        if (isActive) setIsLoadingDocument(false);
      }
    }

    loadDocument();

    return () => {
      isActive = false;
    };
  }, [resolvedDocumentId, navigate]);

  const documentRow = useMemo(() => mapApiDocumentToDetail(documentData), [documentData]);

  if (isLoadingDocument && !documentRow) {
    return (
      <AdminLayout
        title="Vérification du document"
        subtitle="Examen d'une pièce justificative"
        showSearch={false}
      >
        <section className="campus-section-container">
          <div className="student-profile-feedback">Chargement du document...</div>
        </section>
      </AdminLayout>
    );
  }

  if (documentError && !documentRow) {
    return (
      <AdminLayout
        title="Vérification du document"
        subtitle="Examen d'une pièce justificative"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Impossible de charger le document"
            description={documentError}
            actionLabel="Retour aux documents"
            actionTo="/admin/documents"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  if (!documentRow) {
    return (
      <AdminLayout
        title="Vérification du document"
        subtitle="Examen d'une pièce justificative"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Document introuvable"
            description="Ce document n'existe pas ou n'est plus disponible dans le périmètre courant."
            actionLabel="Retour aux documents"
            actionTo="/admin/documents"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  const historyEntries = buildHistoryEntries(documentRow);

  const handleReviewAction = async (nextStatus) => {
    if (!window.confirm(getDocumentConfirmationMessage(nextStatus))) {
      return;
    }

    setActionLoading(nextStatus);
    setDocumentError("");

    try {
      const updatedDocument = await updateAdminDocumentStatus(documentRow.id, { statut: nextStatus });
      setDocumentData(updatedDocument);
      showToast(
        `Document passé en statut ${getDocumentDisplayStatus(nextStatus).toLowerCase()}.`,
        "success"
      );
    } catch (error) {
      const message = error.message || "Impossible de mettre à jour le statut du document.";

      if (error.status === 401) {
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setDocumentError(message);
      showToast(message, "error");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <AdminLayout
      title="Vérification du document"
      subtitle="Examen et validation d'une pièce justificative"
      showSearch={false}
    >
      <section className="campus-section-container">
        <div className="admin-document-hero">
          <div className="admin-document-hero-copy">
            <Link to="/admin/documents" className="admin-application-back-link">
              Retour aux documents
            </Link>
            <span className="admin-section-kicker">Pièce candidate</span>
            <h2>{documentRow.typeLabel}</h2>
            <p className="admin-application-dossier-id">{documentRow.fileName}</p>

            <div className="admin-application-hero-tags">
              <StatusBadge status={getDocumentDisplayStatus(documentRow.status)} />
              <span className="admin-page-context neutral">{documentRow.studentName}</span>
              <span className="admin-page-context info">{documentRow.university}</span>
            </div>

            <div className="admin-document-hero-grid">
              <div className="admin-document-hero-item">
                <span>Dossier</span>
                <strong>{documentRow.numeroDossier}</strong>
              </div>
              <div className="admin-document-hero-item">
                <span>Date de dépôt</span>
                <strong>{formatAdminDate(documentRow.depositedAt)}</strong>
              </div>
              <div className="admin-document-hero-item">
                <span>Programme</span>
                <strong>{documentRow.programme || "Non renseigné"}</strong>
              </div>
              <div className="admin-document-hero-item">
                <span>Email candidat</span>
                <strong>{documentRow.email || "Non renseigné"}</strong>
              </div>
            </div>
          </div>

          <div className="admin-application-hero-actions">
            <Button
              className="admin-detail-action-primary"
              onClick={() => handleReviewAction("Valide")}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === "Valide" ? "Validation..." : "Valider"}
            </Button>
            <Button
              className="admin-detail-action-danger"
              onClick={() => handleReviewAction("Refuse")}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === "Refuse" ? "Refus..." : "Refuser"}
            </Button>
            <Button
              className="admin-table-action-button"
              onClick={() => handleReviewAction("En attente")}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === "En attente" ? "Mise à jour..." : "Remettre en attente"}
            </Button>
          </div>
        </div>
      </section>

      <section className="campus-section-container">
        {documentError ? (
          <div className="student-profile-feedback student-profile-feedback-error">
            {documentError}
          </div>
        ) : null}

        <div className="admin-document-layout">
          <div className="admin-document-main">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations du document</h3>
                  <p>Référence, statut et disponibilité du fichier déposé</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Type de document", documentRow.typeLabel],
                  ["Nom du fichier", documentRow.fileName],
                  ["Statut de vérification", getDocumentDisplayStatus(documentRow.status)],
                  ["Dernière mise à jour", documentRow.reviewUpdatedAt || documentRow.depositedAt],
                ].map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>
                      {label === "Dernière mise à jour"
                        ? formatAdminDateTime(value)
                        : value}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Fichier soumis</h3>
                  <p>La plateforme conserve ici la référence du fichier déposé par le candidat</p>
                </div>
              </div>

              <div className="admin-document-file-card">
                <div className="admin-document-file-icon">DOC</div>
                <div className="admin-document-file-copy">
                  <strong>{documentRow.fileName}</strong>
                  {documentRow.fileUrl ? (
                    <a
                      className="admin-table-action-button"
                      href={documentRow.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir / télécharger
                    </a>
                  ) : (
                    <span>Fichier indisponible</span>
                  )}
                </div>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Contexte de candidature</h3>
                  <p>Rattachement du document au dossier et à la formation demandée</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Étudiant", documentRow.studentName],
                  ["Université", documentRow.university],
                  ["Programme", documentRow.programme || "Non renseigné"],
                  ["Niveau", documentRow.niveau || "Non renseigné"],
                  ["Statut candidature", documentRow.applicationStatus || "Non liée"],
                  ["Numéro de dossier", documentRow.numeroDossier],
                ].map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="admin-document-side">
            <article className="admin-meta-card admin-application-sticky-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Résumé de vérification</h3>
                  <p>Lecture rapide de la situation documentaire</p>
                </div>
              </div>

              <div className="admin-application-summary-grid">
                <div className="admin-application-summary-item">
                  <span>Statut</span>
                  <strong>{getDocumentDisplayStatus(documentRow.status)}</strong>
                  <StatusBadge status={getDocumentDisplayStatus(documentRow.status)} />
                </div>
                <div className="admin-application-summary-item">
                  <span>Dépôt</span>
                  <strong>{formatAdminDate(documentRow.depositedAt)}</strong>
                  <p>{documentRow.typeLabel}</p>
                </div>
                <div className="admin-application-summary-item">
                  <span>Université</span>
                  <strong>{documentRow.university}</strong>
                  <p>{documentRow.programme || "Programme non renseigné"}</p>
                </div>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Historique</h3>
                  <p>Chronologie des événements liés à cette pièce</p>
                </div>
              </div>

              <div className="admin-application-history">
                {historyEntries.map((entry) => (
                  <article key={entry.id} className="admin-application-history-item">
                    <div className={`admin-application-history-dot ${entry.tone}`} />
                    <div className="admin-application-history-content">
                      <div className="admin-application-history-head">
                        <strong>{entry.title}</strong>
                        <span>{formatAdminDateTime(entry.occurredAt)}</span>
                      </div>
                      <p>{entry.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Actions contextuelles</h3>
                  <p>Navigation rapide vers le dossier complet</p>
                </div>
              </div>

              <div className="admin-document-side-actions">
                <Button
                  className="admin-table-action-button"
                  onClick={() => navigate(`/admin/candidatures/${documentRow.applicationId}`)}
                  disabled={!documentRow.applicationId}
                >
                  Voir le dossier
                </Button>
                <Button className="admin-filter-tab" onClick={() => navigate("/admin/documents")}>
                  Retour à la liste
                </Button>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
