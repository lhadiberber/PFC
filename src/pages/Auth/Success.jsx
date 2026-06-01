import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LanguageSelector from "../../components/LanguageSelector";
import { useAdmissions } from "../../context/AdmissionsContext";
import { useLanguage } from "../../context/LanguageContext";

function Icon({ name, size = 20 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    checkCircle: (
      <>
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="10" height="10" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    check: <path d="M20 6L9 17l-5-5" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8M8 17h6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </>
    ),
    arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

Icon.propTypes = {
  name: PropTypes.oneOf([
    "checkCircle",
    "copy",
    "check",
    "file",
    "bell",
    "search",
    "arrowRight",
  ]).isRequired,
  size: PropTypes.number,
};

export default function Success() {
  const [searchParams] = useSearchParams();
  const { lastSubmittedApplication } = useAdmissions();
  const { locale, messages, t } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const text = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const numeroDossier =
    searchParams.get("numeroDossier") ||
    lastSubmittedApplication?.numeroDossier ||
    "";

  const submittedAt = lastSubmittedApplication?.date_depot
    ? new Date(lastSubmittedApplication.date_depot)
    : new Date();
  const formattedDate = submittedAt.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = submittedAt.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopy = async () => {
    if (!numeroDossier) return;

    try {
      await navigator.clipboard.writeText(numeroDossier);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      setCopied(false);
    }
  };

  const nextSteps = [
    {
      icon: "file",
      title: text("success.step1Title", "Examen du dossier"),
      description: text(
        "success.step1Desc",
        "L’administration universitaire examine votre dossier et les documents déposés."
      ),
    },
    {
      icon: "bell",
      title: text("success.step2Title", "Notification de décision"),
      description: text(
        "success.step2Desc",
        "Vous serez informé de la décision d’admission depuis votre espace étudiant."
      ),
    },
    {
      icon: "search",
      title: text("success.step3Title", "Suivi de candidature"),
      description: text(
        "success.step3Desc",
        "Consultez régulièrement la rubrique Mes candidatures pour suivre l’avancement de votre dossier."
      ),
    },
  ];

  return (
    <div className="success-page success-page-modern">
      <header className="success-topbar">
        <Link to="/" className="success-brand">
          <span className="auth-register-brand-mark">PFC</span>
          <span className="auth-register-brand-text">{messages?.common?.brand}</span>
        </Link>
        <LanguageSelector />
      </header>

      <main className="success-main">
        <section className="success-header">
          <div className="success-icon-wrapper">
            <Icon name="checkCircle" size={42} />
          </div>
          <h1 className="success-title">
            {text("success.title", "Candidature soumise avec succès.")}
          </h1>
          <p className="success-subtitle">
            {text(
              "success.message",
              "Votre dossier a bien été reçu. Vous pouvez suivre son évolution depuis votre espace étudiant."
            )}
          </p>
        </section>

        <section className="success-summary-card" aria-labelledby="success-summary-title">
          <h2 id="success-summary-title" className="summary-card-title">
            {text("success.summaryTitle", "Récapitulatif de votre dossier")}
          </h2>

          <div className="summary-rows">
            <div className="summary-row">
              <span className="summary-label">
                {text("success.dossierLabel", "Numéro de dossier")}
              </span>
              {numeroDossier ? (
                <div className="dossier-number-group">
                  <span className="dossier-number">{numeroDossier}</span>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={handleCopy}
                    aria-label="Copier le numéro de dossier"
                  >
                    <Icon name={copied ? "check" : "copy"} size={14} />
                    <span className="copy-label">
                      {copied
                        ? text("success.copied", "Copié")
                        : text("success.copy", "Copier")}
                    </span>
                  </button>
                </div>
              ) : (
                <span className="summary-value muted">
                  {text("success.noDossier", "Non disponible")}
                </span>
              )}
            </div>

            <div className="summary-row">
              <span className="summary-label">
                {text("success.dateLabel", "Date de soumission")}
              </span>
              <span className="summary-value">
                {formattedDate} {text("success.at", "à")} {formattedTime}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">{text("success.statusLabel", "Statut")}</span>
              <span className="status-badge status-pending">
                {text("success.statusPending", "En attente de traitement")}
              </span>
            </div>
          </div>
        </section>

        <section className="next-steps-section" aria-labelledby="next-steps-title">
          <h2 id="next-steps-title" className="next-steps-title">
            {text("success.nextStepsTitle", "Que se passe-t-il maintenant ?")}
          </h2>
          <ol className="next-steps-list">
            {nextSteps.map((step, index) => (
              <li key={step.title} className="next-step-item">
                <div className="step-number" aria-hidden="true">
                  {index + 1}
                </div>
                <div className="step-icon-wrapper">
                  <Icon name={step.icon} />
                </div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="success-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/mes-candidatures")}
          >
            {text("success.viewApplications", "Voir mes candidatures")}
            <Icon name="arrowRight" size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            {text("success.backDashboard", "Retour au tableau de bord")}
          </button>
        </div>
      </main>
    </div>
  );
}
