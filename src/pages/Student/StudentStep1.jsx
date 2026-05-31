import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAdmissions } from "../../context/AdmissionsContext";
import {
  NIVEAU_BACHELIER,
  getDomaines,
  getFilieresByDomaine,
} from "../../data/formationsBachelier";
import "../../index.css";

function getDefaultAcademicYear() {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 1}`;
}

function countCompleted(values) {
  return ["domaine", "filiere", "anneeUniversitaire"].filter((field) =>
    String(values[field] || "").trim()
  ).length;
}

export default function StudentStep1() {
  const navigate = useNavigate();
  const { applicationDraft, updateAcademicInfo } = useAdmissions();
  const [formData, setFormData] = useState(() => ({
    domaine: applicationDraft.academicInfo.domaine || "",
    filiere: applicationDraft.academicInfo.filiere || "",
    anneeUniversitaire:
      applicationDraft.academicInfo.anneeUniversitaire || getDefaultAcademicYear(),
    niveau: NIVEAU_BACHELIER,
  }));
  const [errors, setErrors] = useState({});

  const domaines = useMemo(() => getDomaines(), []);
  const filieres = useMemo(
    () => getFilieresByDomaine(formData.domaine),
    [formData.domaine]
  );
  const completion = useMemo(
    () => Math.round((countCompleted(formData) / 3) * 100),
    [formData]
  );

  const syncAcademicInfo = (nextFormData) => {
    setFormData(nextFormData);
    updateAcademicInfo({
      ...nextFormData,
      niveau: NIVEAU_BACHELIER,
      niveauDemande: NIVEAU_BACHELIER,
      specialite: nextFormData.filiere,
      formation: nextFormData.filiere,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextFormData = {
      ...formData,
      [name]: value,
    };

    if (name === "domaine") {
      nextFormData.filiere = "";
      updateAcademicInfo({
        etablissement: "",
        universite: "",
        faculteInstitut: "",
        wilayaEtablissement: "",
        typeEtablissement: "",
      });
    }

    if (name === "filiere") {
      updateAcademicInfo({
        etablissement: "",
        universite: "",
        faculteInstitut: "",
        wilayaEtablissement: "",
        typeEtablissement: "",
      });
    }

    syncAcademicInfo(nextFormData);

    if (errors[name]) {
      setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.domaine.trim()) {
      nextErrors.domaine = "Veuillez sélectionner un domaine d'études.";
    }
    if (!formData.filiere.trim()) {
      nextErrors.filiere = "Veuillez sélectionner une filière.";
    }
    if (!formData.anneeUniversitaire.trim()) {
      nextErrors.anneeUniversitaire = "Veuillez renseigner l'année universitaire.";
    }

    return nextErrors;
  };

  const handleNext = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateAcademicInfo({
      ...formData,
      niveau: NIVEAU_BACHELIER,
      niveauDemande: NIVEAU_BACHELIER,
      specialite: formData.filiere,
      formation: formData.filiere,
    });
    navigate("/student-step2");
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>Choix de la filière</h3>
        <p>
          Choisissez la filière que vous souhaitez intégrer en première année
          universitaire.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Sélection</strong>
            <span>{completion}%</span>
          </div>
          <ProgressBar value={completion} color="#2563eb" label={`${completion}%`} compact />
        </div>
      </div>

      <div className="student-application-note">
        <strong>Niveau de candidature</strong>
        <p>
          Le niveau est fixé automatiquement à la première année universitaire
          pour les bacheliers.
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={1}
      title="Déposer une candidature"
      subtitle="Choisissez la filière que vous souhaitez intégrer après le baccalauréat."
      helperText="Cette étape précise votre choix d'orientation. Les établissements proposés ensuite dépendront de la filière sélectionnée."
      introTitle="Choix de la filière"
      introText="Sélectionnez un domaine d'études, puis la filière souhaitée pour votre entrée en première année universitaire."
      sidebar={sidebar}
    >
      <form className="student-application-form-stack" onSubmit={(event) => event.preventDefault()}>
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Filière demandée</h2>
              <p>Les champs ci-dessous permettent de préparer la liste des établissements compatibles.</p>
            </div>
            <span className="student-application-required-pill">Champs obligatoires</span>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field">
              <label htmlFor="application-domain">Domaine d'études *</label>
              <select
                id="application-domain"
                name="domaine"
                value={formData.domaine}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Sélectionner un domaine</option>
                {domaines.map((domaine) => (
                  <option key={domaine} value={domaine}>
                    {domaine}
                  </option>
                ))}
              </select>
              {errors.domaine ? <span className="error-message">{errors.domaine}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-filiere">Filière souhaitée *</label>
              <select
                id="application-filiere"
                name="filiere"
                value={formData.filiere}
                onChange={handleChange}
                className="student-application-input"
                disabled={!formData.domaine}
                required
              >
                <option value="">
                  {formData.domaine ? "Sélectionner une filière" : "Choisissez d'abord un domaine"}
                </option>
                {filieres.map((filiere) => (
                  <option key={filiere.nom} value={filiere.nom}>
                    {filiere.nom}
                  </option>
                ))}
              </select>
              {errors.filiere ? <span className="error-message">{errors.filiere}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-year">Année universitaire *</label>
              <input
                id="application-year"
                type="text"
                name="anneeUniversitaire"
                value={formData.anneeUniversitaire}
                onChange={handleChange}
                placeholder="Ex. 2026-2027"
                className="student-application-input"
                required
              />
              {errors.anneeUniversitaire ? (
                <span className="error-message">{errors.anneeUniversitaire}</span>
              ) : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-level">Niveau</label>
              <input
                id="application-level"
                type="text"
                value={NIVEAU_BACHELIER}
                className="student-application-input"
                readOnly
              />
              <span className="student-application-hint">
                Le niveau n'est pas modifiable pour une candidature de bachelier.
              </span>
            </div>
          </div>
        </section>

        <div className="student-application-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Retour au dashboard
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleNext}
          >
            Continuer vers l'établissement
          </button>
        </div>
      </form>
    </ApplicationStepLayout>
  );
}
