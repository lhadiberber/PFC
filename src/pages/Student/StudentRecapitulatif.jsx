import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAdmissions } from "../../context/AdmissionsContext";
import { showLoading, showToast } from "../../utils/toast";
import "../../index.css";

const PERSONAL_ITEMS = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prenom" },
  { key: "dateNaiss", label: "Date de naissance" },
  { key: "lieuNaiss", label: "Lieu de naissance" },
  { key: "sexe", label: "Sexe" },
  { key: "nationalite", label: "Nationalite" },
  { key: "telephone", label: "Telephone" },
  { key: "email", label: "Adresse e-mail" },
  { key: "adresse", label: "Adresse complete" },
];

const ACADEMIC_ITEMS = [
  { key: "diplomeActuel", label: "Diplome actuel" },
  { key: "etablissementActuel", label: "Etablissement actuel" },
  { key: "pays", label: "Pays d'etudes" },
  { key: "anneeBac", label: "Annee d'obtention" },
  { key: "moyenneBac", label: "Moyenne generale" },
  { key: "specialiteActuelle", label: "Specialite actuelle" },
];

const TARGET_ITEMS = [
  { key: "universite", label: "Universite choisie" },
  { key: "specialite", label: "Formation demandee" },
  { key: "niveauDemande", label: "Niveau demande" },
];

const DOCUMENT_ITEMS = [
  { key: "copieBac", label: "Copie du bac ou diplome" },
  { key: "releveNotes", label: "Releve de notes" },
  { key: "carteIdentite", label: "Carte d'identite ou passeport" },
  { key: "photo", label: "Photo d'identite" },
  { key: "residence", label: "Justificatif de residence" },
  { key: "cv", label: "CV" },
];

function hasValue(value) {
  return String(value || "").trim() !== "";
}

