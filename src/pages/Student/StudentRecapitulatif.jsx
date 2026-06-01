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
  { key: "email", label: "Adresse e-mail" },
  { key: "wilaya", label: "Wilaya de résidence" },
  { key: "commune", label: "Commune" },
];

const BAC_ITEMS = [
  { key: "anneeBac", label: "Année d'obtention du bac" },
  { key: "serieBac", label: "Série du baccalauréat" },
  { key: "moyenneBac", label: "Moyenne générale", type: "average" },
  { key: "mentionBac", label: "Mention obtenue" },
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
  { key: "niveauDemande", label: "Niveau demandé" },
];

const DOCUMENT_ITEMS = [
  { key: "releveNotes", label: "Relevé de notes du baccalauréat", required: true },
  { key: "attestationReussite", label: "Attestation de réussite au bac", required: true },
  { key: "carteIdentite", label: "Pièce d'identité nationale", required: true },
  { key: "photo", label: "Photo d'identité", required: true },
  { key: "residence", label: "Certificat de résidence", required: true },
  { key: "justificatifParticulier", label: "Justificatif particulier", required: false },
];

const REQUIRED_DOCUMENT_ITEMS = DOCUMENT_ITEMS.filter((document) => document.required);

function hasValue(value) {
  return String(value || "").trim() !== "";
}

function toPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

function formatDate(value) {
  if (!value) return "Non renseigné";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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
  const rawValue =
    item.source === "academic"
      ? getAcademicValue(academicInfo, item.key)
      : source[item.key];

  if (item.type === "date") return formatDate(rawValue);
  if (item.type === "average" && hasValue(rawValue)) return `${rawValue} / 20`;
  return rawValue || "Non renseigné";
}

