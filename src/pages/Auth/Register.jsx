import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "../../components/LanguageSelector";
import { useAdmissions } from "../../context/AdmissionsContext";
import { useLanguage } from "../../context/LanguageContext";
import { registerStudentAccount } from "../../utils/studentAccount";
import "../../index.css";

const INITIAL_FORM = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [agreeLegal, setAgreeLegal] = useState(false);
  const { saveProfile } = useAdmissions();
  const { messages } = useLanguage();
  const copy = messages.auth.register;
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};

    if (!formData.nom.trim()) nextErrors.nom = copy.errors.nomRequired;
    if (!formData.prenom.trim()) nextErrors.prenom = copy.errors.prenomRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = copy.errors.invalidEmail;
    }
    if (!/^\+?[\d\s]{10,}$/.test(formData.telephone)) {
      nextErrors.telephone = copy.errors.invalidPhone;
    }
    if (formData.password.length < 6) {
      nextErrors.password = copy.errors.shortPassword;
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = copy.errors.passwordMismatch;
    }
    if (!agreeLegal) {
      nextErrors.legal = copy.errors.legalRequired;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

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

  const handleLegalChange = (event) => {
    setAgreeLegal(event.target.checked);

    if (errors.legal) {
      setErrors((current) => ({
        ...current,
        legal: "",
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const nextStudentProfile = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      dateNaiss: "",
      lieuNaiss: "",
      sexe: "",
      nationalite: "",
      email: formData.email.trim(),
      telephone: formData.telephone.trim(),
      pays: "",
      adresse: "",
    };

    localStorage.setItem("userRole", "student");
    localStorage.setItem("userEmail", formData.email.trim());
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: formData.email.trim(),
        firstName: formData.prenom.trim(),
        lastName: formData.nom.trim(),
        phone: formData.telephone.trim(),
        role: "student",
      })
    );
    saveProfile(nextStudentProfile);
    registerStudentAccount({
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.prenom.trim(),
      lastName: formData.nom.trim(),
    });

    navigate("/profil");
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
                <label className="auth-register-field">
                  <span>{copy.fields.nom}</span>
                  <input
                    type="text"
                    name="nom"
                    placeholder={copy.placeholders.nom}
                    value={formData.nom}
                    onChange={handleChange}
                  />
                  {errors.nom ? <small className="error-message">{errors.nom}</small> : null}
                </label>

                <label className="auth-register-field">
                  <span>{copy.fields.prenom}</span>
                  <input
                    type="text"
                    name="prenom"
                    placeholder={copy.placeholders.prenom}
                    value={formData.prenom}
                    onChange={handleChange}
                  />
                  {errors.prenom ? (
                    <small className="error-message">{errors.prenom}</small>
                  ) : null}
                </label>

                <label className="auth-register-field auth-register-field-full">
                  <span>{copy.fields.email}</span>
                  <input
                    type="email"
                    name="email"
                    placeholder={copy.placeholders.email}
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email ? <small className="error-message">{errors.email}</small> : null}
                </label>

                <label className="auth-register-field auth-register-field-full">
                  <span>{copy.fields.telephone}</span>
                  <input
                    type="tel"
                    name="telephone"
                    placeholder={copy.placeholders.telephone}
                    value={formData.telephone}
                    onChange={handleChange}
                  />
                  {errors.telephone ? (
                    <small className="error-message">{errors.telephone}</small>
                  ) : null}
                </label>

                <label className="auth-register-field">
                  <span>{copy.fields.password}</span>
                  <input
                    type="password"
                    name="password"
                    placeholder={copy.placeholders.password}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password ? (
                    <small className="error-message">{errors.password}</small>
                  ) : null}
                </label>

                <label className="auth-register-field">
                  <span>{copy.fields.confirmPassword}</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder={copy.placeholders.confirmPassword}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword ? (
                    <small className="error-message">{errors.confirmPassword}</small>
                  ) : null}
                </label>
              </div>

              <label className="auth-register-legal">
                <input type="checkbox" checked={agreeLegal} onChange={handleLegalChange} />
                <span>
                  {copy.legal.beforeTerms}
                  <a href="#conditions" onClick={(event) => event.preventDefault()}>
                    {copy.legal.terms}
                  </a>
                  {copy.legal.between}
                  <a href="#confidentialite" onClick={(event) => event.preventDefault()}>
                    {copy.legal.privacy}
                  </a>
                  {copy.legal.afterPrivacy}
                </span>
              </label>
              {errors.legal ? <small className="error-message">{errors.legal}</small> : null}

              <button type="submit" className="auth-register-submit">
                {copy.submit}
              </button>
            </form>

            <div className="auth-register-footer">
              <p>
                {copy.footerText} <Link to="/login">{copy.footerLink}</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
