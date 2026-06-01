import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "../../components/LanguageSelector";
import { useLanguage } from "../../context/LanguageContext";
import { registerStudent } from "../../services/authService";
import "../../index.css";

const INITIAL_FORM = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  password: "",
  confirmPassword: "",
};

function Spinner() {
  return (
    <svg
      className="login-spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: "Très faible", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Faible", color: "#f97316" };
  if (score === 3) return { score: 3, label: "Moyen", color: "#eab308" };
  if (score === 4) return { score: 4, label: "Fort", color: "#22c55e" };
  return { score: 5, label: "Très fort", color: "#16a34a" };
}

function validateForm(formData, agreeLegal, copy) {
  const errors = {};

  if (!formData.nom.trim()) errors.nom = copy.errors.nomRequired;
  if (!formData.prenom.trim()) errors.prenom = copy.errors.prenomRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = copy.errors.invalidEmail;
  }
  if (!/^\+?[\d\s]{10,}$/.test(formData.telephone)) {
    errors.telephone = copy.errors.invalidPhone;
  }
  if (formData.password.length < 8) {
    errors.password = copy.errors.shortPassword;
  }
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = copy.errors.passwordMismatch;
  }
  if (!agreeLegal) {
    errors.legal = copy.errors.legalRequired;
  }

  return errors;
}

