import { Link } from "react-router-dom";
import "../index.css";

export default function StudentDashboard() {
  return (
    <div className="page">
      <h1>Mon Compte</h1>
      <p>Bienvenue dans votre espace personnel</p>
      
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Deposer une candidature</h3>
          <p>Soumettez votre dossier d'admission a l'universite</p>
          <Link to="/student">
            <button className="dashboard-btn">Commencer</button>
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>Mes Candidatures</h3>
          <p>Suivez l'etat de vos demandes</p>
          <button className="dashboard-btn" disabled>En attente</button>
        </div>

        <div className="dashboard-card">
          <h3>Mon Profil</h3>
          <p>Gerez vos informations personnelles</p>
          <button className="dashboard-btn" disabled>En construction</button>
        </div>

      <div className="actions" style={{ marginTop: "30px" }}>
        <Link to="/">
          <button type="button" className="retour-btn">Deconnexion</button>
        </Link>
      </div>
  );
}
