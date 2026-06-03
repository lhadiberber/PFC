import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import CustomSelect from "../../components/ui/CustomSelect";
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

function isValidAcademicYear(value) {
  return /^\d{4}-\d{4}$/.test(value.trim());
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
    } else if (!isValidAcademicYear(formData.anneeUniversitaire)) {
      nextErrors.anneeUniversitaire = "Format attendu : 2025-2026.";
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
        <h3>Orientation universitaire</h3>
        <p>
          Sélectionnez la filière que vous souhaitez intégrer en première année
          universitaire. Les établissements compatibles seront proposés à l'étape suivante.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Complétion</strong>
            <span>{completion}%</span>
          </div>
          <ProgressBar value={completion} color="#00C9B1" label={`${completion}%`} compact />
        </div>
      </div>

      <div className="student-application-note">
        <strong>Niveau</strong>
        <p>
          Première année universitaire — fixé automatiquement pour les bacheliers.
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={1}
      title="Déposer une candidature"
      subtitle="Choisissez la filière que vous souhaitez intégrer après l'obtention du baccalauréat."
      helperText="Votre choix de filière déterminera la liste des établissements proposés à l'étape suivante."
      introTitle="Choix de la filière"
      introText="Sélectionnez un domaine d'études, puis la filière souhaitée pour votre entrée en première année universitaire."
      sidebar={sidebar}
    >
      <form
        className="student-application-form-stack"
        onSubmit={(event) => event.preventDefault()}
      >
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Filière demandée</h2>
              <p>
                Renseignez votre choix d'orientation. Ces informations serviront à
                filtrer les établissements compatibles à l'étape suivante.
              </p>
            </div>
            <span className="student-application-required-pill">* Champ obligatoire</span>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field">
              <label htmlFor="application-domain">Domaine d'études <abbr title="champ obligatoire">*</abbr></label>
              <CustomSelect
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
              </CustomSelect>
              {errors.domaine ? <span className="error-message">{errors.domaine}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-filiere">Filière souhaitée <abbr title="champ obligatoire">*</abbr></label>
              <CustomSelect
                id="application-filiere"
                name="filiere"
                value={formData.filiere}
                onChange={handleChange}
                className="student-application-input"
                disabled={!formData.domaine}
                required
              >
                <option value="">
                  {formData.domaine
                    ? "Sélectionner une filière"
                    : "Choisissez d'abord un domaine"}
                </option>
                {filieres.map((filiere) => (
                  <option key={filiere.nom} value={filiere.nom}>
                    {filiere.nom}
                  </option>
                ))}
              </CustomSelect>
              {!formData.domaine ? (
                <span className="student-application-hint">
                  Sélectionnez un domaine pour afficher les filières disponibles.
                </span>
              ) : null}
              {errors.filiere ? <span className="error-message">{errors.filiere}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-year">Année universitaire <abbr title="champ obligatoire">*</abbr></label>
              <input
                id="application-year"
                type="text"
                name="anneeUniversitaire"
                value={formData.anneeUniversitaire}
                onChange={handleChange}
                placeholder="Ex. : 2025-2026"
                className="student-application-input"
                required
              />
              <span className="student-application-hint">
                Format attendu : 2025-2026.
              </span>
              {errors.anneeUniversitaire ? (
                <span className="error-message">{errors.anneeUniversitaire}</span>
              ) : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-level">Niveau de candidature</label>
              <input
                id="application-level"
                type="text"
                value={NIVEAU_BACHELIER}
                className="student-application-input"
                readOnly
              />
              <span className="student-application-hint">
                Le niveau est fixé automatiquement pour les candidatures de bacheliers.
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
            Retour au tableau de bord
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
