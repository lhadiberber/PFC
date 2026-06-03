import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAdmissions } from "../../context/AdmissionsContext";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import {
  deleteStudentDocument,
  listMyDocuments,
  uploadStudentDocument,
} from "../../services/documentService";
import "../../index.css";

const documentConfig = {
  releveNotes: {
    label: "Relevé de notes du baccalauréat",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "BAC",
    required: true,
  },
  attestationReussite: {
    label: "Attestation de réussite au baccalauréat",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "ATT",
    required: true,
  },
  carteIdentite: {
    label: "Pièce d'identité",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "ID",
    required: true,
  },
  photo: {
    label: "Photo d'identité",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "IMG",
    required: true,
  },
  residence: {
    label: "Certificat de résidence",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "RES",
    required: true,
  },
  justificatifParticulier: {
    label: "Justificatif particulier",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "OPT",
    required: false,
    help: "Ajoutez ce document uniquement si votre situation nécessite une pièce complémentaire.",
  },
};

const DOCUMENT_TYPE_BY_FIELD = Object.fromEntries(
  Object.entries(documentConfig).map(([fieldName, config]) => [fieldName, config.label])
);

const LEGACY_FIELD_BY_DOCUMENT_FIELD = {
  attestationReussite: "copieBac",
  justificatifParticulier: "cv",
};

const FIELD_BY_DOCUMENT_TYPE = Object.fromEntries(
  Object.entries(DOCUMENT_TYPE_BY_FIELD).map(([fieldName, documentType]) => [
    documentType,
    fieldName,
  ])
);

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveDocumentField(documentType) {
  const directField = FIELD_BY_DOCUMENT_TYPE[documentType];
  if (directField) return directField;

  const normalizedType = normalizeKey(documentType);
  const legacyMap = {
    diplome: "attestationReussite",
    "copie du bac ou diplome": "attestationReussite",
    "releve de notes": "releveNotes",
    "passeport / carte d'identite": "carteIdentite",
    "carte d'identite ou passeport": "carteIdentite",
    "lettre de motivation": "photo",
    "certificat de langue": "residence",
    cv: "justificatifParticulier",
  };

  return legacyMap[normalizedType] || null;
}

function isImageDocument(fieldName) {
  return [".jpg", ".jpeg", ".png"].some((extension) =>
    documentConfig[fieldName].accept.includes(extension)
  );
}

function formatMegabytes(size) {
  return `${size / (1024 * 1024)} Mo`;
}

function normalizeDocumentStatus(status) {
  const cleanStatus = String(status || "").trim();
  const normalizedStatus = normalizeKey(cleanStatus);
  if (normalizedStatus.startsWith("valid")) return "Validé";
  if (normalizedStatus.startsWith("refus")) return "Refusé";
  return "En attente";
}

function mapApiDocumentsToFields(documents) {
  return documents.reduce(
    (mappedDocuments, document) => {
      const fieldName = resolveDocumentField(document.type_document);
      if (!fieldName || mappedDocuments.files[fieldName]) return mappedDocuments;

      mappedDocuments.files[fieldName] = document.nom_fichier || "";
      mappedDocuments.documentIds[fieldName] = document.id;
      mappedDocuments.statuses[fieldName] = normalizeDocumentStatus(document.statut);

      return mappedDocuments;
    },
    { files: {}, documentIds: {}, statuses: {} }
  );
}

function buildEmptyDocumentFiles() {
  return Object.keys(documentConfig).reduce((fields, fieldName) => {
    fields[fieldName] = "";
    return fields;
  }, {});
}

function buildInitialFiles(documents = {}) {
  return {
    ...buildEmptyDocumentFiles(),
    releveNotes: documents.releveNotes || "",
    attestationReussite: documents.attestationReussite || documents.copieBac || "",
    carteIdentite: documents.carteIdentite || "",
    photo: documents.photo || "",
    residence: documents.residence || "",
    justificatifParticulier: documents.justificatifParticulier || documents.cv || "",
  };
}

function UploadIcon() {
  return (
    <svg
      className="upload-svg-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5" />
    </svg>
  );
}

