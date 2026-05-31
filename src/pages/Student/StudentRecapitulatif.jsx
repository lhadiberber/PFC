import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAdmissions } from "../../context/AdmissionsContext";
import { NIVEAU_BACHELIER } from "../../data/formationsBachelier";
import { createApplication } from "../../services/applicationService";
import { clearAuthSession, getAuthToken } from "../../services/authService";
import { showLoading, showToast } from "../../utils/toast";
import "../../index.css";

const PERSONAL_ITEMS = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "dateNaiss", label: "Date de naissance", type: "date" },
  { key: "telephone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "wilaya", label: "Wilaya" },
  { key: "commune", label: "Commune" },
];

const BAC_ITEMS = [
  { key: "anneeBac", label: "Année du bac" },
  { key: "serieBac", label: "Série du bac" },
  { key: "moyenneBac", label: "Moyenne générale", type: "average" },
  { key: "mentionBac", label: "Mention" },
  { key: "numeroInscriptionBac", label: "Numéro d'inscription au bac" },
  { key: "lyceeOrigine", label: "Lycée d'origine" },
  { key: "wilayaLycee", label: "Wilaya du lycée" },
];

const CHOICE_ITEMS = [
  { key: "domaine", label: "Domaine d'études" },
  { key: "filiere", label: "Filière souhaitée" },
  { key: "etablissement", label: "Établissement choisi" },
  { key: "faculteInstitut", label: "Faculté / Institut" },
  { key: "wilayaEtablissement", label: "Wilaya de l'établissement" },
  { key: "typeEtablissement", label: "Type d'établissement" },
  { key: "anneeUniversitaire", label: "Année universitaire" },
  { key: "niveauDemande", label: "Niveau" },
];

const DOCUMENT_ITEMS = [
  { key: "releveNotes", label: "Relevé de notes du baccalauréat", required: true },
  { key: "attestationReussite", label: "Attestation de réussite au baccalauréat", required: true },
  { key: "carteIdentite", label: "Pièce d'identité", required: true },
  { key: "photo", label: "Photo d'identité", required: true },
  { key: "residence", label: "Certificat de résidence", required: true },
  { key: "justificatifParticulier", label: "Justificatif particulier", required: false },
];

const REQUIRED_DOCUMENT_ITEMS = DOCUMENT_ITEMS.filter((document) => document.required);

function hasValue(value) {
  return String(value || "").trim() !== "";
}

function countCompleted(source, items) {
  return items.filter((item) => hasValue(source[item.key])).length;
}

