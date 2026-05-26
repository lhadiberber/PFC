import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import { getAuthSession } from "../../services/authService";
import "../../index.css";

export default function SuperAdminProfile() {
  const session = getAuthSession();
  const user = session?.user || {};
  const fullName = `${user.prenom || ""} ${user.nom || ""}`.trim() || "Super administrateur";
  const initials = `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`.toUpperCase() || "SA";

  return (
    <AdminLayout
      title="Profil super administrateur"
      subtitle="Consultez les informations du compte connecté."
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
                <span className="admin-page-context neutral">Super administrateur</span>
                <StatusBadge status="Actif" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="campus-section-container">
        <article className="admin-meta-card">
          <div className="admin-meta-card-header">
            <div>
              <h3>Informations du compte</h3>
              <p>Ces informations viennent de la session connectée.</p>
            </div>
          </div>

          <div className="admin-profile-info-list">
            {[
              ["Nom", user.nom || "-"],
              ["Prénom", user.prenom || "-"],
              ["Email", user.email || "-"],
              ["Rôle", "Super administrateur"],
            ].map(([label, value]) => (
              <div key={label} className="admin-profile-info-row">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminLayout>
  );
}
