import React from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../index.css";

export default function SuperAdminDashboard() {
  return (
    <AdminLayout
      title="Espace super administrateur"
      subtitle="Gestion generale des acces administrateurs."
      showSearch={false}
    >
      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-page-context info">Acces reserve</span>
            <h2>Super administrateur</h2>
            <p>
              La gestion complete des administrateurs sera ajoutee dans l'etape suivante.
            </p>
          </div>
        </div>

        <div className="admin-quick-actions-grid">
          <Link to="/admin" className="admin-quick-action-card admin-quick-action-card-info">
            <div className="admin-quick-action-body">
              <strong>Acceder au tableau de bord admin</strong>
              <span>Consulter les candidatures, les étudiants et les documents.</span>
            </div>
          </Link>
        </div>
      </section>
    </AdminLayout>
  );
}