function countFilled(source, items) {
  return items.filter((item) => hasValue(source[item.key])).length;
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function formatDate(value) {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAcademicValue(academicInfo, key) {
  const aliases = {
    serieBac: academicInfo.serieBac || academicInfo.typeBac || academicInfo.diplomeActuel,
    mentionBac: academicInfo.mentionBac || academicInfo.mention,
    lyceeOrigine: academicInfo.lyceeOrigine || academicInfo.etablissementActuel,
    niveauDemande: academicInfo.niveauDemande || academicInfo.niveau || NIVEAU_BACHELIER,
  };

  return aliases[key] ?? academicInfo[key];
}

function getDisplayValue(source, item, academicInfo = source) {
  const rawValue = item.source === "academic" ? getAcademicValue(academicInfo, item.key) : source[item.key];

  if (item.type === "date") {
    return formatDate(rawValue);
  }

  if (item.type === "average" && hasValue(rawValue)) {
    return `${rawValue} / 20`;
  }

  return rawValue || "Non renseigné";
}

function buildBackendNumeroDossier(application) {
  if (!application?.id) {
    return "";
  }

  const date = new Date(application.date_depot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

export default function StudentRecapitulatif() {
  const navigate = useNavigate();
  const { applicationDraft, submitApplication } = useAdmissions();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const isSubmittingRef = useRef(false);

  const personalInfo = applicationDraft.personalInfo;
  const academicInfo = applicationDraft.academicInfo;
  const documents = applicationDraft.documents;
  const personalCompletion = useMemo(
    () => toPercent(countFilled(personalInfo, PERSONAL_ITEMS), PERSONAL_ITEMS.length),
    [personalInfo]
  );
  const bacCompletion = useMemo(
    () =>
      toPercent(
        BAC_ITEMS.filter((item) => hasValue(getAcademicValue(academicInfo, item.key))).length,
        BAC_ITEMS.length
      ),
    [academicInfo]
  );
  const choiceCompletion = useMemo(
    () =>
      toPercent(
        CHOICE_ITEMS.filter((item) => hasValue(getAcademicValue(academicInfo, item.key))).length,
        CHOICE_ITEMS.length
      ),
    [academicInfo]
  );
  const documentsCompletion = useMemo(
    () => toPercent(countCompleted(documents, REQUIRED_DOCUMENT_ITEMS), REQUIRED_DOCUMENT_ITEMS.length),
    [documents]
  );

  const missingItems = useMemo(() => {
    const missing = [];

    PERSONAL_ITEMS.forEach((item) => {
      if (!hasValue(personalInfo[item.key])) {
        missing.push(item.label);
      }
    });

    BAC_ITEMS.forEach((item) => {
      if (!hasValue(getAcademicValue(academicInfo, item.key))) {
        missing.push(item.label);
      }
    });

    CHOICE_ITEMS.forEach((item) => {
      if (!hasValue(getAcademicValue(academicInfo, item.key))) {
        missing.push(item.label);
      }
    });

    REQUIRED_DOCUMENT_ITEMS.forEach((item) => {
      if (!hasValue(documents[item.key])) {
        missing.push(item.label);
      }
    });

    return missing;
  }, [academicInfo, documents, personalInfo]);

  const handleValiderClick = () => {
    if (missingItems.length > 0) {
      showToast("Veuillez compléter les informations obligatoires avant de valider.", "error");
      return;
    }

    setSubmitError("");
    setShowConfirm(true);
  };

  const confirmValider = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      const message = "Session absente ou expirée. Veuillez vous reconnecter.";
      setSubmitError(message);
      setShowConfirm(false);
      showToast(message, "error");
      navigate("/login", { state: { message } });
      return;
    }

    isSubmittingRef.current = true;
    setShowConfirm(false);
    setIsSubmitting(true);
    setSubmitError("");
    showLoading(true, "Envoi de votre candidature...");

    try {
      const backendApplication = await createApplication({
        domaine: academicInfo.domaine,
        filiere: academicInfo.filiere,
        annee_universitaire: academicInfo.anneeUniversitaire,
        niveau: NIVEAU_BACHELIER,
        etablissement: academicInfo.etablissement,
        faculte_institut: academicInfo.faculteInstitut,
        wilaya_etablissement: academicInfo.wilayaEtablissement,
        type_etablissement: academicInfo.typeEtablissement,
        universite: academicInfo.etablissement,
        formation: academicInfo.filiere,
        motivation: academicInfo.commentaires || "Candidature en première année universitaire.",
      });

      const createdApplication = submitApplication();
      const numeroDossier =
        buildBackendNumeroDossier(backendApplication) || createdApplication.numeroDossier;

      showLoading(false);
      showToast("Candidature envoyée avec succès.", "success");
      navigate(`/success?numeroDossier=${numeroDossier}`);
    } catch (error) {
      const message = error.message || "Impossible de soumettre la candidature.";
      if (error.status === 401) {
        clearAuthSession();
        navigate("/login", { state: { message } });
      }
      showLoading(false);
      setSubmitError(message);
      showToast(message, "error");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>État du dossier</h3>
        <p>Vérifiez attentivement les informations de votre dossier avant de valider votre candidature.</p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Profil</strong>
            <span>{personalCompletion}%</span>
          </div>
          <ProgressBar value={personalCompletion} color="#2563eb" label={`${personalCompletion}%`} compact />
        </div>

        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Baccalauréat</strong>
            <span>{bacCompletion}%</span>
          </div>
          <ProgressBar value={bacCompletion} color="#0f766e" label={`${bacCompletion}%`} compact />
        </div>

        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Choix universitaire</strong>
            <span>{choiceCompletion}%</span>
          </div>
          <ProgressBar value={choiceCompletion} color="#7c3aed" label={`${choiceCompletion}%`} compact />
        </div>

        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Documents</strong>
            <span>{documentsCompletion}%</span>
          </div>
          <ProgressBar value={documentsCompletion} color="#d97706" label={`${documentsCompletion}%`} compact />
        </div>
      </div>

      <div className="student-application-note">
        <strong>{missingItems.length === 0 ? "Dossier prêt" : "Points à compléter"}</strong>
        <p>
          {missingItems.length === 0
            ? "Votre dossier est complet. Vous pouvez valider votre candidature."
            : `${missingItems.length} élément(s) doivent encore être vérifiés ou complétés.`}
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={4}
      title="Déposer une candidature"
      subtitle="Vérifiez l'ensemble de vos informations avant de soumettre votre dossier."
      helperText="Cette dernière étape vous permet de relire votre dossier complet avant la validation."
      introTitle="Récapitulatif de votre candidature"
      introText="Vérifiez attentivement les informations de votre dossier avant de valider votre candidature."
      sidebar={sidebar}
    >
      {showConfirm ? (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Confirmation de soumission</h3>
            <p>Voulez-vous vraiment valider cette candidature ?</p>
            <div className="confirm-buttons">
              <button className="retour-btn" onClick={() => setShowConfirm(false)}>
                Annuler
              </button>
              <button className="valider-btn" onClick={confirmValider} disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="student-application-form-stack">
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Résumé du dossier</h2>
              <p>Relisez les informations principales avant la validation finale.</p>
            </div>
            <StatusBadge status={missingItems.length === 0 ? "Validé" : "En attente"} />
          </div>

          <div className="student-application-recap-grid">
            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Informations personnelles</h3>
                <button type="button" className="student-application-inline-link" onClick={() => navigate("/profil")}>
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {PERSONAL_ITEMS.map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>{getDisplayValue(personalInfo, item)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Informations du bac</h3>
                <button type="button" className="student-application-inline-link" onClick={() => navigate("/profil")}>
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {BAC_ITEMS.map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>{getDisplayValue(academicInfo, { ...item, source: "academic" }, academicInfo)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Choix universitaire</h3>
                <button type="button" className="student-application-inline-link" onClick={() => navigate("/student-step1")}>
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {CHOICE_ITEMS.map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>{getDisplayValue(academicInfo, { ...item, source: "academic" }, academicInfo)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Documents</h2>
              <p>Vérifiez que les pièces obligatoires sont bien déposées.</p>
            </div>
            <button type="button" className="student-application-inline-link" onClick={() => navigate("/student-step3")}>
              Modifier les documents
            </button>
          </div>

          <div className="student-application-documents-review">
            {DOCUMENT_ITEMS.map((item) => {
              const isSubmitted = hasValue(documents[item.key]);
              const status = isSubmitted ? "Déposé" : item.required ? "Manquant" : "Non fourni";

              return (
                <div key={item.key} className="student-application-document-review-row">
                  <div>
                    <h3>{item.label}</h3>
                    <p>{documents[item.key] || (item.required ? "Document obligatoire manquant." : "Document optionnel non fourni.")}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-validation-card">
            <div>
              <h2>Validation de la candidature</h2>
              <p>
                En validant, votre dossier sera transmis au service des admissions.
                Vous pourrez suivre son état depuis votre espace étudiant.
              </p>
            </div>

            {missingItems.length > 0 ? (
              <div className="student-application-validation-warning">
                <strong>Éléments encore à vérifier</strong>
                <ul>
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="student-application-note">
                <strong>Dossier complet</strong>
                <p>Votre candidature est prête à être validée.</p>
              </div>
            )}
          </div>
        </section>

        <div className="student-application-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step3")}
          >
            Retour
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step1")}
          >
            Modifier
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleValiderClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : "Valider ma candidature"}
          </button>
        </div>
      </div>
    </ApplicationStepLayout>
  );
}
