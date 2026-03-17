import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAdmissions } from "../../context/AdmissionsContext";
import "../../index.css";

export default function Success() {
  const [searchParams] = useSearchParams();
  const { lastSubmittedApplication } = useAdmissions();
  const numeroDossier =
    searchParams.get("numeroDossier") || lastSubmittedApplication?.numeroDossier || "";

  const now = new Date();
  const formattedDate = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="success-page">
      <div className="success-content">
        <div className="success-icon">OK</div>
        <h1>Votre candidature a ete soumise avec succes.</h1>

        {numeroDossier && (
          <div className="numero-dossier">
            <p>Numero de dossier :</p>
            <span className="dossier-number">{numeroDossier}</span>
          </div>
        )}

        <div className="submission-date">
          <p>
            Soumis le {formattedDate} a {formattedTime}
          </p>
        </div>

        <p className="success-message-text">
          Vous pouvez suivre le statut de votre candidature dans "Mes candidatures".
        </p>

        <div className="success-buttons">
          <Link to="/mes-candidatures">
            <button className="home-btn">Voir mes candidatures</button>
          </Link>
          <Link to="/dashboard">
            <button className="dashboard-btn">Retour au tableau de bord</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
