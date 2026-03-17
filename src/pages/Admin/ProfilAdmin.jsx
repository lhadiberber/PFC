import React, { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
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

export default function ProfilAdmin() {
  const [profileData, setProfileData] = useState(readProfileSnapshot);
  const [securityData, setSecurityData] = useState(() => readAdminSecurity());
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
      showToast("Veuillez renseigner le nom et le prenom.", "error");
      return;
    }

    if (!isEmailValid(nextProfile.email)) {
      showToast("Veuillez renseigner une adresse e-mail valide.", "error");
      return;
    }

    const savedProfile = writeStoredAdminProfile(nextProfile);
    setProfileData(savedProfile);
    setIsEditing(false);
    showToast("Profil administrateur mis a jour.", "success");
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

    if (
      !passwordData.currentPassword.trim() ||
      !passwordData.newPassword.trim() ||
      !passwordData.confirmPassword.trim()
    ) {
      showToast("Veuillez completer tous les champs de securite.", "error");
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

    const result = updateAdminPassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    setSecurityData(readAdminSecurity());
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    showToast("Mot de passe mis a jour.", "success");
  };

  return (
    <AdminLayout
      title="Profil administrateur"
      subtitle="Consultez et mettez a jour les informations de votre compte administrateur"
      showSearch={false}
      headerAction={
        <Button
          className="admin-header-primary-action"
          onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
        >
          {isEditing ? "Enregistrer les modifications" : "Modifier le profil"}
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
              <span>Compte cree</span>
              <strong>{formatAdminDate(profileData.accountCreatedAt)}</strong>
            </div>
            <div className="admin-profile-hero-side-item">
              <span>Derniere connexion</span>
              <strong>
                {securityData.lastLoginAt
                  ? formatAdminDateTime(securityData.lastLoginAt)
                  : "Non renseignee"}
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
                  <p>Consultez et mettez a jour les informations de votre compte</p>
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
                    label: "Prenom",
                    name: "firstName",
                    value: profileData.firstName,
                    type: "text",
                    placeholder: "Prenom",
                  },
                  {
                    label: "Adresse e-mail",
                    name: "email",
                    value: profileData.email,
                    type: "email",
                    placeholder: "adresse@universite.dz",
                  },
                  {
                    label: "Numero de telephone",
                    name: "phone",
                    value: profileData.phone,
                    type: "text",
                    placeholder: "+213 ...",
                  },
                  {
                    label: "Date de creation du compte",
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
                    Annuler
                  </Button>
                  <Button className="admin-header-primary-action" onClick={handleSaveProfile}>
                    Enregistrer les modifications
                  </Button>
                </div>
              ) : null}
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Securite du compte</h3>
                  <p>Mettez a jour votre mot de passe et gardez un acces protege</p>
                </div>
                <span className="admin-page-context neutral">
                  Mis a jour le {formatAdminDate(securityData.lastPasswordUpdatedAt)}
                </span>
              </div>

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
                    placeholder="Minimum 6 caracteres"
                  />
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
                    Mettre a jour le mot de passe
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
                  <p>Elements utiles sur votre session et votre compte</p>
                </div>
              </div>

              <div className="admin-profile-info-list">
                {[
                  [
                    "Derniere connexion",
                    securityData.lastLoginAt
                      ? formatAdminDateTime(securityData.lastLoginAt)
                      : "Non renseignee",
                  ],
                  ["Compte", securityData.accountStatus],
                  ["Role", "Administrateur"],
                  [
                    "Navigateur",
                    securityData.lastLoginBrowser
                      ? securityData.lastLoginBrowser
                      : "Navigateur non detecte",
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
                  <h3>Preferences</h3>
                  <p>Reglez l'affichage et les notifications de l'espace admin</p>
                </div>
              </div>

              <div className="admin-profile-preferences">
                <label className="admin-profile-field">
                  <span>Theme</span>
                  <select
                    name="themePreference"
                    value={profileData.themePreference}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  >
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                  </select>
                </label>

                <label className="admin-preference-card">
                  <input
                    type="checkbox"
                    name="notificationsEnabled"
                    checked={profileData.notificationsEnabled}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                  <span>Notifications admin activees</span>
                </label>

                <label className="admin-preference-card">
                  <input
                    type="checkbox"
                    name="dailySummary"
                    checked={profileData.dailySummary}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                  />
                  <span>Recevoir un recapitulatif quotidien</span>
                </label>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
