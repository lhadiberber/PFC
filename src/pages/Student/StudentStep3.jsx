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
import { showToast } from "../../utils/toast";
import "../../index.css";

const documentConfig = {
  copieBac: {
    label: "Diplome",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "DIP",
  },
  releveNotes: {
    label: "Releve de notes",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "NOTES",
  },
  carteIdentite: {
    label: "Passeport / Carte d'identite",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "ID",
  },
  photo: {
    label: "Lettre de motivation",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "LM",
  },
  residence: {
    label: "Certificat de langue",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "LANG",
  },
  cv: {
    label: "CV",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "CV",
  },
};

const DOCUMENT_TYPE_BY_FIELD = Object.fromEntries(
  Object.entries(documentConfig).map(([fieldName, config]) => [fieldName, config.label])
);

const FIELD_BY_DOCUMENT_TYPE = Object.fromEntries(
  Object.entries(DOCUMENT_TYPE_BY_FIELD).map(([fieldName, documentType]) => [
    documentType,
    fieldName,
  ])
);

function isImageDocument(fieldName) {
  return [".jpg", ".jpeg", ".png"].some((extension) =>
    documentConfig[fieldName].accept.includes(extension)
  );
}

function formatMegabytes(size) {
  return `${size / (1024 * 1024)} MB`;
}

