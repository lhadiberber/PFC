import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomSelect from "../../components/ui/CustomSelect";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAdmissions } from "../../context/AdmissionsContext";
import { getApiErrorMessage, getAuthToken } from "../../services/authService";
import {
  fetchMyProfile,
  profileFromApi,
  profileToApi,
  saveMyProfile,
} from "../../services/profileService";
import {
  readStoredStudentAccount,
  syncStudentAccountProfile,
  updateStudentPassword,
} from "../../utils/studentAccount";
import { nationalities } from "../../utils/countryCodes";
import "../../index.css";

const emptyProfile = {
  nom: "",
  prenom: "",
  dateNaiss: "",
  lieuNaiss: "",
  sexe: "",
  nationalite: "",
  email: "",
  telephone: "",
  adresse: "",
  wilaya: "",
  commune: "",
};

const emptyAcademicInfo = {
  anneeBac: "",
  serieBac: "",
  moyenneBac: "",
  mentionBac: "",
  numeroInscriptionBac: "",
  lyceeOrigine: "",
  wilayaLycee: "",
};

const PERSONAL_FIELDS = [
  "nom",
  "prenom",
  "dateNaiss",
  "lieuNaiss",
  "sexe",
  "nationalite",
];

const CONTACT_FIELDS = ["email", "telephone", "adresse", "wilaya", "commune"];

const BAC_FIELDS = [
  "anneeBac",
  "serieBac",
  "moyenneBac",
  "mentionBac",
  "numeroInscriptionBac",
  "lyceeOrigine",
  "wilayaLycee",
];

const DOCUMENT_FIELDS = [
  "attestationReussite",
  "releveNotes",
  "carteIdentite",
  "photo",
  "residence",
];

const BAC_SERIES = [
  "Sciences expérimentales",
  "Mathématiques",
  "Techniques mathématiques",
  "Gestion et économie",
  "Lettres et philosophie",
  "Langues étrangères",
];

const BAC_MENTIONS = ["Passable", "Assez bien", "Bien", "Très bien", "Excellent"];

function hasValue(value) {
  return String(value || "").trim() !== "";
}

