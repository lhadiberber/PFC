import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdmissionsProvider } from "./context/AdmissionsContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AdmissionsProvider>
        <App />
      </AdmissionsProvider>
    </LanguageProvider>
  </React.StrictMode>
);
