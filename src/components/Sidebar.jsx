import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";

function SidebarIcon({ name }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
        </svg>
      );
    case "file":
      return (
        <svg {...commonProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...commonProps}>
          <path d="M12 15V3" />
          <path d="m7 8 5-5 5 5" />
          <path d="M4 21h16" />
        </svg>
      );
    case "user":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22a8 8 0 0 1 16 0" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
          <path d="M16.5 10.5a3 3 0 1 0-.8-5.9" />
          <path d="M17.5 20.5a5.5 5.5 0 0 0-3-5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 3 5 6.5v5.7c0 4.2 2.8 7.9 7 9.3 4.2-1.4 7-5.1 7-9.3V6.5z" />
          <path d="m9.5 12 1.7 1.7 3.5-4" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "globe":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 0 20" />
          <path d="M12 2a15.3 15.3 0 0 0 0 20" />
        </svg>
      );
    case "menu":
      return (
        <svg {...commonProps}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
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

function isItemActive(item, pathname) {
  if (item.activePaths?.includes(pathname)) return true;
  if (item.activePrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
  return item.path === pathname;
}

export default function Sidebar({
  brandHref = "/",
  brandTitle,
  brandSubtitle,
  className = "",
  navGroups,
  onLogout,
  userInitials,
  userName,
  userSubtitle,
}) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (event, item) => {
    if (isItemActive(item, location.pathname)) {
      event.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="app-sidebar-mobile-trigger"
        aria-label={isMobileOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((current) => !current)}
      >
        <SidebarIcon name="menu" />
      </button>

      {isMobileOpen ? (
        <button
          type="button"
          className="app-sidebar-overlay"
          aria-label="Fermer la navigation"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

      <aside className={`app-sidebar ${isMobileOpen ? "is-open" : ""} ${className}`.trim()}>
        <div className="app-sidebar-brand">
          <Link to={brandHref} className="app-sidebar-brand-link">
            <span className="app-sidebar-logo">UP</span>
            <span className="app-sidebar-brand-copy">
              <strong>{brandTitle}</strong>
              <small>{brandSubtitle}</small>
            </span>
          </Link>
        </div>

        <div className="app-sidebar-user">
          <span className="app-sidebar-avatar">{userInitials}</span>
          <span className="app-sidebar-user-copy">
            <strong>{userName}</strong>
            <small>{userSubtitle}</small>
          </span>
        </div>

        <nav className="app-sidebar-nav" aria-label="Navigation principale">
          {navGroups.map((group) => (
            <div key={group.section || "main"} className="app-sidebar-nav-group">
              {group.section ? <span className="app-sidebar-section">{group.section}</span> : null}
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(event) => handleNavClick(event, item)}
                  className={`app-sidebar-link ${
                    isItemActive(item, location.pathname) ? "active" : ""
                  }`.trim()}
                >
                  <span className="app-sidebar-icon">
                    <SidebarIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-spacer" />

        <div className="app-sidebar-bottom">
          <div className="app-sidebar-language">
            <span className="app-sidebar-language-icon">
              <SidebarIcon name="globe" />
            </span>
            <LanguageSelector compact variant="dark" />
          </div>

          <button type="button" className="app-sidebar-logout" onClick={onLogout}>
            <span className="app-sidebar-icon">
              <SidebarIcon name="logout" />
            </span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  brandHref: PropTypes.string,
  brandSubtitle: PropTypes.string.isRequired,
  brandTitle: PropTypes.string.isRequired,
  className: PropTypes.string,
  navGroups: PropTypes.arrayOf(
    PropTypes.shape({
      section: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          activePaths: PropTypes.arrayOf(PropTypes.string),
          activePrefixes: PropTypes.arrayOf(PropTypes.string),
          icon: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          path: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  onLogout: PropTypes.func.isRequired,
  userInitials: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  userSubtitle: PropTypes.string.isRequired,
};

SidebarIcon.propTypes = {
  name: PropTypes.string.isRequired,
};
