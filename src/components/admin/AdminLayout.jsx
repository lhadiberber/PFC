import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "../LanguageSelector";
import Button from "../ui/Button";
import PageHeader from "../ui/PageHeader";
import { useAdmissions } from "../../context/AdmissionsContext";
import { useLanguage } from "../../context/LanguageContext";
import { clearAuthSession } from "../../services/authService";
import { getAdminStats } from "../../utils/adminApplications";

function getStoredAdminProfile() {
  try {
    const raw = localStorage.getItem("adminProfile");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getStoredSidebarCollapsed() {
  try {
    return localStorage.getItem("adminSidebarCollapsed") === "true";
  } catch (error) {
    return false;
  }
}

function getActiveMenu(pathname) {
  if (pathname.startsWith("/admin/candidatures")) return "candidatures";
  if (pathname.startsWith("/admin/etudiants")) return "etudiants";
  if (pathname.startsWith("/admin/documents")) return "documents";
  if (pathname.startsWith("/admin/profil")) return "profil";
  return "dashboard";
}

function buildInitials(fullName) {
  const parts = (fullName || "Administrateur")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "AD";
}

function AdminIcon({ name }) {
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
    case "students":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-1A3.5 3.5 0 0 0 8 19.5V21" />
          <circle cx="12" cy="9" r="3.5" />
          <path d="M20 21v-1a3 3 0 0 0-2.4-2.94" />
          <path d="M17.5 5.2a3 3 0 0 1 0 5.6" />
          <path d="M4 21v-1a3 3 0 0 1 2.4-2.94" />
          <path d="M6.5 5.2a3 3 0 0 0 0 5.6" />
        </svg>
      );
    case "document":
      return (
        <svg {...commonProps}>
          <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      );
    case "profile":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="12" cy="10" r="3" />
          <path d="M8 17c.9-1.7 2.3-2.5 4-2.5s3.1.8 4 2.5" />
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
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...commonProps}>
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9" />
          <path d="M10 19a2.2 2.2 0 0 0 4 0" />
        </svg>
      );
    case "sun":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.3" />
          <path d="M12 19.2v2.3" />
          <path d="M4.9 4.9l1.6 1.6" />
          <path d="M17.5 17.5l1.6 1.6" />
          <path d="M2.5 12h2.3" />
          <path d="M19.2 12h2.3" />
          <path d="M4.9 19.1l1.6-1.6" />
          <path d="M17.5 6.5l1.6-1.6" />
        </svg>
      );
    case "moon":
      return (
        <svg {...commonProps}>
          <path d="M18 14.5A6.5 6.5 0 0 1 9.5 6a7.5 7.5 0 1 0 8.5 8.5z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 3l7 3.5v5.7c0 4.2-2.8 7.9-7 9.3-4.2-1.4-7-5.1-7-9.3V6.5z" />
          <path d="M9.5 12.2l1.8 1.8 3.4-3.8" />
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

function getMenuItems(t) {
  return [
    {
      section: "",
      items: [
        {
          id: "dashboard",
          label: t("adminLayout.menu.dashboard"),
          icon: "dashboard",
          path: "/admin",
        },
        {
          id: "candidatures",
          label: t("adminLayout.menu.candidatures"),
          icon: "folder",
          path: "/admin/candidatures",
        },
        {
          id: "etudiants",
          label: t("adminLayout.menu.students"),
          icon: "students",
          path: "/admin/etudiants",
        },
        {
          id: "documents",
          label: t("adminLayout.menu.documents"),
          icon: "document",
          path: "/admin/documents",
        },
        {
          id: "profil",
          label: t("adminLayout.menu.profile"),
          icon: "profile",
          path: "/admin/profil",
        },
      ],
    },
  ];
}

export default function AdminLayout({
  title,
  subtitle,
  children,
  headerAction = null,
  searchValue = "",
  onSearchChange,
  onSearchKeyDown,
  searchPlaceholder = "Rechercher...",
  showSearch = true,
}) {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const { applications } = useAdmissions();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("adminDarkMode") === "true");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStoredSidebarCollapsed());
  const [showNotif, setShowNotif] = useState(false);
  const [adminProfile, setAdminProfile] = useState(() => getStoredAdminProfile());
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const adminStats = useMemo(() => getAdminStats(applications), [applications]);
  const menuItems = useMemo(() => getMenuItems(t), [t]);
  const activeMenu = getActiveMenu(location.pathname);

  const operatorName = adminProfile?.fullName || t("adminLayout.defaultOperator");
  const operatorRole = adminProfile?.role || t("adminLayout.defaultRole");
  const operatorInitials = buildInitials(operatorName);
  const formattedDate = currentTime.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("adminDarkMode", darkMode ? "true" : "false");
    return () => document.body.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", sidebarCollapsed ? "true" : "false");
  }, [sidebarCollapsed]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const syncPreferences = () => {
      setDarkMode(localStorage.getItem("adminDarkMode") === "true");
      setAdminProfile(getStoredAdminProfile());
    };

    window.addEventListener("admin:preferences-updated", syncPreferences);
    window.addEventListener("storage", syncPreferences);

    return () => {
      window.removeEventListener("admin:preferences-updated", syncPreferences);
      window.removeEventListener("storage", syncPreferences);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem("adminDarkMode");
    localStorage.removeItem("adminProfile");
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={`admin-layout ${darkMode ? "theme-dark" : ""} ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <div className="admin-brand-mark">PFC</div>
            <div className="admin-brand-copy">
              <h2 className="admin-logo">{t("common.portalAdmissions")}</h2>
              <p className="admin-logo-subtitle">{t("adminLayout.sidebarSubtitle")}</p>
            </div>
          </div>

          <Button
            className="admin-sidebar-toggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            title={sidebarCollapsed ? "Developper la navigation" : "Replier la navigation"}
          >
            <AdminIcon name={sidebarCollapsed ? "collapse-right" : "collapse-left"} />
          </Button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((group) => (
            <div key={group.section} className="admin-nav-group">
              {group.section ? (
                <span className="admin-nav-group-title">{group.section}</span>
              ) : null}

              {group.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`admin-nav-item ${activeMenu === item.id ? "active" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <span className="admin-nav-icon">
                    <AdminIcon name={item.icon} />
                  </span>
                  <span className="admin-nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Button
            className="admin-nav-item admin-logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Deconnexion" : undefined}
            aria-label="Deconnexion"
          >
            <span className="admin-nav-icon">
              <AdminIcon name="logout" />
            </span>
            <span className="admin-nav-label">Deconnexion</span>
          </Button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header admin-header-focused">
          <div className="admin-header-top">
            <div className="admin-header-content admin-header-copy-block">
              <span className="admin-page-tag admin-page-tag-admin">{t("adminLayout.spaceTag")}</span>
              <PageHeader
                title={title}
                subtitle={subtitle}
                className="admin-heading-block admin-heading-block-focused"
              />
            </div>

            {headerAction ? <div className="admin-header-top-actions">{headerAction}</div> : null}

            <div className="admin-header-meta">
              <LanguageSelector compact className="admin-language-selector" />

              <div className="admin-header-date">
                <span className="admin-header-meta-label">{t("adminLayout.dateLabel")}</span>
                <strong>{formattedDate}</strong>
              </div>

              <div className="admin-header-user">
                <span className="admin-user-avatar">{operatorInitials}</span>
                <div className="admin-user-text">
                  <strong>{operatorName}</strong>
                  <small>{operatorRole}</small>
                </div>
              </div>

              <div className="admin-header-notification" ref={notifRef}>
                <Button
                  className="admin-header-icon-button"
                  onClick={() => setShowNotif((prev) => !prev)}
                  title={t("adminLayout.notificationTitle")}
                >
                  <span className="admin-notification-icon">
                    <AdminIcon name="bell" />
                  </span>
                  <span className="admin-notification-badge">{adminStats.enAttente}</span>
                </Button>

                {showNotif && (
                  <div className="admin-notif-dropdown">
                    <div className="notif-item">
                      <strong>
                        {t("adminLayout.notifications.consolidated", {
                          count: adminStats.totalCandidatures,
                        })}
                      </strong>
                      <span>{t("adminLayout.notifications.consolidatedDetail")}</span>
                    </div>
                    <div className="notif-item">
                      <strong>
                        {t("adminLayout.notifications.pending", {
                          count: adminStats.enAttente,
                        })}
                      </strong>
                      <span>{t("adminLayout.notifications.pendingDetail")}</span>
                    </div>
                    <div className="notif-item">
                      <strong>
                        {t("adminLayout.notifications.documents", {
                          count: adminStats.documentsManquants,
                        })}
                      </strong>
                      <span>{t("adminLayout.notifications.documentsDetail")}</span>
                    </div>
                    <Button
                      className="notif-link"
                      onClick={() => {
                        setShowNotif(false);
                        navigate("/admin/candidatures");
                      }}
                    >
                      {t("adminLayout.openQueue")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showSearch && (
            <div className="admin-header-search">
              <label className="admin-search-caption" htmlFor="admin-global-search">
                {t("adminLayout.searchCaption")}
              </label>
              <div className="admin-search admin-search-wide admin-search-prominent">
                <span className="admin-search-icon">
                  <AdminIcon name="search" />
                </span>
                <input
                  id="admin-global-search"
                  type="text"
                  value={searchValue}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="admin-search-input"
                />
              </div>
              <p className="admin-search-helper">
                {t("adminLayout.searchHelper")}
              </p>
            </div>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}

AdminLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  headerAction: PropTypes.node,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onSearchKeyDown: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  showSearch: PropTypes.bool,
};

AdminIcon.propTypes = {
  name: PropTypes.string.isRequired,
};
