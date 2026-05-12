import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAdmissions } from "../../context/AdmissionsContext";
import { nationalities } from "../../utils/countryCodes";
import "../../index.css";

const ACADEMIC_FIELDS = [
  "diplomeActuel",
  "etablissementActuel",
  "pays",
  "anneeBac",
  "moyenneBac",
  "specialiteActuelle",
];

const TARGET_FIELDS = ["universite", "specialite", "niveauDemande", "motivation"];

const DIPLOMA_OPTIONS = [
  "Baccalaureat scientifique",
  "Baccalaureat mathematiques",
  "Licence",
  "Licence professionnelle",
  "Master 1",
  "Master 2",
  "Diplome d'ingenieur",
  "Autre diplome equivalent",
];

const CURRENT_SPECIALTY_OPTIONS = [
  "Informatique",
  "Mathematiques",
  "Physique",
  "Chimie",
  "Biologie",
  "Electronique",
  "Genie civil",
  "Economie et gestion",
  "Droit",
  "Langues etrangeres",
];

const TARGET_PROGRAM_OPTIONS = [
  "Informatique",
  "Mathematiques",
  "Physique",
  "Chimie",
  "Biologie",
  "Sciences de l'ingenieur",
  "Genie civil",
  "Statistique",
  "Management",
  "Economie appliquee",
];

const LEVEL_OPTIONS = ["Licence 3", "Master 1", "Master 2", "Cycle ingenieur"];

const UNIVERSITY_GROUPS = [
  {
    label: "Universites publiques",
    options: [
      "Universite d'Alger 1",
      "Universite d'Alger 2",
      "Universite d'Alger 3",
      "Universite de Constantine 1",
      "Universite de Constantine 2",
      "Universite de Constantine 3",
      "Universite d'Oran 1",
      "Universite d'Oran 2",
      "Universite de Annaba",
      "Universite de Tizi Ouzou",
      "Universite de Bejaia",
      "Universite de Blida 1",
      "Universite de Blida 2",
      "Universite de Mostaganem",
      "Universite de Mascara",
      "Universite de Sidi Bel Abbes",
      "Universite de Tlemcen",
      "Universite de Biskra",
      "Universite de Ouargla",
      "Universite de Ghardaia",
      "Universite de Batna 1",
      "Universite de Batna 2",
      "Universite de Setif 1",
      "Universite de Setif 2",
      "Universite de Jijel",
      "Universite de Skikda",
      "Universite de Constantine 4",
      "Universite de Medea",
      "Universite de Ain Defla",
      "Universite de Tiaret",
      "Universite de Bechar",
      "Universite de Djelfa",
      "Universite de Laghouat",
      "Universite de M'Sila",
      "Universite de Bouira",
      "Universite de Tebessa",
      "Universite de El Oued",
      "Universite de Khenchela",
      "Universite de Bordj Bou Arreridj",
      "Universite de Guelma",
      "Universite de Souk Ahras",
      "Universite de Tipaza",
      "Universite de Chlef",
      "Universite de Naama",
      "Universite de Illizi",
      "Universite de Tamanrasset",
      "Universite de Adrar",
    ],
  },
  {
    label: "Ecoles superieures",
    options: [
      "Ecole Nationale Polytechnique",
      "Ecole Nationale Superieure d'Informatique",
      "Ecole Nationale Polytechnique de Constantine",
      "Ecole Nationale Superieure de Statistique et d'Economie Appliquee",
      "Ecole Superieure de Commerce",
      "Ecole Nationale des Travaux Publics",
      "Ecole Nationale Superieure des Mines",
      "Ecole Nationale Superieure de Meteorologie",
      "Ecole Nationale Superieure des Sciences de la Mer",
    ],
  },
];

