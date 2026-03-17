import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../index.css";

function getStoredSidebarCollapsed() {
  try {
    return localStorage.getItem("studentSidebarCollapsed") === "true";
  } catch (error) {
    return false;
  }
}

function buildInitials(fullName) {
  const parts = (fullName || "Etudiant")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "ET";
}

function StudentNavIcon({ name }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "folder":
      return (
        <svg {...commonProps}>
          <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
        </svg>
      );
    case "upload":
      return (
        <svg {...commonProps}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      );
    case "profile":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 4v16" />
        </svg>
      );
    case "collapse-left":
      return (
        <svg {...commonProps}>
          <path d="M15 6l-6 6 6 6" />
          <path d="M20 4v16" />
        </svg>
      );
    case "collapse-right":
      return (
        <svg {...commonProps}>
          <path d="M9 6l6 6-6 6" />
          <path d="M4 4v16" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStoredSidebarCollapsed());
  const [profileData, setProfileData] = useState({
    prenom: "",
    nom: "",
    email: "",
  });

  const hideNavbar = ["/", "/login", "/register", "/success"].includes(location.pathname);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("studentProfile");
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData({
          prenom: parsedProfile?.prenom || "",
          nom: parsedProfile?.nom || "",
          email: parsedProfile?.email || "",
        });
      }
    } catch (error) {
      console.error("Impossible de lire le profil etudiant", error);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("student-sidebar-collapsed", sidebarCollapsed);
    localStorage.setItem("studentSidebarCollapsed", sidebarCollapsed ? "true" : "false");

    return () => {
      document.body.classList.remove("student-sidebar-collapsed");
    };
  }, [sidebarCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("studentProfile");
    localStorage.removeItem("user");
    localStorage.removeItem("studentDocuments");
    navigate("/");
  };

  if (hideNavbar) {
    return null;
  }

  const fullName = [profileData.prenom, profileData.nom].filter(Boolean).join(" ").trim();
  const displayName = fullName || profileData.email || "Etudiant";
  const initials = buildInitials(displayName);

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: "dashboard",
      active: location.pathname === "/dashboard",
    },
    {
      to: "/mes-candidatures",
      label: "Mes candidatures",
      icon: "folder",
      active: location.pathname === "/mes-candidatures" || location.pathname === "/candidatures",
    },
    {
      to: "/student-step1",
      label: "Deposer un dossier",
      icon: "upload",
      active:
        location.pathname.startsWith("/student-step") ||
        location.pathname === "/student" ||
        location.pathname === "/student-recapitulatif",
    },
    {
      to: "/profil",
      label: "Profil",
      icon: "profile",
      active: location.pathname === "/profil",
    },
  ];

  return (
    <nav
      className={`navbar-vertical navbar-vertical-student ${
        sidebarCollapsed ? "student-sidebar-collapsed" : ""
      }`.trim()}
    >
      <div className="navbar-vertical-header">
        <div className="student-sidebar-brand">
          <div className="student-sidebar-mark">PFC</div>
          <div className="student-sidebar-copy">
            <Link to="/dashboard" className="student-sidebar-brand-link">
              Portail Admissions
            </Link>
            <p className="student-sidebar-subtitle">Espace candidat</p>
          </div>
        </div>

        <button
          type="button"
          className="student-sidebar-toggle"
          onClick={() => setSidebarCollapsed((current) => !current)}
          title={sidebarCollapsed ? "Developper la navigation" : "Replier la navigation"}
          aria-label={sidebarCollapsed ? "Developper la navigation" : "Replier la navigation"}
        >
          <StudentNavIcon name={sidebarCollapsed ? "collapse-right" : "collapse-left"} />
        </button>
      </div>

      <div className="student-sidebar-user">
        <span className="student-sidebar-avatar">{initials}</span>
        <div className="student-sidebar-user-copy">
          <strong>{displayName}</strong>
          <span>Suivi de candidature</span>
        </div>
      </div>

      <div className="navbar-links-vertical student-sidebar-links">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`student-nav-item ${item.active ? "active" : ""}`.trim()}
          >
            <span className="nav-icon student-nav-icon">
              <StudentNavIcon name={item.icon} />
            </span>
            <span className="nav-text student-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="student-sidebar-footer">
        <button onClick={handleLogout} className="student-nav-item student-nav-item-danger navbar-logout-vertical">
          <span className="nav-icon student-nav-icon">
            <StudentNavIcon name="logout" />
          </span>
          <span className="nav-text student-nav-label">Deconnexion</span>
        </button>
      </div>
    </nav>
  );
}