function countCompleted(source, fields) {
  return fields.filter((field) => hasValue(source[field])).length;
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function buildInitials(nom, prenom, email) {
  const source = [prenom, nom].filter(Boolean).join(" ").trim() || email || "ET";
  return source
    .split(" ")
    .map((part) => part.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

function formatDateTime(value) {
  if (!value) {
    return "Non renseignée";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortApplications(applications) {
  return [...applications].sort((first, second) => {
    const firstDate = new Date(first.submittedAt || first.dateDepot || 0);
    const secondDate = new Date(second.submittedAt || second.dateDepot || 0);
    return secondDate - firstDate;
  });
}

function buildAcademicForm(source = {}) {
  return {
    ...emptyAcademicInfo,
    ...source,
    anneeBac: source.anneeBac || "",
    serieBac: source.serieBac || source.typeBac || source.diplomeActuel || "",
    moyenneBac: source.moyenneBac || "",
    mentionBac: source.mentionBac || source.mention || "",
    numeroInscriptionBac: source.numeroInscriptionBac || "",
    lyceeOrigine: source.lyceeOrigine || source.etablissementActuel || "",
    wilayaLycee: source.wilayaLycee || "",
  };
}

function buildPersonalForm(source = {}) {
  return {
    ...emptyProfile,
    ...source,
    wilaya: source.wilaya || "",
    commune: source.commune || "",
  };
}

function updateStoredUserProfile(profile) {
  let storedUser = {};

  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (_error) {
    storedUser = {};
  }

  localStorage.setItem("userEmail", profile.email.trim());
  localStorage.setItem(
    "user",
    JSON.stringify({
      ...storedUser,
      id: storedUser.id || profile.user_id,
      nom: profile.nom,
      prenom: profile.prenom,
      email: profile.email,
      role: storedUser.role || "student",
    })
  );
}

function Spinner() {
  return (
    <svg
      className="login-spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function getPasswordStrengthPercent(password) {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  return Math.min(score, 100);
}

export default function Profil() {
  const navigate = useNavigate();
  const {
    profile,
    hasSavedProfile,
    saveProfile,
    applicationDraft,
    updateAcademicInfo,
    applications,
  } = useAdmissions();

  const [personalForm, setPersonalForm] = useState(() => buildPersonalForm(profile));
  const [academicForm, setAcademicForm] = useState(() =>
    buildAcademicForm(applicationDraft.academicInfo)
  );
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(!hasSavedProfile);
  const [accountInfo, setAccountInfo] = useState(() => readStoredStudentAccount());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [activeTab, setActiveTab] = useState("infos");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    setPersonalForm(buildPersonalForm(profile));
  }, [profile]);

  useEffect(() => {
    setAcademicForm(buildAcademicForm(applicationDraft.academicInfo));
  }, [applicationDraft.academicInfo]);

  useEffect(() => {
    if (!hasSavedProfile) {
      setIsEditing(true);
    }
  }, [hasSavedProfile]);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteProfile() {
      const token = getAuthToken();

      if (!token) {
        const message = "Votre session a expiré. Veuillez vous reconnecter.";
        setProfileError(message);
        setIsInitialLoading(false);
        navigate("/login", { replace: true, state: { message } });
        return;
      }

      try {
        const remoteProfile = await fetchMyProfile();
        const mappedProfile = profileFromApi(
          remoteProfile,
          profile || emptyProfile,
          applicationDraft.academicInfo
        );

        if (!isMounted) {
          return;
        }

        setPersonalForm(buildPersonalForm(mappedProfile.personal));
        setAcademicForm(buildAcademicForm(mappedProfile.academic));
        saveProfile(mappedProfile.personal);
        updateAcademicInfo({
          ...applicationDraft.academicInfo,
          ...mappedProfile.academic,
        });
        updateStoredUserProfile(remoteProfile);
        setAccountInfo(syncStudentAccountProfile(mappedProfile.personal));
        setIsEditing(
          countCompleted(mappedProfile.personal, [...PERSONAL_FIELDS, ...CONTACT_FIELDS]) <
            PERSONAL_FIELDS.length + CONTACT_FIELDS.length
        );
        setProfileError("");
      } catch (error) {
        if (isMounted) {
          setProfileError(getApiErrorMessage(error, "Impossible de charger le profil étudiant."));
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }

    loadRemoteProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncAccount = () => {
      setAccountInfo(readStoredStudentAccount());
    };

    window.addEventListener("student:account-updated", syncAccount);
    window.addEventListener("storage", syncAccount);

    return () => {
      window.removeEventListener("student:account-updated", syncAccount);
      window.removeEventListener("storage", syncAccount);
    };
  }, []);

  useEffect(() => {
    if (!profile?.email) {
      return;
    }

    if (!accountInfo.email || !accountInfo.accountCreatedAt) {
      const syncedAccount = syncStudentAccountProfile(profile);
      setAccountInfo(syncedAccount);
    }
  }, [accountInfo.accountCreatedAt, accountInfo.email, profile]);

  const latestApplication = useMemo(() => sortApplications(applications)[0] || null, [applications]);

  const mergedDocuments = useMemo(
    () =>
      DOCUMENT_FIELDS.reduce((collection, field) => {
        collection[field] =
          applicationDraft.documents?.[field] || latestApplication?.details?.[field] || "";
        return collection;
      }, {}),
    [applicationDraft.documents, latestApplication]
  );

  const personalCompletion = useMemo(
    () =>
      toPercent(
        countCompleted(personalForm, [...PERSONAL_FIELDS, ...CONTACT_FIELDS]),
        PERSONAL_FIELDS.length + CONTACT_FIELDS.length
      ),
    [personalForm]
  );
  const identityCompletion = useMemo(
    () => toPercent(countCompleted(personalForm, PERSONAL_FIELDS), PERSONAL_FIELDS.length),
    [personalForm]
  );
  const contactCompletion = useMemo(
    () => toPercent(countCompleted(personalForm, CONTACT_FIELDS), CONTACT_FIELDS.length),
    [personalForm]
  );
  const academicCompletion = useMemo(
    () => toPercent(countCompleted(academicForm, BAC_FIELDS), BAC_FIELDS.length),
    [academicForm]
  );
  const documentsCompletion = useMemo(
    () => toPercent(countCompleted(mergedDocuments, DOCUMENT_FIELDS), DOCUMENT_FIELDS.length),
    [mergedDocuments]
  );
  const overallCompletion = useMemo(
    () => Math.round((personalCompletion + academicCompletion + documentsCompletion) / 3),
    [academicCompletion, documentsCompletion, personalCompletion]
  );

  const displayName = useMemo(
    () =>
      `${personalForm.prenom || ""} ${personalForm.nom || ""}`.trim() ||
      accountInfo.email ||
      "Étudiant",
    [accountInfo.email, personalForm.nom, personalForm.prenom]
  );

  const profileStatus = latestApplication?.statut || "Actif";
  const completionTone =
    overallCompletion >= 90 ? "Complet" : overallCompletion >= 60 ? "En progression" : "À compléter";
  const passwordStrength = getPasswordStrengthPercent(passwordData.newPassword);
  const securityStatus = accountInfo.password ? "Initialisée" : "À initialiser";
  const latestApplicationLabel = latestApplication?.statut || "Aucune candidature";

  const handlePersonalChange = (event) => {
    const { name, value } = event.target;
    setPersonalForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }

    if (profileError) setProfileError("");
    if (profileFeedback) setProfileFeedback(null);
  };

  const handleAcademicChange = (event) => {
    const { name, value } = event.target;
    setAcademicForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }

    if (profileError) setProfileError("");
    if (profileFeedback) setProfileFeedback(null);
  };

  const validate = () => {
    const nextErrors = {};

    if (!personalForm.nom.trim()) nextErrors.nom = "Veuillez renseigner votre nom.";
    if (!personalForm.prenom.trim()) nextErrors.prenom = "Veuillez renseigner votre prénom.";
    if (!personalForm.dateNaiss) nextErrors.dateNaiss = "Veuillez renseigner votre date de naissance.";
    if (!personalForm.sexe) nextErrors.sexe = "Veuillez sélectionner votre sexe.";
    if (!personalForm.nationalite.trim()) nextErrors.nationalite = "Veuillez renseigner votre nationalité.";
    if (!personalForm.lieuNaiss.trim()) nextErrors.lieuNaiss = "Veuillez renseigner votre lieu de naissance.";
    if (!personalForm.email.trim()) nextErrors.email = "Veuillez renseigner votre adresse e-mail.";
    else if (!/\S+@\S+\.\S+/.test(personalForm.email)) nextErrors.email = "Adresse e-mail invalide.";
    if (!personalForm.telephone.trim()) nextErrors.telephone = "Veuillez renseigner votre numéro de téléphone.";
    if (!personalForm.adresse.trim()) nextErrors.adresse = "Veuillez renseigner votre adresse postale.";
    if (!personalForm.wilaya.trim()) nextErrors.wilaya = "Veuillez renseigner votre wilaya.";
    if (!personalForm.commune.trim()) nextErrors.commune = "Veuillez renseigner votre commune.";

    const currentYear = new Date().getFullYear();
    const bacYear = Number(academicForm.anneeBac);

    if (!academicForm.anneeBac) {
      nextErrors.anneeBac = "Veuillez renseigner l'année d'obtention du baccalauréat.";
    } else if (
      !/^\d{4}$/.test(String(academicForm.anneeBac)) ||
      bacYear < 1980 ||
      bacYear > currentYear + 1
    ) {
      nextErrors.anneeBac = "Veuillez saisir une année valide, par exemple 2024.";
    }

    if (!academicForm.serieBac) {
      nextErrors.serieBac = "Veuillez sélectionner votre série du baccalauréat.";
    }

    if (!academicForm.moyenneBac) {
      nextErrors.moyenneBac = "Veuillez renseigner votre moyenne générale.";
    } else if (Number(academicForm.moyenneBac) < 0 || Number(academicForm.moyenneBac) > 20) {
      nextErrors.moyenneBac = "La moyenne doit être comprise entre 0 et 20.";
    }

    if (!academicForm.numeroInscriptionBac.trim()) {
      nextErrors.numeroInscriptionBac = "Veuillez renseigner votre numéro d'inscription au baccalauréat.";
    }

    return nextErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setProfileFeedback(null);
      setProfileError("Veuillez corriger les champs indiqués avant d'enregistrer.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileFeedback(null);

    try {
      const savedRemoteProfile = await saveMyProfile(profileToApi(personalForm, academicForm));
      const mappedProfile = profileFromApi(savedRemoteProfile, personalForm, academicForm);
      const nextAcademicInfo = {
        ...applicationDraft.academicInfo,
        ...mappedProfile.academic,
        typeBac: mappedProfile.academic.serieBac || applicationDraft.academicInfo.typeBac,
        diplomeActuel: mappedProfile.academic.serieBac || applicationDraft.academicInfo.diplomeActuel,
        etablissementActuel:
          mappedProfile.academic.lyceeOrigine || applicationDraft.academicInfo.etablissementActuel,
        specialiteActuelle:
          mappedProfile.academic.serieBac || applicationDraft.academicInfo.specialiteActuelle,
        mention: mappedProfile.academic.mentionBac || applicationDraft.academicInfo.mention,
      };

      setPersonalForm(buildPersonalForm(mappedProfile.personal));
      setAcademicForm(buildAcademicForm(mappedProfile.academic));
      saveProfile(mappedProfile.personal);
      updateAcademicInfo(nextAcademicInfo);
      updateStoredUserProfile(savedRemoteProfile);
      setAccountInfo(syncStudentAccountProfile(mappedProfile.personal));

      setErrors({});
      setIsEditing(false);
      setProfileFeedback({ type: "success", text: "Profil mis à jour avec succès." });
    } catch (error) {
      const message = getApiErrorMessage(error, "Une erreur est survenue. Veuillez réessayer.");
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setPersonalForm(buildPersonalForm(profile));
    setAcademicForm(buildAcademicForm(applicationDraft.academicInfo));
    setErrors({});
    setProfileError("");
    setProfileFeedback(null);
    setIsEditing(!hasSavedProfile);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({
      ...current,
      [name]: value,
    }));
    if (passwordFeedback) setPasswordFeedback(null);
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (!passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()) {
      setPasswordFeedback({ type: "error", text: "Veuillez renseigner tous les champs de sécurité." });
      return;
    }

    if (accountInfo.password && !passwordData.currentPassword.trim()) {
      setPasswordFeedback({ type: "error", text: "Veuillez renseigner le mot de passe actuel." });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "La confirmation du mot de passe ne correspond pas.",
      });
      return;
    }

    const passwordUpdate = updateStudentPassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (!passwordUpdate.success) {
      setPasswordFeedback({ type: "error", text: passwordUpdate.message });
      return;
    }

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setAccountInfo(readStoredStudentAccount());
    setPasswordFeedback({ type: "success", text: passwordUpdate.message });
  };

  const renderActions = () => (
    <div className="student-profile-header-actions">
      {isEditing ? (
        <>
          <button
            type="button"
            className="student-application-button student-application-button-secondary"
            onClick={handleCancel}
            disabled={isSavingProfile}
          >
            Annuler
          </button>
          <button
            type="button"
            className="student-application-button student-application-button-primary"
            onClick={handleSave}
            disabled={isSavingProfile || isInitialLoading}
          >
            {isSavingProfile ? (
              <span className="login-btn-inner">
                <Spinner />
                Enregistrement...
              </span>
            ) : (
              "Enregistrer les modifications"
            )}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="student-application-button student-application-button-primary"
          onClick={() => setIsEditing(true)}
          disabled={isInitialLoading}
        >
          Modifier le profil
        </button>
      )}
    </div>
  );

  const renderInputField = ({
    label,
    name,
    value,
    onChange,
    type = "text",
    required = false,
    readOnly = false,
    placeholder = "",
    hint = "",
    full = false,
    rows = 0,
    extraProps = {},
  }) => (
    <label className={`profile-field ${full ? "profile-field-full" : ""}`.trim()}>
      <span className="profile-field-label">
        {label} {required ? <abbr title="obligatoire">*</abbr> : null}
      </span>
      <div className={`profile-input-wrap ${readOnly ? "is-readonly" : ""}`.trim()}>
        {rows > 0 ? (
          <textarea
            name={name}
            rows={rows}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            {...extraProps}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            {...extraProps}
          />
        )}
      </div>
      {hint ? <small className="profile-field-hint">{hint}</small> : null}
      {errors[name] ? <small className="error-message">{errors[name]}</small> : null}
    </label>
  );

  const renderSelectField = ({
    label,
    name,
    value,
    onChange,
    required = false,
    disabled = false,
    children,
  }) => (
    <label className="profile-field">
      <span className="profile-field-label">
        {label} {required ? <abbr title="obligatoire">*</abbr> : null}
      </span>
      <div className={`profile-input-wrap ${disabled ? "is-readonly" : ""}`.trim()}>
        <CustomSelect
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={disabled ? "is-readonly" : ""}
        >
          {children}
        </CustomSelect>
      </div>
      {errors[name] ? <small className="error-message">{errors[name]}</small> : null}
    </label>
  );

  const renderPasswordField = ({
    label,
    name,
    value,
    ref,
    show,
    toggle,
    placeholder,
    hint,
    required = false,
  }) => (
    <label className="profile-field">
      <span className="profile-field-label">
        {label} {required ? <abbr title="obligatoire">*</abbr> : null}
      </span>
      <div className="profile-input-wrap profile-password-wrap">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={handlePasswordChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="profile-password-toggle"
          onClick={() => {
            toggle((current) => !current);
            ref.current?.focus();
          }}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>
      {hint ? <small className="profile-field-hint">{hint}</small> : null}
    </label>
  );

  const renderProgressItem = (label, value) => (
    <div className="profile-state-row" key={label}>
      <div className="profile-state-row-head">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="profile-state-track" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div className="student-profile-shell profile-page">
      <nav className="profile-breadcrumb" aria-label="Fil d'Ariane">
        <Link to="/dashboard">Accueil</Link>
        <span>/</span>
        <strong>Profil</strong>
      </nav>

      <header className="profile-header">
        <div className="profile-header-main">
          <div className="profile-avatar">
            {buildInitials(personalForm.nom, personalForm.prenom, personalForm.email)}
          </div>
          <div>
            <span className="profile-kicker">Espace candidat</span>
            <h1>Mon Profil</h1>
            <p>Gérez vos informations personnelles et la sécurité de votre compte.</p>
          </div>
        </div>
        {renderActions()}
      </header>

      {isInitialLoading ? (
        <div className="student-profile-feedback student-profile-feedback-info" role="status" aria-live="polite">
          <span className="login-btn-inner">
            <Spinner />
            Chargement de votre profil...
          </span>
        </div>
      ) : null}

      {profileError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {profileError}
        </div>
      ) : null}

      {profileFeedback ? (
        <div
          className={`student-profile-feedback ${
            profileFeedback.type === "error" ? "student-profile-feedback-error" : "student-profile-feedback-success"
          }`}
          role={profileFeedback.type === "error" ? "alert" : "status"}
        >
          {profileFeedback.text}
        </div>
      ) : null}

      <section className="profile-summary-grid" aria-label="Résumé du profil">
        <article className="profile-summary-card">
          <span className="profile-summary-icon">PRO</span>
          <div>
            <strong>{overallCompletion}%</strong>
            <p>Profil complété</p>
          </div>
        </article>
        <article className="profile-summary-card">
          <span className="profile-summary-icon">DOS</span>
          <div>
            <strong>{latestApplicationLabel}</strong>
            <p>Dossier</p>
          </div>
        </article>
        <article className="profile-summary-card">
          <span className="profile-summary-icon">SEC</span>
          <div>
            <strong>{securityStatus}</strong>
            <p>Sécurité du compte</p>
          </div>
        </article>
      </section>

      <div className="profile-container">
        <main className="profile-main">
          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>{displayName}</h2>
                <p>{personalForm.email || "Aucune adresse e-mail renseignée"}</p>
              </div>
              <div className="profile-card-status">
                <StatusBadge status={profileStatus} />
                <span>{completionTone}</span>
              </div>
            </div>

            <div className="profile-tabs" role="tablist" aria-label="Sections du profil">
              <button
                type="button"
                className={`profile-tab ${activeTab === "infos" ? "active" : ""}`.trim()}
                onClick={() => setActiveTab("infos")}
                role="tab"
                aria-selected={activeTab === "infos"}
              >
                Informations personnelles
              </button>
              <button
                type="button"
                className={`profile-tab ${activeTab === "bac" ? "active" : ""}`.trim()}
                onClick={() => setActiveTab("bac")}
                role="tab"
                aria-selected={activeTab === "bac"}
              >
                Baccalauréat
              </button>
              <button
                type="button"
                className={`profile-tab ${activeTab === "securite" ? "active" : ""}`.trim()}
                onClick={() => setActiveTab("securite")}
                role="tab"
                aria-selected={activeTab === "securite"}
              >
                Sécurité du compte
              </button>
            </div>

            {activeTab === "infos" ? (
              <div className="profile-tab-panel" role="tabpanel">
                <div className="profile-section-title">
                  <h3>Identité</h3>
                  <p>Les champs marqués <abbr title="obligatoire">*</abbr> sont obligatoires.</p>
                </div>
                <div className="profile-form-grid">
                  {renderInputField({ label: "Nom", name: "nom", value: personalForm.nom, onChange: handlePersonalChange, required: true, readOnly: !isEditing, icon: "ID" })}
                  {renderInputField({ label: "Prénom", name: "prenom", value: personalForm.prenom, onChange: handlePersonalChange, required: true, readOnly: !isEditing, icon: "ID" })}
                  {renderInputField({ label: "Date de naissance", name: "dateNaiss", value: personalForm.dateNaiss, onChange: handlePersonalChange, type: "date", required: true, readOnly: !isEditing, icon: "DT" })}
                  {renderInputField({ label: "Lieu de naissance", name: "lieuNaiss", value: personalForm.lieuNaiss, onChange: handlePersonalChange, required: true, readOnly: !isEditing, icon: "LOC" })}
                  {renderSelectField({ label: "Sexe", name: "sexe", value: personalForm.sexe, onChange: handlePersonalChange, required: true, disabled: !isEditing, icon: "SX", children: <><option value="">Sélectionner</option><option value="Homme">Homme</option><option value="Femme">Femme</option></> })}
                  {renderSelectField({ label: "Nationalité", name: "nationalite", value: personalForm.nationalite, onChange: handlePersonalChange, required: true, disabled: !isEditing, icon: "NAT", children: <><option value="">Sélectionner une nationalité</option>{nationalities.map((country) => (<option key={country} value={country}>{country}</option>))}</> })}
                </div>

                <div className="profile-section-title profile-section-spaced">
                  <h3>Coordonnées</h3>
                  <p>Ces informations permettent à l'administration de vous contacter.</p>
                </div>
                <div className="profile-form-grid">
                  {renderInputField({ label: "Adresse e-mail", name: "email", value: personalForm.email, onChange: handlePersonalChange, type: "email", readOnly: true, icon: "@", hint: "L'adresse e-mail ne peut pas être modifiée depuis cette page.", extraProps: { autoComplete: "email" } })}
                  {renderInputField({ label: "Téléphone", name: "telephone", value: personalForm.telephone, onChange: handlePersonalChange, type: "tel", required: true, readOnly: !isEditing, icon: "TEL", extraProps: { autoComplete: "tel" } })}
                  {renderInputField({ label: "Adresse postale", name: "adresse", value: personalForm.adresse, onChange: handlePersonalChange, required: true, readOnly: !isEditing, icon: "ADR", full: true, rows: 3 })}
                  {renderInputField({ label: "Wilaya", name: "wilaya", value: personalForm.wilaya, onChange: handlePersonalChange, required: true, readOnly: !isEditing, icon: "W" })}
                  {renderInputField({ label: "Commune", name: "commune", value: personalForm.commune, onChange: handlePersonalChange, required: true, readOnly: !isEditing, icon: "C" })}
                </div>
              </div>
            ) : null}

            {activeTab === "bac" ? (
              <div className="profile-tab-panel" role="tabpanel">
                <div className="profile-section-title">
                  <h3>Baccalauréat</h3>
                  <p>Renseignez les informations utilisées pour préparer l'étude de votre candidature.</p>
                </div>
                <div className="profile-form-grid">
                  {renderInputField({ label: "Année d'obtention", name: "anneeBac", value: academicForm.anneeBac, onChange: handleAcademicChange, type: "number", required: true, readOnly: !isEditing, icon: "AN", placeholder: "Ex. 2024", extraProps: { min: "1980", max: new Date().getFullYear() + 1 } })}
                  {renderSelectField({ label: "Série du baccalauréat", name: "serieBac", value: academicForm.serieBac, onChange: handleAcademicChange, required: true, disabled: !isEditing, icon: "SR", children: <><option value="">Sélectionner une série</option>{BAC_SERIES.map((serie) => (<option key={serie} value={serie}>{serie}</option>))}</> })}
                  {renderInputField({ label: "Moyenne générale", name: "moyenneBac", value: academicForm.moyenneBac, onChange: handleAcademicChange, type: "number", required: true, readOnly: !isEditing, icon: "MOY", placeholder: "Ex. 14.50", extraProps: { step: "0.01", min: "0", max: "20" } })}
                  {renderSelectField({ label: "Mention", name: "mentionBac", value: academicForm.mentionBac, onChange: handleAcademicChange, disabled: !isEditing, icon: "MEN", children: <><option value="">Sélectionner une mention</option>{BAC_MENTIONS.map((mention) => (<option key={mention} value={mention}>{mention}</option>))}</> })}
                  {renderInputField({ label: "Numéro d'inscription", name: "numeroInscriptionBac", value: academicForm.numeroInscriptionBac, onChange: handleAcademicChange, required: true, readOnly: !isEditing, icon: "NUM", placeholder: "Ex. 12345678" })}
                  {renderInputField({ label: "Lycée d'origine", name: "lyceeOrigine", value: academicForm.lyceeOrigine, onChange: handleAcademicChange, readOnly: !isEditing, icon: "LYC", placeholder: "Nom de votre lycée" })}
                  {renderInputField({ label: "Wilaya du lycée", name: "wilayaLycee", value: academicForm.wilayaLycee, onChange: handleAcademicChange, readOnly: !isEditing, icon: "W" })}
                </div>
              </div>
            ) : null}

            {activeTab === "securite" ? (
              <div className="profile-tab-panel" role="tabpanel">
                {!accountInfo.password ? (
                  <div className="profile-security-alert">
                    <span aria-hidden="true">SEC</span>
                    <div>
                      <strong>Sécurité à initialiser</strong>
                      <p>Aucun mot de passe local n'est encore configuré pour ce compte. Enregistrez-en un pour renforcer l'accès à votre espace étudiant.</p>
                    </div>
                  </div>
                ) : null}

                {passwordFeedback ? (
                  <div
                    className={`student-profile-feedback ${
                      passwordFeedback.type === "error"
                        ? "student-profile-feedback-error"
                        : "student-profile-feedback-success"
                    }`}
                    role={passwordFeedback.type === "error" ? "alert" : "status"}
                  >
                    {passwordFeedback.text}
                  </div>
                ) : null}

                <form className="profile-form-grid" onSubmit={handlePasswordSubmit} noValidate>
                  {renderPasswordField({ label: "Mot de passe actuel", name: "currentPassword", value: passwordData.currentPassword, ref: currentPasswordRef, show: showCurrentPassword, toggle: setShowCurrentPassword, placeholder: accountInfo.password ? "Saisir le mot de passe actuel" : "Non requis si aucun mot de passe n'est configuré", hint: accountInfo.password ? "Requis pour confirmer le changement." : "Vous pouvez créer directement un nouveau mot de passe." })}
                  <div>
                    {renderPasswordField({ label: "Nouveau mot de passe", name: "newPassword", value: passwordData.newPassword, ref: newPasswordRef, show: showNewPassword, toggle: setShowNewPassword, placeholder: "Minimum 8 caractères", hint: "Utilisez au moins 8 caractères, avec chiffres et majuscules si possible.", required: true })}
                    <div className="profile-password-strength" aria-hidden="true">
                      <span style={{ width: `${passwordStrength}%` }} />
                    </div>
                  </div>
                  <div className="profile-field-full">
                    {renderPasswordField({ label: "Confirmation du nouveau mot de passe", name: "confirmPassword", value: passwordData.confirmPassword, ref: confirmPasswordRef, show: showConfirmPassword, toggle: setShowConfirmPassword, placeholder: "Confirmez le nouveau mot de passe", required: true })}
                    {passwordData.confirmPassword.length > 0 ? (
                      <small className={passwordData.newPassword === passwordData.confirmPassword ? "student-profile-match-ok" : "student-profile-match-error"} aria-live="polite">
                        {passwordData.newPassword === passwordData.confirmPassword ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}
                      </small>
                    ) : null}
                  </div>
                  <div className="profile-field-full profile-security-submit">
                    <button type="submit" className="student-application-button student-application-button-primary">
                      Mettre à jour le mot de passe
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="student-profile-bottom-actions">
              {renderActions()}
            </div>
          </section>
        </main>

        <aside className="profile-sidebar-right" aria-label="État du profil">
          <section className="profile-state-card">
            <div className="profile-state-header">
              <h2>État du profil</h2>
              <p>Visualisez votre progression</p>
            </div>

            <div className="profile-state-score">
              <strong>{overallCompletion}%</strong>
              <span>{completionTone}</span>
            </div>

            <div className="profile-state-list">
              {renderProgressItem("Informations personnelles", identityCompletion)}
              {renderProgressItem("Coordonnées", contactCompletion)}
              {renderProgressItem("Baccalauréat", academicCompletion)}
            </div>

            <div className="profile-account-list">
              <div>
                <span>Dossier</span>
                <strong>{latestApplicationLabel}</strong>
              </div>
              <div>
                <span>Dernière connexion</span>
                <strong>{formatDateTime(accountInfo.lastLoginAt)}</strong>
              </div>
              <div>
                <span>Mot de passe</span>
                <strong>{securityStatus}</strong>
              </div>
            </div>

            <div className="profile-state-actions">
              <Link to="/student-step1" className="profile-primary-action">Compléter mon dossier</Link>
              <Link to="/mes-candidatures" className="profile-secondary-action">Voir mes candidatures</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
