import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import campusImage from "../assets/Workshop preps first-year college students, parents for freshman year.jpg";
import { isValidAdminCredentials, registerAdminLogin } from "../utils/adminAccount";
import "../index.css";

export default function Home() {
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (isValidAdminCredentials(email, password)) {
      setShowLoginMenu(false);
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", email);
      registerAdminLogin(email);
      navigate("/admin");
    } else {
      alert("Email ou mot de passe incorrect");
    }
  };

  return (
    <div className="campus-landing">
      {/* Header with navigation */}
      <header className="campus-header">
        <div className="campus-header-container">
          <div className="campus-logo">
            <Link to="/">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">PFC Admissions</span>
            </Link>
          </div>
          
          <nav className="campus-nav">
            <Link to="/" className="campus-nav-link active">Accueil</Link>
            <Link to="/" className="campus-nav-link">Universités</Link>
            <Link to="/" className="campus-nav-link">Formations</Link>
            <Link to="/" className="campus-nav-link">Aide</Link>
          </nav>
          
          <div className="campus-auth" ref={menuRef}>
            <button 
              className="campus-btn-login"
              onClick={() => setShowLoginMenu(!showLoginMenu)}
            >
              <span>Connexion</span>
              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            
            {showLoginMenu && (
              <div className="campus-dropdown">
                <form onSubmit={handleLogin}>
                  <div className="campus-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="campus-form-group">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="campus-btn-submit">
                    Se connecter
                  </button>
                </form>
                <div className="campus-dropdown-footer">
                  <Link to="/register" onClick={() => setShowLoginMenu(false)}>
                    Créer un compte
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="campus-hero">
        <div className="campus-hero-bg"></div>
        <div className="campus-hero-container">
          <div className="campus-hero-content">
            <div className="campus-hero-badge">Platforme Nationale d'Admission</div>
            <h1 className="campus-hero-title">
              Votre parcours vers l'enseignement supérieur commence ici
            </h1>
            <p className="campus-hero-subtitle">
              Déposez votre candidature dans les meilleures universités 
              et suivez son évolution en temps réel.
            </p>
            <div className="campus-hero-actions">
              <Link to="/register" className="campus-btn-primary">
                <span>Créer mon compte</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/login" className="campus-btn-secondary">
                J&apos;ai déjà un compte
              </Link>
            </div>
            
            {/* Stats row */}
            <div className="campus-hero-stats">
              <div className="campus-hero-stat">
                <span className="stat-value">15,000+</span>
                <span className="stat-label">Étudiants</span>
              </div>
              <div className="campus-stat-divider"></div>
              <div className="campus-hero-stat">
                <span className="stat-value">50+</span>
                <span className="stat-label">Universités</span>
              </div>
              <div className="campus-stat-divider"></div>
              <div className="campus-hero-stat">
                <span className="stat-value">25,000+</span>
                <span className="stat-label">Candidatures</span>
              </div>
            </div>
          </div>
          
          <div className="campus-hero-visual">
            <img 
              src={campusImage} 
              alt="Campus étudiants" 
              className="campus-hero-img"
            />
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="campus-steps">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>Comment déposer ma candidature ?</h2>
            <p>4 étapes simples pour soumettre votre dossier</p>
          </div>
          
          <div className="campus-steps-grid">
            <div className="campus-step-card">
              <div className="campus-step-number">01</div>
              <div className="campus-step-content">
                <h3>Créer mon compte</h3>
                <p>Inscrivez-vous en quelques clics avec vos informations personnelles</p>
              </div>
            </div>
            
            <div className="campus-step-card">
              <div className="campus-step-number">02</div>
              <div className="campus-step-content">
                <h3>Remplir mon dossier</h3>
                <p>Complétez vos informations académiques et téléchargez vos documents</p>
              </div>
            </div>
            
            <div className="campus-step-card">
              <div className="campus-step-number">03</div>
              <div className="campus-step-content">
                <h3>Choisir mes formations</h3>
                <p>Sélectionnez jusqu&apos;à 3 universités et formations ciblées</p>
              </div>
            </div>
            
            <div className="campus-step-card">
              <div className="campus-step-number">04</div>
              <div className="campus-step-content">
                <h3>Suivre ma candidature</h3>
                <p>Consultez l'état d'avancement de votre dossier en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Universities Section */}
      <section className="campus-universities">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>Universités partenaires</h2>
            <p>Découvrez les établissements d'enseignement supérieur</p>
          </div>
          
          <div className="campus-universities-grid">
            <div className="campus-university-card">
              <div className="university-header">
                <span className="university-badge">Public</span>
              </div>
              <h3>Université d'Alger</h3>
              <p>La plus grande université du pays avec plus de 100 000 étudiants</p>
              <div className="university-stats">
                <span>150+ formations</span>
                <span>Alger</span>
              </div>
            </div>
            
            <div className="campus-university-card">
              <div className="university-header">
                <span className="university-badge">Public</span>
              </div>
              <h3>Université d'Oran</h3>
              <p>Excellence en sciences, techniques et médecine</p>
              <div className="university-stats">
                <span>120+ formations</span>
                <span>Oran</span>
              </div>
            </div>
            
            <div className="campus-university-card">
              <div className="university-header">
                <span className="university-badge">Public</span>
              </div>
              <h3>Université Constantine 3</h3>
              <p>Tradition académique reconnue depuis 1975</p>
              <div className="university-stats">
                <span>90+ formations</span>
                <span>Constantine</span>
              </div>
            </div>
            
            <div className="campus-university-card">
              <div className="university-header">
                <span className="university-badge">Public</span>
              </div>
              <h3>Université Annaba</h3>
              <p>Université moderne et innovante en sciences de l'ingénieur</p>
              <div className="university-stats">
                <span>80+ formations</span>
                <span>Annaba</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="campus-calendar">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>Calendrier d'admission</h2>
            <p>Les dates clés de la campagne d'admission 2026</p>
          </div>
          
          <div className="campus-timeline">
            <div className="timeline-phase">
              <div className="phase-marker phase-jan"></div>
              <div className="phase-content">
                <span className="phase-date">15 Janvier 2026</span>
                <h3>Ouverture des inscriptions</h3>
                <p>Début de la campagne de candidature</p>
              </div>
            </div>
            
            <div className="timeline-connector"></div>
            
            <div className="timeline-phase">
              <div className="phase-marker phase-mar"></div>
              <div className="phase-content">
                <span className="phase-date">30 Mars 2026</span>
                <h3>Date limite</h3>
                <p>Clôture des inscriptions</p>
              </div>
            </div>
            
            <div className="timeline-connector"></div>
            
            <div className="timeline-phase">
              <div className="phase-marker phase-avril"></div>
              <div className="phase-content">
                <span className="phase-date">Avril - Mai 2026</span>
                <h3>Traitement</h3>
                <p>Analyse des dossiers par les universités</p>
              </div>
            </div>
            
            <div className="timeline-connector"></div>
            
            <div className="timeline-phase">
              <div className="phase-marker phase-juin"></div>
              <div className="phase-content">
                <span className="phase-date">10 Juin 2026</span>
                <h3>Résultats</h3>
                <p>Publication des admissions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="campus-features">
        <div className="campus-section-container">
          <div className="campus-features-grid">
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3>Simple et rapide</h3>
              <p>Déposez votre dossier en 15 minutes depuis chez vous</p>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3>Sécurisé</h3>
              <p>Vos données personnelles sont cryptées et protégées</p>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3> Temps réel</h3>
              <p>Suivez l'évolution de votre candidature 24h/24</p>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3> Assistance</h3>
              <p>Une équipe disponible pour répondre à vos questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="campus-faq">
        <div className="campus-section-container">
          <div className="campus-section-header">
            <h2>Questions fréquentes</h2>
            <p>Tout ce que vous devez savoir</p>
          </div>
          
          <div className="campus-faq-grid">
            <div className="campus-faq-item">
              <h3>Comment créer un compte ?</h3>
              <p>Cliquez sur "Créer mon compte" et remplissez le formulaire avec vos informations personnelles. Vous recevrez un email de confirmation.</p>
            </div>
            
            <div className="campus-faq-item">
              <h3>Quels documents dois-je fournir ?</h3>
              <p>Vous aurez besoin de votre pièce d'identité, votre diplôme le plus élevé, vos relevés de notes et une photo d'identité récente.</p>
            </div>
            
            <div className="campus-faq-item">
              <h3>Combien de formations puis-je choisir ?</h3>
                <p>Vous pouvez sélectionner jusqu&apos;à 3 formations dans des universités différentes ou identiques.</p>
            </div>
            
            <div className="campus-faq-item">
              <h3>Comment suivre ma candidature ?</h3>
              <p>Connectez-vous à votre espace personnel pour voir le statut de votre dossier en temps réel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="campus-cta">
        <div className="campus-cta-container">
          <h2>Prêt à commencer votre parcours ?</h2>
          <p>Créez votre compte dès maintenant et déposez votre candidature</p>
          <Link to="/register" className="campus-btn-primary campus-btn-large">
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="campus-footer">
        <div className="campus-footer-container">
          <div className="campus-footer-top">
            <div className="campus-footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🎓</span>
                <span className="logo-text">PFC Admissions</span>
              </div>
              <p>La plateforme nationale d'admission à l'enseignement supérieur</p>
            </div>
            
            <div className="campus-footer-links">
              <div className="footer-column">
                <h4>Plateforme</h4>
                <a href="/">Accueil</a>
                <a href="/">Universités</a>
                <a href="/">Formations</a>
              </div>
              
              <div className="footer-column">
                <h4>Aide</h4>
                <a href="/">FAQ</a>
                <a href="/">Contact</a>
                <a href="/">Support</a>
              </div>
              
              <div className="footer-column">
                <h4>Légal</h4>
                <a href="/">Mentions légales</a>
                <a href="/">Confidentialité</a>
                <a href="/">CGU</a>
              </div>
            </div>
          </div>
          
          <div className="campus-footer-bottom">
            <p>© 2026 PFC Admissions - Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

