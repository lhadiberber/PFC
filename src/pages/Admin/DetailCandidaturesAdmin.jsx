import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdmissions } from "../../context/AdmissionsContext";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import {
  getAdminApplication,
  updateAdminApplicationStatus as updateAdminApplicationStatusApi,
} from "../../services/adminService";
import { showToast } from "../../utils/toast";
import {
  formatAdminDate,
  formatAdminDateTime,
  getAdminProgress,
  toAdminApplication,
} from "../../utils/adminApplications";
import "../../index.css";

const PRIORITY_OPTIONS = [
  { value: "basse", label: "Basse" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute", label: "Haute" },
  { value: "critique", label: "Critique" },
];

const INTERNAL_STATUS_OPTIONS = [
  { value: "qualification", label: "Qualification" },
  { value: "instruction", label: "Instruction" },
  { value: "commission", label: "Commission" },
  { value: "decision", label: "Décision" },
  { value: "decision-finalisee", label: "Décision finalisée" },
];

const DOCUMENT_FIELDS = [
  { key: "copieBac", label: "Copie du bac" },
  { key: "releveNotes", label: "Relevé de notes" },
  { key: "carteIdentite", label: "Carte d'identité" },
  { key: "photo", label: "Photo d'identité" },
  { key: "residence", label: "Justificatif de résidence" },
  { key: "cv", label: "CV" },
];

function getCompletenessLabel(level) {
  switch (level) {
    case "complet":
      return "Complet";
    case "avance":
      return "Avancé";
    case "partiel":
      return "Partiel";
    case "fragile":
    default:
      return "Fragile";
  }
}

function getProgressState(progressValue) {
  if (progressValue >= 100) {
    return "Complété";
  }

  if (progressValue >= 70) {
    return "En bonne voie";
  }

  if (progressValue >= 40) {
    return "À consolider";
  }

  return "À compléter";
}

function getFinalDecisionLabel(status) {
  if (status === "Acceptee") {
    return "Décision favorable";
  }

  if (status === "Rejetee") {
    return "Décision défavorable";
  }

  return "En attente";
}

function getStatusDisplayLabel(status) {
  if (status === "Acceptee") {
    return "Acceptée";
  }

  if (status === "Rejetee") {
    return "Refusée";
  }

  return status;
}

function getStatusConfirmationMessage(status) {
  if (status === "Acceptee") {
    return "Confirmer l'acceptation de cette candidature ?";
  }

  if (status === "Rejetee") {
    return "Confirmer le refus de cette candidature ?";
  }

  return "Confirmer la remise en attente de cette candidature ?";
}

function getFieldValue(value, fallback = "Non renseigné") {
  return value && String(value).trim() ? value : fallback;
}

export default function DetailCandidaturesAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    applications,
    activityLog,
    updateApplicationStatus,
    updateApplicationMetadata,
    addApplicationNote,
  } = useAdmissions();
  const [metadataForm, setMetadataForm] = useState({
    internalPriority: "moyenne",
    assignedTo: "",
    internalStatus: "qualification",
  });
  const [noteDraft, setNoteDraft] = useState("");
  const [remoteApplication, setRemoteApplication] = useState(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [applicationError, setApplicationError] = useState("");
  const [statusActionLoading, setStatusActionLoading] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadApplication() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expirée. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsLoadingApplication(true);
      setApplicationError("");

      try {
        const application = await getAdminApplication(id);
        if (isActive) {
          setRemoteApplication(application);
        }
      } catch (error) {
        if (!isActive) return;

        if (error.status === 401) {
          const message = "Session expirée. Veuillez vous reconnecter.";
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setApplicationError(
          error.status === 403
            ? "Accès refusé. Cette page est réservée aux administrateurs."
            : error.message || "Impossible de charger la candidature."
        );
      } finally {
        if (isActive) {
          setIsLoadingApplication(false);
        }
      }
    }

    loadApplication();

    return () => {
      isActive = false;
    };
  }, [id, navigate]);

  const localCandidature = useMemo(
    () => applications.map(toAdminApplication).find((item) => String(item.id) === String(id)),
    [applications, id]
  );
  const candidature = useMemo(
    () => (remoteApplication ? toAdminApplication(remoteApplication) : localCandidature),
    [localCandidature, remoteApplication]
  );

  useEffect(() => {
    if (!candidature) {
      return;
    }

    setMetadataForm({
      internalPriority: candidature.adminMeta.internalPriority,
      assignedTo: candidature.adminMeta.assignedTo,
      internalStatus: candidature.adminMeta.internalStatus,
    });
  }, [candidature]);

  const dossierHistory = useMemo(() => {
    if (!candidature) {
      return [];
    }

    return [...activityLog]
      .filter((entry) => String(entry.applicationId) === String(candidature.id))
      .sort((first, second) => new Date(second.occurredAt) - new Date(first.occurredAt));
  }, [activityLog, candidature]);

  if (isLoadingApplication && !candidature) {
    return (
      <AdminLayout
        title="Dossier de candidature"
        subtitle="Instruction et décision administrative"
        showSearch={false}
      >
        <section className="campus-section-container">
          <div className="student-profile-feedback">Chargement de la candidature...</div>
        </section>
      </AdminLayout>
    );
  }

  if (applicationError && !candidature) {
    return (
      <AdminLayout
        title="Dossier de candidature"
        subtitle="Instruction et décision administrative"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Impossible de charger la candidature"
            description={applicationError}
            actionLabel="Retour aux candidatures"
            actionTo="/admin/candidatures"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  if (!candidature) {
    return (
      <AdminLayout
        title="Dossier de candidature"
        subtitle="Instruction et décision administrative"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Dossier introuvable"
            description="Cette candidature n'existe pas ou n'est plus disponible."
            actionLabel="Retour aux candidatures"
            actionTo="/admin/candidatures"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  const progress = getAdminProgress(candidature);
  const completenessLabel = getCompletenessLabel(candidature.adminMeta.completenessLevel);
  const documents = DOCUMENT_FIELDS.map((documentField) => {
    const value = candidature.details?.[documentField.key];
    return {
      ...documentField,
      value,
      provided: Boolean(value),
    };
  });
  const providedDocumentsCount = documents.filter((document) => document.provided).length;
  const missingDocuments = documents.filter((document) => !document.provided);
  const personalInfo = [
    ["Nom", candidature.details.nom],
    ["Prénom", candidature.details.prenom],
    ["Date de naissance", candidature.details.dateNaiss],
    ["Lieu de naissance", candidature.details.lieuNaiss],
    ["Nationalité", candidature.details.nationalite],
    ["Email", candidature.details.email],
    ["Téléphone", candidature.details.telephone],
    ["Adresse", candidature.details.adresse],
  ];
  const academicInfo = [
    ["Diplôme actuel", candidature.details.typeBac],
    ["Établissement", candidature.details.universite],
    ["Pays", candidature.details.pays],
    ["Année d'obtention", candidature.details.anneeBac],
    ["Moyenne", candidature.details.moyenneBac],
    ["Mention", candidature.details.mention],
  ];
  const formationInfo = [
    ["Université demandée", candidature.universite],
    ["Programme / spécialité", candidature.specialite],
    ["Niveau demandé", candidature.details.niveauDemande || candidature.details.niveau],
  ];
  const motivationText = getFieldValue(
    candidature.details.motivation || candidature.details.lettreMotivation,
    "Aucune lettre de motivation n'a été fournie dans cette version de la candidature."
  );

  const handleStatusChange = async (nextStatus) => {
    if (!window.confirm(getStatusConfirmationMessage(nextStatus))) {
      return;
    }

    setStatusActionLoading(nextStatus);
    setApplicationError("");

    try {
      const updatedApplication = await updateAdminApplicationStatusApi(candidature.id, {
        statut: nextStatus,
        commentaire_admin: noteDraft.trim() || undefined,
      });

      if (updatedApplication) {
        setRemoteApplication(updatedApplication);
      }

      updateApplicationStatus(candidature.id, nextStatus);
      showToast(`Statut mis à jour : ${getStatusDisplayLabel(nextStatus)}`, "success");
    } catch (error) {
      const message = error.message || "Impossible de mettre à jour le statut.";

      if (error.status === 401) {
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setApplicationError(
        error.status === 403
          ? "Accès refusé. Cette action est réservée aux administrateurs."
          : message
      );
      showToast(message, "error");
    } finally {
      setStatusActionLoading("");
    }
  };

  const handleMetadataSubmit = (event) => {
    event.preventDefault();

    const nextAssignedTo = metadataForm.assignedTo.trim();
    const hasChanges =
      metadataForm.internalPriority !== candidature.adminMeta.internalPriority ||
      metadataForm.internalStatus !== candidature.adminMeta.internalStatus ||
      nextAssignedTo !== candidature.adminMeta.assignedTo;

    if (!hasChanges) {
      showToast("Aucune mise à jour à enregistrer.", "info");
      return;
    }

    updateApplicationMetadata(candidature.id, {
      internalPriority: metadataForm.internalPriority,
      internalStatus: metadataForm.internalStatus,
      assignedTo: nextAssignedTo,
    });
    showToast("Pilotage interne mis à jour.", "success");
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    const createdNote = addApplicationNote(candidature.id, noteDraft);

    if (!createdNote) {
      showToast("Ajoutez un contenu de note avant validation.", "info");
      return;
    }

    setNoteDraft("");
    showToast("Note interne ajoutée.", "success");
  };

  const handleRequestDocument = () => {
    const createdNote = addApplicationNote(
      candidature.id,
      "Demande de document complémentaire envoyée au candidat."
    );

    if (!createdNote) {
      showToast("La demande de document n'a pas pu être enregistrée.", "info");
      return;
    }

    updateApplicationMetadata(candidature.id, {
      internalStatus: "qualification",
    });
    showToast("Demande de document enregistrée dans le suivi du dossier.", "success");
  };

  const handleDocumentAction = (document, mode) => {
    if (!document.provided) {
      showToast(`${document.label} manquant sur ce dossier.`, "info");
      return;
    }

    if (mode === "preview") {
      showToast(`Aperçu indisponible : ${document.value}`, "info");
      return;
    }

    showToast(`Téléchargement simulé : ${document.value}`, "info");
  };

  return (
    <AdminLayout
      title="Dossier de candidature"
      subtitle="Instruction et décision administrative"
      showSearch={false}
    >
      {applicationError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {applicationError}
        </div>
      ) : null}

      {isLoadingApplication ? (
        <div className="student-profile-feedback">Actualisation du dossier...</div>
      ) : null}

      <section className="campus-section-container">
        <div className="admin-application-hero">
          <div className="admin-application-hero-copy">
            <Link to="/admin/candidatures" className="admin-application-back-link">
              Retour aux candidatures
            </Link>
            <span className="admin-section-kicker">Dossier candidat</span>
            <h2>{candidature.nom}</h2>
            <p className="admin-application-dossier-id">Dossier {candidature.numeroDossier}</p>

            <div className="admin-application-hero-tags">
              <StatusBadge status={candidature.statut} />
              <span className="admin-page-context neutral">
                Déposé le {formatAdminDate(candidature.date)}
              </span>
              <span className="admin-page-context info">
                {providedDocumentsCount}/{documents.length} documents reçus
              </span>
              <span className={`admin-page-context ${candidature.adminMeta.internalPriorityTone}`}>
                Priorité {candidature.adminMeta.internalPriorityLabel}
              </span>
            </div>

            <div className="admin-application-hero-grid">
              <div className="admin-application-hero-item">
                <span>Université</span>
                <strong>{candidature.universite}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Spécialité</span>
                <strong>{candidature.specialite}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Statut interne</span>
                <strong>{candidature.adminMeta.internalStatusLabel}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Affectation</span>
                <strong>{getFieldValue(candidature.adminMeta.assignedTo, "Non assigné")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-application-hero-actions">
            <Button
              className="admin-detail-action admin-detail-action-primary"
              onClick={() => handleStatusChange("Acceptee")}
              disabled={Boolean(statusActionLoading)}
            >
              {statusActionLoading === "Acceptee" ? "Mise à jour..." : "Accepter"}
            </Button>
            <Button
              className="admin-detail-action admin-detail-action-danger"
              onClick={() => handleStatusChange("Rejetee")}
              disabled={Boolean(statusActionLoading)}
            >
              {statusActionLoading === "Rejetee" ? "Mise à jour..." : "Refuser"}
            </Button>
            <Button
              className="admin-detail-action admin-detail-action-warning"
              onClick={handleRequestDocument}
            >
              Demander document
            </Button>
            <Button
              className="admin-detail-action admin-detail-action-neutral"
              onClick={() => handleStatusChange("En attente")}
              disabled={Boolean(statusActionLoading)}
            >
              {statusActionLoading === "En attente" ? "Mise à jour..." : "Mettre en attente"}
            </Button>
          </div>
        </div>
      </section>

      <section className="campus-section-container">
        <article className="admin-meta-card admin-application-summary-banner">
          <div className="admin-meta-card-header">
            <div>
              <h3>Résumé rapide</h3>
              <p>Lecture immédiate de la maturité du dossier</p>
            </div>
          </div>

          <div className="admin-application-summary-grid admin-application-summary-grid-wide">
            <div className="admin-application-summary-item">
              <span>Profil</span>
              <strong>{getProgressState(progress.profil)}</strong>
              <ProgressBar value={progress.profil} label={`${progress.profil}%`} compact />
            </div>
            <div className="admin-application-summary-item">
              <span>Documents</span>
              <strong>
                {providedDocumentsCount} / {documents.length}
              </strong>
              <ProgressBar value={progress.documents} label={`${progress.documents}%`} compact />
            </div>
            <div className="admin-application-summary-item">
              <span>Validation finale</span>
              <strong>{getFinalDecisionLabel(candidature.statut)}</strong>
              <ProgressBar value={progress.finale} label={`${progress.finale}%`} compact />
            </div>
            <div className="admin-application-summary-item">
              <span>Complétude globale</span>
              <strong>{completenessLabel}</strong>
              <p>{candidature.adminMeta.processingDelay} jour(s) de traitement</p>
            </div>
          </div>
        </article>
      </section>

      <section className="campus-section-container">
        <div className="admin-application-layout">
          <div className="admin-application-main">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations personnelles</h3>
                  <p>Informations principales du candidat</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {personalInfo.map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>{getFieldValue(value)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations académiques</h3>
                  <p>Résumé scolaire disponible sur le dossier</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {academicInfo.map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>{getFieldValue(value)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Choix de formation</h3>
                  <p>Programme et orientation demandés par le candidat</p>
                </div>
              </div>

              <div className="admin-application-info-grid admin-application-info-grid-compact">
                {formationInfo.map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>{getFieldValue(value, "Non précisé")}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Lettre de motivation</h3>
                  <p>Texte libre transmis avec la candidature</p>
                </div>
              </div>

              <div className="admin-application-letter">
                <p>{motivationText}</p>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Documents du dossier</h3>
                  <p>{providedDocumentsCount} document(s) reçu(s) sur {documents.length}</p>
                </div>
                {missingDocuments.length > 0 ? (
                  <span className="admin-queue-pill warning">
                    {missingDocuments.length} document(s) manquant(s)
                  </span>
                ) : (
                  <span className="admin-queue-pill positive">Dossier documentaire complet</span>
                )}
              </div>

              {missingDocuments.length > 0 ? (
                <div className="admin-application-doc-alert">
                  <strong>Pièces à relancer :</strong> {missingDocuments.map((item) => item.label).join(", ")}
                </div>
              ) : null}

              <div className="admin-application-documents">
                {documents.map((document) => (
                  <div
                    key={document.key}
                    className={`admin-application-document-row ${
                      document.provided ? "provided" : "missing"
                    }`}
                  >
                    <div className="admin-application-document-main">
                      <strong>{document.label}</strong>
                      <span>
                        {document.provided
                          ? document.value
                          : "Document non fourni par le candidat"}
                      </span>
                    </div>

                    <div className="admin-application-document-side">
                      <span className={`admin-queue-pill ${document.provided ? "positive" : "warning"}`}>
                        {document.provided ? "Reçu" : "Manquant"}
                      </span>
                      <div className="admin-application-document-actions">
                        <button
                          type="button"
                          className="admin-detail-link-button"
                          disabled={!document.provided}
                          onClick={() => handleDocumentAction(document, "preview")}
                        >
                          Voir
                        </button>
                        <button
                          type="button"
                          className="admin-detail-link-button"
                          disabled={!document.provided}
                          onClick={() => handleDocumentAction(document, "download")}
                        >
                          Télécharger
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="admin-application-side">
            <article className="admin-meta-card admin-application-sticky-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Pilotage interne</h3>
                  <p>Affectation, priorité et suivi collaboratif</p>
                </div>
              </div>

              <div className="admin-meta-overview">
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Priorité interne</span>
                  <span className={`admin-queue-pill ${candidature.adminMeta.internalPriorityTone}`}>
                    {candidature.adminMeta.internalPriorityLabel}
                  </span>
                </div>
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Statut interne</span>
                  <span className={`admin-queue-pill ${candidature.adminMeta.internalStatusTone}`}>
                    {candidature.adminMeta.internalStatusLabel}
                  </span>
                </div>
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Dernière mise à jour</span>
                  <strong>{formatAdminDateTime(candidature.adminMeta.lastUpdatedAt)}</strong>
                </div>
                <div className="admin-meta-item">
                  <span className="admin-meta-label">Décision finale</span>
                  <strong>
                    {candidature.adminMeta.decisionDate
                      ? formatAdminDateTime(candidature.adminMeta.decisionDate)
                      : "Aucune décision finale"}
                  </strong>
                </div>
              </div>

              <form className="admin-control-form" onSubmit={handleMetadataSubmit}>
                <div className="admin-control-grid">
                  <label className="admin-control-field" htmlFor="detailPriority">
                    <span className="admin-toolbar-label">Priorité</span>
                    <select
                      id="detailPriority"
                      className="admin-toolbar-select"
                      value={metadataForm.internalPriority}
                      onChange={(event) =>
                        setMetadataForm((current) => ({
                          ...current,
                          internalPriority: event.target.value,
                        }))
                      }
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-control-field" htmlFor="detailInternalStatus">
                    <span className="admin-toolbar-label">Statut interne</span>
                    <select
                      id="detailInternalStatus"
                      className="admin-toolbar-select"
                      value={metadataForm.internalStatus}
                      onChange={(event) =>
                        setMetadataForm((current) => ({
                          ...current,
                          internalStatus: event.target.value,
                        }))
                      }
                    >
                      {INTERNAL_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label
                    className="admin-control-field admin-control-field-wide"
                    htmlFor="detailAssignedTo"
                  >
                    <span className="admin-toolbar-label">Affecté à</span>
                    <input
                      id="detailAssignedTo"
                      className="admin-control-input"
                      type="text"
                      value={metadataForm.assignedTo}
                      onChange={(event) =>
                        setMetadataForm((current) => ({
                          ...current,
                          assignedTo: event.target.value,
                        }))
                      }
                      placeholder="Ex. Cellule Campus France Alger"
                    />
                  </label>
                </div>

                <div className="admin-control-actions">
                  <Button type="submit" className="campus-btn-primary">
                    Enregistrer le pilotage
                  </Button>
                </div>
              </form>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Historique</h3>
                  <p>Chronologie des actions effectuées sur ce dossier</p>
                </div>
              </div>

              {dossierHistory.length === 0 ? (
                <p className="admin-note-empty">Aucun événement n'est encore enregistré sur ce dossier.</p>
              ) : (
                <div className="admin-application-history">
                  {dossierHistory.map((entry) => (
                    <article key={entry.id} className="admin-application-history-item">
                      <div className={`admin-application-history-dot ${entry.tone || "neutral"}`} />
                      <div className="admin-application-history-content">
                        <div className="admin-application-history-head">
                          <strong>{entry.title}</strong>
                          <span>{formatAdminDateTime(entry.occurredAt)}</span>
                        </div>
                        <p>{entry.description}</p>
                        {entry.detail ? (
                          <small className="admin-application-history-detail">{entry.detail}</small>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="admin-meta-card admin-note-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Notes administrateur</h3>
                  <p>Commentaires internes non visibles par le candidat</p>
                </div>
              </div>

              <form className="admin-note-form" onSubmit={handleAddNote}>
                <label className="admin-control-field" htmlFor="internalNote">
                  <span className="admin-toolbar-label">Nouvelle note</span>
                  <textarea
                    id="internalNote"
                    className="admin-control-textarea"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Ajoutez un commentaire de traitement, une relance ou une consigne interne..."
                    rows={4}
                  />
                </label>

                <div className="admin-control-actions">
                  <Button type="submit" className="campus-btn-primary">
                    Ajouter la note
                  </Button>
                </div>
              </form>

              <div className="admin-note-list">
                {candidature.adminMeta.notesCount === 0 ? (
                  <p className="admin-note-empty">Aucune note interne sur ce dossier pour le moment.</p>
                ) : (
                  candidature.adminMeta.notes.map((note) => (
                    <article key={note.id} className="admin-note-item">
                      <div className="admin-note-meta">
                        <strong>{note.authorName}</strong>
                        <span>{note.authorRole}</span>
                        <span>{formatAdminDateTime(note.createdAt)}</span>
                      </div>
                      <p>{note.content}</p>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Navigation</h3>
                  <p>Revenir rapidement aux autres espaces de gestion</p>
                </div>
              </div>

              <div className="admin-detail-navigation">
                <Link to="/admin/candidatures" className="admin-detail-nav-link">
                  Retour aux candidatures
                </Link>
                <Button className="admin-detail-action admin-detail-action-neutral" onClick={() => navigate("/admin")}>
                  Retour au dashboard
                </Button>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