function countCompleted(source, items) {
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
    return "Non renseigne";
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

function buildDocumentStatus(fileName) {
  return fileName ? { label: "Depose", tone: "Valide" } : { label: "Manquant", tone: "En attente" };
}

function getDisplayValue(source, key) {
  if (key === "dateNaiss") {
    return formatDate(source[key]);
  }

  if (key === "moyenneBac" && hasValue(source[key])) {
    return `${source[key]} / 20`;
  }

  return source[key] || "Non renseigne";
}

export default function StudentRecapitulatif() {
  const navigate = useNavigate();
  const { applicationDraft, submitApplication } = useAdmissions();
  const [showConfirm, setShowConfirm] = useState(false);

  const personalInfo = applicationDraft.personalInfo;
  const academicInfo = applicationDraft.academicInfo;
  const documents = applicationDraft.documents;

  const personalCompletion = useMemo(
    () => toPercent(countCompleted(personalInfo, PERSONAL_ITEMS), PERSONAL_ITEMS.length),
    [personalInfo]
  );
  const academicCompletion = useMemo(
    () =>
      toPercent(
        countCompleted(academicInfo, [...ACADEMIC_ITEMS, ...TARGET_ITEMS]),
        [...ACADEMIC_ITEMS, ...TARGET_ITEMS].length
      ),
    [academicInfo]
  );
  const documentsCompletion = useMemo(
    () => toPercent(countCompleted(documents, DOCUMENT_ITEMS), DOCUMENT_ITEMS.length),
    [documents]
  );

  const missingItems = useMemo(() => {
    const missing = [];

    PERSONAL_ITEMS.forEach((item) => {
      if (!hasValue(personalInfo[item.key])) {
        missing.push(item.label);
      }
    });

    [...ACADEMIC_ITEMS, ...TARGET_ITEMS].forEach((item) => {
      if (!hasValue(academicInfo[item.key])) {
        missing.push(item.label);
      }
    });

    DOCUMENT_ITEMS.forEach((item) => {
      if (!hasValue(documents[item.key])) {
        missing.push(item.label);
      }
    });

    return missing;
  }, [academicInfo, documents, personalInfo]);

  const handleValiderClick = () => {
    if (missingItems.length > 0) {
      showToast("Le dossier est incomplet. Merci de verifier les etapes precedentes.", "error");
      return;
    }

    setShowConfirm(true);
  };

  const confirmValider = () => {
    setShowConfirm(false);
    showLoading(true, "Envoi de votre candidature...");

    const createdApplication = submitApplication();

    setTimeout(() => {
      showLoading(false);
      showToast("Candidature soumise avec succes.", "success");
      navigate(`/success?numeroDossier=${createdApplication.numeroDossier}`);
    }, 1200);
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>Etat de preparation</h3>
        <p>
          Relisez chaque section avant de soumettre votre candidature. Une fois
          validee, votre demande deviendra active dans votre espace candidat.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Informations personnelles</strong>
            <span>{personalCompletion}%</span>
          </div>
          <ProgressBar value={personalCompletion} color="#2563eb" label={`${personalCompletion}%`} compact />
        </div>

        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Parcours academique</strong>
            <span>{academicCompletion}%</span>
          </div>
          <ProgressBar value={academicCompletion} color="#0f766e" label={`${academicCompletion}%`} compact />
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
        <strong>{missingItems.length === 0 ? "Dossier pret" : "Points a completer"}</strong>
        <p>
          {missingItems.length === 0
            ? "Votre dossier est complet. Vous pouvez maintenant confirmer la soumission."
            : `${missingItems.length} element(s) doivent encore etre verifies ou completes.`}
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={4}
      title="Deposer une candidature"
      subtitle="Verifiez l'ensemble de vos informations avant de soumettre officiellement votre dossier."
      helperText="Cette derniere etape vous permet de relire votre dossier complet et de confirmer la soumission de votre candidature."
      introTitle="Validation finale"
      introText="Prenez le temps de relire chaque section. Une fois la candidature soumise, elle apparaitra dans votre espace de suivi et sera transmise aux services d'admission."
      sidebar={sidebar}
    >
      {showConfirm ? (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Confirmation de soumission</h3>
            <p>Voulez-vous vraiment activer et soumettre cette candidature ?</p>
            <div className="confirm-buttons">
              <button className="retour-btn" onClick={() => setShowConfirm(false)}>
                Annuler
              </button>
              <button className="valider-btn" onClick={confirmValider}>
                Oui, soumettre
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="student-application-form-stack">
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Resume du dossier</h2>
              <p>Relisez chaque rubrique avant de finaliser votre candidature.</p>
            </div>
            <StatusBadge status={missingItems.length === 0 ? "Valide" : "En attente"} />
          </div>

          <div className="student-application-recap-grid">
            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Informations personnelles</h3>
                <button type="button" className="student-application-inline-link" onClick={() => navigate("/student-step1")}>
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {PERSONAL_ITEMS.map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>{getDisplayValue(personalInfo, item.key)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-application-recap-card">
              <div className="student-application-recap-head">
                <h3>Parcours academique</h3>
                <button type="button" className="student-application-inline-link" onClick={() => navigate("/student-step2")}>
                  Modifier
                </button>
              </div>
              <div className="student-application-detail-list">
                {[...ACADEMIC_ITEMS, ...TARGET_ITEMS].map((item) => (
                  <div key={item.key} className="student-application-detail-row">
                    <span>{item.label}</span>
                    <strong>{getDisplayValue(academicInfo, item.key)}</strong>
                  </div>
                ))}
                {academicInfo.motivation ? (
                  <div className="student-application-detail-block">
                    <span>Motivation courte</span>
                    <p>{academicInfo.motivation}</p>
                  </div>
                ) : null}
                {academicInfo.commentaires ? (
                  <div className="student-application-detail-block">
                    <span>Commentaires</span>
                    <p>{academicInfo.commentaires}</p>
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Documents du dossier</h2>
              <p>Verifiez que chaque document depose correspond bien a la piece demandee.</p>
            </div>
            <button type="button" className="student-application-inline-link" onClick={() => navigate("/student-step3")}>
              Modifier les documents
            </button>
          </div>

          <div className="student-application-documents-review">
            {DOCUMENT_ITEMS.map((item) => {
              const status = buildDocumentStatus(documents[item.key]);

              return (
                <div key={item.key} className="student-application-document-review-row">
                  <div>
                    <h3>{item.label}</h3>
                    <p>{documents[item.key] || "Aucun document depose pour cette piece."}</p>
                  </div>
                  <StatusBadge status={status.tone} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-validation-card">
            <div>
              <h2>Confirmation de la soumission</h2>
              <p>
                En validant votre candidature, vous activez votre dossier sur la plateforme.
                Vous pourrez ensuite suivre son evolution depuis votre espace etudiant.
              </p>
            </div>

            {missingItems.length > 0 ? (
              <div className="student-application-validation-warning">
                <strong>Elements encore a verifier</strong>
                <ul>
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="student-application-note">
                <strong>Dossier complet</strong>
                <p>Votre candidature est prete a etre soumise.</p>
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
            className="student-application-button student-application-button-primary"
            onClick={handleValiderClick}
          >
            Soumettre la candidature
          </button>
        </div>
      </div>
    </ApplicationStepLayout>
  );
}
