import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isValidAdminCredentials, registerAdminLogin } from "../../utils/adminAccount";
import { isValidStudentCredentials, registerStudentLogin } from "../../utils/studentAccount";
import "../../index.css";

export default function Login() {
  const navigate = useNavigate();
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
      nextErrors.email = "L'adresse e-mail est requise.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Veuillez saisir une adresse e-mail valide.";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Le mot de passe est requis.";
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
        password: "Les identifiants etudiant saisis sont incorrects.",
      });
      return;
    }

    localStorage.setItem("userRole", "student");
    localStorage.setItem("userEmail", formData.email.trim());
    registerStudentLogin(formData.email.trim());
    navigate(savedProfile ? "/dashboard" : "/profil");
  };

  return (
    <div className="auth-page auth-register-page">
      <div className="auth-register-shell">
        <Link to="/" className="auth-register-brand">
          <span className="auth-register-brand-mark">PFC</span>
          <span className="auth-register-brand-text">Admissions</span>
        </Link>

        <div className="auth-register-card">
          <aside className="auth-register-intro">
            <span className="auth-register-kicker">Acces a votre espace personnel</span>
            <h1>Retrouvez votre compte pour suivre vos candidatures en toute simplicite.</h1>
            <p>
              Connectez-vous pour completer votre dossier, consulter l'etat de vos demarches
              et acceder a votre espace d'admission depuis une interface claire et securisee.
            </p>

            <div className="auth-register-highlights">
              <div className="auth-register-highlight">
                <strong>Acces rapide</strong>
                <span>Retrouvez vos informations et votre progression en quelques secondes.</span>
              </div>
              <div className="auth-register-highlight">
                <strong>Suivi de candidature</strong>
                <span>Consultez vos depots, vos etapes et vos decisions depuis un seul espace.</span>
              </div>
              <div className="auth-register-highlight">
                <strong>Connexion securisee</strong>
                <span>Votre compte reste associe a vos informations et a vos documents.</span>
              </div>
            </div>
          </aside>

          <section className="auth-register-main">
            <div className="auth-register-header">
              <span className="auth-register-badge">Connexion</span>
              <h2>Se connecter</h2>
              <p>Accedez a votre espace personnel et suivez vos demarches</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-register-form">
              <div className="auth-register-grid">
                <label className="auth-register-field auth-register-field-full">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="votre.email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email ? <small className="error-message">{errors.email}</small> : null}
                </label>

                <label className="auth-register-field auth-register-field-full">
                  <span>Mot de passe</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Saisissez votre mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password ? (
                    <small className="error-message">{errors.password}</small>
                  ) : null}
                </label>
              </div>

              <button type="submit" className="auth-register-submit">
                Se connecter
              </button>
            </form>

            <div className="auth-register-footer">
              <p>
                Pas encore de compte ? <Link to="/register">Creer un compte</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
