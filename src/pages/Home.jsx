import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import campusImage from "../assets/Workshop preps first-year college students, parents for freshman year.jpg";
import { loginUser, saveAuthSession, getAuthSession } from "../services/authService";
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

const footerLinkTargets = [
  ["accueil", "universites", "formations", "aide"],
  ["contact", "aide"],
  ["mentions-legales", "confidentialite", "cgu"],
];

function getHomePath(role) {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

export default function Home() {
  const { messages, t } = useLanguage();
  const home = messages.home;
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const menuRef = useRef(null);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAuthSession();
    if (session?.user?.role) {
      navigate(getHomePath(session.user.role), { replace: true });
    }
  }, [navigate]);

  const navItems = useMemo(
    () => [
      { label: home.nav.home, target: "accueil" },
      { label: home.nav.universities, target: "universites" },
      { label: home.nav.programs, target: "formations" },
      { label: home.nav.help, target: "aide" },
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowLoginMenu(false);
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isLoginSubmitting) return;
    setLoginError("");
    setIsLoginSubmitting(true);

    try {
      const session = await loginUser({
        email: email.trim(),
        password,
      });
      saveAuthSession(session);
      setShowLoginMenu(false);
      navigate(getHomePath(session.user.role));
    } catch (error) {
      if (error instanceof TypeError || error.message === "Failed to fetch") {
        setLoginError("Le service est temporairement indisponible. Réessayez dans un instant.");
      } else {
        setLoginError(error.message || t("home.loginMenu.invalidCredentials"));
      }
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const scrollToSection = useCallback((event, targetId) => {
    event.preventDefault();
    setShowMobileMenu(false);
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleOpenLogin = () => {
    setLoginError("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setShowLoginMenu((current) => !current);
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

          <nav className="campus-nav" aria-label="Navigation principale">
            {navItems.map((item, index) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                onClick={(event) => scrollToSection(event, item.target)}
                className={`campus-nav-link ${index === 0 ? "active" : ""}`.trim()}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="campus-header-actions">
            <LanguageSelector compact aria-label="Changer la langue" />

            <Link to="/register" className="campus-btn-header-cta">
              {home.hero.createAccount}
            </Link>

            <button
              type="button"
              className="campus-btn-hamburger"
              aria-label={showMobileMenu ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu((value) => !value)}
            >
              {showMobileMenu ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div className="campus-auth" ref={menuRef}>
              <button
                type="button"
                className="campus-btn-login"
                aria-expanded={showLoginMenu}
                aria-controls="campus-login-dropdown"
                onClick={handleOpenLogin}
              >
                <span>{home.loginButton}</span>
                <svg
                  className={`dropdown-icon ${showLoginMenu ? "rotated" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showLoginMenu ? (
                <div className="campus-dropdown" id="campus-login-dropdown" role="dialog" aria-label="Connexion">
                  <form onSubmit={handleLogin} noValidate>
                    <strong className="campus-dropdown-title">{home.loginMenu.submit}</strong>
                    <p className="campus-dropdown-helper">
                      Connectez-vous avec votre compte étudiant ou administrateur.
                    </p>

                    <div className="campus-form-group">
                      <label htmlFor="home-login-email">{t("common.email")}</label>
                      <input
                        id="home-login-email"
                        name="email"
                        type="email"
                        placeholder={messages.auth.login.emailPlaceholder}
                        value={email}
                        disabled={isLoginSubmitting}
                        autoComplete="email"
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setLoginError("");
                        }}
                        required
                      />
                    </div>

                    <div className="campus-form-group">
                      <label htmlFor="home-login-password">{t("common.password")}</label>
                      <div className="campus-input-password-wrap">
                        <input
                          id="home-login-password"
                          ref={passwordInputRef}
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          disabled={isLoginSubmitting}
                          autoComplete="current-password"
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setLoginError("");
                          }}
                          required
                        />
                        <button
                          type="button"
                          className="campus-btn-toggle-password"
                          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          onClick={() => {
                            setShowPassword((value) => !value);
                            passwordInputRef.current?.focus();
                          }}
                        >
                          {showPassword ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <a
                        href="#aide"
                        className="campus-forgot-password"
                        onClick={(event) => {
                          setShowLoginMenu(false);
                          scrollToSection(event, "aide");
                        }}
                      >
                        Mot de passe oublié ?
                      </a>
                    </div>

                    {loginError ? (
                      <p className="campus-dropdown-error" role="alert" aria-live="polite">
                        {loginError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      className="campus-btn-submit"
                      disabled={isLoginSubmitting}
                      aria-busy={isLoginSubmitting}
                    >
                      {isLoginSubmitting ? (
                        <span className="campus-btn-loading">
                          <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                          Connexion...
                        </span>
                      ) : (
                        home.loginMenu.submit
                      )}
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

        {showMobileMenu ? (
          <nav className="campus-mobile-menu" aria-label="Menu mobile">
            {navItems.map((item) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                onClick={(event) => scrollToSection(event, item.target)}
                className="campus-mobile-menu-link"
              >
                {item.label}
              </a>
            ))}
            <div className="campus-mobile-menu-actions">
              <Link to="/register" className="campus-btn-primary" onClick={() => setShowMobileMenu(false)}>
                {home.hero.createAccount}
              </Link>
              <button
                type="button"
                className="campus-btn-secondary"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLoginMenu(true);
                }}
              >
                {home.loginButton}
              </button>
            </div>
          </nav>
        ) : null}
      </header>

      <section id="accueil" className="campus-hero">
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
            <img src={campusImage} alt={home.hero.title} className="campus-hero-img" />
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

      <section id="universites" className="campus-universities">
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

      <section id="formations" className="campus-programs">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>{home.programs.title}</h2>
            <p>{home.programs.subtitle}</p>
          </div>
          <div className="campus-programs-grid">
            {home.programs.items.map((item) => (
              <div key={item.title} className="campus-program-card">
                <span className="program-level">{item.level}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
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

      <section id="aide" className="campus-faq">
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

      <section className="campus-footer-info">
        <div className="campus-section-container">
          <div className="campus-footer-info-grid">
            {home.footer.infoSections.map((item) => (
              <article key={item.id} id={item.id} className="campus-footer-info-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
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
              {home.footer.columns.map((column, columnIndex) => (
                <div key={column.title} className="footer-column">
                  <h4>{column.title}</h4>
                  {column.links.map((link, linkIndex) => {
                    const targetId = footerLinkTargets[columnIndex]?.[linkIndex] ?? "accueil";
                    return (
                      <a
                        key={link}
                        href={`#${targetId}`}
                        onClick={(event) => scrollToSection(event, targetId)}
                      >
                        {link}
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="campus-footer-bottom">
            <p>{home.footer.copyright}</p>
          </div>
        </div>
      </footer>

      {showScrollTop ? (
        <button
          type="button"
          className="campus-scroll-top"
          onClick={scrollToTop}
          aria-label="Retour en haut de la page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
