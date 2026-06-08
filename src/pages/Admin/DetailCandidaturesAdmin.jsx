import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import CustomSelect from "../../components/ui/CustomSelect";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdmissions } from "../../context/AdmissionsContext";
import {
  clearAuthSession,
  getApiErrorMessage,
  getApiRetryingMessage,
  getApiUnavailableMessage,
  getAuthToken,
  isNetworkUnavailableError,
} from "../../services/authService";
import {
  fetchAdminDocumentFile,
  getAdminApplication,
  updateAdminApplicationStatus as updateAdminApplicationStatusApi,
} from "../../services/adminService";
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
  { key: "releveNotes", label: "Relevé de notes du baccalauréat" },
  { key: "attestationReussite", label: "Attestation de réussite au bac" },
  { key: "carteIdentite", label: "Pièce d'identité" },
  { key: "photo", label: "Photo d'identité" },
  { key: "residence", label: "Certificat de résidence" },
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

function getPreselectionTone(status) {
  switch (status) {
    case "eligible":
      return "positive";
    case "incomplet":
      return "warning";
    case "non_eligible":
      return "danger";
    default:
      return "neutral";
  }
}

function normalizeDocumentType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  const [actionFeedback, setActionFeedback] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState("");
  const [pendingStatusDecision, setPendingStatusDecision] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
        let application = null;
        let lastNetworkError = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            application = await getAdminApplication(id);
            lastNetworkError = null;
            break;
          } catch (error) {
            if (error.status === 401 || !isNetworkUnavailableError(error)) {
              throw error;
            }

            lastNetworkError = error;

            if (isActive) {
              setApplicationError(getApiRetryingMessage("des candidatures"));
            }

            await wait(600 * (attempt + 1));
          }
        }

        if (lastNetworkError) {
          throw lastNetworkError;
        }

        if (isActive) {
          setApplicationError("");
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
          isNetworkUnavailableError(error)
            ? getApiUnavailableMessage("des candidatures")
            : error.status === 403
              ? "Accès refusé. Cette page est réservée aux administrateurs."
              : getApiErrorMessage(error, "Impossible de charger la candidature.")
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
  }, [id, navigate, reloadKey]);

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
          <div className="admin-dashboard-topbar-actions">
            <Button
              className="campus-btn-primary"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Réessayer
            </Button>
          </div>
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
  const documentRecords = Array.isArray(candidature.documents) ? candidature.documents : [];
  const documents = DOCUMENT_FIELDS.map((documentField) => {
    const documentRecord =
      documentRecords.find((record) => record.key === documentField.key) ||
      documentRecords.find(
        (record) =>
          normalizeDocumentType(record.type_document) === normalizeDocumentType(documentField.label)
      );
    const value = candidature.details?.[documentField.key] || documentRecord?.nom_fichier || "";

    return {
      ...documentField,
      value,
      fileUrl: documentRecord?.file_url || "",
      status: documentRecord?.statut || "",
      documentId: documentRecord?.id ? String(documentRecord.id) : "",
      provided: Boolean(value || documentRecord?.id || documentRecord?.file_url),
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

  const executeStatusChange = async (nextStatus) => {
    setPendingStatusDecision("");
    setStatusActionLoading(nextStatus);
    setApplicationError("");
    setActionFeedback(null);

    try {
      const updatedApplication = await updateAdminApplicationStatusApi(candidature.id, {
        statut: nextStatus,
        commentaire_admin: noteDraft.trim() || undefined,
      });

      if (updatedApplication) {
        setRemoteApplication(updatedApplication);
      }

      updateApplicationStatus(candidature.id, nextStatus);
      setActionFeedback({
        type: "success",
        text: `Statut mis à jour : ${getStatusDisplayLabel(nextStatus)}`,
      });
    } catch (error) {
      const message = isNetworkUnavailableError(error)
        ? getApiUnavailableMessage("des candidatures")
        : getApiErrorMessage(error, "Impossible de mettre à jour le statut.");

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
    } finally {
      setStatusActionLoading("");
    }
  };

  const handleStatusChange = (nextStatus) => {
    setPendingStatusDecision(nextStatus);
    setActionFeedback(null);
  };

  const handleMetadataSubmit = (event) => {
    event.preventDefault();

    const nextAssignedTo = metadataForm.assignedTo.trim();
    const hasChanges =
      metadataForm.internalPriority !== candidature.adminMeta.internalPriority ||
      metadataForm.internalStatus !== candidature.adminMeta.internalStatus ||
      nextAssignedTo !== candidature.adminMeta.assignedTo;

    if (!hasChanges) {
      setActionFeedback({ type: "info", text: "Aucune mise à jour à enregistrer." });
      return;
    }

    updateApplicationMetadata(candidature.id, {
      internalPriority: metadataForm.internalPriority,
      internalStatus: metadataForm.internalStatus,
      assignedTo: nextAssignedTo,
    });
    setActionFeedback({ type: "success", text: "Pilotage interne mis à jour." });
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    const createdNote = addApplicationNote(candidature.id, noteDraft);

    if (!createdNote) {
      setActionFeedback({ type: "info", text: "Ajoutez un contenu de note avant validation." });
      return;
    }

    setNoteDraft("");
    setActionFeedback({ type: "success", text: "Note interne ajoutée." });
  };

  const handleRequestDocument = () => {
    const createdNote = addApplicationNote(
      candidature.id,
      "Demande de document complémentaire envoyée au candidat."
    );

    if (!createdNote) {
      setActionFeedback({ type: "info", text: "La demande de document n'a pas pu être enregistrée." });
      return;
    }

    updateApplicationMetadata(candidature.id, {
      internalStatus: "qualification",
    });
    setActionFeedback({
      type: "success",
      text: "Demande de document enregistrée dans le suivi du dossier.",
    });
  };

  const handleDocumentAction = async (documentItem, mode) => {
    if (!documentItem.provided) {
      setActionFeedback({ type: "info", text: `${documentItem.label} manquant sur ce dossier.` });
      return;
    }

    if (!documentItem.documentId) {
      setActionFeedback({
        type: "error",
        text: `Fichier introuvable ou inaccessible : ${documentItem.value || documentItem.label}.`,
      });
      return;
    }

    setActionFeedback(null);

    try {
      const file = await fetchAdminDocumentFile(
        documentItem.documentId,
        mode === "preview" ? "view" : "download"
      );

      if (mode === "preview") {
        const openedWindow = window.open(file.objectUrl, "_blank", "noopener,noreferrer");
        if (!openedWindow) {
          setActionFeedback({
            type: "info",
            text: "L'aperçu n'a pas pu s'ouvrir. Utilisez le téléchargement du fichier.",
          });
        }
        window.setTimeout(() => URL.revokeObjectURL(file.objectUrl), 1000);
        return;
      }

      const link = window.document.createElement("a");
      link.href = file.objectUrl;
      link.download = file.fileName || documentItem.value || documentItem.label;
      link.rel = "noreferrer";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(file.objectUrl), 1000);
    } catch (error) {
      setActionFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Fichier introuvable ou inaccessible."),
      });
      return;
    }
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

      {actionFeedback ? (
        <div
          className={`student-profile-feedback ${
            actionFeedback.type === "error"
              ? "student-profile-feedback-error"
              : actionFeedback.type === "success"
                ? "student-profile-feedback-success"
                : "student-profile-feedback-info"
          }`}
          role={actionFeedback.type === "error" ? "alert" : "status"}
        >
          {actionFeedback.text}
        </div>
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
              <span className={`admin-queue-pill ${getPreselectionTone(candidature.preselection?.status)}`}>
                {candidature.preselection?.label || "Non évalué"}
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
            {pendingStatusDecision ? (
              <div className="admin-inline-confirm" role="alertdialog" aria-live="polite">
                <strong>Confirmer la décision</strong>
                <p>{getStatusConfirmationMessage(pendingStatusDecision)}</p>
                <div className="admin-inline-confirm-actions">
                  <Button
                    className="admin-filter-tab"
                    onClick={() => setPendingStatusDecision("")}
                    disabled={Boolean(statusActionLoading)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="admin-table-action-button"
                    onClick={() => executeStatusChange(pendingStatusDecision)}
                    disabled={Boolean(statusActionLoading)}
                  >
                    {statusActionLoading ? "Mise à jour..." : "Confirmer"}
                  </Button>
                </div>
              </div>
            ) : null}
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
                  <span className="admin-meta-label">Présélection</span>
                  <span className={`admin-queue-pill ${getPreselectionTone(candidature.preselection?.status)}`}>
                    {candidature.preselection?.label || "Non évalué"}
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
                    <CustomSelect
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
                    </CustomSelect>
                  </label>

                  <label className="admin-control-field" htmlFor="detailInternalStatus">
                    <span className="admin-toolbar-label">Statut interne</span>
                    <CustomSelect
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
                    </CustomSelect>
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