export default function StudentStep3() {
  const navigate = useNavigate();
  const fileInputRefs = useRef({});
  const { applicationDraft, updateDocuments } = useAdmissions();

  const [files, setFiles] = useState(() => buildInitialFiles(applicationDraft.documents));
  const [previews, setPreviews] = useState({});
  const [errors, setErrors] = useState({});
  const [dragStates, setDragStates] = useState({});
  const [documentIds, setDocumentIds] = useState({});
  const [documentStatuses, setDocumentStatuses] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [pageError, setPageError] = useState("");

  const requiredDocumentKeys = useMemo(
    () =>
      Object.entries(documentConfig)
        .filter(([, config]) => config.required)
        .map(([key]) => key),
    []
  );

  const uploadedRequiredCount = useMemo(
    () => requiredDocumentKeys.filter((key) => files[key]).length,
    [files, requiredDocumentKeys]
  );

  const uploadProgress = useMemo(
    () => Math.round((uploadedRequiredCount / requiredDocumentKeys.length) * 100),
    [requiredDocumentKeys.length, uploadedRequiredCount]
  );

  useEffect(() => {
    let isActive = true;

    async function loadExistingDocuments() {
      const token = getAuthToken();

      if (!token) {
        clearAuthSession();
        navigate("/login", {
          state: { message: "Session absente ou expirée. Veuillez vous reconnecter." },
        });
        return;
      }

      setIsLoadingDocuments(true);
      setPageError("");

      try {
        const documents = await listMyDocuments();
        if (!isActive) return;

        const mappedDocuments = mapApiDocumentsToFields(documents);
        const nextFiles = { ...buildEmptyDocumentFiles(), ...mappedDocuments.files };

        setFiles(nextFiles);
        setDocumentIds(mappedDocuments.documentIds);
        setDocumentStatuses(mappedDocuments.statuses);
        updateDocuments(nextFiles);
      } catch (error) {
        if (!isActive) return;

        const message = error.message || "Impossible de charger les documents déjà déposés.";

        if (error.status === 401) {
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setPageError(message);
      } finally {
        if (isActive) setIsLoadingDocuments(false);
      }
    }

    loadExistingDocuments();
    return () => {
      isActive = false;
    };
  }, [navigate]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      });
    };
  }, [previews]);

  const clearFieldError = (fieldName) => {
    if (!errors[fieldName]) return;
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const processFile = async (file, fieldName) => {
    const config = documentConfig[fieldName];
    if (!file) return;

    const allowedTypes = config.accept.split(",").map((type) => type.trim().toLowerCase());
    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;

    if (!allowedTypes.includes(fileExtension)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: `Format non autorisé. Formats acceptés : ${config.accept}`,
      }));
      return;
    }

    if (file.size > config.maxSize) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: `Fichier trop volumineux. Taille maximale : ${formatMegabytes(config.maxSize)}`,
      }));
      return;
    }

    clearFieldError(fieldName);
    setUploadingFields((currentFields) => ({ ...currentFields, [fieldName]: true }));
    setPageError("");

    try {
      const previousDocumentId = documentIds[fieldName];
      const document = await uploadStudentDocument({
        typeDocument: DOCUMENT_TYPE_BY_FIELD[fieldName],
        file,
      });

      if (previousDocumentId && previousDocumentId !== document.id) {
        try {
          await deleteStudentDocument(previousDocumentId);
        } catch (_error) {
          // L'ancien fichier reste disponible si sa suppression échoue.
        }
      }

      setPreviews((currentPreviews) => {
        if (currentPreviews[fieldName]) URL.revokeObjectURL(currentPreviews[fieldName]);
        return {
          ...currentPreviews,
          [fieldName]: isImageDocument(fieldName) ? URL.createObjectURL(file) : "",
        };
      });

      const fileName = document.nom_fichier || file.name;

      setFiles((currentFiles) => ({ ...currentFiles, [fieldName]: fileName }));
      setDocumentIds((currentDocumentIds) => ({
        ...currentDocumentIds,
        [fieldName]: document.id,
      }));
      setDocumentStatuses((currentStatuses) => ({
        ...currentStatuses,
        [fieldName]: normalizeDocumentStatus(document.statut),
      }));
      updateDocuments({
        [fieldName]: fileName,
        [LEGACY_FIELD_BY_DOCUMENT_FIELD[fieldName] || fieldName]: fileName,
      });
    } catch (error) {
      const message = error.message || "Impossible de déposer ce document.";
      if (error.status === 401) {
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }
      setErrors((currentErrors) => ({ ...currentErrors, [fieldName]: message }));
    } finally {
      setUploadingFields((currentFields) => ({ ...currentFields, [fieldName]: false }));
      if (fileInputRefs.current[fieldName]) {
        fileInputRefs.current[fieldName].value = "";
      }
    }
  };

  const handleFileChange = (event, fieldName) => {
    processFile(event.target.files?.[0], fieldName);
  };

  const handleRemoveFile = async (fieldName) => {
    const documentId = documentIds[fieldName];
    setUploadingFields((currentFields) => ({ ...currentFields, [fieldName]: true }));

    try {
      if (documentId) await deleteStudentDocument(documentId);

      setPreviews((currentPreviews) => {
        if (currentPreviews[fieldName]) URL.revokeObjectURL(currentPreviews[fieldName]);
        return { ...currentPreviews, [fieldName]: "" };
      });

      setFiles((currentFiles) => ({ ...currentFiles, [fieldName]: "" }));
      setDocumentIds((currentDocumentIds) => {
        const nextDocumentIds = { ...currentDocumentIds };
        delete nextDocumentIds[fieldName];
        return nextDocumentIds;
      });
      setDocumentStatuses((currentStatuses) => {
        const nextStatuses = { ...currentStatuses };
        delete nextStatuses[fieldName];
        return nextStatuses;
      });
      updateDocuments({
        [fieldName]: "",
        [LEGACY_FIELD_BY_DOCUMENT_FIELD[fieldName] || fieldName]: "",
      });
      clearFieldError(fieldName);

      if (fileInputRefs.current[fieldName]) {
        fileInputRefs.current[fieldName].value = "";
      }
    } catch (error) {
      const message = error.message || "Impossible de retirer ce document.";
      if (error.status === 401) {
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }
      setErrors((currentErrors) => ({ ...currentErrors, [fieldName]: message }));
    } finally {
      setUploadingFields((currentFields) => ({ ...currentFields, [fieldName]: false }));
    }
  };

  const handleDragOver = (event, fieldName) => {
    event.preventDefault();
    if (uploadingFields[fieldName]) return;
    setDragStates((currentState) => ({ ...currentState, [fieldName]: true }));
  };

  const handleDragLeave = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: false }));
  };

  const handleDrop = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: false }));
    if (uploadingFields[fieldName]) return;
    processFile(event.dataTransfer.files?.[0], fieldName);
  };

  const handleRecapitulatif = () => {
    if (Object.values(uploadingFields).some(Boolean)) {
      setPageError("Veuillez attendre la fin de l'envoi des documents avant de continuer.");
      return;
    }

    const nextErrors = {};
    requiredDocumentKeys.forEach((key) => {
      if (!files[key]) {
        nextErrors[key] = "Ce document est requis.";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setTimeout(() => {
        const firstError = document.querySelector(".has-error");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    navigate("/student-recapitulatif");
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>Documents requis</h3>
        <p>
          Déposez des fichiers lisibles et conformes aux formats acceptés. Le justificatif
          particulier est optionnel.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Pièces obligatoires déposées</strong>
            <span>{uploadedRequiredCount}/{requiredDocumentKeys.length}</span>
          </div>
          <ProgressBar value={uploadProgress} color="#00C9B1" label={`${uploadProgress}%`} compact />
        </div>
      </div>

      <ul className="student-application-side-list">
        {Object.entries(documentConfig).map(([key, config]) => (
          <li key={key}>
            <div>
              <strong>{config.label}</strong>
              <span>
                {isLoadingDocuments
                  ? "Chargement..."
                  : files[key] || "Non déposé"}
              </span>
            </div>
            <span
              className={`student-application-doc-status ${
                files[key] ? "is-ready" : "is-missing"
              }`.trim()}
            >
              {uploadingFields[key]
                ? "Envoi..."
                : files[key]
                  ? documentStatuses[key] || "Déposé"
                  : config.required
                    ? "Manquant"
                    : "Optionnel"}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <ApplicationStepLayout
      step={3}
      title="Déposer une candidature"
      subtitle="Ajoutez les pièces justificatives nécessaires à l'instruction de votre dossier."
      helperText="Les documents téléversés seront contrôlés par l'administration. Vérifiez leur lisibilité avant de passer à l'étape suivante."
      introTitle="Documents justificatifs"
      introText="Les pièces obligatoires permettent de vérifier votre baccalauréat, votre identité et votre résidence. Le justificatif particulier est facultatif."
      sidebar={sidebar}
    >
      <div className="student-application-form-stack student-step3-page">
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Pièces à fournir</h2>
              <p>
                Glissez vos fichiers dans la zone correspondante ou cliquez pour les
                sélectionner depuis votre appareil.
              </p>
            </div>
            <span className="student-application-required-pill">
              {uploadedRequiredCount}/{requiredDocumentKeys.length} obligatoire(s) déposée(s)
            </span>
          </div>

          {pageError ? (
            <div
              className="student-profile-feedback student-profile-feedback-error"
              role="alert"
            >
              {pageError}
            </div>
          ) : null}

          {isLoadingDocuments ? (
            <div className="student-profile-feedback" aria-live="polite">
              Chargement des documents déjà déposés...
            </div>
          ) : null}

          <div className="student-application-progress-banner">
            <div>
              <strong>Progression du dépôt</strong>
              <p>
                {uploadProgress === 100
                  ? "Toutes les pièces obligatoires ont été déposées."
                  : "Ajoutez les pièces obligatoires pour accéder à la validation finale."}
              </p>
            </div>
            <ProgressBar value={uploadProgress} color="#00C9B1" label={`${uploadProgress}%`} />
          </div>

          <div className="student-application-upload-grid upload-grid">
            {Object.entries(documentConfig).map(([fieldName, config]) => (
              <div
                key={fieldName}
                className={`student-application-upload-card upload-card ${
                  files[fieldName] ? "completed" : ""
                }`.trim()}
              >
                <div className="student-application-upload-head">
                  <div>
                    <h3>{config.label}</h3>
                    <p>
                      Formats acceptés : {config.accept.replace(/,/g, ", ")}. Taille max :{" "}
                      {formatMegabytes(config.maxSize)}.
                    </p>
                    {config.help ? <p>{config.help}</p> : null}
                  </div>
                  <span className="student-application-upload-tag">
                    {config.required ? "Obligatoire" : "Optionnel"}
                  </span>
                </div>

                <div
                  className={[
                    "upload-zone",
                    dragStates[fieldName] ? "drag-over" : "",
                    files[fieldName] ? "has-file" : "",
                    errors[fieldName] ? "has-error" : "",
                  ]
                    .join(" ")
                    .trim()}
                  onDragOver={(event) => handleDragOver(event, fieldName)}
                  onDragLeave={(event) => handleDragLeave(event, fieldName)}
                  onDrop={(event) => handleDrop(event, fieldName)}
                  onClick={() => {
                    if (!uploadingFields[fieldName]) {
                      fileInputRefs.current[fieldName]?.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={(element) => {
                      fileInputRefs.current[fieldName] = element;
                    }}
                    onChange={(event) => handleFileChange(event, fieldName)}
                    className="file-input-hidden"
                    accept={config.accept}
                    disabled={uploadingFields[fieldName]}
                  />

                  {files[fieldName] ? (
                    <div className="uploaded-file">
                      <div className="file-icon">
                        {previews[fieldName] ? (
                          <img
                            src={previews[fieldName]}
                            alt="Aperçu du document"
                            className="file-preview"
                          />
                        ) : (
                          <span className="file-emoji">Fichier</span>
                        )}
                      </div>

                      <div className="file-info">
                        <span className="file-name">{files[fieldName]}</span>
                        <span className="file-status">
                          {uploadingFields[fieldName] ? (
                            "Envoi en cours..."
                          ) : (
                            <>
                              <span className="file-status-icon" aria-hidden="true">
                                {normalizeKey(documentStatuses[fieldName]).startsWith("valid")
                                  ? "\u2705"
                                  : "\u23F3"}
                              </span>
                              {`Statut : ${
                                documentStatuses[fieldName] || "En attente de validation"
                              }`}
                            </>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="remove-file-btn btn-retirer"
                        disabled={uploadingFields[fieldName]}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFile(fieldName);
                        }}
                      >
                        {uploadingFields[fieldName] ? "Traitement..." : "Retirer"}
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <UploadIcon />
                      <span className="upload-label">{config.label}</span>
                      <span className="upload-hint">
                        {uploadingFields[fieldName]
                          ? "Envoi du fichier en cours..."
                          : "Cliquez ou glissez un fichier ici"}
                      </span>
                      <span className="upload-formats">
                        {config.accept.replace(/,/g, ", ")}
                      </span>
                    </div>
                  )}
                </div>

                {errors[fieldName] ? (
                  <span className="error-message">{errors[fieldName]}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <details className="info-accordion">
          <summary>{"\u26A0\uFE0F"} Avant de continuer</summary>
          <div className="content">
            <p>
              Vérifiez que chaque document déposé est lisible, complet et correspond
              bien à la pièce demandée. Un document illisible ou incorrect peut
              entraîner un retard dans l'instruction de votre dossier.
            </p>
          </div>
        </details>

        <div className="student-application-actions form-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step2")}
          >
            Retour à l'établissement
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleRecapitulatif}
            disabled={isLoadingDocuments || Object.values(uploadingFields).some(Boolean)}
          >
            {Object.values(uploadingFields).some(Boolean)
              ? "Envoi en cours..."
              : "Accéder au récapitulatif"}
          </button>
        </div>
      </div>
    </ApplicationStepLayout>
  );
}
