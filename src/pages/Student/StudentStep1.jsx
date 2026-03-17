import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStepLayout from "../../components/student/ApplicationStepLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAdmissions } from "../../context/AdmissionsContext";
import { countryCodes, nationalities } from "../../utils/countryCodes";
import "../../index.css";

const IDENTITY_FIELDS = ["nom", "prenom", "dateNaiss", "lieuNaiss", "sexe", "nationalite"];
const CONTACT_FIELDS = ["telephone", "email", "adresse"];

function buildInitialData(profile, draftPersonalInfo) {
  return {
    nom: draftPersonalInfo.nom || profile.nom || "",
    prenom: draftPersonalInfo.prenom || profile.prenom || "",
    dateNaiss: draftPersonalInfo.dateNaiss || profile.dateNaiss || "",
    lieuNaiss: draftPersonalInfo.lieuNaiss || profile.lieuNaiss || "",
    sexe: draftPersonalInfo.sexe || profile.sexe || "",
    nationalite: draftPersonalInfo.nationalite || profile.nationalite || "",
    telephone: draftPersonalInfo.telephone || profile.telephone || "",
    email: draftPersonalInfo.email || profile.email || "",
    adresse: draftPersonalInfo.adresse || profile.adresse || "",
    paysCode: draftPersonalInfo.paysCode || "+33",
  };
}

