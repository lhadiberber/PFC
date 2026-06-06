import React, { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import CustomSelect from "../../components/ui/CustomSelect";
import AdminLayout from "../../components/admin/AdminLayout";
import { formatAdminDate, formatAdminDateTime } from "../../utils/adminApplications";
import {
  readAdminSecurity,
  readStoredAdminProfile,
  updateAdminPassword,
  writeStoredAdminProfile,
} from "../../utils/adminAccount";
import { showToast } from "../../utils/toast";
import "../../index.css";

function IconEdit() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function buildInitials(firstName, lastName, fullName) {
  const source = [firstName, lastName].filter(Boolean).join(" ").trim() || fullName || "AD";
  return source
    .split(" ")
    .map((part) => part.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

function readProfileSnapshot() {
  return readStoredAdminProfile();
}

function isEmailValid(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function getPasswordStrength(password) {
  if (!password) return { label: "Aucun mot de passe", tone: "neutral" };
  if (password.length < 6) return { label: "Faible", tone: "warning" };
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { label: "Fort", tone: "positive" };
  }
  return { label: "Moyen", tone: "info" };
}

export default function ProfilAdmin() {
  const [profileData, setProfileData] = useState(readProfileSnapshot);
  const [securityData, setSecurityData] = useState(() => readAdminSecurity());
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    const syncAccount = () => {
      setProfileData(readStoredAdminProfile());
      setSecurityData(readAdminSecurity());
    };

    window.addEventListener("admin:preferences-updated", syncAccount);
    window.addEventListener("admin:security-updated", syncAccount);
    window.addEventListener("storage", syncAccount);

    return () => {
      window.removeEventListener("admin:preferences-updated", syncAccount);
      window.removeEventListener("admin:security-updated", syncAccount);
      window.removeEventListener("storage", syncAccount);
    };
  }, []);

  const avatarInitials = useMemo(
    () => buildInitials(profileData.firstName, profileData.lastName, profileData.fullName),
    [profileData.firstName, profileData.fullName, profileData.lastName]
  );
  const displayName = useMemo(
    () =>
      `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() ||
      profileData.fullName,
    [profileData.firstName, profileData.fullName, profileData.lastName]
  );
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordData.newPassword),
    [passwordData.newPassword]
  );

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProfileData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveProfile = () => {
    const nextProfile = {
      ...profileData,
      firstName: profileData.firstName.trim(),
      lastName: profileData.lastName.trim(),
      email: profileData.email.trim(),
      phone: profileData.phone.trim(),
      service: profileData.service.trim(),
      role: "Administrateur",
    };

    if (!nextProfile.firstName || !nextProfile.lastName) {
      showToast("Veuillez renseigner le nom et le prénom.", "error");
      return;
    }

    if (!isEmailValid(nextProfile.email)) {
      showToast("Veuillez renseigner une adresse e-mail valide.", "error");
      return;
    }

    const savedProfile = writeStoredAdminProfile(nextProfile);
    setProfileData(savedProfile);
    setIsEditing(false);
    showToast("Profil administrateur mis à jour.", "success");
  };

  const handleResetProfile = () => {
    setProfileData(readStoredAdminProfile());
    setIsEditing(false);
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
    setPasswordMessage(null);

    if (
      !passwordData.currentPassword.trim() ||
      !passwordData.newPassword.trim() ||
      !passwordData.confirmPassword.trim()
    ) {
      setPasswordMessage({ type: "error", text: "Veuillez compléter tous les champs de sécurité." });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "La confirmation du mot de passe ne correspond pas.",
      });
      return;
    }

    const passwordUpdate = updateAdminPassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (!passwordUpdate.success) {
      setPasswordMessage({ type: "error", text: passwordUpdate.message });
      return;
    }

    setSecurityData(readAdminSecurity());
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordMessage({ type: "success", text: "Mot de passe mis à jour avec succès." });
    showToast("Mot de passe mis à jour.", "success");
    setTimeout(() => setPasswordMessage(null), 3000);
  };

  return (
    <AdminLayout
      title="Mon profil"
      subtitle="Gérez vos informations personnelles et la sécurité de votre compte"
      showSearch={false}
      headerAction={
        <Button
          className="admin-header-primary-action"
          onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <IconCheck />
              Enregistrer les modifications
            </>
          ) : (
            <>
              <IconEdit />
              Modifier le profil
            </>
          )}
        </Button>
      }
    >
      <section className="campus-section-container">
        <div className="admin-profile-hero">
          <div className="admin-profile-hero-main">
            <div className="admin-profile-avatar">{avatarInitials}</div>

            <div className="admin-profile-hero-copy">
              <span className="admin-section-kicker">Compte administrateur</span>
              <h2>{displayName}</h2>
              <p>{profileData.email}</p>

              <div className="admin-profile-hero-meta">
                <span className="admin-page-context neutral">Administrateur</span>
                <span className="admin-page-context info">{profileData.service}</span>
                <span className="admin-page-context positive">
                  Compte {securityData.accountStatus.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-profile-hero-side">
            <div className="admin-profile-hero-side-item">
              <span>Compte créé</span>
              <strong>{formatAdminDate(profileData.accountCreatedAt)}</strong>
            </div>
            <div className="admin-profile-hero-side-item">
              <span>Dernière connexion</span>
              <strong>
                {securityData.lastLoginAt
                  ? formatAdminDateTime(securityData.lastLoginAt)
                  : "Non renseignée"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="campus-section-container">
        <div className="admin-profile-layout">
          <div className="admin-profile-main">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations personnelles</h3>
                  <p>Vos données de contact et d'identification</p>
                </div>
              </div>

              <div className="admin-profile-form-grid">
                {[
                  {
                    label: "Nom",
                    name: "lastName",
                    value: profileData.lastName,
                    type: "text",
                    placeholder: "Nom",
                  },
                  {
                    label: "Prénom",
                    name: "firstName",
                    value: profileData.firstName,
                    type: "text",
                    placeholder: "Prénom",
                  },
                  {
                    label: "Adresse e-mail",
                    name: "email",
                    value: profileData.email,
                    type: "email",
                    placeholder: "adresse@universite.dz",
                  },
                  {
                    label: "Numéro de téléphone",
                    name: "phone",
                    value: profileData.phone,
                    type: "text",
                    placeholder: "+213 ...",
                  },
                  {
                    label: "Date de création du compte",
                    name: "accountCreatedAt",
                    value: formatAdminDate(profileData.accountCreatedAt),
                    readOnly: true,
                  },
                  {
                    label: "Fonction / service",
                    name: "service",
                    value: profileData.service,
                    type: "text",
                    placeholder: "Service des admissions",
                  },
                ].map((field) => (
                  <label key={field.label} className="admin-profile-field">
                    <span>{field.label}</span>
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={field.value}
                      onChange={field.readOnly ? undefined : handleProfileChange}
                      readOnly={field.readOnly || !isEditing}
                      placeholder={field.placeholder}
                    />
                  </label>
                ))}
              </div>

              {isEditing ? (
                <div className="admin-profile-card-actions">
                  <Button className="admin-filter-tab" onClick={handleResetProfile}>
                    <IconX />
                    Annuler
                  </Button>
                  <Button className="admin-header-primary-action" onClick={handleSaveProfile}>
                    <IconCheck />
                    Enregistrer les modifications
                  </Button>
                </div>
              ) : null}
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Sécurité du compte</h3>
                  <p>Changez votre mot de passe et protégez votre accès</p>
                </div>
                <span className="admin-page-context neutral">
                  Mis à jour le {formatAdminDate(securityData.lastPasswordUpdatedAt)}
                </span>
              </div>

              {passwordMessage ? (
                <div
                  className={`student-profile-feedback ${
                    passwordMessage.type === "error" ? "student-profile-feedback-error" : "student-profile-feedback-success"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              ) : null}

              <form className="admin-profile-security-form" onSubmit={handlePasswordSubmit}>
                <label className="admin-profile-field">
                  <span>Mot de passe actuel</span>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Saisir le mot de passe actuel"
                  />
                </label>

                <label className="admin-profile-field">
                  <span>Nouveau mot de passe</span>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Minimum 6 caractères"
                  />
                  {passwordData.newPassword ? (
                    <span className={`admin-page-context ${passwordStrength.tone}`}>
                      Robustesse : {passwordStrength.label}
                    </span>
                  ) : null}
                </label>

                <label className="admin-profile-field">
                  <span>Confirmer le nouveau mot de passe</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirmer le mot de passe"
                  />
                </label>

                <div className="admin-profile-card-actions">
                  <Button className="admin-header-primary-action" type="submit">
                    <IconLock />
                    Mettre à jour le mot de passe
                  </Button>
                </div>
              </form>
            </article>
          </div>

          <aside className="admin-profile-side">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations de connexion</h3>
                  <p>Éléments utiles sur votre session et votre compte</p>
                </div>
              </div>

              <div className="admin-profile-info-list">
                {[
                  [
                    "Dernière connexion",
                    securityData.lastLoginAt
                      ? formatAdminDateTime(securityData.lastLoginAt)
                      : "Non renseignée",
                  ],
                  ["Compte", securityData.accountStatus],
                  ["Role", "Administrateur"],
                  [
                    "Navigateur",
                    securityData.lastLoginBrowser
                      ? securityData.lastLoginBrowser
                      : "Navigateur non détecté",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="admin-profile-info-row">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Préférences</h3>
                  <p>Réglez l'affichage de l'espace admin</p>
                </div>
              </div>

              <div className="admin-profile-preferences">
                <label className="admin-profile-field">
                  <span>Thème</span>
                  <CustomSelect
                    name="themePreference"
                    value={profileData.themePreference}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  >
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                  </CustomSelect>
                </label>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
