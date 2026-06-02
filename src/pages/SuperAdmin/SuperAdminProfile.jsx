import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import { getAuthSession } from "../../services/authService";
import { formatAdminDate, formatAdminDateTime } from "../../utils/adminApplications";
import "../../index.css";

function buildInitials(firstName, lastName, fallback = "SA") {
  const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  return initials || fallback;
}

function getFieldValue(value, fallback = "Non renseigné") {
  return value && String(value).trim() ? value : fallback;
}

function formatRole(role) {
  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return getFieldValue(role, "Rôle non renseigné");
}

export default function SuperAdminProfile() {
  const session = getAuthSession();
  const user = session?.user || {};
  const fullName = `${user.prenom || ""} ${user.nom || ""}`.trim() || "Super administrateur";
  const initials = buildInitials(user.prenom, user.nom);
  const status = user.is_active === false ? "Inactif" : "Actif";

  const accountRows = useMemo(
    () => [
      ["Nom", getFieldValue(user.nom, "-")],
      ["Prénom", getFieldValue(user.prenom, "-")],
      ["Email", getFieldValue(user.email, "-")],
      ["Rôle", formatRole(user.role || session?.role)],
      ["Identifiant", user.id ? `#${user.id}` : "Non renseigné"],
      [
        "Date de création",
        user.created_at ? formatAdminDate(user.created_at) : "Non renseignée",
      ],
    ],
    [session?.role, user.created_at, user.email, user.id, user.nom, user.prenom, user.role]
  );

  const sessionRows = useMemo(
    () => [
      ["Statut du compte", status],
      ["Session", session?.token ? "Connectée" : "Non disponible"],
      [
        "Dernière mise à jour connue",
        user.updated_at ? formatAdminDateTime(user.updated_at) : "Non renseignée",
      ],
      ["Source des données", "Session authentifiée"],
    ],
    [session?.token, status, user.updated_at]
  );

  return (
    <AdminLayout
      title="Profil super administrateur"
      subtitle="Consultez les informations du compte connecté et vos accès de pilotage"
      showSearch={false}
    >
      <section className="campus-section-container">
        <div className="admin-profile-hero">
          <div className="admin-profile-hero-main">
            <div className="admin-profile-avatar">{initials}</div>

            <div className="admin-profile-hero-copy">
              <span className="admin-section-kicker">Compte super administrateur</span>
              <h2>{fullName}</h2>
              <p>{user.email || "Email non renseigné"}</p>

              <div className="admin-profile-hero-meta">
                <span className="admin-page-context neutral">{formatRole(user.role || session?.role)}</span>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          <div className="admin-profile-hero-side">
            <div className="admin-profile-hero-side-item">
              <span>Identifiant</span>
              <strong>{user.id ? `#${user.id}` : "Non renseigné"}</strong>
            </div>
            <div className="admin-profile-hero-side-item">
              <span>Création du compte</span>
              <strong>{user.created_at ? formatAdminDate(user.created_at) : "Non renseignée"}</strong>
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
                  <h3>Informations du compte</h3>
                  <p>Ces informations viennent de la session authentifiée.</p>
                </div>
              </div>

              <div className="admin-profile-info-list">
                {accountRows.map(([label, value]) => (
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
                  <h3>Accès de pilotage</h3>
                  <p>Raccourcis vers les zones réservées au super administrateur.</p>
                </div>
              </div>

              <div className="admin-quick-actions-grid">
                {[
                  ["Gestion des administrateurs", "/super-admin/admins", "Créer ou administrer les comptes admin"],
                  ["Gestion des utilisateurs", "/super-admin/users", "Consulter et gérer les comptes inscrits"],
                  ["Tableau de bord", "/super-admin", "Revenir aux statistiques globales"],
                ].map(([title, to, description]) => (
                  <Link
                    key={to}
                    to={to}
                    className="admin-quick-action-card admin-quick-action-card-info"
                  >
                    <div className="admin-quick-action-body">
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <aside className="admin-profile-side">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Session</h3>
                  <p>État courant de la connexion super admin.</p>
                </div>
              </div>

              <div className="admin-profile-info-list">
                {sessionRows.map(([label, value]) => (
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
                  <h3>Sécurité</h3>
                  <p>Les modifications sensibles doivent rester gérées par les endpoints dédiés.</p>
                </div>
              </div>

              <div className="admin-profile-info-list">
                <div className="admin-profile-info-row">
                  <span>Modification du profil</span>
                  <strong>Non exposée par l'API actuelle</strong>
                </div>
                <div className="admin-profile-info-row">
                  <span>Changement du mot de passe</span>
                  <strong>Non exposé par l'API actuelle</strong>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
