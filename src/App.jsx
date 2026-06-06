import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import "./index.css";
import Home from "./pages/Home";
import StudentStep1 from "./pages/Student/StudentStep1";
import StudentStep2 from "./pages/Student/StudentStep2";
import StudentStep3 from "./pages/Student/StudentStep3";
import StudentRecapitulatif from "./pages/Student/StudentRecapitulatif";
import DashboardAdmin from "./pages/Admin/DashboardAdmin.jsx";
import CandidaturesAdmin from "./pages/Admin/CandidaturesAdmin.jsx";
import EtudiantsAdmin from "./pages/Admin/EtudiantsAdmin.jsx";
import DetailEtudiantAdmin from "./pages/Admin/DetailEtudiantAdmin.jsx";
import DocumentsAdmin from "./pages/Admin/DocumentsAdmin.jsx";
import DetailDocumentAdmin from "./pages/Admin/DetailDocumentAdmin.jsx";
import ProfilAdmin from "./pages/Admin/ProfilAdmin.jsx";
import DetailCandidaturesAdmin from "./pages/Admin/DetailCandidaturesAdmin.jsx";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Success from "./pages/Auth/Success";
import StudentDashboard from "./pages/Student/StudentDashboard";
import MesCandidatures from "./pages/Student/MesCandidatures";
import Profil from "./pages/Student/Profil";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard.jsx";
import AdminsManagement from "./pages/SuperAdmin/AdminsManagement.jsx";
import UsersManagement from "./pages/SuperAdmin/UsersManagement.jsx";
import SuperAdminProfile from "./pages/SuperAdmin/SuperAdminProfile.jsx";
import Navbar from "./components/Navbar";
import { useAdmissions } from "./context/AdmissionsContext";
import { clearAuthSession, getAuthSession } from "./services/authService";
import { setLoadingFn, clearLoadingFn } from "./utils/toast";

const ADMIN_ROLES = ["admin", "super_admin"];
const SUPER_ADMIN_HOME = "/super-admin";

function getHomePath(role) {
  if (role === "super_admin") return SUPER_ADMIN_HOME;
  if (role === "admin") return "/admin";
  return "/dashboard";
}

// Verifie que la page demandee correspond au role connecte.
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { hasSavedProfile } = useAdmissions();
  const session = getAuthSession();
  const userRole = session?.role;

  if (!session?.token || !userRole) {
    clearAuthSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: "Session absente ou expiree. Veuillez vous reconnecter." }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={getHomePath(userRole)} replace />;
  }

  if (userRole === "student" && location.pathname !== "/profil" && !hasSavedProfile) {
    return <Navigate to="/profil" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

function AppContent() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const location = useLocation();
  const isAdminPage =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin");
  const hideNavbar =
    ["/", "/login", "/register", "/success"].includes(location.pathname) || isAdminPage;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    setLoadingFn((show, text) => {
      setLoading(show);
      if (show && text) setLoadingText(text);
    });

    return () => {
      clearLoadingFn();
    };
  }, []);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "main-content-full" : "main-content"}>
        {loading && (
          <div className="spinner-overlay">
            <div style={{ textAlign: "center" }}>
              <div className="spinner"></div>
              <div className="spinner-text">{loadingText}</div>
            </div>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/student" element={<Navigate to="/student-step1" replace />} />
          <Route path="/student-step1" element={<ProtectedRoute allowedRoles={["student"]}><StudentStep1 /></ProtectedRoute>} />
          <Route path="/student-step2" element={<ProtectedRoute allowedRoles={["student"]}><StudentStep2 /></ProtectedRoute>} />
          <Route path="/student-step3" element={<ProtectedRoute allowedRoles={["student"]}><StudentStep3 /></ProtectedRoute>} />
          <Route path="/student-recapitulatif" element={<ProtectedRoute allowedRoles={["student"]}><StudentRecapitulatif /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/admin/candidatures" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CandidaturesAdmin /></ProtectedRoute>} />
          <Route path="/admin/candidatures/:id" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DetailCandidaturesAdmin /></ProtectedRoute>} />
          <Route path="/admin/etudiants" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><EtudiantsAdmin /></ProtectedRoute>} />
          <Route path="/admin/etudiants/:id" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DetailEtudiantAdmin /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DocumentsAdmin /></ProtectedRoute>} />
          <Route path="/admin/documents/:documentId" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DetailDocumentAdmin /></ProtectedRoute>} />
          <Route path="/admin/documents/:applicationId/:documentKey" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><DetailDocumentAdmin /></ProtectedRoute>} />
          <Route path="/admin/profil" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ProfilAdmin /></ProtectedRoute>} />
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin/admins" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminsManagement /></ProtectedRoute>} />
          <Route path="/super-admin/users" element={<ProtectedRoute allowedRoles={["super_admin"]}><UsersManagement /></ProtectedRoute>} />
          <Route path="/super-admin/profil" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminProfile /></ProtectedRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/success" element={<Success />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/mes-candidatures" element={<ProtectedRoute allowedRoles={["student"]}><MesCandidatures /></ProtectedRoute>} />
          <Route path="/candidatures" element={<ProtectedRoute allowedRoles={["student"]}><MesCandidatures /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute allowedRoles={["student"]}><Profil /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
