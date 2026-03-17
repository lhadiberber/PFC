import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdmissions } from "../../context/AdmissionsContext";
import { formatAdminDate, formatAdminDateTime, toAdminApplication } from "../../utils/adminApplications";
import {
  buildStudentRecords,
  findStudentRecordByApplicationId,
  getStudentStatusMeta,
} from "../../utils/adminStudents";
import "../../index.css";

const DOCUMENT_FIELDS = [
  { key: "carteIdentite", label: "Passeport / carte d'identite" },
  { key: "releveNotes", label: "Releve de notes" },
  { key: "cv", label: "CV" },
  { key: "copieBac", label: "Diplome" },
  { key: "lettreMotivation", label: "Lettre de motivation" },
];

function getFieldValue(value, fallback = "Non renseigne") {
  return value && String(value).trim() ? value : fallback;
}

export default function DetailEtudiantAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { applications, activityLog } = useAdmissions();

  const student = useMemo(() => {
    const records = buildStudentRecords(applications.map(toAdminApplication)).map((record) => ({
      ...record,
      statusMeta: getStudentStatusMeta(record),
    }));

    return findStudentRecordByApplicationId(records, id) || null;
  }, [applications, id]);

  const history = useMemo(() => {
    if (!student) {
      return [];
    }

    const studentApplicationIds = new Set(
      student.applications.map((application) => String(application.id))
    );

    return [...activityLog]
      .filter((entry) => studentApplicationIds.has(String(entry.applicationId)))
      .sort((first, second) => new Date(second.occurredAt) - new Date(first.occurredAt));
  }, [activityLog, student]);

  if (!student) {
    return (
      <AdminLayout
        title="Fiche etudiant"
        subtitle="Consultation du profil et des informations de candidature"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Etudiant introuvable"
            description="Ce profil n'existe pas ou n'est plus disponible."
            actionLabel="Retour aux etudiants"
            actionTo="/admin/etudiants"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  const latestApplication = student.latestApplication;
  const documents = DOCUMENT_FIELDS.map((documentField) => {
    const value =
      documentField.key === "lettreMotivation"
        ? latestApplication.details?.motivation || latestApplication.details?.lettreMotivation
        : latestApplication.details?.[documentField.key];

    return {
      ...documentField,
      value,
      provided: Boolean(value),
    };
  });

  return (
    <AdminLayout
      title="Fiche etudiant"
      subtitle="Consultation du profil et des informations de candidature"
      showSearch={false}
    >
      <section className="campus-section-container">
        <div className="admin-application-hero">
          <div className="admin-application-hero-copy">
            <Link to="/admin/etudiants" className="admin-application-back-link">
              Retour aux etudiants
            </Link>
            <span className="admin-section-kicker">Profil etudiant</span>
            <h2>{student.fullName}</h2>
            <p className="admin-application-dossier-id">{student.email}</p>

            <div className="admin-application-hero-tags">
              <StatusBadge status={student.statusMeta.badgeStatus} />
              <span className="admin-page-context neutral">
                Inscrit le {formatAdminDate(student.firstDate)}
              </span>
              <span className="admin-page-context info">
                {student.candidaturesCount} candidature(s)
              </span>
            </div>

            <div className="admin-application-hero-grid">
              <div className="admin-application-hero-item">
                <span>Universite</span>
                <strong>{student.latestUniversite}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Programme</span>
                <strong>{student.latestProgramme}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Diplome</span>
                <strong>{student.latestDiplome}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Annee</span>
                <strong>{getFieldValue(student.latestYear, "Non renseignee")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-application-hero-actions">
            <Button
              className="admin-header-primary-action"
              onClick={() => navigate(`/admin/candidatures/${student.latestApplicationId}`)}
            >
              Voir la candidature
            </Button>
          </div>
        </div>
      </section>

      <section className="campus-section-container">
        <div className="admin-application-layout">
          <div className="admin-application-main">
            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations personnelles</h3>
                  <p>Coordonnees et identite du profil etudiant</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Nom", student.nom],
                  ["Prenom", student.prenom],
                  ["Email", student.email],
                  ["Telephone", student.telephone],
                  ["Nationalite", student.nationalite],
                  ["Date de naissance", latestApplication.details?.dateNaiss],
                ].map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>{getFieldValue(value)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Informations academiques</h3>
                  <p>Donnees les plus recentes transmises dans le dossier</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Universite", student.latestUniversite],
                  ["Programme", student.latestProgramme],
                  ["Diplome", student.latestDiplome],
                  ["Annee", latestApplication.details?.anneeBac],
                  ["Moyenne", latestApplication.details?.moyenneBac],
                  ["Mention", latestApplication.details?.mention],
                ].map(([label, value]) => (
                  <div key={label} className="admin-application-info-item">
                    <span>{label}</span>
                    <strong>{getFieldValue(value)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Documents</h3>
                  <p>Pieces associees a la derniere candidature du profil</p>
                </div>
              </div>

              <div className="admin-application-documents">
                {documents.map((document) => (
                  <div
                    key={document.key}
                    className={`admin-application-document-row ${
                      document.provided ? "provided" : "missing"
                    }`}
                  >
                    <div className="admin-application-document-main">
                      <strong>{document.label}</strong>
                      <span>
                        {document.provided ? document.value : "Document non fourni"}
                      </span>
                    </div>
                    <div className="admin-application-document-side">
                      <span className={`admin-queue-pill ${document.provided ? "positive" : "warning"}`}>
                        {document.provided ? "Recu" : "Manquant"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="admin-application-side">
            <article className="admin-meta-card admin-application-sticky-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Statut de candidature</h3>
                  <p>Lecture de la candidature la plus recente du profil</p>
                </div>
              </div>

              <div className="admin-application-summary-grid">
                <div className="admin-application-summary-item">
                  <span>Statut</span>
                  <strong>{student.statusMeta.label}</strong>
                  <StatusBadge status={student.statusMeta.badgeStatus} />
                </div>
                <div className="admin-application-summary-item">
                  <span>Dernier depot</span>
                  <strong>{formatAdminDate(student.latestDate)}</strong>
                  <p>{student.latestUniversite}</p>
                </div>
                <div className="admin-application-summary-item">
                  <span>Candidatures</span>
                  <strong>{student.candidaturesCount}</strong>
                  <p>{student.acceptedCount} acceptee(s), {student.rejectedCount} refusee(s)</p>
                </div>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Historique</h3>
                  <p>Chronologie des actions liees a ce profil</p>
                </div>
              </div>

              {history.length === 0 ? (
                <p className="admin-note-empty">Aucun evenement n'est disponible pour ce profil.</p>
              ) : (
                <div className="admin-application-history">
                  {history.map((entry) => (
                    <article key={entry.id} className="admin-application-history-item">
                      <div className={`admin-application-history-dot ${entry.tone || "neutral"}`} />
                      <div className="admin-application-history-content">
                        <div className="admin-application-history-head">
                          <strong>{entry.title}</strong>
                          <span>{formatAdminDateTime(entry.occurredAt)}</span>
                        </div>
                        <p>{entry.description}</p>
                        {entry.detail ? (
                          <small className="admin-application-history-detail">{entry.detail}</small>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
