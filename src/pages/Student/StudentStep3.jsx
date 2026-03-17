import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAdmissions } from "../../context/AdmissionsContext";
import "../../index.css";

const documentConfig = {
  copieBac: {
    label: "Copie du bac ou diplome",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "BAC",
  },
  releveNotes: {
    label: "Releve de notes",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "NOTES",
  },
  carteIdentite: {
    label: "Carte d'identite ou passeport",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "ID",
  },
  photo: {
    label: "Photo d'identite",
    accept: ".jpg,.jpeg,.png",
    maxSize: 2 * 1024 * 1024,
    icon: "PHOTO",
  },
  residence: {
    label: "Justificatif de residence",
    accept: ".pdf,.jpg,.jpeg,.png",
    maxSize: 5 * 1024 * 1024,
    icon: "ADR",
  },
  cv: {
    label: "CV",
    accept: ".pdf,.doc,.docx",
    maxSize: 5 * 1024 * 1024,
    icon: "CV",
  },
};

function isImageDocument(fieldName) {
  return [".jpg", ".jpeg", ".png"].some((extension) =>
    documentConfig[fieldName].accept.includes(extension)
  );
}

function formatMegabytes(size) {
  return `${size / (1024 * 1024)} MB`;
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

  const uploadedCount = useMemo(() => Object.values(files).filter(Boolean).length, [files]);
  const uploadProgress = useMemo(
    () => Math.round((uploadedCount / Object.keys(documentConfig).length) * 100),
    [uploadedCount]
  );

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

    const nextErrors = { ...errors };
    delete nextErrors[fieldName];
    setErrors(nextErrors);
  };

  const processFile = (file, fieldName) => {
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

    setPreviews((currentPreviews) => {
      if (currentPreviews[fieldName]) {
        URL.revokeObjectURL(currentPreviews[fieldName]);
      }

      return {
        ...currentPreviews,
        [fieldName]: isImageDocument(fieldName) ? URL.createObjectURL(file) : "",
      };
    });

    const nextFiles = {
      ...files,
      [fieldName]: file.name,
    };

    setFiles(nextFiles);
    updateDocuments({ [fieldName]: file.name });
  };

  const handleFileChange = (event, fieldName) => {
    processFile(event.target.files?.[0], fieldName);
  };

  const handleRemoveFile = (fieldName) => {
    setPreviews((currentPreviews) => {
      if (currentPreviews[fieldName]) {
        URL.revokeObjectURL(currentPreviews[fieldName]);
      }

      return {
        ...currentPreviews,
        [fieldName]: "",
      };
    });

    const nextFiles = {
      ...files,
      [fieldName]: "",
    };

    setFiles(nextFiles);
    updateDocuments({ [fieldName]: "" });
    clearFieldError(fieldName);

    if (fileInputRefs.current[fieldName]) {
      fileInputRefs.current[fieldName].value = "";
    }
  };

  const handleDragOver = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: true }));
  };

  const handleDragLeave = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: false }));
  };

  const handleDrop = (event, fieldName) => {
    event.preventDefault();
    setDragStates((currentState) => ({ ...currentState, [fieldName]: false }));
    processFile(event.dataTransfer.files?.[0], fieldName);
  };

  const handleRecapitulatif = () => {
    const nextErrors = {};

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
              <span>{files[key] || "Document non depose"}</span>
            </div>
            <span
              className={`student-application-doc-status ${files[key] ? "is-ready" : "is-missing"}`.trim()}
            >
              {files[key] ? "Depose" : "Manquant"}
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
                  onClick={() => fileInputRefs.current[fieldName]?.click()}
                >
                  <input
                    type="file"
                    ref={(element) => {
                      fileInputRefs.current[fieldName] = element;
                    }}
                    onChange={(event) => handleFileChange(event, fieldName)}
                    className="file-input-hidden"
                    accept={config.accept}
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
                        <span className="file-status">Document pret</span>
                      </div>

                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFile(fieldName);
                        }}
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">{config.icon}</span>
                      <span className="upload-label">{config.label}</span>
                      <span className="upload-hint">Cliquer ou glisser un fichier ici</span>
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
          >
            Acceder au recapitulatif
          </button>
        </div>
      </div>
    </ApplicationStepLayout>
  );
}
