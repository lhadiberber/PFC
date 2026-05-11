import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../index.css";

// Mock data for admin dashboard
const mockCandidatures = [
  {
    id: 1,
    nom: "Amine B.",
    universite: "Université d'Alger 1",
    specialite: "Informatique",
    date: "2026-03-08",
    statut: "En attente",
  },
  {
    id: 2,
    nom: "Sarah M.",
    universite: "Université de Constantine 1",
    specialite: "Mathématiques",
    date: "2026-03-07",
    statut: "Acceptée",
  },
  {
    id: 3,
    nom: "Mohamed K.",
    universite: "École Nationale Polytechnique",
    specialite: "Physique",
    date: "2026-03-07",
    statut: "En attente",
  },
  {
    id: 4,
    nom: "Fatima Z.",
    universite: "Université d'Oran",
    specialite: "Chimie",
    date: "2026-03-06",
    statut: "Refusée",
  },
  {
    id: 5,
    nom: "Youssef A.",
    universite: "Université de Tunis",
    specialite: "Biologie",
    date: "2026-03-06",
    statut: "Acceptée",
  },
];

const recentCandidatures = [...mockCandidatures]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 6);

// Get current date
const today = new Date();
const formattedDate = today.toLocaleDateString("fr-FR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("tous"); // 'tous' | 'attente' | 'acceptee' | 'refusee'
  const [darkMode, setDarkMode] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  // Calculate statistics
  const totalCandidatures = 125;
  const enAttente = 34;
  const acceptees = 56;
  const refusees = 35;
  const totalEtudiants = 82;
  const dossiersIncomplets = 12;
  const candidaturesNonTraitees = 8;
  const documentsManquants = 5;

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const normalize = (s) => (s || "").toString().toLowerCase();
  const matchesSearch = (c) => {
    const q = normalize(debouncedQuery || searchQuery);
    if (!q) return true;
    return [c.nom, c.universite, c.specialite].some((v) => normalize(v).includes(q));
  };
  const matchesStatus = (c) => {
    if (filterStatus === "tous") return true;
    if (filterStatus === "attente") return c.statut === "En attente";
    if (filterStatus === "acceptee") return c.statut === "Acceptée";
    if (filterStatus === "refusee") return c.statut === "Refusée";
    return true;
  };

  const displayedCandidatures = recentCandidatures.filter(
    (c) => matchesSearch(c) && matchesStatus(c)
  );

  const baseList = recentCandidatures.filter(matchesSearch);
  const counts = {
    tous: baseList.length,
    attente: baseList.filter((c) => c.statut === "En attente").length,
    acceptee: baseList.filter((c) => c.statut === "Acceptée").length,
    refusee: baseList.filter((c) => c.statut === "Refusée").length,
  };

  const getProgress = (c) => {
    switch (c.statut) {
      case "En attente":
        return { profil: 80, documents: 60, finale: 40 };
      case "Acceptée":
        return { profil: 100, documents: 100, finale: 100 };
      case "Refusée":
        return { profil: 100, documents: 100, finale: 100 };
      default:
        return { profil: 50, documents: 30, finale: 0 };
    }
  };

  const byUniversite = mockCandidatures.reduce((acc, cur) => {
    acc[cur.universite] = (acc[cur.universite] || 0) + 1;
    return acc;
  }, {});
  const totalChart = Object.values(byUniversite).reduce((a, b) => a + b, 0) || 1;

  const recentActivity = [
    "Amine B. a soumis une candidature",
    "Sarah M. a été acceptée",
    "Mohamed K. a ajouté un document",
    "Fatima Z. a été refusée",
  ];

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate(`/admin/candidatures?query=${encodeURIComponent(debouncedQuery || searchQuery)}`);
    }
  };

  const handleLogout = () => {
    // Clear all localStorage items for complete logout
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("studentProfile");
    localStorage.removeItem("user");
    localStorage.removeItem("studentDocuments");
    navigate("/");
  };


  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case "En attente":
        return "statut-attente";
      case "Acceptée":
        return "statut-acceptee";
      case "Refusée":
        return "statut-rejetee";
      default:
        return "";
    }
  };

  const menuItems = [
    { id: "dashboard", label: "dashboard", icon: "📊", path: "/admin" },
    { id: "candidature", label: `candidatures (${enAttente})`, icon: "📋", path: "/admin/candidatures" },
    { id: "etudiants", label: `étudiants (${totalEtudiants})`, icon: "👥", path: "/admin/etudiants" },
    { id: "documents", label: `documents (${documentsManquants})`, icon: "📁", path: "/admin/documents" },
    { id: "profil", label: "profil", icon: "👤", path: "/admin/profil" },
    { id: "deconnexion", label: "deconexion", icon: "🚪", path: "/" },
  ];


  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-logo">PFC Admin</h2>
        </div>
        
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            item.id === "deconnexion" ? (
              <button
                key={item.id}
                className="admin-nav-item admin-logout-btn"
                onClick={handleLogout}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label">{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.id}
                to={item.path}
                className={`admin-nav-item ${activeMenu === item.id ? "active" : ""}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label">{item.label}</span>
              </Link>
            )
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-content">
            <h1>Tableau de bord administrateur</h1>
            <p>Suivi et gestion des candidatures d&apos;admission</p>

            <div className="admin-search">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Rechercher un étudiant, une candidature..."
                className="admin-search-input"
              />
            </div>
          </div>
          <div className="admin-header-right">
            <button className="admin-theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "🌙" : "☀️"}
            </button>
            <div className="admin-user">
              <span className="admin-user-icon">👤</span>
              <span>Bonjour, Administrateur</span>
            </div>
            <span className="admin-date">{formattedDate}</span>
            <div
              className="admin-notification"
              ref={notifRef}
              onClick={() => setShowNotif((s) => !s)}
              title="Notifications"
            >
              <span className="admin-notification-icon">🔔</span>
              <span className="admin-notification-badge">3</span>
              {showNotif && (
                <div className="admin-notif-dropdown">
                  <div className="notif-item">3 nouvelles candidatures</div>
                  <div className="notif-item">2 dossiers incomplets</div>
                  <button
                    className="notif-link"
                    onClick={() => {
                      setShowNotif(false);
                      navigate("/admin/candidatures");
                    }}
                  >
                    Voir tout →
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Statistics Cards */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Statistiques des candidatures</h2>
            <p>Vue d'ensemble des candidatures et des étudiants</p>
          </div>
          
          <div className="admin-stats campus-steps-grid">
            <div className="campus-step-card admin-stat-total">
              <div className="campus-step-number">📊</div>
              <div className="campus-step-content">
                <h3>{totalCandidatures}</h3>
                <p>Total candidatures</p>
              </div>
            </div>
            
            <div className="campus-step-card admin-stat-attente">
              <div className="campus-step-number">⏳</div>
              <div className="campus-step-content">
                <h3>{enAttente}</h3>
                <p>En attente</p>
              </div>
            </div>
            
            <div className="campus-step-card admin-stat-acceptee">
              <div className="campus-step-number">✅</div>
              <div className="campus-step-content">
                <h3>{acceptees}</h3>
                <p>Acceptées</p>
              </div>
            </div>
            
            <div className="campus-step-card admin-stat-refusee">
              <div className="campus-step-number">❌</div>
              <div className="campus-step-content">
                <h3>{refusees}</h3>
                <p>Refusées</p>
              </div>
            </div>
            
            <div className="campus-step-card admin-stat-etudiants">
              <div className="campus-step-number">👥</div>
              <div className="campus-step-content">
                <h3>{totalEtudiants}</h3>
                <p>Étudiants inscrits</p>
              </div>
            </div>
            
            <div className="campus-step-card admin-stat-incomplets">
              <div className="campus-step-number">⚠️</div>
              <div className="campus-step-content">
                <h3>{dossiersIncomplets}</h3>
                <p>Dossiers incomplets</p>
              </div>
            </div>
          </div>
        </section>


        {/* Status Distribution */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Répartition des statuts</h2>
            <p>Distribution des candidatures par statut</p>
          </div>
          
          <div className="campus-universities-grid">
            <div className="campus-university-card status-attente">
              <div className="university-header">
                <span className="university-badge">⏳ En attente</span>
              </div>
              <h3>{enAttente} candidatures</h3>
              <p>{Math.round((enAttente / totalCandidatures) * 100)}% du total</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(enAttente / totalCandidatures) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="campus-university-card status-acceptee">
              <div className="university-header">
                <span className="university-badge">✅ Acceptées</span>
              </div>
              <h3>{acceptees} candidatures</h3>
              <p>{Math.round((acceptees / totalCandidatures) * 100)}% du total</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(acceptees / totalCandidatures) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="campus-university-card status-refusee">
              <div className="university-header">
                <span className="university-badge">❌ Refusées</span>
              </div>
              <h3>{refusees} candidatures</h3>
              <p>{Math.round((refusees / totalCandidatures) * 100)}% du total</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(refusees / totalCandidatures) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Applications */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Dernières candidatures</h2>
            <p>Candidatures récemment soumises</p>
          </div>
          
          <div className="admin-filter-tabs">
              {[
                { id: "tous", label: "Tous" },
                { id: "attente", label: "En attente" },
                { id: "acceptee", label: "Acceptées" },
                { id: "refusee", label: "Refusées" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`admin-filter-tab ${filterStatus === tab.id ? "active" : ""}`}
                  onClick={() => setFilterStatus(tab.id)}
                >
                  {tab.label} ({counts[tab.id]})
                </button>
              ))}
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Université</th>
                  <th>Spécialité</th>
                  <th>Date de dépôt</th>
                  <th>Statut</th>
                  <th>Progression</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedCandidatures.map((candidature) => (
                  <tr
                    key={candidature.id}
                    className="row-clickable"
                    onClick={() => navigate(`/admin/candidatures/${candidature.id}`)}
                  >
                    <td>{candidature.nom}</td>
                    <td>{candidature.universite}</td>
                    <td>{candidature.specialite}</td>
                    <td>{candidature.date}</td>
                    <td>
                      <span className={`statut-badge ${getStatutBadgeClass(candidature.statut)}`}>
                        {candidature.statut}
                      </span>
                    </td>
                    <td>
                      <div className="progress-group">
                        {(() => {
                          const p = getProgress(candidature);
                          return (
                            <>
                              <div className="progress-item">
                                <span>Profil</span>
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${p.profil}%` }}
                                    role="progressbar"
                                    aria-valuenow={p.profil}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <span className="progress-pct">{p.profil}%</span>
                              </div>
                              <div className="progress-item">
                                <span>Docs</span>
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${p.documents}%` }}
                                    role="progressbar"
                                    aria-valuenow={p.documents}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <span className="progress-pct">{p.documents}%</span>
                              </div>
                              <div className="progress-item">
                                <span>Finale</span>
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${p.finale}%` }}
                                    role="progressbar"
                                    aria-valuenow={p.finale}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <span className="progress-pct">{p.finale}%</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td>
                      <button
                        className="campus-btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/candidatures/${candidature.id}`);
                        }}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-table-footer">
            <Link to="/admin/candidatures" className="campus-btn-primary">
              Voir toutes les candidatures →
            </Link>
          </div>
        </section>

        {/* Alertes */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Alertes</h2>
            <p>Notifications importantes nécessitant votre attention</p>
          </div>
          
          <div className="campus-features-grid">
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>📁</span>
              </div>
              <h3>{dossiersIncomplets} dossiers incomplets</h3>
              <p>Des candidats n&apos;ont pas fourni tous les documents requis</p>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>⏳</span>
              </div>
              <h3>{candidaturesNonTraitees} candidatures en attente</h3>
              <p>Candidatures qui nécessitent une validation</p>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>⚠️</span>
              </div>
              <h3>{documentsManquants} étudiants incomplets</h3>
              <p>Étudiants n&apos;ayant pas déposé tous les documents</p>
            </div>
          </div>
        </section>

        {/* Graphique: candidatures par université */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Candidatures par université</h2>
            <p>Répartition des candidatures par établissement</p>
          </div>
          
          <div className="admin-chart">
            {Object.entries(byUniversite).map(([u, n]) => (
              <div key={u} className="chart-row">
                <span className="chart-label">{u}</span>
                <div className="chart-bar">
                  <div
                    className="chart-fill"
                    style={{ width: `${Math.round((n / totalChart) * 100)}%` }}
                  ></div>
                </div>
                <span className="chart-value">{n}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Activité récente */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Activité récente</h2>
            <p>Dernières actions effectuées sur la plateforme</p>
          </div>
          
          <div className="campus-faq-grid">
            {recentActivity.map((a, i) => (
              <div key={i} className="campus-faq-item">
                <h3>Activité #{i+1}</h3>
                <p>{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions rapides */}
        <section className="campus-section-container">
          <div className="campus-section-header">
            <h2>Actions rapides</h2>
            <p>Accès direct aux fonctionnalités principales</p>
          </div>
          
          <div className="campus-features-grid">
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>📋</span>
              </div>
              <h3>Gérer les candidatures</h3>
              <p>Consulter et traiter les candidatures en attente</p>
              <Link to="/admin/candidatures" className="campus-btn-primary">Accéder</Link>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>👥</span>
              </div>
              <h3>Voir les étudiants</h3>
              <p>Consulter la liste des étudiants inscrits</p>
              <Link to="/admin/etudiants" className="campus-btn-primary">Accéder</Link>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>📁</span>
              </div>
              <h3>Consulter les documents</h3>
              <p>Gérer les documents soumis par les étudiants</p>
              <Link to="/admin/documents" className="campus-btn-primary">Accéder</Link>
            </div>
            
            <div className="campus-feature-card">
              <div className="feature-icon-wrap">
                <span>👤</span>
              </div>
              <h3>Accéder au profil admin</h3>
              <p>Modifier vos informations personnelles</p>
              <Link to="/admin/profil" className="campus-btn-primary">Accéder</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* Style général de la page */
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page h1 {
  color: #1a1a1a;
  font-size: 2em;
  margin-bottom: 10px;
  text-align: center;
}

.page p {
  color: #444;
  font-size: 1.1em;
  margin-bottom: 20px;
  text-align: center;
}


/* Style du formulaire */
.form {
  width: 100%;
  max-width: 700px;
  padding: 25px;
  border: 1px solid #bbb;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Ligne de champs (formRow) */
.formRow {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap; /* Pour s'adapter aux petits écrans */
}

/* Groupe de champs (enveloppe inputs/select pour organisation) */
.form-group {
  margin-bottom: 15px;
  flex: 1; /* �%tend dans formRow */
  min-width: 200px; /* Largeur minimale */
}

/* Style commun pour inputs et select */
.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #8a959e;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background-color: #fff;
  color: #222;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
}

.form-input::placeholder {
  color: #6b7280;
}

/* Style spécifique pour menu déroulant */
.form-input select {
  appearance: none; /* Supprime la flèche par défaut */
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0mlld0JiOCIgdveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'); /* Flèche SVG personnalisée */
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  padding-right: 40px; /* Espace pour la flèche */
}

/* Messages d'erreur */
.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
  font-weight: 500;
}

/* Required fields note */
.form-required-note {
  color: #555;
  font-size: 13px;
  margin-bottom: 15px;
  text-align: center;
  font-style: italic;
}

/* Help text */
.form-help-text {
  color: #555;
  font-size: 13px;
  margin-bottom: 15px;
  text-align: center;
  font-style: italic;
}

/* Input hint text */
.input-hint {
  display: block;
  font-size: 11px;
  color: #555;
  margin-top: 4px;
}

/* Documents progress indicator */
.documents-progress {
  text-align: center;
  padding: 12px 20px;
  background-color: #e7f3ff;
  border: 2px solid #007bff;
  border-radius: 8px;
  margin-bottom: 25px;
  font-weight: 600;
  color: #007bff;
  font-size: 15px;
}

/* Recap verification text */
.recap-verification-text {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 25px;
  text-align: center;
  font-style: italic;
}

/* Improved recap grid - label/value pairs */
.recap-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 20px;
}

.recap-grid p {
  margin: 0;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recap-grid p strong {
  color: #495057;
  min-width: 140px;
  flex-shrink: 0;
}

.recap-grid p span:last-child {
  color: #212529;
  font-weight: 500;
  text-align: right;
}

/* Document status styling in recap */
.recap-grid p:has(.doc-ok),
.recap-part:contains("Documents") .recap-grid p {
  font-weight: normal;
}

.doc-ok {
  color: #28a745;
}

.doc-missing {
  color: #dc3545;
}

/* Section des actions (boutons) */
.actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 20px;
}

.actions button {
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.actions button[type="submit"] {
  background-color: #007bff;
  color: white;
}

.actions button[type="submit"]:hover {
  background-color: #0056b3;
}

.actions button[type="button"] {
  background-color: #6c757d;
  color: white;
}

.actions button[type="button"]:hover {
  background-color: #545b62;
}

/* Bouton Récapitulatif */
.recapitulatif-btn {
  background-color: #28a745 !important;
  color: white !important;
}

.recapitulatif-btn:hover {
  background-color: #218838 !important;
}

/* Bouton Retour - rouge */
.retour-btn {
  background-color: #dc3545 !important;
  color: white !important;
}

.retour-btn:hover {
  background-color: #c82333 !important;
}

/* Bouton Valider - vert */
.valider-btn {
  background-color: #28a745 !important;
  color: white !important;
  padding: 12px 30px !important;
  font-size: 16px !important;
  border-radius: 6px !important;
}

.valider-btn:hover {
  background-color: #218838 !important;
}

/* Responsive pour mobiles */
@media (max-width: 600px) {
  .page {
    padding: 10px;
  }
  
  .form {
    padding: 15px;
  }
  
  .formRow {
    flex-direction: column;
    gap: 10px;
  }
  
  .form-group {
    min-width: unset;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .actions button {
    width: 100%;
    max-width: 200px;
  }
}
.pfc-movable {
  position: absolute;
  top: 80px;
  left: 600px;
}

.platform-movable {
  position: absolute;
  top: 140px;
  left: 420px;
}

.login-button {
  position: absolute;
  top: 330px;
  left: 580px;
}

.register-button {
  position: absolute;
  top: 360px;
  left: 580px;
}

.email-field {
  position: absolute;
  top: 200px;
  left: 500px;
  width: 250px;
  height: 40px;
}

.password-field {
  position: absolute;
  top: 240px;
  left: 500px;
  width: 250px;
  height: 40px;
}

/* Style pour les labels de fichiers */
.file-label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

/* Style pour les noms de fichiers */
.file-name {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #28a745;
  word-break: break-all;
}

/* Section Récapitulatif */
.recapitulatif-section {
  width: 100%;
  max-width: 600px;
  margin-top: 20px;
  padding: 20px;
  border: 2px solid #007bff;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.recapitulatif-section h3 {
  color: #007bff;
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.recap-part {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.recap-part h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 16px;
}

.recap-part p {
  margin: 8px 0;
  font-size: 14px;
  color: #555;
}

.recap-part p strong {
  color: #333;
  display: inline-block;
  min-width: 150px;
}

/* Page de succès */
.success-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f4f4;
  padding: 20px;
  margin-left: 0 !important;
}

.success-content {
  text-align: center;
  background-color: white;
  padding: 50px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.success-icon {
  font-size: 80px;
  color: #28a745;
  margin-bottom: 20px;
}

.success-content h1 {
  color: #28a745;
  font-size: 28px;
  margin-bottom: 20px;
}

.success-content p {
  color: #666;
  font-size: 16px;
  margin-bottom: 15px;
  line-height: 1.6;
}

.home-btn {
  margin-top: 30px;
  padding: 12px 30px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.home-btn:hover {
  background-color: #0056b3;
}

/* Dashboard styles */
.dashboard-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 30px;
}

/* ============================================
   COMPLETION INDICATORS (NEW)
   ============================================ */

.completion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 600px) {
  .completion-grid {
    grid-template-columns: 1fr;
  }
}

.completion-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.completion-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.completion-icon {
  font-size: 24px;
}

.completion-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.completion-progress {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.completion-progress .progress-bar {
  flex: 1;
  height: 10px;
  background: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
}

.completion-progress .progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.completion-percentage {
  font-size: 16px;
  font-weight: bold;
  min-width: 50px;
}

.completion-link {
  display: inline-block;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.completion-link:hover {
  background: #0056b3;
}

.dashboard-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 250px;
  flex: 1;
  max-width: 300px;
}

.dashboard-card h3 {
  color: #333;
  margin-bottom: 15px;
}

.dashboard-card p {
  color: #666;
  margin-bottom: 20px;
}

.dashboard-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.dashboard-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.dashboard-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  width: 100%;
  max-width: 700px;
  flex-wrap: wrap;
  gap: 5px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 55px;
  border-radius: 8px;
  background-color: #c5c9ce;
  color: #444;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step-number {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.step-label {
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

/* Active step - blue */
.step.active {
  background-color: #007bff;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
  transform: scale(1.05);
}

.step.active .step-number {
  color: white;
}

.step.active .step-label {
  color: rgba(255, 255, 255, 0.9);
}

/* Completed step - green with checkmark */
.step.completed {
  background-color: #28a745;
  color: white;
}

.step.completed .step-number {
  color: white;
}

.step.completed .step-label {
  color: rgba(255, 255, 255, 0.9);
}

/* Future step - grey (default) - AM�%LIOR�% */
.step:not(.active):not(.completed) {
  background-color: #c5c9ce;
  color: #333;
}

.step:not(.active):not(.completed) .step-number {
  color: #333;
}

.step:not(.active):not(.completed) .step-label {
  color: #444;
}

.step-line {
  width: 30px;
  height: 3px;
  background-color: #bbb;
  border-radius: 2px;
  flex-shrink: 0;
}

.step.completed + .step-line {
  background-color: #28a745;
}

/* Responsive step indicator */
@media (max-width: 600px) {
  .step-indicator {
    max-width: 100%;
    gap: 3px;
  }
  
  .step {
    width: 55px;
    height: 45px;
    border-radius: 6px;
  }
  
  .step-number {
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .step-label {
    font-size: 7px;
  }
  
  .step-line {
    width: 15px;
    height: 2px;
  }
}

/* Bouton Suivant */
.suivant-btn {
  background-color: #007bff !important;
  color: white !important;
}

.suivant-btn:hover {
  background-color: #0056b3 !important;
}

/* Récapitulatif grid */
.recap-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.recap-actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 20px;
}

.recap-actions button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* Navbar styles */
.navbar {
  background-color: #007bff;
  padding: 12px 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand a {
  color: white;
  font-size: 22px;
  font-weight: bold;
  text-decoration: none;
  letter-spacing: 0.5px;
}

.navbar-links {
  display: flex;
  gap: 15px;
  align-items: center;
}

.navbar-links a {
  color: white;
  text-decoration: none;
  padding: 10px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  position: relative;
}

/* Active link - more visible with underline */
.navbar-links a:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.navbar-links a.active {
  background-color: rgba(255, 255, 255, 0.25);
  font-weight: 600;
}

.navbar-links a.active::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background-color: white;
  border-radius: 2px;
}

/* Logout button - reduced visual width */
.navbar-logout {
  background-color: #dc3545;
  padding: 8px 14px !important;
  font-size: 13px !important;
  margin-left: 5px;
}

.navbar-logout:hover {
  background-color: #c82333 !important;
}

/* User greeting and icon on the right */
.navbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 8px 14px;
  border-radius: 20px;
}

.user-icon {
  font-size: 16px;
}

.user-greeting {
  white-space: nowrap;
}

/* Responsive navbar */
@media (max-width: 768px) {
  .navbar-container {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .navbar-links {
    gap: 8px;
    order: 3;
    width: 100%;
    justify-content: center;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .navbar-links a {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .user-greeting {
    display: none;
  }
  
  .navbar-brand a {
    font-size: 18px;
  }
}

/* ============================================
   NAVBAR VERTICALE (COLONNE �? GAUCHE)
   ============================================ */

/* Main content wrapper */
.main-content {
  margin-left: 260px;
  min-height: 100vh;
  padding: 20px;
}

/* Full width for pages without sidebar (home, login, register) */
.main-content-full {
  margin-left: 0;
  padding: 0 !important;
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
}

.navbar-vertical {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: linear-gradient(180deg, #1a365d 0%, #2d4a7c 100%);
  padding: 30px 20px;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 25px;
  z-index: 1000;
}

.navbar-vertical .navbar-brand {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.navbar-vertical .navbar-brand a {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-decoration: none;
  letter-spacing: 1px;
}

.navbar-vertical .navbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.navbar-vertical .user-icon {
  font-size: 28px;
}

.navbar-vertical .user-greeting {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.navbar-vertical .navbar-links-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.navbar-vertical .navbar-links-vertical a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s ease;
  font-size: 15px;
  font-weight: 500;
}

.navbar-vertical .navbar-links-vertical a:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  transform: translateX(5px);
}

.navbar-vertical .navbar-links-vertical a.active {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.navbar-vertical .nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.navbar-vertical .nav-text {
  flex: 1;
}

.navbar-vertical .navbar-logout-vertical {
  background-color: #dc3545;
  color: white !important;
  margin-top: auto;
}

.navbar-vertical .navbar-logout-vertical:hover {
  background-color: #c82333 !important;
}

/* Responsive pour mobile */
@media (max-width: 768px) {
  .navbar-vertical {
    width: 100%;
    height: auto;
    position: relative;
    padding: 15px;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
  
  .navbar-vertical .navbar-brand {
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .navbar-vertical .navbar-user {
    display: none;
  }
  
  .navbar-vertical .navbar-links-vertical {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    width: 100%;
    order: 3;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .navbar-vertical .navbar-links-vertical a {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .navbar-vertical .nav-icon {
    display: none;
  }
  
  .navbar-vertical .navbar-logout-vertical {
    margin-top: 0;
  }
}

/* Styles pour Mes Candidatures */
.candidatures-list {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.candidature-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.candidature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.candidature-header h3 {
  color: #333;
  margin: 0;
}

.candidature-details p {
  margin: 8px 0;
  color: #444;
}

.candidature-details strong {
  color: #222;
}

.statut-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.statut-attente {
  background-color: #ffc107;
  color: #333;
}

.statut-acceptee {
  background-color: #28a745;
  color: white;
}

.statut-rejetee {
  background-color: #dc3545;
  color: white;
}

.no-candidatures {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-candidatures p {
  color: #666;
  margin-bottom: 20px;
}

/* Bouton Voir les détails - Cohérence: bleu = principal */
.candidature-actions {
  margin-top: 15px;
  text-align: center;
}

.details-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.details-btn:hover {
  background-color: #0056b3;
}

/* Section des détails (Récapitulatif) */
.candidature-details-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #007bff;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.candidature-details-section h4 {
  color: #007bff;
  margin-bottom: 15px;
  text-align: center;
  font-size: 18px;
}

.candidature-details-section h5 {
  color: #333;
  margin: 15px 0 10px 0;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

/* Form labels */
.form-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

/* Success message */
.success-message {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.success-message .success-icon {
  font-size: 60px;
  color: #28a745;
  margin-bottom: 20px;
}

.success-message h2 {
  color: #28a745;
  margin-bottom: 10px;
}

.success-message p {
  color: #666;
}

/* Numéro de dossier */
.numero-dossier {
  background-color: #e7f3ff;
  border: 2px solid #007bff;
  border-radius: 10px;
  padding: 15px 25px;
  margin: 20px 0;
}

.numero-dossier p {
  color: #333;
  font-size: 14px;
  margin-bottom: 5px;
}

.dossier-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  letter-spacing: 1px;
}

.success-message-text {
  color: #666 !important;
  font-size: 14px;
  margin: 15px 0 !important;
}

/* Submission date */
.submission-date {
  margin: 15px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.submission-date p {
  color: #495057;
  font-size: 14px;
  margin: 0;
}

/* Success buttons */
.success-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}

.success-buttons .home-btn {
  padding: 12px 25px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.success-buttons .home-btn:hover {
  background-color: #0056b3;
}

.success-buttons .dashboard-btn {
  padding: 12px 25px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.success-buttons .dashboard-btn:hover {
  background-color: #545b62;
}

/* ============================================
   AM�%LIORATION UPLOAD DOCUMENTS - Step 3
   ============================================ */

.step-description {
  text-align: center;
  color: #444;
  font-size: 14px;
  margin-bottom: 15px;
}

.documents-form {
  max-width: 900px;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }
}

.document-upload-container {
  display: flex;
  flex-direction: column;
}

.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover {
  border-color: #007bff;
  background-color: #f0f7ff;
}

.upload-zone.drag-over {
  border-color: #007bff;
  background-color: #e6f0ff;
  transform: scale(1.02);
}

.upload-zone.has-file {
  border-color: #28a745;
  background-color: #f0fff4;
  border-style: solid;
}

.upload-zone.has-error {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.file-input-hidden {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 5px;
}

.upload-label {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px;
  color: #888;
}

.upload-formats {
  font-size: 10px;
  color: #aaa;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-preview {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
}

.file-emoji {
  font-size: 32px;
}

.file-info {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.file-info .file-name {
  display: block;
  font-weight: bold;
  color: #333;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.file-status {
  display: block;
  font-size: 11px;
  color: #28a745;
  margin-top: 2px;
}

.remove-file-btn {
  width: 28px;
  height: 28px;
  border: none;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

.remove-file-btn:hover {
  background-color: #c82333;
}

/* Animation de chargement */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.upload-zone.uploading {
  animation: pulse 1.5s infinite;
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */

.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  min-width: 250px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background-color: #d4edda;
  border: 1px solid #28a745;
  color: #155724;
}

.toast-error {
  background-color: #f8d7da;
  border: 1px solid #dc3545;
  color: #721c24;
}

.toast-info {
  background-color: #d1ecf1;
  border: 1px solid #17a2b8;
  color: #0c5460;
}

.toast-icon {
  font-size: 18px;
  font-weight: bold;
}

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
  padding: 0;
  color: inherit;
}

.toast-close:hover {
  opacity: 1;
}

/* ============================================
   SPINNER DE CHARGEMENT
   ============================================ */

.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-text {
  color: white;
  margin-top: 15px;
  font-size: 16px;
}

/* Button with loading state */
.btn-loading {
  position: relative;
  pointer-events: none;
}


.btn-loading .spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

/* ============================================
   NEW STUDENT DASHBOARD STYLES
   ============================================ */

.dashboard-page {
  max-width: 900px;
}

/* Welcome Message */
.dashboard-welcome {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-radius: 15px;
  color: white;
  width: 100%;
}

.dashboard-welcome h1 {
  color: white;
  font-size: 2.5em;
  margin-bottom: 10px;
}

.dashboard-welcome p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2em;
  margin: 0;
}

/* Dashboard Sections */
.dashboard-section {
  width: 100%;
  margin-bottom: 35px;
}

.dashboard-section h2 {
  color: #333;
  font-size: 1.4em;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: white;
  padding: 25px 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 3em;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 0.95em;
  color: #444;
  font-weight: 500;
}

/* Stat card colors */
.stat-total {
  border-top: 4px solid #007bff;
}

.stat-total .stat-number {
  color: #007bff;
}

.stat-attente {
  border-top: 4px solid #ffc107;
}

.stat-attente .stat-number {
  color: #ffc107;
}

.stat-acceptee {
  border-top: 4px solid #28a745;
}

.stat-acceptee .stat-number {
  color: #28a745;
}

.stat-rejetee {
  border-top: 4px solid #dc3545;
}

.stat-rejetee .stat-number {
  color: #dc3545;
}

/* Activity Card */
.activity-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.activity-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px 30px;
  flex: 1;
}

@media (max-width: 600px) {
  .activity-info {
    grid-template-columns: 1fr;
  }
}

.activity-detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.activity-label {
  font-size: 0.85em;
  color: #555;
  font-weight: 500;
}

.activity-value {
  font-size: 1em;
  color: #222;
  font-weight: 600;
}

.activity-status {
  display: flex;
  align-items: center;
}

.no-activity {
  color: #555;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 20px;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.quick-action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.quick-action-btn.primary {
  background-color: #007bff;
  color: white;
}

.quick-action-btn.primary:hover {
  background-color: #0056b3;
}

.quick-action-btn.secondary {
  background-color: #007bff;
  color: white;
}

.quick-action-btn.secondary:hover {
  background-color: #0056b3;
}

.quick-action-btn.tertiary {
  background-color: #6c757d;
  color: white;
}

.quick-action-btn.tertiary:hover {
  background-color: #545b62;
}

.action-icon {
  font-size: 1.3em;
}

.action-text {
  white-space: nowrap;
}

/* Responsive adjustments for quick actions */
@media (max-width: 600px) {
  .quick-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-action-btn {
    justify-content: center;
  }
  
  .dashboard-welcome h1 {
    font-size: 1.8em;
  }
  
  .dashboard-welcome p {
    font-size: 1em;
  }
}

/* ============================================
   CONFIRMATION DIALOG
   ============================================ */

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9997;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-dialog {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  text-align: center;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-dialog h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 20px;
}

.confirm-dialog p {
  color: #666;
  margin-bottom: 25px;
  font-size: 15px;
}

.confirm-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.confirm-buttons button {
  padding: 10px 25px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* ============================================
   MES CANDIDATURES - COMPTEURS ET FILTRES
   ============================================ */

/* Compteurs */
.candidatures-counter {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.counter-item {
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #495057;
}

.counter-item strong {
  margin-right: 5px;
}

.counter-acceptees {
  border-left: 4px solid #28a745;
}

.counter-acceptees strong {
  color: #28a745;
}

.counter-attente {
  border-left: 4px solid #ffc107;
}

.counter-attente strong {
  color: #d39e00;
}

.counter-rejetees {
  border-left: 4px solid #dc3545;
}

.counter-rejetees strong {
  color: #dc3545;
}

/* Filtres */
.candidatures-filters {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid #999;
  background: white;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  color: #444;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.filter-btn.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.filter-btn.filter-attente.active {
  background: #ffc107;
  border-color: #ffc107;
  color: #333;
}

.filter-btn.filter-acceptees.active {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.filter-btn.filter-rejetees.active {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

/* Download button */
.download-btn {
  padding: 10px 14px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
  margin-left: 10px;
}

.download-btn:hover {
  background: #545b62;
}

/* Candidature actions - aligned buttons */
.candidature-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
}

/* Candidature card - unified styling */
.candidature-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.candidature-card:last-child {
  margin-bottom: 0;
}

/* ============================================
   ENCADR�% R�%SUM�% (RESUME BOX)
   ============================================ */

.resume-box {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #007bff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.resume-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.resume-dossier {
  font-size: 16px;
  font-weight: bold;
  color: #495057;
}

.resume-box-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resume-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.resume-item:not(:last-child) {
  border-bottom: 1px dashed #dee2e6;
}

.resume-label {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
}

.resume-value {
  color: #212529;
  font-size: 14px;
  font-weight: 600;
}

/* ============================================
   DOCUMENTS LIST - STYLE LIEN/CLiquable
   ============================================ */

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.document-item:hover {
  background-color: #f8f9fa;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.document-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.document-label {
  color: #495057;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.document-link {
  color: #007bff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  padding: 4px 10px;
  background-color: #e7f3ff;
  border-radius: 15px;
  border: 1px solid #b8daff;
  transition: all 0.3s ease;
  cursor: pointer;
  flex: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-link:hover {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .candidatures-counter {
    gap: 10px;
  }
  
  .counter-item {
    padding: 10px 15px;
    font-size: 13px;
  }
  
  .candidatures-filters {
    gap: 8px;
  }
  
  .filter-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .candidature-card {
    padding: 20px;
  }
  
  .resume-box-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .resume-dossier {
    font-size: 14px;
  }
  
  .document-item {
    flex-wrap: wrap;
  }
  
  .document-link {
    width: 100%;
    text-align: left;
    margin-top: 5px;
  }
}

/* ============================================
   PROFIL - SECTIONS TITLES
   ============================================ */

.form-section-title {
  margin: 25px 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.form-section-title h3 {
  color: #007bff;
  font-size: 16px;
  margin: 0;
  padding: 0;
}
/* ============================================
   CAMPUS LANDING PAGE - Professional Style
   ============================================ */

.campus-landing {
  --primary-color: #1a365d;
  --secondary-color: #2d5a87;
  --accent-color: #10b981;
  --text-dark: #1f2937;
  --text-gray: #6b7280;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Header */
.campus-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.campus-header-container {
  margin: 0 auto;
  padding: 0 30px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.campus-logo a {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.campus-logo .logo-icon {
  font-size: 28px;
}

.campus-logo .logo-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-color);
}

.campus-nav {
  display: flex;
  gap: 30px;
}

.campus-nav-link {
  color: var(--text-gray);
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.2s;
}

.campus-nav-link:hover,
.campus-nav-link.active {
  color: var(--primary-color);
}

.campus-auth {
  position: relative;
}

.campus-btn-login {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.campus-btn-login:hover {
  background: var(--secondary-color);
}

.dropdown-icon {
  width: 16px;
  height: 16px;
}

.campus-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 25px;
  width: 320px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.campus-form-group {
  margin-bottom: 15px;
}

.campus-form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 6px;
}

.campus-form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.campus-form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.campus-btn-submit {
  width: 100%;
  padding: 14px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.campus-btn-submit:hover {
  background: var(--secondary-color);
}

.campus-dropdown-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.campus-dropdown-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 13px;
}

.campus-dropdown-footer a:hover {
  text-decoration: underline;
}

/* Hero Section */
.campus-hero {
  position: relative;
  padding-top: 70px;
  min-height: 700px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  overflow: hidden;
}

.campus-hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(26, 54, 93, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
}

.campus-hero-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 60px 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.campus-hero-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-color);
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 20px;
}

.campus-hero-title {
  font-size: 3.2rem;
  font-weight: 800;
  color: var(--primary-color);
  line-height: 1.15;
  margin-bottom: 20px;
}

.campus-hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-gray);
  line-height: 1.6;
  margin-bottom: 35px;
}

.campus-hero-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 50px;
}

.campus-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: var(--accent-color);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.campus-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  color: white;
}

.campus-btn-primary svg {
  width: 20px;
  height: 20px;
}

.campus-btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 16px 32px;
  background: white;
  color: var(--primary-color);
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  border: 2px solid var(--primary-color);
  transition: all 0.3s;
}

.campus-btn-secondary:hover {
  background: var(--primary-color);
  color: white;
}

.campus-hero-stats {
  display: flex;
  align-items: center;
  gap: 30px;
}

.campus-hero-stat {
  display: flex;
  flex-direction: column;
}

.campus-hero-stat .stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
}

.campus-hero-stat .stat-label {
  font-size: 0.9rem;
  color: var(--text-gray);
}

.campus-stat-divider {
  width: 1px;
  height: 40px;
  background: #d1d5db;
}

/* Hero Visual Card */
.campus-hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.campus-hero-img {
  width: 100%;
  max-width: 450px;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  object-fit: cover;
}

.campus-hero-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: 30px;
  width: 100%;
  max-width: 400px;
}

.campus-card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.campus-card-icon {
  font-size: 40px;
}

.campus-card-title h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.campus-card-title span {
  font-size: 0.85rem;
  color: var(--accent-color);
  font-weight: 500;
}

.campus-card-progress {
  margin-bottom: 25px;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #34d399);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: var(--text-gray);
}

.campus-card-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-light);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-gray);
}

.step-item.completed {
  color: var(--accent-color);
}

.step-item.active {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-color);
}

.step-check {
  width: 24px;
  height: 24px;
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.step-number {
  width: 24px;
  height: 24px;
  background: #e5e7eb;
  color: var(--text-gray);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step-item.active .step-number {
  background: var(--accent-color);
  color: white;
}

/* Section Container */
.campus-section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 30px;
}

.campus-section-header {
  text-align: center;
  margin-bottom: 50px;
}

.campus-section-header h2 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.campus-section-header p {
  font-size: 1.1rem;
  color: var(--text-gray);
}

/* Steps Section */
.campus-steps {
  background: var(--bg-white);
}

.campus-steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
}

.campus-step-card {
  position: relative;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.campus-step-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.campus-step-number {
  font-size: 3rem;
  font-weight: 800;
  color: rgba(26, 54, 93, 0.1);
  position: absolute;
  top: 15px;
  right: 20px;
}

.campus-step-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.campus-step-content p {
  font-size: 0.9rem;
  color: var(--text-gray);
  line-height: 1.5;
  margin: 0;
}

/* Universities Section */
.campus-universities {
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.campus-universities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
}

.campus-university-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.campus-university-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
}

.campus-university-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.university-header {
  margin-bottom: 15px;
}

.university-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(26, 54, 93, 0.1);
  color: var(--primary-color);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
}

.campus-university-card h3 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.campus-university-card p {
  font-size: 0.9rem;
  color: var(--text-gray);
  margin-bottom: 20px;
}

.university-stats {
  display: flex;
  gap: 15px;
  font-size: 0.8rem;
  color: var(--text-gray);
}

.university-stats span {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Calendar Section */
.campus-calendar {
  background: white;
}

.campus-timeline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.campus-timeline::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 60px;
  right: 60px;
  height: 3px;
  background: #e5e7eb;
}

.timeline-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.phase-marker {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.phase-jan { background: #10b981; }
.phase-mar { background: #f59e0b; }
.phase-avril { background: #3b82f6; }
.phase-juin { background: #8b5cf6; }

.phase-content {
  padding: 0 10px;
}

.phase-date {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.phase-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.phase-content p {
  font-size: 0.85rem;
  color: var(--text-gray);
  margin: 0;
}

/* Features Section */
.campus-features {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  padding: 80px 0;
}

.campus-features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.campus-feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s;
}

.campus-feature-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
}

.feature-icon-wrap {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.feature-icon-wrap svg {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

.campus-feature-card h3 {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.campus-feature-card p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0;
}

/* FAQ Section */
.campus-faq {
  background: var(--bg-light);
}

.campus-faq-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
}

.campus-faq-item {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.campus-faq-item h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.campus-faq-item p {
  font-size: 0.9rem;
  color: var(--text-gray);
  line-height: 1.6;
  margin: 0;
}

/* CTA Section */
.campus-cta {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 80px 0;
}

.campus-cta-container {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 30px;
}

.campus-cta h2 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 15px;
}

.campus-cta p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 30px;
}

.campus-btn-large {
  padding: 18px 40px;
  font-size: 16px;
}

/* Footer */
.campus-footer {
  background: #1a1a2e;
  color: white;
  padding: 60px 0 30px;
}

.campus-footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
}

.campus-footer-top {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 60px;
  margin-bottom: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.footer-logo .logo-icon {
  font-size: 28px;
}

.footer-logo .logo-text {
  font-size: 20px;
  font-weight: 700;
}

.campus-footer-brand p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.campus-footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.footer-column h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
}

.footer-column a {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 12px;
  transition: color 0.2s;
}

.footer-column a:hover {
  color: white;
}

.campus-footer-bottom {
  text-align: center;
}

.campus-footer-bottom p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .campus-hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .campus-hero-actions {
    justify-content: center;
  }
  
  .campus-hero-stats {
    justify-content: center;
  }
  
  .campus-hero-visual {
    display: none;
  }
  
  .campus-steps-grid,
  .campus-universities-grid,
  .campus-features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .campus-timeline {
    flex-wrap: wrap;
    gap: 30px;
  }
  
  .campus-timeline::before {
    display: none;
  }
}

@media (max-width: 768px) {
  .campus-header-container {
    padding: 0 20px;
  }
  
  .campus-nav {
    display: none;
  }
  
  .campus-hero-title {
    font-size: 2.2rem;
  }
  
  .campus-hero-actions {
    flex-direction: column;
  }
  
  .campus-hero-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .campus-stat-divider {
    display: none;
  }
  
  .campus-section-container {
    padding: 60px 20px;
  }
  
  .campus-section-header h2 {
    font-size: 1.8rem;
  }
  
  .campus-steps-grid,
  .campus-universities-grid,
  .campus-features-grid,
  .campus-faq-grid {
    grid-template-columns: 1fr;
  }
  
  .campus-footer-top {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .campus-footer-links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .campus-logo .logo-text {
    font-size: 18px;
  }
  
  .campus-btn-login {
    padding: 8px 14px;
    font-size: 13px;
  }
  
  .campus-hero-title {
    font-size: 1.8rem;
  }
  
  .campus-footer-links {
    grid-template-columns: 1fr;
  }
}

/* Reset for full-width landing page */
.landing-page {
  min-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  margin-left: calc(-50vw + 50%);
  padding: 80px 0 0 0;
  background: #f8fafc;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Navbar horizontale en haut */
.landing-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  box-sizing: border-box;
}

.landing-navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 15px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landing-navbar-brand {
  font-size: 24px;
  font-weight: bold;
}

.landing-navbar-brand a {
  color: #1a365d;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.landing-navbar-links {
  display: flex;
  gap: 30px;
}

.landing-nav-link {
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.3s ease;
}

.landing-nav-link:hover,
.landing-nav-link.active {
  color: #1a365d;
}

.landing-navbar-auth {
  display: flex;
  gap: 15px;
  align-items: center;
  position: relative;
}

.landing-nav-btn-auth {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  color: white;
}

.landing-nav-btn-auth:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(26, 54, 93, 0.4);
}

.landing-nav-btn-auth span:first-child {
  font-size: 16px;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 5px;
  transition: transform 0.3s ease;
}

.landing-nav-btn-auth:hover .dropdown-arrow {
  transform: translateY(2px);
}

/* Login Dropdown Menu */
.login-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
  width: 300px;
  z-index: 1001;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-dropdown-field {
  margin-bottom: 15px;
}

.login-dropdown-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.login-dropdown-field input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.login-dropdown-field input:focus {
  outline: none;
  border-color: #1a365d;
}

.login-dropdown-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.login-dropdown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(26, 54, 93, 0.4);
}

.login-dropdown-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.login-dropdown-footer a {
  color: #1a365d;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}

.login-dropdown-footer a:hover {
  text-decoration: underline;
}

/* Responsive navbar */
@media (max-width: 900px) {
  .landing-navbar-links {
    display: none;
  }
}

@media (max-width: 600px) {
  .landing-navbar-container {
    padding: 12px 15px;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .landing-navbar-brand {
    font-size: 20px;
  }
  
  .landing-navbar-auth {
    gap: 10px;
  }
  
  .landing-nav-btn-auth {
    padding: 8px 16px;
    font-size: 13px;
  }
}

.landing-page {
  min-height: 100vh;
  width: 100%;
  background: #f8fafc;
  padding-top: 80px;
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 30px;
  display: flex;
  align-items: center;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  width: 100%;
}

.hero-text {
  text-align: left;
}

.hero-title {
  font-size: 3.2em;
  color: #1a365d;
  margin-bottom: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.4em;
  color: #4a5568;
  margin-bottom: 35px;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 20px;
}

/* How to use section in hero */
.hero-how-to-use {
  margin-top: 35px;
  text-align: left;
}

.hero-how-to-use h3 {
  color: #1a365d;
  font-size: 1.15em;
  margin-bottom: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.how-to-use-steps {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.how-to-use-step {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  padding: 10px 18px;
  border-radius: 25px;
  box-shadow: 0 3px 12px rgba(26, 54, 93, 0.25);
  transition: all 0.3s ease;
}

.how-to-use-step:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(26, 54, 93, 0.35);
}

.how-to-use-step .step-icon {
  width: 26px;
  height: 26px;
  background: white;
  color: #1a365d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
}

.how-to-use-step .step-text {
  color: white;
  font-size: 0.9em;
  font-weight: 600;
}

@media (max-width: 600px) {
  .how-to-use-steps {
    flex-direction: column;
    gap: 10px;
  }
  
  .how-to-use-step {
    width: 100%;
    justify-content: flex-start;
  }
}

/* Platform features section in hero */
.hero-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-top: 30px;
  width: 100%;
}

.hero-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 18px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(26, 54, 93, 0.1);
  transition: all 0.3s ease;
}

.hero-feature-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: rgba(26, 54, 93, 0.3);
}

.hero-feature-icon {
  font-size: 32px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%);
  width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.hero-feature-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-feature-text strong {
  color: #1a365d;
  font-size: 1em;
  font-weight: 700;
}

.hero-feature-text span {
  color: #4a5568;
  font-size: 0.85em;
  line-height: 1.4;
}

@media (max-width: 600px) {
  .hero-features {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .hero-feature-item {
    padding: 15px;
  }
  
  .hero-feature-icon {
    width: 48px;
    height: 48px;
    font-size: 26px;
  }
}

.hero-btn-primary {
  padding: 16px 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.hero-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.hero-btn-secondary {
  padding: 16px 40px;
  background: white;
  color: #1a365d;
  text-decoration: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 700;
  border: 3px solid #1a365d;
  transition: all 0.3s ease;
}

.hero-btn-secondary:hover {
  background: #1a365d;
  color: white;
  transform: translateY(-3px);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-image-placeholder {
  display: flex;
  gap: 30px;
  font-size: 80px;
  animation: float 3s ease-in-out infinite;
}

.hero-emoji {
  display: inline-block;
}

.hero-emoji:nth-child(1) {
  animation-delay: 0s;
}

.hero-emoji:nth-child(2) {
  animation-delay: 0.5s;
}

.hero-emoji:nth-child(3) {
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.landing-container {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

.landing-hero {
  margin-bottom: 50px;
}

.landing-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.landing-title {
  font-size: 4em;
  color: white;
  margin-bottom: 15px;
  font-weight: bold;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.landing-subtitle {
  font-size: 1.6em;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
  font-weight: 500;
}

.landing-description {
  font-size: 1.2em;
  color: rgba(255, 255, 255, 0.75);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.landing-actions {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 60px;
  flex-wrap: wrap;
}

.landing-btn-primary,
.landing-btn-secondary {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 50px;
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.3s ease;
  min-width: 280px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.landing-btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.landing-btn-primary:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
}

.landing-btn-secondary {
  background: white;
  color: #1a365d;
}

.landing-btn-secondary:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(255, 255, 255, 0.3);
}

.btn-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.btn-text {
  font-size: 1.4em;
  font-weight: 700;
  margin-bottom: 8px;
}

.btn-desc {
  font-size: 0.95em;
  opacity: 0.85;
}

.landing-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 50px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 30px 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
}

.feature-card .feature-icon {
  font-size: 45px;
  margin-bottom: 15px;
}

.feature-card h3 {
  color: white;
  font-size: 1.2em;
  margin-bottom: 10px;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.95em;
  margin: 0;
}

/* Important dates */
.important-dates {
  background: white;
  padding: 60px 5%;
  margin: 40px 0;
  width: 100%;
  box-sizing: border-box;
}

.dates-title {
  text-align: center;
  font-size: 2em;
  color: #1a365d;
  margin-bottom: 30px;
  font-weight: 700;
}

.dates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  max-width: 1000px;
  margin: 0 auto;
}

.date-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px 25px;
  border-radius: 12px;
  border-left: 4px solid #1a365d;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.date-icon {
  font-size: 32px;
}

.date-info h3 {
  font-size: 0.95em;
  color: #4a5568;
  margin-bottom: 5px;
  font-weight: 600;
}

.date-value {
  font-size: 1.3em;
  color: #1a365d;
  font-weight: 700;
  margin: 0;
}

/* Statistics section */
.statistics-section {
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  padding: 60px 5%;
  margin: 40px 0;
  width: 100%;
  box-sizing: border-box;
}

.statistics-section .section-title {
  color: white;
}

.statistics-section .stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
  max-width: 1100px;
  margin: 0 auto;
}

.statistics-section .stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 30px 20px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.statistics-section .stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.statistics-section .stat-number {
  font-size: 2.5em;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 10px;
  color: white;
}

.statistics-section .stat-label {
  font-size: 1em;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

@media (max-width: 768px) {
  .dates-grid {
    grid-template-columns: 1fr;
  }
  
  .statistics-section .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .statistics-section .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) { .dates-grid { grid-template-columns: 1fr; } }

/* Section Title - commun */
.section-title {
  text-align: center;
  font-size: 2em;
  color: #1a365d;
  margin-bottom: 40px;
  font-weight: 700;
}

/* Comment ça marche */
.how-it-works {
  background: white;
  padding: 60px 5%;
  margin: 40px 0;
  width: 100%;
  box-sizing: border-box;
}

.steps-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
  max-width: 1100px;
  margin: 0 auto;
}

.step-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 25px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.step-card:hover {
  transform: translateY(-5px);
}

.step-number {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 15px;
}

.step-content h3 {
  color: #1a365d;
  font-size: 1.1em;
  margin-bottom: 8px;
  font-weight: 600;
}

.step-content p {
  color: #4a5568;
  font-size: 0.9em;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .steps-container {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}

/* Universités */
.universities-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 60px 5%;
  margin: 40px 0;
  width: 100%;
  box-sizing: border-box;
}

.universities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
  max-width: 1100px;
  margin: 0 auto;
}

.university-card {
  background: white;
  padding: 30px 20px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-top: 4px solid #1a365d;
}

.university-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.university-icon {
  font-size: 40px;
  margin-bottom: 15px;
}

.university-card h3 {
  color: #1a365d;
  font-size: 1.1em;
  margin-bottom: 10px;
  font-weight: 600;
}

.university-card p {
  color: #4a5568;
  font-size: 0.85em;
  margin: 0;
}

@media (max-width: 900px) {
  .universities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .universities-grid {
    grid-template-columns: 1fr;
  }
}

/* Calendrier d'admission */
.calendar-section {
  background: white;
  padding: 60px 5%;
  margin: 40px 0;
  width: 100%;
  box-sizing: border-box;
}

.timeline {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.timeline-marker {
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1em;
  min-width: 120px;
  text-align: center;
}

.timeline-content h3 {
  color: #1a365d;
  font-size: 1.1em;
  margin: 0;
  font-weight: 600;
}

@media (max-width: 600px) {
  .timeline-item {
    flex-direction: column;
    text-align: center;
  }
  
  .timeline-marker {
    width: 100%;
  }
}

/* FAQ */
.faq-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 60px 5%;
  margin: 40px 0;
  width: 100%;
  box-sizing: border-box;
}

.faq-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  background: white;
  padding: 25px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #1a365d;
}

.faq-item h3 {
  color: #1a365d;
  font-size: 1.1em;
  margin-bottom: 12px;
  font-weight: 600;
}

.faq-item p {
  color: #4a5568;
  font-size: 0.95em;
  margin: 0;
  line-height: 1.6;
}

/* Footer */
.landing-footer {
  background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
  padding: 40px 5% 20px;
  width: 100%;
  box-sizing: border-box;
  color: white;
}

.footer-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
}

.footer-links {
  text-align: center;
}

.footer-links h4 {
  color: white;
  font-size: 1.3em;
  margin-bottom: 15px;
  font-weight: 600;
}

.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.95em;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: white;
}

.footer-copyright {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  text-align: center;
}

.footer-copyright p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9em;
  margin: 0;
}

@media (max-width: 600px) {
  .footer-links ul {
    flex-direction: column;
    gap: 15px;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .landing-title {
    font-size: 2.5em;
  }
  
  .landing-subtitle {
    font-size: 1.2em;
  }
  
  .landing-description {
    font-size: 1em;
  }
  
  .landing-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .landing-btn-primary,
  .landing-btn-secondary {
    width: 100%;
    max-width: 320px;
    padding: 25px 30px;
  }
  
  .landing-features {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* Ancien positionnement - supprimé pour éviter les chevauchements */
/*
.pfc-movable {
  position: absolute;
  top: 80px;
  left: 600px;
}

.platform-movable {
  position: absolute;
  top: 140px;
  left: 420px;
}

.login-button {
  position: absolute;
  top: 330px;
  left: 580px;
}

.register-button {
  position: absolute;
  top: 360px;
  left: 580px;
}

.email-field {
  position: absolute;
  top: 200px;
  left: 500px;
  width: 250px;
  height: 40px;
}

.password-field {
  position: absolute;
  top: 240px;
  left: 500px;
  width: 250px;
  height: 40px;
}
*/
/* ======= AUTH PAGES (Login/Register) ======= */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin-left: 0 !important;
}

.auth-container {
  width: 100%;
  max-width: 480px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h1 {
  color: #333;
  font-size: 28px;
  margin-bottom: 8px;
}

.auth-header p {
  color: #666;
  font-size: 15px;
}

.auth-form .form-group {
  margin-bottom: 20px;
}

.auth-form .form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.input-icon {
  font-size: 16px;
}

.auth-form .form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e1e5ee;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.auth-form .form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: 14px;
  cursor: pointer;
}

.forgot-link {
  color: #667eea;
  font-size: 14px;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.auth-btn-primary {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.auth-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.auth-error {
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.auth-demo {
  background: #f0f7ff;
  border: 1px solid #b8daff;
  border-radius: 10px;
  padding: 16px;
  margin: 20px 0;
  text-align: center;
  font-size: 13px;
}

.auth-demo p {
  margin: 4px 0;
  color: #333;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.legal-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}

.legal-checkbox input {
  margin-top: 3px;
}

.legal-checkbox a {
  color: #667eea;
  text-decoration: none;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

/* ============================================
   ADMIN DASHBOARD STYLES - ENHANCED
   ============================================ */

/* Variables de couleurs */
:root {
  --admin-primary: #1a365d;
  --admin-primary-light: #2d5a87;
  --admin-secondary: #10b981;
  --admin-secondary-light: #34d399;
  --admin-accent: #3b82f6;
  --admin-accent-light: #60a5fa;
  --admin-warning: #f59e0b;
  --admin-danger: #ef4444;
  --admin-success: #10b981;
  --admin-info: #3b82f6;
  --admin-gray-100: #f3f4f6;
  --admin-gray-200: #e5e7eb;
  --admin-gray-300: #d1d5db;
  --admin-gray-400: #9ca3af;
  --admin-gray-500: #6b7280;
  --admin-gray-600: #4b5563;
  --admin-gray-700: #374151;
  --admin-gray-800: #1f2937;
  --admin-gray-900: #111827;
}

/* Header search - Enhanced */
.admin-search {
  position: relative;
  max-width: 420px;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.admin-search:focus-within {
  transform: translateY(-2px);
}

.admin-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--admin-gray-500);
  font-size: 16px;
  transition: color 0.3s ease;
}

.admin-search:focus-within .admin-search-icon {
  color: var(--admin-accent);
}

.admin-search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid var(--admin-gray-200);
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #fff;
  color: var(--admin-gray-800);
  box-sizing: border-box;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.admin-search-input:focus {
  outline: none;
  border-color: var(--admin-accent);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
}

.admin-search-input::placeholder {
  color: var(--admin-gray-400);
  transition: opacity 0.3s ease;
}

.admin-search-input:focus::placeholder {
  opacity: 0.7;
}

/* Header notifications - Enhanced */
.admin-notification {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.admin-notification:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.admin-notification-icon {
  font-size: 20px;
  color: var(--admin-gray-600);
  transition: color 0.3s ease;
}

.admin-notification:hover .admin-notification-icon {
  color: var(--admin-accent);
}

.admin-notification-badge {
  background: var(--admin-danger);
  color: #fff;
  font-size: 11px;
  border-radius: 12px;
  padding: 2px 8px;
  line-height: 1.2;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(239, 68, 68, 0.3);
  transition: transform 0.3s ease;
}

.admin-notification:hover .admin-notification-badge {
  transform: scale(1.1);
}

.admin-notif-dropdown {
  position: absolute;
  top: 40px;
  right: 0;
  width: 320px;
  background: #fff;
  border: 1px solid var(--admin-gray-200);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 100;
  padding: 0;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notif-header {
  padding: 12px 16px;
  background: var(--admin-gray-100);
  border-bottom: 1px solid var(--admin-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-gray-800);
}

.notif-header .notif-count {
  background: var(--admin-accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.notif-body {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.notif-item {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--admin-gray-700);
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notif-item:hover {
  background: var(--admin-gray-100);
  border-left-color: var(--admin-accent);
}

.notif-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--admin-accent-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-weight: 600;
  color: var(--admin-gray-800);
  margin-bottom: 4px;
}

.notif-desc {
  color: var(--admin-gray-600);
  font-size: 12px;
}

.notif-time {
  font-size: 11px;
  color: var(--admin-gray-500);
  margin-top: 4px;
}

.notif-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--admin-gray-200);
  text-align: center;
}

.notif-link {
  display: block;
  width: 100%;
  background: var(--admin-accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
  text-decoration: none;
}

.notif-link:hover {
  background: var(--admin-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 54, 93, 0.2);
}

/* Filtres rapides au-dessus du tableau - Enhanced */
.admin-filter-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  padding: 5px;
}

.admin-filter-tab {
  padding: 10px 18px;
  border: 2px solid var(--admin-gray-200);
  background: #fff;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-gray-600);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-filter-tab:hover {
  border-color: var(--admin-accent);
  color: var(--admin-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.admin-filter-tab.active {
  background: var(--admin-accent);
  color: #fff;
  border-color: var(--admin-accent);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.filter-icon {
  font-size: 16px;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--admin-gray-200);
  color: var(--admin-gray-700);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.admin-filter-tab:hover .filter-count {
  background: var(--admin-accent-light);
  color: white;
}

.admin-filter-tab.active .filter-count {
  background: white;
  color: var(--admin-accent);
}

/* Tableau amélioré */
.admin-table-container {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
  margin-bottom: 30px;
}

.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.admin-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--admin-primary);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
  padding: 16px;
  text-align: left;
  transition: background-color 0.3s ease;
}

.admin-table thead th:first-child {
  border-top-left-radius: 12px;
}

.admin-table thead th:last-child {
  border-top-right-radius: 12px;
}

.admin-table tbody tr {
  transition: all 0.3s ease;
  border-bottom: 1px solid var(--admin-gray-200);
}

.admin-table tbody tr:last-child {
  border-bottom: none;
}

.admin-table tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.row-clickable {
  cursor: pointer;
}

.admin-table tbody tr:nth-child(even) {
  background: var(--admin-gray-100);
}

.admin-table tbody tr:nth-child(even):hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.admin-table td {
  padding: 16px;
  color: var(--admin-gray-700);
  vertical-align: middle;
}

.admin-table td:first-child {
  font-weight: 600;
  color: var(--admin-gray-800);
}

/* Lien pied de tableau - Enhanced */
.admin-table-footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 10px 0;
}

.admin-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--admin-accent);
  border: 2px solid var(--admin-accent);
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.admin-link-btn:hover {
  background: var(--admin-accent);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.admin-link-btn .btn-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.admin-link-btn:hover .btn-icon {
  transform: translateX(4px);
}

/* Progression par candidature - Enhanced */
.progress-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  min-width: 240px;
}

.progress-item {
  display: grid;
  grid-template-columns: 50px 1fr 45px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--admin-gray-600);
  background: var(--admin-gray-100);
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.progress-item:hover {
  background: var(--admin-gray-200);
  transform: translateX(5px);
}

.progress-item .progress-bar {
  height: 8px;
  background: var(--admin-gray-300);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-item .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--admin-accent), var(--admin-accent-light));
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

.progress-item .progress-pct {
  text-align: right;
  font-weight: 700;
  color: var(--admin-gray-800);
  background: white;
  padding: 2px 8px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Graphique (barres horizontales) - Enhanced */
.admin-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 15px;
  align-items: center;
  padding: 10px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: var(--admin-gray-100);
}

.chart-row:hover {
  background: var(--admin-gray-200);
  transform: translateX(5px);
}

.chart-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--admin-gray-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-bar {
  height: 12px;
  background: var(--admin-gray-300);
  border-radius: 6px;
  overflow: hidden;
  min-width: 150px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--admin-primary), var(--admin-primary-light));
  border-radius: 6px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(26, 54, 93, 0.3);
}

.chart-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--admin-primary);
  background: white;
  padding: 4px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  min-width: 30px;
  text-align: center;
}

/* Mode sombre (classe .dark sur <body>) - Enhanced */
.dark .admin-main {
  background-color: var(--admin-gray-900);
  color: var(--admin-gray-100);
}

.dark .campus-section-container {
  background: var(--admin-gray-800);
}

.dark .campus-section-header h2 {
  color: white;
}

.dark .campus-section-header p {
  color: var(--admin-gray-300);
}

.dark .campus-step-card,
.dark .campus-university-card,
.dark .campus-feature-card,
.dark .campus-faq-item {
  background: var(--admin-gray-800);
  border-color: var(--admin-gray-700);
}

.dark .campus-step-card h3,
.dark .campus-university-card h3,
.dark .campus-feature-card h3,
.dark .campus-faq-item h3 {
  color: white;
}

.dark .campus-step-card p,
.dark .campus-university-card p,
.dark .campus-feature-card p,
.dark .campus-faq-item p {
  color: var(--admin-gray-300);
}

.dark .admin-table-container {
  background: var(--admin-gray-800);
}

.dark .admin-table th {
  background: var(--admin-gray-700);
  color: white;
}

.dark .admin-table td {
  color: var(--admin-gray-200);
  border-bottom-color: var(--admin-gray-700);
}

.dark .admin-table tbody tr:nth-child(even) {
  background: var(--admin-gray-800);
}

.dark .admin-table tbody tr:hover {
  background: var(--admin-gray-700);
}

.dark .admin-filter-tab {
  border-color: var(--admin-gray-700);
  background: var(--admin-gray-800);
  color: var(--admin-gray-300);
}

.dark .admin-filter-tab.active {
  background: var(--admin-accent);
  border-color: var(--admin-accent);
  color: white;
}

.dark .filter-count {
  background: var(--admin-gray-700);
  color: var(--admin-gray-300);
}

.dark .admin-filter-tab.active .filter-count {
  background: white;
  color: var(--admin-accent);
}

.dark .progress-item {
  background: var(--admin-gray-800);
}

.dark .progress-item:hover {
  background: var(--admin-gray-700);
}

.dark .progress-item .progress-bar {
  background: var(--admin-gray-700);
}

.dark .progress-item .progress-pct {
  background: var(--admin-gray-800);
  color: var(--admin-gray-200);
}

.dark .chart-row {
  background: var(--admin-gray-800);
}

.dark .chart-row:hover {
  background: var(--admin-gray-700);
}

.dark .chart-bar {
  background: var(--admin-gray-700);
}

.dark .chart-value {
  background: var(--admin-gray-800);
  color: var(--admin-gray-200);
}

.dark .admin-search-input {
  background: var(--admin-gray-800);
  color: white;
  border-color: var(--admin-gray-700);
}

.dark .admin-search-input::placeholder {
  color: var(--admin-gray-500);
}

.dark .admin-user {
  background: var(--admin-gray-800);
  color: white;
}

.dark .admin-notification:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.dark .admin-notification-icon {
  color: var(--admin-gray-300);
}

.dark .admin-notification:hover .admin-notification-icon {
  color: white;
}

.dark .admin-notif-dropdown {
  background: var(--admin-gray-800);
  border-color: var(--admin-gray-700);
}

.dark .notif-header {
  background: var(--admin-gray-700);
  border-color: var(--admin-gray-600);
}

.dark .notif-header h3 {
  color: white;
}

.dark .notif-item {

.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1a365d 0%, #2d4a7c 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
}

.admin-sidebar-header {
  padding: 25px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-logo {
  color: white;
  font-size: 22px;
  font-weight: bold;
  margin: 0;
}

.admin-sidebar-nav {
  flex: 1;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 14px;
}

.admin-nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.admin-nav-item.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-left: 3px solid #007bff;
}

.admin-nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.admin-nav-label {
  font-weight: 500;
}

.admin-sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background-color: rgba(220, 53, 69, 0.8);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.admin-logout-btn:hover {
  background-color: #dc3545;
}

/* Main Content */
.admin-main {
  flex: 1;
  margin-left: 260px;
  padding: 30px;
  width: calc(100% - 260px);
}

/* Header */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.admin-header-content h1 {
  color: #1a365d;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.admin-header-content p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.admin-date {
  color: #666;
  font-size: 13px;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.admin-user-icon {
  font-size: 16px;
}

/* Statistics Cards */
.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 1200px) {
  .admin-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.admin-stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.admin-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.16);
  transition: all 0.3s ease;
}

.admin-stat-icon {
  font-size: 36px;
}

.admin-stat-info {
  display: flex;
  flex-direction: column;
}

.admin-stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1a365d;
  line-height: 1;
}

.admin-stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

/* Stat card colors */
.admin-stat-total {
  border-left: 4px solid #007bff;
}
.admin-stat-total .admin-stat-number {
  color: #007bff;
}

.admin-stat-attente {
  border-left: 4px solid #ff9800;
}

.admin-stat-attente .admin-stat-number {
  color: #ff9800;
}

.admin-stat-acceptee {
  border-left: 4px solid #28a745;
}

.admin-stat-acceptee .admin-stat-number {
  color: #28a745;
}

.admin-stat-refusee {
  border-left: 4px solid #dc3545;
}

.admin-stat-refusee .admin-stat-number {
  color: #dc3545;
}

.admin-stat-etudiants {
  border-left: 4px solid #6f42c1;
}

.admin-stat-etudiants .admin-stat-number {
  color: #6f42c1;
}

.admin-stat-incomplets {
  border-left: 4px solid #ffc107;
}

.admin-stat-incomplets .admin-stat-number {
  color: #ffc107;
}

/* Status Distribution Section */
.admin-status-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.admin-status-section h2 {
  color: #1a365d;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.admin-status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .admin-status-grid {
    grid-template-columns: 1fr;
  }
}

.admin-status-card {
  padding: 20px;
  border-radius: 10px;
  background: #f8f9fa;
}

.admin-status-card.status-attente {
  border-left: 4px solid #ffc107;
}

.admin-status-card.status-acceptee {
  border-left: 4px solid #28a745;
}

.admin-status-card.status-refusee {
  border-left: 4px solid #dc3545;
}

.admin-status-card .admin-status-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.admin-status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.admin-status-number {
  font-size: 24px;
  font-weight: 700;
  color: #1a365d;
}

.admin-status-label {
  font-size: 13px;
  color: #666;
}

.admin-status-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.admin-status-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.status-attente .admin-status-fill {
  background: linear-gradient(90deg, #ffc107, #ffcd39);
}

.status-acceptee .admin-status-fill {
  background: linear-gradient(90deg, #28a745, #34ce57);
}

.status-refusee .admin-status-fill {
  background: linear-gradient(90deg, #dc3545, #e4606d);
}

/* Recent Applications Section */
.admin-recent-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.admin-recent-section h2 {
  color: #1a365d;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.admin-table-container {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  background: #f8f9fa;
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e0e0e0;
}

.admin-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.admin-table tr:hover {
  background-color: #f8f9fa;
}

.admin-action-btn {
  padding: 6px 14px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.admin-action-btn:hover {
  background-color: #0056b3;
}

/* Quick Actions Section */
.admin-quick-actions {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.admin-quick-actions h2 {
  color: #1a365d;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.admin-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

@media (max-width: 768px) {
  .admin-actions-grid {
    grid-template-columns: 1fr;
  }
}

.admin-quick-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.admin-quick-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.admin-quick-icon {
  font-size: 20px;
}

/* Responsive */
@media (max-width: 1024px) {
  .admin-sidebar {
    width: 80px;
  }
  
  .admin-sidebar-header {
    padding: 20px 10px;
  }
  
  .admin-logo {
    font-size: 16px;
    text-align: center;
  }
  
  .admin-nav-label {
    display: none;
  }
  
  .admin-nav-item {
    justify-content: center;
    padding: 14px;
  }
  
  .admin-nav-icon {
    margin: 0;
  }
  
  .admin-sidebar-footer {
    padding: 10px;
  }
  
  .admin-logout-btn {
    justify-content: center;
    padding: 12px;
  }
  
  .admin-logout-btn span:last-child {
    display: none;
  }
  
  .admin-main {
    margin-left: 80px;
    width: calc(100% - 80px);
  }
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .admin-sidebar {
    position: relative;
    width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    padding: 10px;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .admin-sidebar-header {
    border-bottom: none;
    padding: 0;
  }
  
  .admin-sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 5px;
    padding: 0;
    justify-content: center;
  }
  
  .admin-nav-item {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .admin-nav-label {
    display: inline;
  }
  
  .admin-sidebar-footer {
    border-top: none;
    padding: 0;
  }
  
  .admin-logout-btn {
    width: auto;
    padding: 8px 12px;
  }
  
  .admin-logout-btn span:last-child {
    display: inline;
  }
  
  .admin-main {
    margin-left: 0;
    width: 100%;
    padding: 15px;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .admin-header-right {
    width: 100%;
    justify-content: space-between;
  }
}

}