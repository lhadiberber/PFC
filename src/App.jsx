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
import Navbar from "./components/Navbar";
import ToastContainer from "./components/Toast";
import { useAdmissions } from "./context/AdmissionsContext";
import { setToastFn, setLoadingFn, clearToastFn, clearLoadingFn } from "./utils/toast";

// Protected Route component
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { hasSavedProfile } = useAdmissions();
  const userRole = localStorage.getItem("userRole");

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} replace />;
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

// Inner component that uses useLocation inside Router context
function AppContent() {
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  // Get current location to determine if navbar should be hidden
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const hideNavbar = ["/", "/login", "/register", "/success"].includes(location.pathname) || isAdminPage;

  useEffect(() => {
    setToastFn((message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    });

    setLoadingFn((show, text) => {
      setLoading(show);
      if (show && text) setLoadingText(text);
    });

    return () => {
      clearToastFn();
      clearLoadingFn();
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/student" element={<Navigate to="/student-step1" replace />} />
          <Route path="/student-step1" element={<ProtectedRoute allowedRoles={["student"]}><StudentStep1 /></ProtectedRoute>} />
          <Route path="/student-step2" element={<ProtectedRoute allowedRoles={["student"]}><StudentStep2 /></ProtectedRoute>} />
          <Route path="/student-step3" element={<ProtectedRoute allowedRoles={["student"]}><StudentStep3 /></ProtectedRoute>} />
          <Route path="/student-recapitulatif" element={<ProtectedRoute allowedRoles={["student"]}><StudentRecapitulatif /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/admin/candidatures" element={<ProtectedRoute allowedRoles={["admin"]}><CandidaturesAdmin /></ProtectedRoute>} />
          <Route path="/admin/candidatures/:id" element={<ProtectedRoute allowedRoles={["admin"]}><DetailCandidaturesAdmin /></ProtectedRoute>} />
          <Route path="/admin/etudiants" element={<ProtectedRoute allowedRoles={["admin"]}><EtudiantsAdmin /></ProtectedRoute>} />
          <Route path="/admin/etudiants/:id" element={<ProtectedRoute allowedRoles={["admin"]}><DetailEtudiantAdmin /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute allowedRoles={["admin"]}><DocumentsAdmin /></ProtectedRoute>} />
          <Route path="/admin/documents/:applicationId/:documentKey" element={<ProtectedRoute allowedRoles={["admin"]}><DetailDocumentAdmin /></ProtectedRoute>} />
          <Route path="/admin/profil" element={<ProtectedRoute allowedRoles={["admin"]}><ProfilAdmin /></ProtectedRoute>} />
          
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