function countCompleted(values, fields) {
  return fields.filter((field) => String(values[field] || "").trim() !== "").length;
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export default function StudentStep2() {
  const navigate = useNavigate();
  const { applicationDraft, updateAcademicInfo } = useAdmissions();
  const [formData, setFormData] = useState(() => ({
    ...applicationDraft.academicInfo,
    typeBac: applicationDraft.academicInfo.typeBac || applicationDraft.academicInfo.diplomeActuel || "",
  }));
  const [errors, setErrors] = useState({});

  const academicCompletion = useMemo(
    () => toPercent(countCompleted(formData, ACADEMIC_FIELDS), ACADEMIC_FIELDS.length),
    [formData]
  );
  const targetCompletion = useMemo(
    () => toPercent(countCompleted(formData, TARGET_FIELDS), TARGET_FIELDS.length),
    [formData]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextFormData = {
      ...formData,
      [name]: value,
    };

    if (name === "diplomeActuel") {
      nextFormData.typeBac = value;
    }

    setFormData(nextFormData);
    updateAcademicInfo(nextFormData);

    if (errors[name]) {
      setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.diplomeActuel.trim()) nextErrors.diplomeActuel = "Le diplome actuel est requis.";
    if (!formData.etablissementActuel.trim()) {
      nextErrors.etablissementActuel = "L'etablissement actuel est requis.";
    }
    if (!formData.pays.trim()) nextErrors.pays = "Le pays d'etudes est requis.";
    if (!formData.anneeBac) nextErrors.anneeBac = "L'annee d'obtention est requise.";
    if (!formData.moyenneBac) nextErrors.moyenneBac = "La moyenne generale est requise.";
    else if (parseFloat(formData.moyenneBac) < 0 || parseFloat(formData.moyenneBac) > 20) {
      nextErrors.moyenneBac = "La moyenne doit etre comprise entre 0 et 20.";
    }
    if (!formData.specialiteActuelle.trim()) {
      nextErrors.specialiteActuelle = "La specialite actuelle est requise.";
    }
    if (!formData.specialite.trim()) {
      nextErrors.specialite = "La formation souhaitee est requise.";
    }
    if (!formData.universite.trim()) {
      nextErrors.universite = "L'universite demandee est requise.";
    }
    if (!formData.niveauDemande.trim()) {
      nextErrors.niveauDemande = "Le niveau demande est requis.";
    }
    if (!formData.motivation?.trim()) {
      nextErrors.motivation = "La motivation est requise.";
    }

    return nextErrors;
  };

  const handleNext = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateAcademicInfo(formData);
    navigate("/student-step3");
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>Vue d'ensemble</h3>
        <p>
          Cette etape permet d'evaluer votre parcours et de rattacher votre demande
          a une universite et a une formation cible.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Parcours academique</strong>
            <span>{academicCompletion}%</span>
          </div>
          <ProgressBar value={academicCompletion} color="#2563eb" label={`${academicCompletion}%`} compact />
        </div>

        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Choix de formation</strong>
            <span>{targetCompletion}%</span>
          </div>
          <ProgressBar value={targetCompletion} color="#0f766e" label={`${targetCompletion}%`} compact />
        </div>
      </div>

      <div className="student-application-note">
        <strong>Bon a savoir</strong>
        <p>
          Votre choix d'universite et de programme apparaitra tel quel sur le dossier
          transmis a l'administration.
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={2}
      title="Deposer une candidature"
      subtitle="Precisez votre parcours academique et la formation demandee pour preparer l'instruction de votre dossier."
      helperText="Les informations renseignees ici doivent correspondre a vos diplomes et releves de notes. Elles seront verifiees avec les pieces justificatives."
      introTitle="Parcours academique"
      introText="Renseignez votre parcours actuel, puis indiquez l'universite et la formation sollicitees. Les champs obligatoires permettent de qualifier correctement votre candidature."
      sidebar={sidebar}
    >
      <form className="student-application-form-stack" onSubmit={(event) => event.preventDefault()}>
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Informations academiques</h2>
              <p>Votre parcours de formation et les donnees utiles a l'etude de votre dossier.</p>
            </div>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field">
              <label htmlFor="application-diploma">Diplome actuel *</label>
              <select
                id="application-diploma"
                name="diplomeActuel"
                value={formData.diplomeActuel}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner un diplome</option>
                {DIPLOMA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.diplomeActuel ? <span className="error-message">{errors.diplomeActuel}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-school">Etablissement actuel *</label>
              <input
                id="application-school"
                type="text"
                name="etablissementActuel"
                placeholder="Ex. Universite d'Alger 1"
                value={formData.etablissementActuel}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.etablissementActuel ? (
                <span className="error-message">{errors.etablissementActuel}</span>
              ) : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-country">Pays d'etudes *</label>
              <select
                id="application-country"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner un pays</option>
                {nationalities.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.pays ? <span className="error-message">{errors.pays}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-graduation-year">Annee d'obtention *</label>
              <input
                id="application-graduation-year"
                type="number"
                min="1990"
                max="2100"
                name="anneeBac"
                placeholder="Ex. 2025"
                value={formData.anneeBac}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.anneeBac ? <span className="error-message">{errors.anneeBac}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-average">Moyenne generale *</label>
              <input
                id="application-average"
                type="number"
                step="0.01"
                min="0"
                max="20"
                name="moyenneBac"
                placeholder="Ex. 14.50"
                value={formData.moyenneBac}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              <span className="student-application-hint">Valeur comprise entre 0 et 20.</span>
              {errors.moyenneBac ? <span className="error-message">{errors.moyenneBac}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-mention">Mention</label>
              <select
                id="application-mention"
                name="mention"
                value={formData.mention}
                onChange={handleChange}
                className="student-application-input"
              >
                <option value="">Selectionner une mention</option>
                <option value="Tres Bien">Tres Bien</option>
                <option value="Bien">Bien</option>
                <option value="Assez Bien">Assez Bien</option>
                <option value="Passable">Passable</option>
              </select>
            </div>

            <div className="student-application-field student-application-field-full">
              <label htmlFor="application-current-specialty">Specialite actuelle *</label>
              <select
                id="application-current-specialty"
                name="specialiteActuelle"
                value={formData.specialiteActuelle}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner votre specialite actuelle</option>
                {CURRENT_SPECIALTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.specialiteActuelle ? (
                <span className="error-message">{errors.specialiteActuelle}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Choix de formation</h2>
              <p>Indiquez l'etablissement et la formation sur lesquels portera votre demande.</p>
            </div>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field">
              <label htmlFor="application-university">Universite choisie *</label>
              <select
                id="application-university"
                name="universite"
                value={formData.universite}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner une universite</option>
                {UNIVERSITY_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.universite ? <span className="error-message">{errors.universite}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-program">Formation / specialite souhaitee *</label>
              <select
                id="application-program"
                name="specialite"
                value={formData.specialite}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner une formation</option>
                {TARGET_PROGRAM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.specialite ? <span className="error-message">{errors.specialite}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-level">Niveau demande *</label>
              <select
                id="application-level"
                name="niveauDemande"
                value={formData.niveauDemande}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner un niveau</option>
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.niveauDemande ? (
                <span className="error-message">{errors.niveauDemande}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Informations complementaires</h2>
              <p>Ajoutez des precisions utiles a la lecture de votre dossier par l'administration.</p>
            </div>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field student-application-field-full">
              <label htmlFor="application-motivation">Motivation courte *</label>
              <textarea
                id="application-motivation"
                name="motivation"
                placeholder="Expliquez en quelques lignes votre projet de formation et vos attentes."
                value={formData.motivation}
                onChange={handleChange}
                className="student-application-textarea"
                rows={5}
                required
              />
              {errors.motivation ? <span className="error-message">{errors.motivation}</span> : null}
            </div>

            <div className="student-application-field student-application-field-full">
              <label htmlFor="application-comments">Commentaires utiles</label>
              <textarea
                id="application-comments"
                name="commentaires"
                placeholder="Ajoutez ici toute information utile pour l'instruction de votre dossier."
                value={formData.commentaires}
                onChange={handleChange}
                className="student-application-textarea"
                rows={4}
              />
            </div>
          </div>
        </section>

        <div className="student-application-actions">
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={() => navigate("/student-step1")}
          >
            Retour
          </button>

          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleNext}
          >
            Continuer vers les documents
          </button>
        </div>
      </form>
    </ApplicationStepLayout>
  );
}
