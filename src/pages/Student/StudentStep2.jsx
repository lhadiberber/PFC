import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import CustomSelect from "../../components/ui/CustomSelect";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAdmissions } from "../../context/AdmissionsContext";
import { findFiliereByName } from "../../data/formationsBachelier";
import "../../index.css";

function buildInitialData(academicInfo) {
  return {
    etablissement: academicInfo.etablissement || academicInfo.universite || "",
    faculteInstitut: academicInfo.faculteInstitut || "",
    wilayaEtablissement: academicInfo.wilayaEtablissement || "",
    typeEtablissement: academicInfo.typeEtablissement || "",
  };
}

function countCompleted(values) {
  return ["etablissement", "faculteInstitut", "wilayaEtablissement", "typeEtablissement"].filter(
    (field) => String(values[field] || "").trim()
  ).length;
}

export default function StudentStep2() {
  const navigate = useNavigate();
  const { applicationDraft, updateAcademicInfo } = useAdmissions();
  const selectedFiliere = applicationDraft.academicInfo.filiere;
  const selectedDomaine = applicationDraft.academicInfo.domaine;
  const filiereDetails = useMemo(
    () => findFiliereByName(selectedFiliere),
    [selectedFiliere]
  );
  const etablissements = filiereDetails?.etablissements || [];
  const [formData, setFormData] = useState(() => buildInitialData(applicationDraft.academicInfo));
  const [errors, setErrors] = useState({});

  const completion = useMemo(
    () => Math.round((countCompleted(formData) / 4) * 100),
    [formData]
  );

  // choix de l'etablissement selon la filiere
  const handleEtablissementChange = (event) => {
    const etablissement = etablissements.find((item) => item.nom === event.target.value);
    const nextFormData = etablissement
      ? {
          etablissement: etablissement.nom,
          faculteInstitut: etablissement.faculte,
          wilayaEtablissement: etablissement.wilaya,
          typeEtablissement: etablissement.type,
        }
      : {
          etablissement: "",
          faculteInstitut: "",
          wilayaEtablissement: "",
          typeEtablissement: "",
        };

    setFormData(nextFormData);
    updateAcademicInfo({
      ...nextFormData,
      universite: nextFormData.etablissement,
    });
    setErrors({});
  };

  const validate = () => {
    if (!formData.etablissement.trim()) {
      return { etablissement: "Veuillez sélectionner un établissement." };
    }
    return {};
  };

  // passage vers le depot des documents
  const handleNext = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    updateAcademicInfo({
      ...formData,
      universite: formData.etablissement,
    });
    navigate("/student-step3");
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>Établissements proposés</h3>
        <p>
          La liste des établissements est filtrée automatiquement selon la filière
          sélectionnée à l'étape précédente.
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
        <strong>Filière sélectionnée</strong>
        <p>{selectedFiliere || "Aucune filière sélectionnée."}</p>
      </div>

      {selectedDomaine ? (
        <div className="student-application-note">
          <strong>Domaine</strong>
          <p>{selectedDomaine}</p>
        </div>
      ) : null}
    </>
  );

  return (
    <ApplicationStepLayout
      step={2}
      title="Déposer une candidature"
      subtitle="Sélectionnez l'établissement correspondant à votre filière."
      helperText="La liste est filtrée selon votre choix de filière. Vous pouvez revenir à l'étape précédente pour modifier votre sélection."
      introTitle="Choix de l'établissement"
      introText="Sélectionnez l'établissement qui propose votre filière en première année universitaire. Les informations associées seront renseignées automatiquement."
      sidebar={sidebar}
    >
      <form
        className="student-application-form-stack"
        onSubmit={(event) => event.preventDefault()}
      >
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Établissement demandé</h2>
              <p>
                Domaine : <strong>{selectedDomaine || "non renseigné"}</strong> · Filière :{" "}
                <strong>{selectedFiliere || "non renseignée"}</strong>
              </p>
            </div>
            <span className="student-application-required-pill">* Champ obligatoire</span>
          </div>

          {!selectedFiliere ? (
            <div
              className="student-profile-feedback student-profile-feedback-error"
              role="alert"
            >
              Aucune filière sélectionnée. Veuillez retourner à l'étape précédente pour
              effectuer votre choix.
            </div>
          ) : null}

          {selectedFiliere && etablissements.length === 0 ? (
            <div
              className="student-profile-feedback student-profile-feedback-info"
              role="status"
            >
              Aucun établissement disponible pour la filière sélectionnée. Veuillez
              retourner à l'étape précédente et choisir une autre filière.
            </div>
          ) : null}

          <div className="student-application-form-grid">
            <div className="student-application-field student-application-field-full">
              <label htmlFor="application-establishment">Établissement <abbr title="champ obligatoire">*</abbr></label>
              <CustomSelect
                id="application-establishment"
                name="etablissement"
                value={formData.etablissement}
                onChange={handleEtablissementChange}
                className="student-application-input"
                disabled={!selectedFiliere || etablissements.length === 0}
                required
              >
                <option value="">Sélectionner un établissement</option>
                {etablissements.map((etablissement) => (
                  <option key={etablissement.nom} value={etablissement.nom}>
                    {etablissement.nom}
                  </option>
                ))}
              </CustomSelect>
              {errors.etablissement ? (
                <span className="error-message">{errors.etablissement}</span>
              ) : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-faculty">Faculté / Institut</label>
              <input
                id="application-faculty"
                type="text"
                value={formData.faculteInstitut}
                className="student-application-input"
                readOnly
              />
              <span className="student-application-hint">
                Renseigné automatiquement selon l'établissement choisi.
              </span>
            </div>

            <div className="student-application-field">
              <label htmlFor="application-establishment-wilaya">Wilaya</label>
              <input
                id="application-establishment-wilaya"
                type="text"
                value={formData.wilayaEtablissement}
                className="student-application-input"
                readOnly
              />
              <span className="student-application-hint">
                Renseignée automatiquement selon l'établissement choisi.
              </span>
            </div>

            <div className="student-application-field">
              <label htmlFor="application-establishment-type">Type d'établissement</label>
              <input
                id="application-establishment-type"
                type="text"
                value={formData.typeEtablissement}
                className="student-application-input"
                readOnly
              />
              <span className="student-application-hint">
                Renseigné automatiquement selon l'établissement choisi.
              </span>
            </div>
          </div>
        </section>

        <div className="student-application-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step1")}
          >
            Retour à la filière
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleNext}
            disabled={!selectedFiliere || etablissements.length === 0}
          >
            Continuer vers les documents
          </button>
        </div>
      </form>
    </ApplicationStepLayout>
  );
}