function mapApiDocumentsToFields(documents) {
  return documents.reduce(
    (mappedDocuments, document) => {
      const fieldName = FIELD_BY_DOCUMENT_TYPE[document.type_document];

      if (!fieldName || mappedDocuments.files[fieldName]) {
        return mappedDocuments;
      }

      mappedDocuments.files[fieldName] = document.nom_fichier || "";
      mappedDocuments.documentIds[fieldName] = document.id;
      mappedDocuments.statuses[fieldName] = document.statut || "En attente";

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

export default function StudentStep3() {
  const navigate = useNavigate();
  const fileInputRefs = useRef({});
  const { applicationDraft, updateDocuments } = useAdmissions();

  const [files, setFiles] = useState(() => ({
    copieBac: applicationDraft.documents.copieBac || "",
    releveNotes: applicationDraft.documents.releveNotes || "",
    carteIdentite: applicationDraft.documents.carteIdentite || "",
    photo: applicationDraft.documents.photo || "",
    residence: applicationDraft.documents.residence || "",
    cv: applicationDraft.documents.cv || "",
  }));
  const [previews, setPreviews] = useState({});
  const [errors, setErrors] = useState({});
  const [dragStates, setDragStates] = useState({});
  const [documentIds, setDocumentIds] = useState({});
  const [documentStatuses, setDocumentStatuses] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [pageError, setPageError] = useState("");

  const uploadedCount = useMemo(() => Object.values(files).filter(Boolean).length, [files]);
  const uploadProgress = useMemo(
    () => Math.round((uploadedCount / Object.keys(documentConfig).length) * 100),
    [uploadedCount]
  );

  useEffect(() => {
    let isActive = true;

    async function loadExistingDocuments() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expiree. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsLoadingDocuments(true);
      setPageError("");

      try {
        const documents = await listMyDocuments();

        if (!isActive) {
          return;
        }

        const mappedDocuments = mapApiDocumentsToFields(documents);

        const nextFiles = {
          ...buildEmptyDocumentFiles(),
          ...mappedDocuments.files,
        };

        setFiles(nextFiles);
        setDocumentIds(mappedDocuments.documentIds);
        setDocumentStatuses(mappedDocuments.statuses);
        updateDocuments(nextFiles);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error.message || "Impossible de charger les documents deja deposes.";

        if (error.status === 401) {
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setPageError(message);
      } finally {
        if (isActive) {
          setIsLoadingDocuments(false);
        }
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
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [previews]);

  const clearFieldError = (fieldName) => {
    if (!errors[fieldName]) {
      return;
    }

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const processFile = async (file, fieldName) => {
    const config = documentConfig[fieldName];

    if (!file) {
      return;
    }

    const allowedTypes = config.accept.split(",").map((type) => type.trim().toLowerCase());
    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;

    if (!allowedTypes.includes(fileExtension)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: `Type de fichier non autorise. Formats acceptes : ${config.accept}`,
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
          // Le nouveau fichier est bien depose; l'ancien restera visible cote admin si la suppression echoue.
        }
      }

      setPreviews((currentPreviews) => {
        if (currentPreviews[fieldName]) {
          URL.revokeObjectURL(currentPreviews[fieldName]);
        }

        return {
          ...currentPreviews,
          [fieldName]: isImageDocument(fieldName) ? URL.createObjectURL(file) : "",
        };
      });

      setFiles((currentFiles) => ({
        ...currentFiles,
        [fieldName]: document.nom_fichier || file.name,
      }));
      setDocumentIds((currentDocumentIds) => ({
        ...currentDocumentIds,
        [fieldName]: document.id,
      }));
      setDocumentStatuses((currentStatuses) => ({
        ...currentStatuses,
        [fieldName]: document.statut || "En attente",
      }));
      updateDocuments({ [fieldName]: document.nom_fichier || file.name });
      showToast(`${config.label} depose avec succes.`, "success");
    } catch (error) {
      const message = error.message || "Impossible de deposer ce document.";

      if (error.status === 401) {
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: message,
      }));
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
      if (documentId) {
        await deleteStudentDocument(documentId);
      }

      setPreviews((currentPreviews) => {
        if (currentPreviews[fieldName]) {
          URL.revokeObjectURL(currentPreviews[fieldName]);
        }

        return {
          ...currentPreviews,
          [fieldName]: "",
        };
      });

      setFiles((currentFiles) => ({
        ...currentFiles,
        [fieldName]: "",
      }));
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
      updateDocuments({ [fieldName]: "" });
      clearFieldError(fieldName);
      showToast(`${documentConfig[fieldName].label} retire avec succes.`, "success");

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

      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: message,
      }));
    } finally {
      setUploadingFields((currentFields) => ({ ...currentFields, [fieldName]: false }));
    }
  };

  const handleDragOver = (event, fieldName) => {
    event.preventDefault();
    if (uploadingFields[fieldName]) {
      return;
    }
    setDragStates((currentState) => ({ ...currentState, [fieldName]: true }));
  };

  const handleDragLeave = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: false }));
  };

  const handleDrop = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: false }));
    if (uploadingFields[fieldName]) {
      return;
    }
    processFile(event.dataTransfer.files?.[0], fieldName);
  };

  const handleRecapitulatif = () => {
    const nextErrors = {};

    if (Object.values(uploadingFields).some(Boolean)) {
      setPageError("Veuillez attendre la fin de l'envoi des documents.");
      return;
    }

    Object.keys(documentConfig).forEach((key) => {
      if (!files[key]) {
        nextErrors[key] = "Ce document est requis.";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      setTimeout(() => {
        const firstError = document.querySelector(".has-error");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
          Deposez des fichiers lisibles et conformes. Chaque document doit etre
          complet pour permettre l'instruction de votre dossier.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Pieces deposees</strong>
            <span>
              {uploadedCount}/{Object.keys(documentConfig).length}
            </span>
          </div>
          <ProgressBar value={uploadProgress} color="#2563eb" label={`${uploadProgress}%`} compact />
        </div>
      </div>

      <ul className="student-application-side-list">
        {Object.entries(documentConfig).map(([key, config]) => (
          <li key={key}>
            <div>
              <strong>{config.label}</strong>
              <span>{isLoadingDocuments ? "Chargement..." : files[key] || "Document non depose"}</span>
            </div>
            <span
              className={`student-application-doc-status ${files[key] ? "is-ready" : "is-missing"}`.trim()}
            >
              {uploadingFields[key]
                ? "Envoi..."
                : files[key]
                  ? documentStatuses[key] || "Depose"
                  : "Manquant"}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <ApplicationStepLayout
      step={3}
      title="Deposer une candidature"
      subtitle="Ajoutez les pieces justificatives necessaires a la verification de votre dossier."
      helperText="Les documents televerses ici seront controles par l'administration. Verifiez leur lisibilite avant de continuer."
      introTitle="Documents justificatifs"
      introText="Tous les documents demandes sont requis pour finaliser la candidature. Les formats acceptes et tailles maximales sont indiques pour chaque piece."
      sidebar={sidebar}
    >
      <div className="student-application-form-stack">
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Pieces a fournir</h2>
              <p>Glissez vos fichiers dans la zone correspondante ou cliquez pour les selectionner.</p>
            </div>
            <span className="student-application-required-pill">
              {uploadedCount}/{Object.keys(documentConfig).length} depose(s)
            </span>
          </div>

          {pageError ? (
            <div className="student-profile-feedback student-profile-feedback-error" role="alert">
              {pageError}
            </div>
          ) : null}

          {isLoadingDocuments ? (
            <div className="student-profile-feedback">Chargement des documents deja deposes...</div>
          ) : null}

          <div className="student-application-progress-banner">
            <div>
              <strong>Progression du depot</strong>
              <p>Completez l'ensemble des pieces demandees pour acceder a la validation finale.</p>
            </div>
            <ProgressBar value={uploadProgress} color="#2563eb" label={`${uploadProgress}%`} />
          </div>

          <div className="student-application-upload-grid">
            {Object.entries(documentConfig).map(([fieldName, config]) => (
              <div key={fieldName} className="student-application-upload-card">
                <div className="student-application-upload-head">
                  <div>
                    <h3>{config.label}</h3>
                    <p>
                      Formats acceptes : {config.accept.replace(/,/g, ", ")}. Taille max : {formatMegabytes(config.maxSize)}.
                    </p>
                  </div>
                  <span className="student-application-upload-tag">Obligatoire</span>
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
                          <img src={previews[fieldName]} alt="Preview" className="file-preview" />
                        ) : (
                          <span className="file-emoji">{config.icon}</span>
                        )}
                      </div>

                      <div className="file-info">
                        <span className="file-name">{files[fieldName]}</span>
                        <span className="file-status">
                          {uploadingFields[fieldName]
                            ? "Envoi en cours..."
                            : `Document ${documentStatuses[fieldName] || "En attente"}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="remove-file-btn"
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
                      <span className="upload-icon">{config.icon}</span>
                      <span className="upload-label">{config.label}</span>
                      <span className="upload-hint">
                        {uploadingFields[fieldName]
                          ? "Envoi du fichier..."
                          : "Cliquer ou glisser un fichier ici"}
                      </span>
                      <span className="upload-formats">{config.accept.replace(/,/g, ", ")}</span>
                    </div>
                  )}
                </div>

                {errors[fieldName] ? <span className="error-message">{errors[fieldName]}</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-note">
            <strong>Verification finale</strong>
            <p>
              Avant de passer au recapitulatif, assurez-vous que chaque document depose
              correspond bien au fichier attendu et qu'il est lisible.
            </p>
          </div>
        </section>

        <div className="student-application-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step2")}
          >
            Retour
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleRecapitulatif}
            disabled={isLoadingDocuments || Object.values(uploadingFields).some(Boolean)}
          >
            {Object.values(uploadingFields).some(Boolean)
              ? "Envoi des documents..."
              : "Acceder au recapitulatif"}
          </button>
        </div>
      </div>
    </ApplicationStepLayout>
  );
}