function getFormProgress(formData, agreeLegal) {
  const checks = [
    formData.nom.trim().length > 0,
    formData.prenom.trim().length > 0,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    /^\+?[\d\s]{10,}$/.test(formData.telephone),
    formData.password.length >= 8,
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
    agreeLegal,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export default function Register() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreeLegal, setAgreeLegal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { messages } = useLanguage();
  const copy = messages.auth.register;
  const navigate = useNavigate();
  const nomRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    nomRef.current?.focus();
  }, []);

  const passwordStrength = getPasswordStrength(formData.password);
  const progress = getFormProgress(formData, agreeLegal);
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
    if (formError) setFormError("");
  };

  const handleLegalChange = (event) => {
    setAgreeLegal(event.target.checked);
    if (errors.legal) setErrors((current) => ({ ...current, legal: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateForm(formData, agreeLegal, copy);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      if (validationErrors.nom) nomRef.current?.focus();
      else if (validationErrors.password) passwordRef.current?.focus();
      else if (validationErrors.confirmPassword) confirmRef.current?.focus();

      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await registerStudent({
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        password: formData.password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login", { state: { message: copy.successMessage } });
      }, 800);
    } catch (error) {
      if (error.status === 409) {
        setFormError(copy.errors.emailUsed);
      } else if (error.status === 429) {
        setFormError(copy.errors.tooManyAttempts);
      } else if (!error.status) {
        setFormError(copy.errors.backendUnavailable);
      } else {
        setFormError(error.message || copy.errors.createFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-register-page">
      <div className="auth-register-shell">
        <div className="auth-register-topbar">
          <Link to="/" className="auth-register-brand">
            <span className="auth-register-brand-mark">PFC</span>
            <span className="auth-register-brand-text">{messages.common.brand}</span>
          </Link>
          <LanguageSelector aria-label="Changer la langue" />
        </div>

        <div className="auth-register-card">
          <aside className="auth-register-intro">
            <span className="auth-register-kicker">{copy.introKicker}</span>
            <h1>{copy.introTitle}</h1>
            <p>{copy.introDescription}</p>

            <div className="auth-register-highlights">
              {copy.highlights.map((item) => (
                <div key={item.title} className="auth-register-highlight">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="auth-register-main">
            <div className="auth-register-header">
              <span className="auth-register-badge">{copy.badge}</span>
              <h2>{copy.title}</h2>
              <p>{copy.subtitle}</p>
            </div>

            <div className="register-progress-wrap" aria-label={`Formulaire complété à ${progress}%`}>
              <div className="register-progress-header">
                <span className="register-progress-label">Progression du formulaire</span>
                <span className="register-progress-pct">{progress}%</span>
              </div>
              <div className="register-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="register-progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100 ? "#22c55e" : "var(--ui-primary)",
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="auth-register-form" noValidate>
              {isSuccess ? (
                <div className="auth-feedback auth-feedback-success" role="status" aria-live="polite">
                  Compte créé avec succès. Redirection en cours...
                </div>
              ) : null}

              {formError ? (
                <div className="auth-feedback auth-feedback-error" role="alert" aria-live="assertive">
                  {formError}
                </div>
              ) : null}

              <p className="auth-register-helper">{copy.helper}</p>

              <div className="auth-register-section">
                <h3>{copy.sections.personal}</h3>
                <div className="auth-register-grid">
                  <label className="auth-register-field" htmlFor="register-nom">
                    <span>{copy.fields.nom}</span>
                    <input
                      id="register-nom"
                      ref={nomRef}
                      type="text"
                      name="nom"
                      placeholder={copy.placeholders.nom}
                      value={formData.nom}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="family-name"
                      aria-invalid={Boolean(errors.nom)}
                      aria-describedby={errors.nom ? "nom-error" : undefined}
                    />
                    {errors.nom ? (
                      <small id="nom-error" className="error-message" role="alert">
                        {errors.nom}
                      </small>
                    ) : null}
                  </label>

                  <label className="auth-register-field" htmlFor="register-prenom">
                    <span>{copy.fields.prenom}</span>
                    <input
                      id="register-prenom"
                      type="text"
                      name="prenom"
                      placeholder={copy.placeholders.prenom}
                      value={formData.prenom}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="given-name"
                      aria-invalid={Boolean(errors.prenom)}
                      aria-describedby={errors.prenom ? "prenom-error" : undefined}
                    />
                    {errors.prenom ? (
                      <small id="prenom-error" className="error-message" role="alert">
                        {errors.prenom}
                      </small>
                    ) : null}
                  </label>

                  <label className="auth-register-field auth-register-field-full" htmlFor="register-telephone">
                    <span>{copy.fields.telephone}</span>
                    <input
                      id="register-telephone"
                      type="tel"
                      name="telephone"
                      placeholder={copy.placeholders.telephone}
                      value={formData.telephone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.telephone)}
                      aria-describedby={errors.telephone ? "telephone-error" : undefined}
                    />
                    {errors.telephone ? (
                      <small id="telephone-error" className="error-message" role="alert">
                        {errors.telephone}
                      </small>
                    ) : null}
                  </label>
                </div>
              </div>

              <div className="auth-register-section">
                <h3>{copy.sections.login}</h3>
                <div className="auth-register-grid">
                  <label className="auth-register-field auth-register-field-full" htmlFor="register-email">
                    <span>{copy.fields.email}</span>
                    <input
                      id="register-email"
                      type="email"
                      name="email"
                      placeholder={copy.placeholders.email}
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email ? (
                      <small id="email-error" className="error-message" role="alert">
                        {errors.email}
                      </small>
                    ) : null}
                  </label>

                  <label className="auth-register-field" htmlFor="register-password">
                    <span>{copy.fields.password}</span>
                    <div className="login-password-wrap">
                      <input
                        id="register-password"
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder={copy.placeholders.password}
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby="password-strength"
                      />
                      <button
                        type="button"
                        className="login-toggle-password"
                        onClick={() => {
                          setShowPassword((value) => !value);
                          passwordRef.current?.focus();
                        }}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>

                    {formData.password.length > 0 ? (
                      <div className="register-strength-wrap" id="password-strength" aria-live="polite">
                        <div className="register-strength-bar">
                          {[1, 2, 3, 4, 5].map((item) => (
                            <div
                              key={item}
                              className="register-strength-segment"
                              style={{
                                background: item <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "var(--ui-border)",
                              }}
                            />
                          ))}
                        </div>
                        <span className="register-strength-label" style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    ) : null}

                    {errors.password ? (
                      <small className="error-message" role="alert">
                        {errors.password}
                      </small>
                    ) : null}
                  </label>

                  <label className="auth-register-field" htmlFor="register-confirm-password">
                    <span>{copy.fields.confirmPassword}</span>
                    <div className="login-password-wrap">
                      <input
                        id="register-confirm-password"
                        ref={confirmRef}
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        placeholder={copy.placeholders.confirmPassword}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirmPassword)}
                      />
                      <button
                        type="button"
                        className="login-toggle-password"
                        onClick={() => {
                          setShowConfirm((value) => !value);
                          confirmRef.current?.focus();
                        }}
                        aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showConfirm ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>

                    {formData.confirmPassword.length > 0 ? (
                      <div
                        className={`register-match-indicator ${passwordsMatch ? "is-valid" : "is-invalid"}`}
                        aria-live="polite"
                      >
                        {passwordsMatch
                          ? "Les mots de passe correspondent."
                          : "Les mots de passe ne correspondent pas."}
                      </div>
                    ) : null}

                    {errors.confirmPassword ? (
                      <small className="error-message" role="alert">
                        {errors.confirmPassword}
                      </small>
                    ) : null}
                  </label>
                </div>
              </div>

              <label className="auth-register-legal">
                <input
                  type="checkbox"
                  checked={agreeLegal}
                  onChange={handleLegalChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.legal)}
                />
                <span>
                  {copy.legal.beforeTerms}
                  <a href="/#cgu" target="_blank" rel="noopener noreferrer">
                    {copy.legal.terms}
                  </a>
                  {copy.legal.between}
                  <a href="/#confidentialite" target="_blank" rel="noopener noreferrer">
                    {copy.legal.privacy}
                  </a>
                  {copy.legal.afterPrivacy}
                </span>
              </label>
              {errors.legal ? (
                <small className="error-message" role="alert">
                  {errors.legal}
                </small>
              ) : null}

              <button
                type="submit"
                className="auth-register-submit"
                disabled={isSubmitting || isSuccess}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="login-btn-inner">
                    <Spinner />
                    Création du compte...
                  </span>
                ) : isSuccess ? (
                  <span className="login-btn-inner">Compte créé.</span>
                ) : (
                  copy.submit
                )}
              </button>
            </form>

            <div className="auth-register-footer">
              <p>
                {copy.footerText}{" "}
                <Link to="/login">{copy.footerLink}</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
