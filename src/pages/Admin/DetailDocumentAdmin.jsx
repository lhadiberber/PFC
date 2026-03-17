import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdmissions } from "../../context/AdmissionsContext";
import { formatAdminDate, formatAdminDateTime } from "../../utils/adminApplications";
import {
  findAdminDocumentRow,
  readDocumentReviews,
  updateDocumentReview,
} from "../../utils/adminDocuments";
import { showToast } from "../../utils/toast";
import "../../index.css";

function buildHistoryEntries(documentRow) {
  const entries = [
    {
      id: `${documentRow.id}-submitted`,
      title: "Document soumis",
      description: `${documentRow.typeLabel} depose par ${documentRow.studentName}.`,
      occurredAt: documentRow.depositedAt,
      tone: "info",
    },
  ];

  if (documentRow.reviewUpdatedAt) {
    entries.unshift({
      id: `${documentRow.id}-review`,
      title:
        documentRow.status === "Valide"
          ? "Document valide"
          : documentRow.status === "Refuse"
            ? "Document refuse"
            : "Document remis en attente",
      description:
        documentRow.status === "Valide"
          ? "La piece a ete approuvee par l'administration."
          : documentRow.status === "Refuse"
            ? "La piece necessite un nouveau depot ou une verification complementaire."
            : "Le document attend une nouvelle verification administrative.",
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
  const { applicationId, documentKey } = useParams();
  const { applications } = useAdmissions();
  const [reviewsVersion, setReviewsVersion] = useState(0);

  useEffect(() => {
    const syncReviews = () => setReviewsVersion((current) => current + 1);
    window.addEventListener("admin:document-reviews-updated", syncReviews);
    window.addEventListener("storage", syncReviews);

    return () => {
      window.removeEventListener("admin:document-reviews-updated", syncReviews);
      window.removeEventListener("storage", syncReviews);
    };
  }, []);

  const reviews = useMemo(() => readDocumentReviews(), [reviewsVersion]);
  const documentId = `${applicationId}__${documentKey}`;
  const documentRow = useMemo(
    () => findAdminDocumentRow(applications, documentId, reviews),
    [applications, documentId, reviews]
  );

  if (!documentRow) {
    return (
      <AdminLayout
        title="Detail du document"
        subtitle="Verification d'une piece candidate"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Document introuvable"
            description="Ce document n'existe pas ou n'est plus disponible dans le perimetre courant."
            actionLabel="Retour aux documents"
            actionTo="/admin/documents"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  const historyEntries = buildHistoryEntries(documentRow);

  const handleReviewAction = (nextStatus) => {
    updateDocumentReview(documentRow.id, nextStatus);
    showToast(`Document passe en statut ${nextStatus.toLowerCase()}.`, "success");
  };

  return (
    <AdminLayout
      title="Detail du document"
      subtitle="Verification et validation d'une piece candidate"
      showSearch={false}
    >
      <section className="campus-section-container">
        <div className="admin-document-hero">
          <div className="admin-document-hero-copy">
            <Link to="/admin/documents" className="admin-application-back-link">
              Retour aux documents
            </Link>
            <span className="admin-section-kicker">Piece candidate</span>
            <h2>{documentRow.typeLabel}</h2>
            <p className="admin-application-dossier-id">{documentRow.fileName}</p>

            <div className="admin-application-hero-tags">
              <StatusBadge status={documentRow.status} />
              <span className="admin-page-context neutral">{documentRow.studentName}</span>
              <span className="admin-page-context info">{documentRow.university}</span>
            </div>

            <div className="admin-document-hero-grid">
              <div className="admin-document-hero-item">
                <span>Dossier</span>
                <strong>{documentRow.numeroDossier}</strong>
              </div>
              <div className="admin-document-hero-item">
                <span>Date de depot</span>
                <strong>{formatAdminDate(documentRow.depositedAt)}</strong>
              </div>
              <div className="admin-document-hero-item">
                <span>Programme</span>
                <strong>{documentRow.programme || "Non renseigne"}</strong>
              </div>
              <div className="admin-document-hero-item">
                <span>Email candidat</span>
                <strong>{documentRow.email || "Non renseigne"}</strong>
              </div>
            </div>
          </div>

          <div className="admin-application-hero-actions">
            <Button
              className="admin-detail-action-primary"
              onClick={() => handleReviewAction("Valide")}
            >
              Valider
            </Button>
            <Button
              className="admin-detail-action-danger"
              onClick={() => handleReviewAction("Refuse")}
            >
              Refuser
            </Button>
            <Button
              className="admin-table-action-button"
              onClick={() => handleReviewAction("En attente")}
            >
              Remettre en attente
            </Button>
          </div>
        </div>
      </section>

      <section className="campus-section-container">
        <div className="admin-document-layout">
          <div className="admin-document-main">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations du document</h3>
                  <p>Reference, statut et disponibilite du fichier depose</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Type de document", documentRow.typeLabel],
                  ["Nom du fichier", documentRow.fileName],
                  ["Statut de verification", documentRow.status],
                  ["Derniere mise a jour", documentRow.reviewUpdatedAt || documentRow.depositedAt],
                ].map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>
                      {label === "Derniere mise a jour"
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
                  <p>La plateforme conserve ici la reference du fichier depose par le candidat</p>
                </div>
              </div>

              <div className="admin-document-file-card">
                <div className="admin-document-file-icon">DOC</div>
                <div className="admin-document-file-copy">
                  <strong>{documentRow.fileName}</strong>
                  <span>
                    Apercu indisponible dans cette maquette. Utilisez le dossier candidat pour
                    consulter le contexte complet.
                  </span>
                </div>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Contexte de candidature</h3>
                  <p>Rattachement du document au dossier et a la formation demandee</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Etudiant", documentRow.studentName],
                  ["Universite", documentRow.university],
                  ["Programme", documentRow.programme || "Non renseigne"],
                  ["Numero de dossier", documentRow.numeroDossier],
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
                  <h3>Resume de verification</h3>
                  <p>Lecture rapide de la situation documentaire</p>
                </div>
              </div>

              <div className="admin-application-summary-grid">
                <div className="admin-application-summary-item">
                  <span>Statut</span>
                  <strong>{documentRow.status}</strong>
                  <StatusBadge status={documentRow.status} />
                </div>
                <div className="admin-application-summary-item">
                  <span>Depot</span>
                  <strong>{formatAdminDate(documentRow.depositedAt)}</strong>
                  <p>{documentRow.typeLabel}</p>
                </div>
                <div className="admin-application-summary-item">
                  <span>Universite</span>
                  <strong>{documentRow.university}</strong>
                  <p>{documentRow.programme || "Programme non renseigne"}</p>
                </div>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Historique</h3>
                  <p>Chronologie des evenements lies a cette piece</p>
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
                >
                  Voir le dossier
                </Button>
                <Button className="admin-filter-tab" onClick={() => navigate("/admin/documents")}>
                  Retour a la liste
                </Button>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
