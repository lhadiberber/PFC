import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import campusImage from "../assets/Workshop preps first-year college students, parents for freshman year.jpg";
import { isValidAdminCredentials, registerAdminLogin } from "../utils/adminAccount";
import "../index.css";

const featureIcons = [
  <svg key="simple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="secure" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>,
  <svg key="realtime" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
  <svg key="support" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>,
];

export default function Home() {
  const { messages, t } = useLanguage();
  const home = messages.home;
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const navItems = useMemo(
    () => [
      home.nav.home,
      home.nav.universities,
      home.nav.programs,
      home.nav.help,
    ],
    [home.nav.help, home.nav.home, home.nav.programs, home.nav.universities]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();

    if (isValidAdminCredentials(email, password)) {
      setShowLoginMenu(false);
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", email);
      registerAdminLogin(email);
      navigate("/admin");
      return;
    }

    alert(t("home.loginMenu.invalidCredentials"));
  };

  return (
    <div className="campus-landing">
      <header className="campus-header">
        <div className="campus-header-container">
          <div className="campus-logo">
            <Link to="/">
              <span className="logo-icon">PFC</span>
              <span className="logo-text">{t("common.brand")}</span>
            </Link>
          </div>

          <nav className="campus-nav">
            {navItems.map((item, index) => (
              <Link
                key={item}
                to="/"
                className={`campus-nav-link ${index === 0 ? "active" : ""}`.trim()}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="campus-header-actions">
            <LanguageSelector compact />

            <div className="campus-auth" ref={menuRef}>
              <button
                type="button"
                className="campus-btn-login"
                onClick={() => setShowLoginMenu((current) => !current)}
              >
                <span>{home.loginButton}</span>
                <svg
                  className="dropdown-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showLoginMenu ? (
                <div className="campus-dropdown">
                  <form onSubmit={handleLogin}>
                    <div className="campus-form-group">
                      <label>{t("common.email")}</label>
                      <input
                        type="email"
                        placeholder={messages.auth.login.emailPlaceholder}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="campus-form-group">
                      <label>{t("common.password")}</label>
                      <input
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="campus-btn-submit">
                      {home.loginMenu.submit}
                    </button>
                  </form>
                  <div className="campus-dropdown-footer">
                    <Link to="/register" onClick={() => setShowLoginMenu(false)}>
                      {home.loginMenu.createAccount}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="campus-hero">
        <div className="campus-hero-bg"></div>
        <div className="campus-hero-container">
          <div className="campus-hero-content">
            <div className="campus-hero-badge">{home.hero.badge}</div>
            <h1 className="campus-hero-title">{home.hero.title}</h1>
            <p className="campus-hero-subtitle">{home.hero.subtitle}</p>

            <div className="campus-hero-actions">
              <Link to="/register" className="campus-btn-primary">
                <span>{home.hero.createAccount}</span>
              </Link>
              <Link to="/login" className="campus-btn-secondary">
                {home.hero.existingAccount}
              </Link>
            </div>

            <div className="campus-hero-stats">
              <div className="campus-hero-stat">
                <span className="stat-value">15,000+</span>
                <span className="stat-label">{home.hero.stats.students}</span>
              </div>
              <div className="campus-stat-divider"></div>
              <div className="campus-hero-stat">
                <span className="stat-value">50+</span>
                <span className="stat-label">{home.hero.stats.universities}</span>
              </div>
              <div className="campus-stat-divider"></div>
              <div className="campus-hero-stat">
                <span className="stat-value">25,000+</span>
                <span className="stat-label">{home.hero.stats.applications}</span>
              </div>
            </div>
          </div>

          <div className="campus-hero-visual">
            <img
              src={campusImage}
              alt={home.hero.title}
              className="campus-hero-img"
            />
          </div>
        </div>
      </section>

      <section className="campus-steps">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>{home.steps.title}</h2>
            <p>{home.steps.subtitle}</p>
          </div>

          <div className="campus-steps-grid">
            {home.steps.items.map((item) => (
              <div key={item.number} className="campus-step-card">
                <div className="campus-step-number">{item.number}</div>
                <div className="campus-step-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="campus-universities">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>{home.universities.title}</h2>
            <p>{home.universities.subtitle}</p>
          </div>

          <div className="campus-universities-grid">
            {home.universities.items.map((item) => (
              <div key={item.title} className="campus-university-card">
                <div className="university-header">
                  <span className="university-badge">{item.badge}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="university-stats">
                  {item.stats.map((stat) => (
                    <span key={stat}>{stat}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="campus-calendar">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>{home.calendar.title}</h2>
            <p>{home.calendar.subtitle}</p>
          </div>

          <div className="campus-timeline">
            {home.calendar.phases.map((phase, index) => (
              <React.Fragment key={phase.title}>
                <div className="timeline-phase">
                  <div className={`phase-marker ${phase.markerClass}`}></div>
                  <div className="phase-content">
                    <span className="phase-date">{phase.date}</span>
                    <h3>{phase.title}</h3>
                    <p>{phase.description}</p>
                  </div>
                </div>
                {index < home.calendar.phases.length - 1 ? (
                  <div className="timeline-connector"></div>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="campus-features">
        <div className="campus-section-container">
          <div className="campus-features-grid">
            {home.features.items.map((item, index) => (
              <div key={item.title} className="campus-feature-card">
                <div className="feature-icon-wrap">{featureIcons[index]}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="campus-faq">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>{home.faq.title}</h2>
            <p>{home.faq.subtitle}</p>
          </div>

          <div className="campus-faq-grid">
            {home.faq.items.map((item) => (
              <div key={item.question} className="campus-faq-item">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="campus-cta">
        <div className="campus-cta-container">
          <h2>{home.cta.title}</h2>
          <p>{home.cta.subtitle}</p>
          <Link to="/register" className="campus-btn-primary campus-btn-large">
            {home.cta.button}
          </Link>
        </div>
      </section>

      <footer className="campus-footer">
        <div className="campus-footer-container">
          <div className="campus-footer-top">
            <div className="campus-footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">PFC</span>
                <span className="logo-text">{t("common.brand")}</span>
              </div>
              <p>{home.footer.description}</p>
            </div>

            <div className="campus-footer-links">
              {home.footer.columns.map((column) => (
                <div key={column.title} className="footer-column">
                  <h4>{column.title}</h4>
                  {column.links.map((link) => (
                    <a key={link} href="/">
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="campus-footer-bottom">
            <p>{home.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