function buildBackendNumeroDossier(application) {
  if (!application?.id) return "";
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

  const { personalInfo, academicInfo, documents } = applicationDraft;

  const personalCompletion = useMemo(
    () =>
      toPercent(
        PERSONAL_ITEMS.filter((item) => hasValue(personalInfo[item.key])).length,
        PERSONAL_ITEMS.length
      ),
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
    () =>
      toPercent(
        REQUIRED_DOCUMENT_ITEMS.filter((item) => hasValue(documents[item.key])).length,
        REQUIRED_DOCUMENT_ITEMS.length
      ),
    [documents]
  );

  const missingItems = useMemo(() => {
    const missing = [];
    PERSONAL_ITEMS.forEach((item) => {
      if (!hasValue(personalInfo[item.key])) missing.push(item.label);
    });
    BAC_ITEMS.forEach((item) => {
      if (!hasValue(getAcademicValue(academicInfo, item.key))) missing.push(item.label);
    });
    CHOICE_ITEMS.forEach((item) => {
      if (!hasValue(getAcademicValue(academicInfo, item.key))) missing.push(item.label);
    });
    REQUIRED_DOCUMENT_ITEMS.forEach((item) => {
      if (!hasValue(documents[item.key])) missing.push(item.label);
    });
    return missing;
  }, [personalInfo, academicInfo, documents]);

  const dossierComplet = missingItems.length === 0;

  const handleValiderClick = () => {
    if (!dossierComplet) {
      showToast("Veuillez compléter les informations obligatoires avant de valider.", "error");
      return;
    }
    setSubmitError("");
    setShowConfirm(true);
  };

  const confirmValider = async () => {
    if (isSubmittingRef.current) return;

    const token = getAuthToken();
    if (!token) {
      const message = "Session expirée. Veuillez vous reconnecter.";
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
    showLoading(true, "Transmission de votre candidature en cours...");

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
      showToast("Votre candidature a été transmise avec succès.", "success");
      navigate(`/success?numeroDossier=${numeroDossier}`);
    } catch (error) {
      const message = error.message || "Une erreur est survenue lors de la soumission.";
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
        <p>
          Vérifiez attentivement chaque section avant de soumettre votre candidature.
          Tout champ manquant peut retarder l'examen de votre dossier.
        </p>
      </div>

      <div className="student-application-side-metrics">
        {[
          { label: "Informations personnelles", value: personalCompletion, color: "#2563eb" },
          { label: "Baccalauréat", value: bacCompletion, color: "#0f766e" },
          { label: "Choix universitaire", value: choiceCompletion, color: "#7c3aed" },
          { label: "Pièces justificatives", value: documentsCompletion, color: "#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="student-application-side-metric">
            <div className="student-application-side-metric-head">
              <strong>{label}</strong>
              <span>{value}%</span>
            </div>
            <ProgressBar value={value} color={color} label={`${value}%`} compact />
          </div>
        ))}
      </div>

      <div className="student-application-note">
        <strong>{dossierComplet ? "Dossier complet" : "Dossier incomplet"}</strong>
        <p>
          {dossierComplet
            ? "Tous les champs obligatoires sont renseignés. Vous pouvez valider votre candidature."
            : `${missingItems.length} élément(s) obligatoire(s) doivent encore être complétés.`}
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={4}
      title="Déposer une candidature"
      subtitle="Relisez l'ensemble de votre dossier avant de le soumettre au service des admissions."
      helperText="Cette étape est irréversible. Vérifiez chaque section avant de valider."
      introTitle="Récapitulatif de votre candidature"
      introText="Vérifiez attentivement toutes les informations ci-dessous. Une fois validé, votre dossier sera transmis à l'administration universitaire."
      sidebar={sidebar}
    >
      {showConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="confirm-dialog">
            <h3 id="confirm-title">Confirmer la soumission</h3>
            <p>
              Vous êtes sur le point de transmettre votre dossier de candidature au service des admissions.
              Cette action ne peut pas être annulée.
            </p>
            <p>Confirmez-vous la soumission de votre candidature ?</p>
            <div className="confirm-buttons">
              <button
                className="retour-btn"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                className="valider-btn"
                onClick={confirmValider}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Transmission en cours..." : "Confirmer et soumettre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {submitError}
        </div>
      )}

      <div className="student-application-form-stack">
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Informations du dossier</h2>
              <p>Relisez vos données personnelles, académiques et votre choix d'orientation.</p>
            </div>
            <StatusBadge status={dossierComplet ? "Valide" : "En attente"} />
          </div>

          <div className="student-application-recap-grid">
            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Informations personnelles</h3>
                <button
                  type="button"
                  className="student-application-inline-link"
                  onClick={() => navigate("/profil")}
                >
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
                <h3>Baccalauréat</h3>
                <button
                  type="button"
                  className="student-application-inline-link"
                  onClick={() => navigate("/profil")}
                >
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {BAC_ITEMS.map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>
                      {getDisplayValue(academicInfo, { ...item, source: "academic" }, academicInfo)}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Choix d'orientation</h3>
                <button
                  type="button"
                  className="student-application-inline-link"
                  onClick={() => navigate("/student-step1")}
                >
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {CHOICE_ITEMS.map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>
                      {getDisplayValue(academicInfo, { ...item, source: "academic" }, academicInfo)}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Pièces justificatives</h2>
              <p>Vérifiez que tous les documents obligatoires ont bien été déposés.</p>
            </div>
            <button
              type="button"
              className="student-application-inline-link"
              onClick={() => navigate("/student-step3")}
            >
              Modifier les documents
            </button>
          </div>

          <div className="student-application-documents-review">
            {DOCUMENT_ITEMS.map((item) => {
              const isSubmitted = hasValue(documents[item.key]);
              const status = isSubmitted
                ? "Déposé"
                : item.required
                  ? "Manquant"
                  : "Non fourni";

              return (
                <div key={item.key} className="student-application-document-review-row">
                  <div>
                    <h3>
                      {item.label}
                      {item.required && (
                        <span aria-label="Obligatoire">
                          {" "}*
                        </span>
                      )}
                    </h3>
                    <p>
                      {isSubmitted
                        ? "Document déposé."
                        : item.required
                          ? "Ce document est obligatoire et n'a pas encore été fourni."
                          : "Document optionnel non fourni."}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>
              );
            })}
          </div>

          <p className="student-application-hint">
            * Les documents marqués d'un astérisque sont obligatoires pour l'examen de votre dossier.
          </p>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-validation-card">
            <div>
              <h2>Validation et soumission</h2>
              <p>
                En soumettant votre dossier, vous confirmez l'exactitude des informations fournies.
                Votre candidature sera transmise au service des admissions de l'établissement choisi.
                Vous pourrez suivre son avancement depuis votre espace étudiant.
              </p>
            </div>

            {!dossierComplet ? (
              <div className="student-application-validation-warning">
                <strong>Éléments obligatoires manquants</strong>
                <p>Les informations suivantes doivent être complétées avant la soumission :</p>
                <ul>
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="student-application-note">
                <strong>Dossier prêt à être soumis</strong>
                <p>
                  Tous les champs obligatoires sont renseignés. Cliquez sur « Soumettre ma candidature »
                  pour finaliser votre inscription.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="student-application-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step3")}
            disabled={isSubmitting}
          >
            Retour
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleValiderClick}
            disabled={isSubmitting || !dossierComplet}
            title={!dossierComplet ? "Complétez les champs obligatoires pour continuer" : undefined}
          >
            {isSubmitting ? "Transmission en cours..." : "Soumettre ma candidature"}
          </button>
        </div>
      </div>
    </ApplicationStepLayout>
  );
}