function countCompleted(values, fields) {
  return fields.filter((field) => String(values[field] || "").trim() !== "").length;
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function getLocalPhoneNumber(phoneNumber) {
  return String(phoneNumber || "").replace(/^\+\d+\s*/, "");
}

function buildInternationalPhone(code, localNumber) {
  const cleanedNumber = String(localNumber || "").trim();
  return cleanedNumber ? `${code} ${cleanedNumber}` : "";
}

export default function StudentStep1() {
  const navigate = useNavigate();
  const { profile, applicationDraft, updatePersonalInfo } = useAdmissions();

  const [formData, setFormData] = useState(() =>
    buildInitialData(profile, applicationDraft.personalInfo)
  );
  const [errors, setErrors] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    applicationDraft.personalInfo.paysCode || "+33"
  );

  const identityCompletion = useMemo(
    () => toPercent(countCompleted(formData, IDENTITY_FIELDS), IDENTITY_FIELDS.length),
    [formData]
  );
  const contactCompletion = useMemo(
    () => toPercent(countCompleted(formData, CONTACT_FIELDS), CONTACT_FIELDS.length),
    [formData]
  );

  const syncPersonalInfo = (nextFormData) => {
    setFormData(nextFormData);
    updatePersonalInfo(nextFormData);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    syncPersonalInfo({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: "",
      }));
    }
  };

  const handleCountryCodeChange = (event) => {
    const code = event.target.value;
    const localNumber = getLocalPhoneNumber(formData.telephone);
    setSelectedCountryCode(code);

    syncPersonalInfo({
      ...formData,
      paysCode: code,
      telephone: buildInternationalPhone(code, localNumber),
    });
  };

  const handleTelephoneChange = (event) => {
    const value = event.target.value.replace(/[^\d\s-]/g, "");
    syncPersonalInfo({
      ...formData,
      telephone: buildInternationalPhone(selectedCountryCode, value),
    });

    if (errors.telephone) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        telephone: "",
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.nom.trim()) nextErrors.nom = "Le nom est requis.";
    if (!formData.prenom.trim()) nextErrors.prenom = "Le prenom est requis.";
    if (!formData.dateNaiss) nextErrors.dateNaiss = "La date de naissance est requise.";
    if (!formData.lieuNaiss.trim()) nextErrors.lieuNaiss = "Le lieu de naissance est requis.";
    if (!formData.sexe) nextErrors.sexe = "Le sexe est requis.";
    if (!formData.nationalite.trim()) nextErrors.nationalite = "La nationalite est requise.";
    if (!formData.telephone.trim()) nextErrors.telephone = "Le numero de telephone est requis.";
    if (!formData.email.trim()) nextErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nextErrors.email = "Email invalide.";
    if (!formData.adresse.trim()) nextErrors.adresse = "L'adresse complete est requise.";

    return nextErrors;
  };

  const handleNext = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    updatePersonalInfo(formData);
    navigate("/student-step2");
  };

  const sidebar = (
    <>
      <div className="student-application-side-section">
        <h3>Suivi de l'etape</h3>
        <p>
          Ces informations seront reprises dans votre dossier et utilisees pour
          l'identification de votre candidature.
        </p>
      </div>

      <div className="student-application-side-metrics">
        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Identite</strong>
            <span>{identityCompletion}%</span>
          </div>
          <ProgressBar value={identityCompletion} color="#2563eb" label={`${identityCompletion}%`} compact />
        </div>

        <div className="student-application-side-metric">
          <div className="student-application-side-metric-head">
            <strong>Coordonnees</strong>
            <span>{contactCompletion}%</span>
          </div>
          <ProgressBar value={contactCompletion} color="#0f766e" label={`${contactCompletion}%`} compact />
        </div>
      </div>

      <div className="student-application-note">
        <strong>Conseil</strong>
        <p>
          Utilisez une adresse e-mail active et un numero de telephone joignable
          pour recevoir les relances de la plateforme.
        </p>
      </div>
    </>
  );

  return (
    <ApplicationStepLayout
      step={1}
      title="Deposer une candidature"
      subtitle="Renseignez vos informations personnelles pour constituer votre dossier de candidature."
      helperText="Prenez quelques minutes pour verifier vos informations d'identite et vos coordonnees avant de passer a l'etape suivante."
      introTitle="Informations personnelles"
      introText="Les champs obligatoires permettent de creer un dossier fiable et exploitable par les services d'admission. Vous pourrez relire et modifier ces informations avant la soumission finale."
      sidebar={sidebar}
    >
      <form className="student-application-form-stack" onSubmit={(event) => event.preventDefault()}>
        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Informations personnelles</h2>
              <p>Identite civile et informations necessaires a l'ouverture de votre dossier.</p>
            </div>
            <span className="student-application-required-pill">Champs obligatoires</span>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field">
              <label htmlFor="application-last-name">Nom *</label>
              <input
                id="application-last-name"
                type="text"
                name="nom"
                placeholder="Ex. Dupont"
                value={formData.nom}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.nom ? <span className="error-message">{errors.nom}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-first-name">Prenom *</label>
              <input
                id="application-first-name"
                type="text"
                name="prenom"
                placeholder="Ex. Jean"
                value={formData.prenom}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.prenom ? <span className="error-message">{errors.prenom}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-birth-date">Date de naissance *</label>
              <input
                id="application-birth-date"
                type="date"
                name="dateNaiss"
                value={formData.dateNaiss}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.dateNaiss ? <span className="error-message">{errors.dateNaiss}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-birth-place">Lieu de naissance *</label>
              <input
                id="application-birth-place"
                type="text"
                name="lieuNaiss"
                placeholder="Ex. Alger"
                value={formData.lieuNaiss}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.lieuNaiss ? <span className="error-message">{errors.lieuNaiss}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-gender">Sexe *</label>
              <select
                id="application-gender"
                name="sexe"
                value={formData.sexe}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner</option>
                <option value="Masculin">Masculin</option>
                <option value="Feminin">Feminin</option>
              </select>
              {errors.sexe ? <span className="error-message">{errors.sexe}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-nationality">Nationalite *</label>
              <select
                id="application-nationality"
                name="nationalite"
                value={formData.nationalite}
                onChange={handleChange}
                className="student-application-input"
                required
              >
                <option value="">Selectionner une nationalite</option>
                {nationalities.map((nationality) => (
                  <option key={nationality} value={nationality}>
                    {nationality}
                  </option>
                ))}
              </select>
              {errors.nationalite ? <span className="error-message">{errors.nationalite}</span> : null}
            </div>
          </div>
        </section>

        <section className="student-dashboard-panel student-application-form-card">
          <div className="student-application-section-head">
            <div>
              <h2>Coordonnees</h2>
              <p>Ces informations seront utilisees pour les confirmations, relances et decisions.</p>
            </div>
          </div>

          <div className="student-application-form-grid">
            <div className="student-application-field">
              <label htmlFor="application-phone">Telephone *</label>
              <div className="phone-input-container student-application-phone-group">
                <select
                  id="application-phone-code"
                  name="paysCode"
                  value={selectedCountryCode}
                  onChange={handleCountryCodeChange}
                  className="student-application-input student-application-phone-code"
                  required
                >
                  {countryCodes.map((item) => (
                    <option key={`${item.code}-${item.pays}`} value={item.code}>
                      {item.code} - {item.pays}
                    </option>
                  ))}
                </select>

                <input
                  id="application-phone"
                  type="tel"
                  name="telephone"
                  placeholder="Ex. 555 55 55"
                  value={getLocalPhoneNumber(formData.telephone)}
                  onChange={handleTelephoneChange}
                  className="student-application-input"
                  required
                />
              </div>
              {errors.telephone ? <span className="error-message">{errors.telephone}</span> : null}
            </div>

            <div className="student-application-field">
              <label htmlFor="application-email">Adresse e-mail *</label>
              <input
                id="application-email"
                type="email"
                name="email"
                placeholder="Ex. jean.dupont@email.com"
                value={formData.email}
                onChange={handleChange}
                className="student-application-input"
                required
              />
              {errors.email ? <span className="error-message">{errors.email}</span> : null}
            </div>

            <div className="student-application-field student-application-field-full">
              <label htmlFor="application-address">Adresse complete *</label>
              <textarea
                id="application-address"
                name="adresse"
                placeholder="Ex. 12 rue des Universites, Alger"
                value={formData.adresse}
                onChange={handleChange}
                className="student-application-textarea"
                rows={4}
                required
              />
              <span className="student-application-hint">
                Indiquez votre adresse complete telle qu'elle figure sur vos documents officiels.
              </span>
              {errors.adresse ? <span className="error-message">{errors.adresse}</span> : null}
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
            Continuer vers le parcours academique
          </button>
        </div>
      </form>
    </ApplicationStepLayout>
  );
}
