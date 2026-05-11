import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "../../components/LanguageSelector";
import { useLanguage } from "../../context/LanguageContext";
import { isStudentProfileComplete } from "../../context/AdmissionsContext";
import { isValidAdminCredentials, registerAdminLogin } from "../../utils/adminAccount";
import { isValidStudentCredentials, registerStudentLogin } from "../../utils/studentAccount";
import "../../index.css";

export default function Login() {
  const navigate = useNavigate();
  const { messages } = useLanguage();
  const copy = messages.auth.login;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (isValidAdminCredentials(formData.email, formData.password)) {
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", formData.email.trim());
      registerAdminLogin(formData.email.trim());
      navigate("/admin");
      return;
    }

    const savedProfile = localStorage.getItem("studentProfile");
    if (savedProfile && !isValidStudentCredentials(formData.email, formData.password)) {
      setErrors({
        password: copy.errors.invalidStudentCredentials,
      });
      return;
    }

    let parsedProfile = {};
    try {
      parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
    } catch (_error) {
      parsedProfile = {};
    }

    localStorage.setItem("userRole", "student");
    localStorage.setItem("userEmail", formData.email.trim());
    registerStudentLogin(formData.email.trim());
    navigate(isStudentProfileComplete(parsedProfile) ? "/dashboard" : "/profil");
  };

  return (
    <div className="auth-page auth-register-page">
      <div className="auth-register-shell">
        <div className="auth-register-topbar">
          <Link to="/" className="auth-register-brand">
            <span className="auth-register-brand-mark">PFC</span>
            <span className="auth-register-brand-text">{messages.common.brand}</span>
          </Link>
          <LanguageSelector />
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

            <form onSubmit={handleSubmit} className="auth-register-form">
              <div className="auth-register-grid">
                <label className="auth-register-field auth-register-field-full">
                  <span>{messages.common.email}</span>
                  <input
                    type="email"
                    name="email"
                    placeholder={copy.emailPlaceholder}
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email ? <small className="error-message">{errors.email}</small> : null}
                </label>

                <label className="auth-register-field auth-register-field-full">
                  <span>{messages.common.password}</span>
                  <input
                    type="password"
                    name="password"
                    placeholder={copy.passwordPlaceholder}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password ? (
                    <small className="error-message">{errors.password}</small>
                  ) : null}
                </label>
              </div>

              <button type="submit" className="auth-register-submit">
                {copy.submit}
              </button>
            </form>

            <div className="auth-register-footer">
              <p>
                {copy.footerText} <Link to="/register">{copy.footerLink}</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
