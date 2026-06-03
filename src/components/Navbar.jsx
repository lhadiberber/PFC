import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useLanguage } from "../context/LanguageContext";
import { clearAuthSession, getAuthSession } from "../services/authService";
import "../index.css";

function buildInitials(fullName) {
  const parts = (fullName || "Etudiant")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "ET";
}

export default function Navbar() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAuthSession();
  const userRole = session?.role;
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
        return;
      }

      const sessionUser = getAuthSession()?.user;
      setProfileData({
        prenom: sessionUser?.prenom || "",
        nom: sessionUser?.nom || "",
        email: sessionUser?.email || "",
      });
    } catch (_error) {
      setProfileData({ prenom: "", nom: "", email: "" });
    }
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem("studentProfile");
    localStorage.removeItem("studentDocuments");
    localStorage.removeItem("studentApplicationDraft");
    navigate("/login", { replace: true });
  };

  if (hideNavbar || userRole !== "student") {
    return null;
  }

  const fullName = [profileData.prenom, profileData.nom].filter(Boolean).join(" ").trim();
  const displayName = fullName || profileData.email || t("studentNav.fallbackUser");
  const initials = buildInitials(displayName);

  const navGroups = [
    {
      section: "",
      items: [
        {
          path: "/dashboard",
          label: t("studentNav.dashboard"),
          icon: "dashboard",
        },
        {
          path: "/mes-candidatures",
          label: t("studentNav.applications"),
          icon: "file",
          activePaths: ["/mes-candidatures", "/candidatures"],
        },
        {
          path: "/student-step1",
          label: t("studentNav.submit"),
          icon: "upload",
          activePaths: ["/student", "/student-recapitulatif"],
          activePrefixes: ["/student-step"],
        },
        {
          path: "/profil",
          label: t("studentNav.profile"),
          icon: "user",
        },
      ],
    },
  ];

  return (
    <Sidebar
      brandHref="/dashboard"
      brandTitle={t("common.portalAdmissions")}
      brandSubtitle={t("common.candidateSpace")}
      navGroups={navGroups}
      onLogout={handleLogout}
      userInitials={initials}
      userName={displayName}
      userSubtitle={t("studentNav.tracking")}
    />
  );
}
