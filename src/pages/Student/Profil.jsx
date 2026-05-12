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
  pays: "",
  adresse: "",
};

const emptyAcademicInfo = {
  diplomeActuel: "",
  etablissementActuel: "",
  pays: "",
  specialiteActuelle: "",
  anneeBac: "",
  moyenneBac: "",
};

const PERSONAL_FIELDS = [
  "nom",
  "prenom",
  "dateNaiss",
  "lieuNaiss",
  "sexe",
  "nationalite",
  "email",
  "telephone",
  "pays",
  "adresse",
];

const ACADEMIC_FIELDS = [
  "diplomeActuel",
  "etablissementActuel",
  "pays",
  "specialiteActuelle",
  "anneeBac",
  "moyenneBac",
];

const DOCUMENT_FIELDS = ["copieBac", "releveNotes", "carteIdentite", "photo", "residence", "cv"];

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
    return "Non renseignee";
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
    return "Non renseignee";
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

  const [personalForm, setPersonalForm] = useState(profile || emptyProfile);
  const [academicForm, setAcademicForm] = useState(() => ({
    ...emptyAcademicInfo,
    ...applicationDraft.academicInfo,
  }));
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
    setPersonalForm(profile || emptyProfile);
  }, [profile]);

  useEffect(() => {
    setAcademicForm({
      ...emptyAcademicInfo,
      ...applicationDraft.academicInfo,
    });
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
        const message = "Session absente ou expiree. Veuillez vous reconnecter.";
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

        setPersonalForm(mappedProfile.personal);
        setAcademicForm({
          ...emptyAcademicInfo,
          ...mappedProfile.academic,
        });
        saveProfile(mappedProfile.personal);
        updateAcademicInfo({
          ...applicationDraft.academicInfo,
          ...mappedProfile.academic,
        });
        updateStoredUserProfile(remoteProfile);
        setAccountInfo(syncStudentAccountProfile(mappedProfile.personal));
        setIsEditing(
          countCompleted(mappedProfile.personal, PERSONAL_FIELDS) < PERSONAL_FIELDS.length
        );
        setProfileError("");
      } catch (error) {
        if (isMounted) {
          setProfileError(error.message || "Impossible de charger le profil etudiant.");
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
    () => toPercent(countCompleted(personalForm, PERSONAL_FIELDS), PERSONAL_FIELDS.length),
    [personalForm]
  );
  const academicCompletion = useMemo(
    () => toPercent(countCompleted(academicForm, ACADEMIC_FIELDS), ACADEMIC_FIELDS.length),
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
    overallCompletion >= 90 ? "Complet" : overallCompletion >= 60 ? "En progression" : "A completer";

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

    if (!personalForm.nom.trim()) nextErrors.nom = "Le nom est requis.";
    if (!personalForm.prenom.trim()) nextErrors.prenom = "Le prenom est requis.";
    if (!personalForm.dateNaiss) nextErrors.dateNaiss = "La date de naissance est requise.";
    if (!personalForm.sexe) nextErrors.sexe = "Le sexe est requis.";
    if (!personalForm.nationalite.trim()) nextErrors.nationalite = "La nationalite est requise.";
    if (!personalForm.lieuNaiss.trim()) nextErrors.lieuNaiss = "Le lieu de naissance est requis.";
    if (!personalForm.email.trim()) nextErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(personalForm.email)) nextErrors.email = "Email invalide.";
    if (!personalForm.telephone.trim()) nextErrors.telephone = "Le telephone est requis.";
    if (!personalForm.pays.trim()) nextErrors.pays = "Le pays est requis.";
    if (!personalForm.adresse.trim()) nextErrors.adresse = "L'adresse complete est requise.";

    if (academicForm.anneeBac && !/^\d{4}$/.test(String(academicForm.anneeBac))) {
      nextErrors.anneeBac = "Veuillez saisir une annee sur 4 chiffres.";
    }

    if (
      academicForm.moyenneBac &&
      (Number(academicForm.moyenneBac) < 0 || Number(academicForm.moyenneBac) > 20)
    ) {
      nextErrors.moyenneBac = "La moyenne doit etre comprise entre 0 et 20.";
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
        typeBac: mappedProfile.academic.diplomeActuel || applicationDraft.academicInfo.typeBac,
      };

      setPersonalForm(mappedProfile.personal);
      setAcademicForm({
        ...emptyAcademicInfo,
        ...mappedProfile.academic,
      });
      saveProfile(mappedProfile.personal);
      updateAcademicInfo(nextAcademicInfo);
      updateStoredUserProfile(savedRemoteProfile);
      setAccountInfo(syncStudentAccountProfile(mappedProfile.personal));

      setErrors({});
      setIsEditing(false);
      showToast("Profil etudiant mis a jour.", "success");
    } catch (error) {
      const message = error.message || "Impossible d'enregistrer le profil etudiant.";
      setProfileError(message);
      showToast(message, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setPersonalForm(profile || emptyProfile);
    setAcademicForm({
      ...emptyAcademicInfo,
      ...applicationDraft.academicInfo,
    });
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

    const result = updateStudentPassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setAccountInfo(readStoredStudentAccount());
    showToast(result.message, "success");
  };

  return (
    <div className="student-profile-shell">
      <header className="student-dashboard-hero student-profile-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Espace candidat</span>
          <h1>Mon profil</h1>
          <p className="student-dashboard-subtitle">
            Consultez et mettez a jour vos informations personnelles.
          </p>
          <p className="student-dashboard-welcome">
            Verifiez les informations de votre compte pour garder un dossier a jour et
            faciliter vos demarches d'admission.
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
          Chargement du profil etudiant...
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
            <span className="student-profile-kicker">Profil etudiant</span>
            <h2>{displayName}</h2>
            <p>{personalForm.email || "Aucune adresse e-mail renseignee"}</p>

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
            <span>Etat du dossier</span>
            <strong>{statusDescription}</strong>
          </div>
          <div className="student-profile-meta-item">
            <span>Derniere connexion</span>
            <strong>{formatDateTime(accountInfo.lastLoginAt)}</strong>
          </div>
        </div>
      </section>

      <div className="student-profile-layout">
        <div className="student-profile-main">
          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Informations personnelles</h2>
              <p>Ces donnees sont utilisees pour l'identification de votre dossier de candidature.</p>
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
                />
                {errors.nom ? <small className="error-message">{errors.nom}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Prenom</span>
                <input
                  type="text"
                  name="prenom"
                  value={personalForm.prenom}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
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
                  <option value="">Selectionner</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Feminin">Feminin</option>
                </select>
                {errors.sexe ? <small className="error-message">{errors.sexe}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Nationalite</span>
                <select
                  name="nationalite"
                  value={personalForm.nationalite}
                  onChange={handlePersonalChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Selectionner une nationalite</option>
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

              <label className="student-profile-field">
                <span>Adresse e-mail</span>
                <input
                  type="email"
                  name="email"
                  value={personalForm.email}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.email ? <small className="error-message">{errors.email}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Telephone</span>
                <input
                  type="tel"
                  name="telephone"
                  value={personalForm.telephone}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.telephone ? (
                  <small className="error-message">{errors.telephone}</small>
                ) : null}
              </label>

              <label className="student-profile-field">
                <span>Pays</span>
                <select
                  name="pays"
                  value={personalForm.pays}
                  onChange={handlePersonalChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Selectionner un pays</option>
                  {nationalities.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.pays ? <small className="error-message">{errors.pays}</small> : null}
              </label>

              <label className="student-profile-field student-profile-field-full">
                <span>Adresse complete</span>
                <textarea
                  name="adresse"
                  rows={4}
                  value={personalForm.adresse}
                  onChange={handlePersonalChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                />
                {errors.adresse ? <small className="error-message">{errors.adresse}</small> : null}
              </label>
            </div>
          </section>

          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Informations academiques</h2>
              <p>
                Ces informations servent a pre-remplir vos prochaines candidatures et a evaluer
                la completude de votre parcours.
              </p>
            </div>

            <div className="student-profile-form-grid">
              <label className="student-profile-field">
                <span>Diplome actuel</span>
                <input
                  type="text"
                  name="diplomeActuel"
                  value={academicForm.diplomeActuel}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  placeholder="Ex. Licence"
                />
              </label>

              <label className="student-profile-field">
                <span>Etablissement</span>
                <input
                  type="text"
                  name="etablissementActuel"
                  value={academicForm.etablissementActuel}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  placeholder="Ex. Universite d'Alger 1"
                />
              </label>

              <label className="student-profile-field">
                <span>Pays d'etudes</span>
                <select
                  name="pays"
                  value={academicForm.pays}
                  onChange={handleAcademicChange}
                  disabled={!isEditing}
                  className={!isEditing ? "is-readonly" : ""}
                >
                  <option value="">Selectionner un pays</option>
                  {nationalities.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>

              <label className="student-profile-field">
                <span>Specialite actuelle</span>
                <input
                  type="text"
                  name="specialiteActuelle"
                  value={academicForm.specialiteActuelle}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  placeholder="Ex. Informatique"
                />
              </label>

              <label className="student-profile-field">
                <span>Annee d'obtention</span>
                <input
                  type="number"
                  name="anneeBac"
                  value={academicForm.anneeBac}
                  onChange={handleAcademicChange}
                  readOnly={!isEditing}
                  className={isEditing ? "" : "is-readonly"}
                  placeholder="Ex. 2025"
                />
                {errors.anneeBac ? <small className="error-message">{errors.anneeBac}</small> : null}
              </label>

              <label className="student-profile-field">
                <span>Moyenne</span>
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
            </div>
          </section>

          <section className="student-dashboard-panel student-profile-section">
            <div className="student-dashboard-section-head">
              <h2>Securite du compte</h2>
              <p>Mettez a jour votre mot de passe pour garder un acces securise a votre espace.</p>
            </div>

            {!accountInfo.password ? (
              <div className="student-application-note student-profile-inline-note">
                <strong>Securite a initialiser</strong>
                <p>
                  Aucun mot de passe local n'est encore configure pour ce compte.
                  Enregistrez-en un pour renforcer l'acces a votre espace etudiant.
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
                  placeholder={accountInfo.password ? "Saisir le mot de passe actuel" : "Optionnel si aucun mot de passe n'est configure"}
                />
              </label>

              <label className="student-profile-field">
                <span>Nouveau mot de passe</span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimum 6 caracteres"
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
                  Mettre a jour le mot de passe
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="student-profile-side">
          <section className="student-dashboard-panel student-profile-side-card">
            <div className="student-dashboard-section-head">
              <h2>Etat du profil</h2>
              <p>Visualisez en un coup d'oeil ce qui est deja renseigne et ce qu'il reste a completer.</p>
            </div>

            <div className="student-profile-progress-list">
              <div className="student-progress-row">
                <div className="student-progress-head">
                  <h3>Informations personnelles</h3>
                  <span>{personalCompletion}%</span>
                </div>
                <p>Identite, coordonnees et informations de contact.</p>
                <ProgressBar value={personalCompletion} color="#2563eb" label={`${personalCompletion}%`} />
              </div>

              <div className="student-progress-row">
                <div className="student-progress-head">
                  <h3>Informations academiques</h3>
                  <span>{academicCompletion}%</span>
                </div>
                <p>Parcours d'etudes et donnees utiles a l'evaluation du dossier.</p>
                <ProgressBar value={academicCompletion} color="#0f766e" label={`${academicCompletion}%`} />
              </div>

              <div className="student-progress-row">
                <div className="student-progress-head">
                  <h3>Documents</h3>
                  <span>{documentsCompletion}%</span>
                </div>
                <p>Pieces deja deposees ou encore manquantes sur votre dossier.</p>
                <ProgressBar value={documentsCompletion} color="#d97706" label={`${documentsCompletion}%`} />
              </div>
            </div>

            <div className="student-dashboard-panel-actions">
              <Link to="/student-step1" className="student-dashboard-link">
                Completer mon dossier
              </Link>
              <Link to="/mes-candidatures" className="student-dashboard-ghost-link">
                Voir mes candidatures
              </Link>
            </div>
          </section>

          <section className="student-dashboard-panel student-profile-side-card">
            <div className="student-dashboard-section-head">
              <h2>Informations du compte</h2>
              <p>Informations de connexion et etat general de votre compte etudiant.</p>
            </div>

            <div className="student-profile-account-list">
              <div className="student-profile-account-row">
                <span>Email principal</span>
                <strong>{accountInfo.email || personalForm.email || "Non renseignee"}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Date de creation du compte</span>
                <strong>{formatDate(accountInfo.accountCreatedAt)}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Derniere connexion</span>
                <strong>{formatDateTime(accountInfo.lastLoginAt)}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Navigateur utilise</span>
                <strong>{accountInfo.lastLoginBrowser || "Non renseigne"}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Statut du compte</span>
                <strong>{accountInfo.accountStatus || "Actif"}</strong>
              </div>
              <div className="student-profile-account-row">
                <span>Derniere mise a jour du mot de passe</span>
                <strong>{formatDateTime(accountInfo.lastPasswordUpdatedAt)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
