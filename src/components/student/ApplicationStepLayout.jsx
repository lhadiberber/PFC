import React from "react";
import PropTypes from "prop-types";

const STEP_ITEMS = [
  { number: 1, label: "Informations personnelles" },
  { number: 2, label: "Parcours academique" },
  { number: 3, label: "Documents justificatifs" },
  { number: 4, label: "Validation finale" },
];

export default function ApplicationStepLayout({
  step,
  title,
  subtitle,
  helperText,
  introTitle = "Avant de commencer",
  introText,
  children,
  sidebar,
}) {
  return (
    <div className="student-application-shell">
      <header className="student-dashboard-hero student-application-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Depot de candidature</span>
          <h1>{title}</h1>
          <p className="student-dashboard-subtitle">{subtitle}</p>
          {helperText ? <p className="student-dashboard-welcome">{helperText}</p> : null}
        </div>

        <div className="student-application-hero-side">
          <div className="student-application-hero-stat">
            <span>Etape actuelle</span>
            <strong>
              {step}/4
            </strong>
            <small>{STEP_ITEMS[step - 1]?.label}</small>
          </div>

          <div className="student-application-hero-stat is-soft">
            <span>Brouillon</span>
            <strong>Enregistre</strong>
            <small>Vos informations sont sauvegardees automatiquement.</small>
          </div>
        </div>
      </header>

      <section className="student-dashboard-panel student-application-intro-card">
        <div className="student-application-intro-copy">
          <h2>{introTitle}</h2>
          <p>{introText}</p>
        </div>

        <div className="student-application-stepper" role="list" aria-label="Progression du depot">
          {STEP_ITEMS.map((item, index) => {
            const state =
              item.number < step ? "completed" : item.number === step ? "active" : "upcoming";

            return (
              <React.Fragment key={item.number}>
                <div className={`student-application-step ${state}`.trim()} role="listitem">
                  <span className="student-application-step-node">{item.number}</span>
                  <div className="student-application-step-copy">
                    <strong>{`Etape ${item.number}`}</strong>
                    <span>{item.label}</span>
                  </div>
                </div>

                {index < STEP_ITEMS.length - 1 ? (
                  <span className={`student-application-step-line ${state}`.trim()} aria-hidden="true" />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      <div className={`student-application-grid ${sidebar ? "" : "is-single"}`.trim()}>
        <div className="student-application-main">{children}</div>
        {sidebar ? <aside className="student-dashboard-panel student-application-side">{sidebar}</aside> : null}
      </div>
    </div>
  );
}

ApplicationStepLayout.propTypes = {
  step: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  introTitle: PropTypes.string,
  introText: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  sidebar: PropTypes.node,
};
