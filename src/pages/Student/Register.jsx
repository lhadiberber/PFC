import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmissions } from "../../context/AdmissionsContext";
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
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};

    if (!formData.nom.trim()) nextErrors.nom = "Le nom est obligatoire.";
    if (!formData.prenom.trim()) nextErrors.prenom = "Le prenom est obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Veuillez saisir une adresse e-mail valide.";
    }
    if (!/^\+?[\d\s]{10,}$/.test(formData.telephone)) {
      nextErrors.telephone = "Veuillez saisir un numero de telephone valide.";
    }
    if (formData.password.length < 6) {
      nextErrors.password = "Le mot de passe doit contenir au moins 6 caracteres.";
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "La confirmation du mot de passe ne correspond pas.";
    }
    if (!agreeLegal) {
      nextErrors.legal = "Vous devez accepter les conditions d'utilisation.";
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
        <Link to="/" className="auth-register-brand">
          <span className="auth-register-brand-mark">PFC</span>
          <span className="auth-register-brand-text">Admissions</span>
        </Link>

        <div className="auth-register-card">
          <aside className="auth-register-intro">
            <span className="auth-register-kicker">Plateforme d'admission universitaire</span>
            <h1>Un espace clair et securise pour preparer votre candidature.</h1>
            <p>
              Creez votre compte pour completer votre profil, centraliser vos documents et
              suivre vos demarches dans un parcours simple et rassurant.
            </p>

            <div className="auth-register-highlights">
              <div className="auth-register-highlight">
                <strong>Depot en ligne</strong>
                <span>Constituez votre dossier depuis un espace unique.</span>
              </div>
              <div className="auth-register-highlight">
                <strong>Suivi centralise</strong>
                <span>Retrouvez vos candidatures et vos pieces en temps reel.</span>
              </div>
              <div className="auth-register-highlight">
                <strong>Plateforme securisee</strong>
                <span>Vos informations restent associees a votre compte personnel.</span>
              </div>
            </div>
          </aside>

          <section className="auth-register-main">
            <div className="auth-register-header">
              <span className="auth-register-badge">Inscription</span>
              <h2>Creer un compte</h2>
              <p>Inscrivez-vous pour candidater</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-register-form">
              <div className="auth-register-grid">
                <label className="auth-register-field">
                  <span>Nom</span>
                  <input
                    type="text"
                    name="nom"
                    placeholder="Votre nom"
                    value={formData.nom}
                    onChange={handleChange}
                  />
                  {errors.nom ? <small className="error-message">{errors.nom}</small> : null}
                </label>

                <label className="auth-register-field">
                  <span>Prenom</span>
                  <input
                    type="text"
                    name="prenom"
                    placeholder="Votre prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                  />
                  {errors.prenom ? (
                    <small className="error-message">{errors.prenom}</small>
                  ) : null}
                </label>

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
                  <span>Telephone</span>
                  <input
                    type="tel"
                    name="telephone"
                    placeholder="+213 555 123 456"
                    value={formData.telephone}
                    onChange={handleChange}
                  />
                  {errors.telephone ? (
                    <small className="error-message">{errors.telephone}</small>
                  ) : null}
                </label>

                <label className="auth-register-field">
                  <span>Mot de passe</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Minimum 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password ? (
                    <small className="error-message">{errors.password}</small>
                  ) : null}
                </label>

                <label className="auth-register-field">
                  <span>Confirmation du mot de passe</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmer le mot de passe"
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
                  J'accepte les{" "}
                  <a href="#conditions" onClick={(event) => event.preventDefault()}>
                    conditions d'utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="#confidentialite" onClick={(event) => event.preventDefault()}>
                    politique de confidentialite
                  </a>
                  .
                </span>
              </label>
              {errors.legal ? <small className="error-message">{errors.legal}</small> : null}

              <button type="submit" className="auth-register-submit">
                Creer mon compte
              </button>
            </form>

            <div className="auth-register-footer">
              <p>
                Deja un compte ? <Link to="/login">Se connecter</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
