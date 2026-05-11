import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import LanguageSelector from "../../components/LanguageSelector";
import { useAdmissions } from "../../context/AdmissionsContext";
import { useLanguage } from "../../context/LanguageContext";
import "../../index.css";

export default function Success() {
  const [searchParams] = useSearchParams();
  const { lastSubmittedApplication } = useAdmissions();
  const { locale, messages, t } = useLanguage();
  const numeroDossier =
    searchParams.get("numeroDossier") || lastSubmittedApplication?.numeroDossier || "";

  const now = new Date();
  const formattedDate = now.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="success-page">
      <div className="success-content">
        <div className="auth-register-topbar success-topbar">
          <Link to="/" className="auth-register-brand">
            <span className="auth-register-brand-mark">PFC</span>
            <span className="auth-register-brand-text">{messages.common.brand}</span>
          </Link>
          <LanguageSelector />
        </div>

        <div className="success-icon">OK</div>
        <h1>{t("success.title")}</h1>

        {numeroDossier ? (
          <div className="numero-dossier">
            <p>{t("success.dossierLabel")}</p>
            <span className="dossier-number">{numeroDossier}</span>
          </div>
        ) : null}

        <div className="submission-date">
          <p>{t("success.submittedAt", { date: formattedDate, time: formattedTime })}</p>
        </div>

        <p className="success-message-text">{t("success.message")}</p>

        <div className="success-buttons">
          <Link to="/mes-candidatures">
            <button className="home-btn">{t("success.viewApplications")}</button>
          </Link>
          <Link to="/dashboard">
            <button className="dashboard-btn">{t("success.backDashboard")}</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
