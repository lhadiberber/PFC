import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAdmissions } from "../../context/AdmissionsContext";
import { getAuthToken } from "../../services/authService";
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
import { showToast } from "../../utils/toast";
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

const DOCUMENT_FIELDS = ["copieBac", "releveNotes", "carteIdentite", "photo", "residence", "cv"];

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

function formatDate(value) {
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
  });
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
          setProfileError(error.message || "Impossible de charger le profil étudiant.");
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
      "Etudiant",
    [accountInfo.email, personalForm.nom, personalForm.prenom]
  );

  const profileStatus = latestApplication?.statut || "Actif";
  const statusDescription = latestApplication
    ? `Derniere candidature ${latestApplication.numeroDossier || ""}`.trim()
    : "Aucune candidature soumise pour le moment";
  const completionTone =
    overallCompletion >= 90 ? "Complet" : overallCompletion >= 60 ? "En progression" : "À compléter";

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
  };

  const validate = () => {
    const nextErrors = {};

    if (!personalForm.nom.trim()) nextErrors.nom = "Veuillez renseigner votre nom.";
    if (!personalForm.prenom.trim()) nextErrors.prenom = "Veuillez renseigner votre prénom.";
    if (!personalForm.dateNaiss) nextErrors.dateNaiss = "Veuillez renseigner votre date de naissance.";
    if (!personalForm.sexe) nextErrors.sexe = "Veuillez sélectionner votre sexe.";
    if (!personalForm.nationalite.trim()) nextErrors.nationalite = "Veuillez renseigner votre nationalité.";
    if (!personalForm.lieuNaiss.trim()) nextErrors.lieuNaiss = "Veuillez renseigner votre lieu de naissance.";
    if (!personalForm.email.trim()) nextErrors.email = "Veuillez renseigner votre email.";
    else if (!/\S+@\S+\.\S+/.test(personalForm.email)) nextErrors.email = "Email invalide.";
    if (!personalForm.telephone.trim()) nextErrors.telephone = "Veuillez renseigner votre téléphone.";
    if (!personalForm.adresse.trim()) nextErrors.adresse = "Veuillez renseigner votre adresse.";
    if (!personalForm.wilaya.trim()) nextErrors.wilaya = "Veuillez renseigner votre wilaya.";
    if (!personalForm.commune.trim()) nextErrors.commune = "Veuillez renseigner votre commune.";

    const currentYear = new Date().getFullYear();
    const bacYear = Number(academicForm.anneeBac);

    if (!academicForm.anneeBac) {
      nextErrors.anneeBac = "Veuillez renseigner l'année du bac.";
    } else if (
      !/^\d{4}$/.test(String(academicForm.anneeBac)) ||
      bacYear < 1980 ||
      bacYear > currentYear + 1
    ) {
      nextErrors.anneeBac = "Veuillez saisir une année du bac valide.";
    }

    if (!academicForm.serieBac) {
      nextErrors.serieBac = "Veuillez sélectionner votre série du bac.";
    }

    if (!academicForm.moyenneBac) {
      nextErrors.moyenneBac = "Veuillez renseigner votre moyenne générale.";
    } else if (Number(academicForm.moyenneBac) < 0 || Number(academicForm.moyenneBac) > 20) {
      nextErrors.moyenneBac = "La moyenne doit être comprise entre 0 et 20.";
    }

    if (!academicForm.numeroInscriptionBac.trim()) {
      nextErrors.numeroInscriptionBac = "Veuillez renseigner votre numéro d'inscription au bac.";
    }

    return nextErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Merci de corriger les champs du profil avant d'enregistrer.", "error");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");

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
      showToast("Profil mis à jour avec succès.", "success");
    } catch (error) {
      const message = error.message || "Une erreur est survenue. Veuillez réessayer.";
      setProfileError(message);
      showToast(message, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setPersonalForm(buildPersonalForm(profile));
    setAcademicForm(buildAcademicForm(applicationDraft.academicInfo));
    setErrors({});
    setProfileError("");
    setIsEditing(!hasSavedProfile);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (!passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()) {
      showToast("Veuillez completer les champs de securite.", "error");
      return;
    }

    if (accountInfo.password && !passwordData.currentPassword.trim()) {
      showToast("Veuillez renseigner le mot de passe actuel.", "error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast("Le nouveau mot de passe doit contenir au moins 6 caracteres.", "error");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("La confirmation du mot de passe ne correspond pas.", "error");
      return;
    }

    const passwordUpdate = updateStudentPassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (!passwordUpdate.success) {
      showToast(passwordUpdate.message, "error");
      return;
    }

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setAccountInfo(readStoredStudentAccount());
    showToast(passwordUpdate.message, "success");
  };

  return (
    <div className="student-profile-shell">
      <header className="student-dashboard-hero student-profile-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Espace candidat</span>
          <h1>Mon profil</h1>
          <p className="student-dashboard-subtitle">
            Complétez vos informations pour faciliter le traitement de votre dossier.
          </p>
          <p className="student-dashboard-welcome">
            Vérifiez votre identité, vos coordonnées et les informations de votre baccalauréat.
          </p>
        </div>

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
                {isSavingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
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
      </header>

      {isInitialLoading ? (
        <div className="student-profile-feedback student-profile-feedback-info" role="status">
          Chargement du profil étudiant...
        </div>
      ) : null}

      {profileError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {profileError}
        </div>
      ) : null}

      <section className="student-dashboard-panel student-profile-identity-card">
        <div className="student-profile-identity-main">
          <div className="student-profile-avatar">
            {buildInitials(personalForm.nom, personalForm.prenom, personalForm.email)}
          </div>

          <div className="student-profile-identity-copy">
            <span className="student-profile-kicker">Profil étudiant</span>
            <h2>{displayName}</h2>
            <p>{personalForm.email || "Aucune adresse e-mail renseignée"}</p>

            <div className="student-profile-badges">
              <StatusBadge status={profileStatus} />
              <span className="student-profile-completion-pill">{completionTone}</span>
            </div>
          </div>
        </div>

        <div className="student-profile-identity-side">
          <div className="student-profile-meta-item">
            <span>Profil complet</span>
            <strong>{overallCompletion}%</strong>
          </div>
          <div className="student-profile-meta-item">
            <span>État du dossier</span>
            <strong>{statusDescription}</strong>
          </div>
          <div className="student-profile-meta-item">
            <span>Dernière connexion</span>
            <strong>{formatDateTime(accountInfo.lastLoginAt)}</strong>
          </div>
        </div>
      </section>

      <div className="student-profile-layout">
        <div className="student-profile-main">
          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Informations personnelles</h2>
              <p>Ces informations permettent d'identifier clairement votre dossier.</p>
            </div>

            <div className="student-profile-form-grid">
              <label className="student-profile-field">
                <span>Nom</span>
                <input
                  type="text"
                  name="nom"
                  value={personalForm.nom}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  autoComplete="family-name"
                />
                {errors.nom ? <small className="error-message">{errors.nom}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Prénom</span>
                <input
                  type="text"
                  name="prenom"
                  value={personalForm.prenom}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  autoComplete="given-name"
                />
                {errors.prenom ? <small className="error-message">{errors.prenom}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Date de naissance</span>
                <input
                  type="date"
                  name="dateNaiss"
                  value={personalForm.dateNaiss}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.dateNaiss ? <small className="error-message">{errors.dateNaiss}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Lieu de naissance</span>
                <input
                  type="text"
                  name="lieuNaiss"
                  value={personalForm.lieuNaiss}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.lieuNaiss ? <small className="error-message">{errors.lieuNaiss}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Sexe</span>
                <select
                  name="sexe"
                  value={personalForm.sexe}
                  onChange={handlePersonalChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Sélectionner</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
                {errors.sexe ? <small className="error-message">{errors.sexe}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Nationalité</span>
                <select
                  name="nationalite"
                  value={personalForm.nationalite}
                  onChange={handlePersonalChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Sélectionner une nationalité</option>
                  {nationalities.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.nationalite ? (
                  <small className="error-message">{errors.nationalite}</small>
                ) : null}
              </label>

            </div>
          </section>

          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Coordonnées</h2>
              <p>Indiquez les informations nécessaires pour vous contacter pendant le suivi du dossier.</p>
            </div>

            <div className="student-profile-form-grid">
              <label className="student-profile-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={personalForm.email}
                  readOnly
                  className="is-readonly"
                  autoComplete="email"
                />
                {errors.email ? <small className="error-message">{errors.email}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Téléphone</span>
                <input
                  type="tel"
                  name="telephone"
                  value={personalForm.telephone}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  autoComplete="tel"
                />
                {errors.telephone ? (
                  <small className="error-message">{errors.telephone}</small>
                ) : null}
              </label>

              <label className="student-profile-field student-profile-field-full">
                <span>Adresse</span>
                <textarea
                  name="adresse"
                  rows={3}
                  value={personalForm.adresse}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.adresse ? <small className="error-message">{errors.adresse}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Wilaya</span>
                <input
                  type="text"
                  name="wilaya"
                  value={personalForm.wilaya}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.wilaya ? <small className="error-message">{errors.wilaya}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Commune</span>
                <input
                  type="text"
                  name="commune"
                  value={personalForm.commune}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.commune ? <small className="error-message">{errors.commune}</small> : null}
              </label>
            </div>
          </section>

          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Baccalauréat</h2>
              <p>Renseignez les informations de votre bac pour préparer l'étude de votre candidature.</p>
            </div>

            <div className="student-profile-form-grid">
              <label className="student-profile-field">
                <span>Année du bac</span>
                <input
                  type="number"
                  min="1980"
                  max={new Date().getFullYear() + 1}
                  name="anneeBac"
                  value={academicForm.anneeBac}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  placeholder="Ex. 2026"
                />
                {errors.anneeBac ? <small className="error-message">{errors.anneeBac}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Série du bac</span>
                <select
                  name="serieBac"
                  value={academicForm.serieBac}
                  onChange={handleAcademicChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Sélectionner une série</option>
                  {BAC_SERIES.map((serie) => (
                    <option key={serie} value={serie}>
                      {serie}
                    </option>
                  ))}
                </select>
                {errors.serieBac ? <small className="error-message">{errors.serieBac}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Moyenne générale</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  name="moyenneBac"
                  value={academicForm.moyenneBac}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  placeholder="Ex. 14.50"
                />
                {errors.moyenneBac ? (
                  <small className="error-message">{errors.moyenneBac}</small>
                ) : null}
              </label>

              <label className="student-profile-field">
                <span>Mention</span>
                <select
                  name="mentionBac"
                  value={academicForm.mentionBac}
                  onChange={handleAcademicChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Sélectionner une mention</option>
                  {BAC_MENTIONS.map((mention) => (
                    <option key={mention} value={mention}>
                      {mention}
                    </option>
                  ))}
                </select>
              </label>

              <label className="student-profile-field">
                <span>Numéro d'inscription au bac</span>
                <input
                  type="text"
                  name="numeroInscriptionBac"
                  value={academicForm.numeroInscriptionBac}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.numeroInscriptionBac ? (
                  <small className="error-message">{errors.numeroInscriptionBac}</small>
                ) : null}
              </label>

              <label className="student-profile-field">
                <span>Lycée d'origine</span>
                <input
                  type="text"
                  name="lyceeOrigine"
                  value={academicForm.lyceeOrigine}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
              </label>

              <label className="student-profile-field">
                <span>Wilaya du lycée</span>
                <input
                  type="text"
                  name="wilayaLycee"
                  value={academicForm.wilayaLycee}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
              </label>
            </div>
          </section>

          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Sécurité du compte</h2>
              <p>Mettez à jour votre mot de passe pour garder un accès sécurisé à votre espace.</p>
            </div>

            {!accountInfo.password ? (
              <div className="student-application-note student-profile-inline-note">
                <strong>Sécurité à initialiser</strong>
                <p>
                  Aucun mot de passe local n'est encore configuré pour ce compte.
                  Enregistrez-en un pour renforcer l'accès à votre espace étudiant.
                </p>
              </div>
            ) : null}

            <form className="student-profile-form-grid" onSubmit={handlePasswordSubmit}>
              <label className="student-profile-field">
                <span>Mot de passe actuel</span>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder={accountInfo.password ? "Saisir le mot de passe actuel" : "Optionnel si aucun mot de passe n'est configuré"}
                />
              </label>

              <label className="student-profile-field">
                <span>Nouveau mot de passe</span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimum 6 caractères"
                />
              </label>

              <label className="student-profile-field student-profile-field-full">
                <span>Confirmation du nouveau mot de passe</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirmez le nouveau mot de passe"
                />
              </label>

              <div className="student-profile-security-actions">
                <button
                  type="submit"
                  className="student-application-button student-application-button-primary"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="student-profile-side">
          <section className="student-dashboard-panel student-profile-side-card">
            <div className="student-dashboard-section-head">
              <h2>État du profil</h2>
              <p>Visualisez en un coup d'œil ce qui est déjà renseigné et ce qu'il reste à compléter.</p>
            </div>

            <div className="student-profile-progress-list">
              <div className="student-progress-row">
                <div className="student-progress-head">
                  <h3>Profil candidat</h3>
                  <span>{personalCompletion}%</span>
                </div>
                <p>Identité, coordonnées et informations de contact.</p>
                <ProgressBar value={personalCompletion} color="#2563eb" label={`${personalCompletion}%`} />
              </div>

              <div className="student-progress-row">
                <div className="student-progress-head">
                  <h3>Baccalauréat</h3>
                  <span>{academicCompletion}%</span>
                </div>
                <p>Série, moyenne et informations liées au bac.</p>
                <ProgressBar value={academicCompletion} color="#0f766e" label={`${academicCompletion}%`} />
              </div>

              <div className="student-progress-row">
                <div className="student-progress-head">
                  <h3>Documents</h3>
                  <span>{documentsCompletion}%</span>
                </div>
                <p>Pièces déjà déposées ou encore manquantes sur votre dossier.</p>
                <ProgressBar value={documentsCompletion} color="#d97706" label={`${documentsCompletion}%`} />
              </div>
            </div>

            <div className="student-dashboard-panel-actions">
              <Link to="/student-step1" className="student-dashboard-link">
                Compléter mon dossier
              </Link>
              <Link to="/mes-candidatures" className="student-dashboard-ghost-link">
                Voir mes candidatures
              </Link>
            </div>
          </section>

          <section className="student-dashboard-panel student-profile-side-card">
            <div className="student-dashboard-section-head">
              <h2>Informations du compte</h2>
              <p>Informations de connexion et état général de votre compte étudiant.</p>
            </div>

            <div className="student-profile-account-list">
              <div className="student-profile-account-row">
                <span>Email principal</span>
                <strong>{accountInfo.email || personalForm.email || "Non renseignee"}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Date de création du compte</span>
                <strong>{formatDate(accountInfo.accountCreatedAt)}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Dernière connexion</span>
                <strong>{formatDateTime(accountInfo.lastLoginAt)}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Navigateur utilisé</span>
                <strong>{accountInfo.lastLoginBrowser || "Non renseigné"}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Statut du compte</span>
                <strong>{accountInfo.accountStatus || "Actif"}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Dernière mise à jour du mot de passe</span>
                <strong>{formatDateTime(accountInfo.lastPasswordUpdatedAt)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
