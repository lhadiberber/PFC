import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "../../components/LanguageSelector";
import { useLanguage } from "../../context/LanguageContext";
import { isStudentProfileComplete } from "../../context/AdmissionsContext";
import {
  getApiErrorMessage,
  getAuthSession,
  loginUser,
  saveAuthSession,
} from "../../services/authService";
import "../../index.css";

const ADMIN_ROLES = ["admin", "super_admin"];

function getHomePath(role) {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { messages } = useLanguage();
  const copy = messages.auth.login;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState(location.state?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session) return;

    const role = session.user?.role ?? session.role;
    if (role) navigate(getHomePath(role), { replace: true });
  }, [navigate]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (formError) setFormError("");
    if (statusMessage) setStatusMessage("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = copy.errors.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = copy.errors.invalidEmail;
    }

    if (!formData.password.trim()) {
      nextErrors.password = copy.errors.passwordRequired;
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.email) emailRef.current?.focus();
      else if (validationErrors.password) passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setStatusMessage("");

    try {
      const session = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      saveAuthSession(session);

      const role = session.user?.role ?? session.role;

      if (ADMIN_ROLES.includes(role)) {
        navigate(getHomePath(role));
        return;
      }

      const destination = resolveStudentDestination(session);
      navigate(destination);
    } catch (error) {
      setFormError(getApiErrorMessage(error, copy.errors.invalidStudentCredentials));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-register-page">
      <div className="auth-register-shell">
        <div className="auth-register-topbar">
          <Link to="/" className="auth-register-brand">
            <span className="auth-register-brand-mark">UP</span>
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

            <form onSubmit={handleSubmit} className="auth-register-form" noValidate>
              {statusMessage ? (
                <div className="auth-feedback auth-feedback-success" role="status" aria-live="polite">
                  {statusMessage}
                </div>
              ) : null}

              {formError ? (
                <div className="auth-feedback auth-feedback-error" role="alert" aria-live="assertive">
                  {formError}
                </div>
              ) : null}

              <div className="auth-register-grid">
                <label
                  className="auth-register-field auth-register-field-full"
                  htmlFor="login-email"
                >
                  <span>{messages.common.email}</span>
                  <input
                    id="login-email"
                    ref={emailRef}
                    type="email"
                    name="email"
                    placeholder={copy.emailPlaceholder}
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

                <label
                  className="auth-register-field auth-register-field-full"
                  htmlFor="login-password"
                >
                  <span>{messages.common.password}</span>

                  <div className="login-password-wrap">
                    <input
                      id="login-password"
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={copy.passwordPlaceholder}
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
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

                  {errors.password ? (
                    <small id="password-error" className="error-message" role="alert">
                      {errors.password}
                    </small>
                  ) : null}

                  <Link to="/forgot-password" className="login-forgot-link">
                    Mot de passe oublié ?
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                className="auth-register-submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="login-btn-inner">
                    <Spinner />
                    Connexion en cours...
                  </span>
                ) : (
                  copy.submit
                )}
              </button>
            </form>

            <div className="auth-register-footer">
              <p>
                {copy.footerText}{" "}
                <Link to="/register">{copy.footerLink}</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function resolveStudentDestination(session) {
  try {
    const savedProfile = localStorage.getItem("studentProfile");
    const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
    const savedEmail = String(parsedProfile.email || "").trim().toLowerCase();
    const sessionEmail = String(session.user?.email || "").trim().toLowerCase();
    const profileMatchesUser = savedEmail && sessionEmail && savedEmail === sessionEmail;

    if (profileMatchesUser && isStudentProfileComplete(parsedProfile)) {
      return "/dashboard";
    }
  } catch (_error) {
    return "/profil";
  }

  return "/profil";
}
