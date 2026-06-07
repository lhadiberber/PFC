import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  clearAuthSession,
  getApiErrorMessage,
  getApiRetryingMessage,
  getApiUnavailableMessage,
  getAuthToken,
  isNetworkUnavailableError,
} from "../../services/authService";
import { getAdminStudent } from "../../services/adminService";
import { formatAdminDate, formatAdminDateTime, toAdminApplication } from "../../utils/adminApplications";
import {
  getStudentStatusMeta,
} from "../../utils/adminStudents";
import "../../index.css";

const DOCUMENT_FIELDS = [
  { key: "releveNotes", label: "Relevé de notes du baccalauréat" },
  { key: "attestationReussite", label: "Attestation de réussite au bac" },
  { key: "carteIdentite", label: "Pièce d'identité" },
  { key: "photo", label: "Photo d'identité" },
  { key: "residence", label: "Certificat de résidence" },
];

function getFieldValue(value, fallback = "Non renseigné") {
  return value && String(value).trim() ? value : fallback;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeStatus(status) {
  if (["Acceptée", "Acceptee"].includes(status)) return "Acceptee";
  if (["Refusée", "Refusee", "Rejetee"].includes(status)) return "Rejetee";
  return "En attente";
}

function mapStudentDetailToRecord(data) {
  if (!data?.user) {
    return null;
  }

  const applications = (data.applications || []).map((application) =>
    toAdminApplication({
      id: application.id,
      numeroDossier: application.numeroDossier,
      universite: application.universite,
      specialite: application.formation || application.specialite,
      niveauDemande: application.niveau,
      dateDepot: application.date_depot || application.dateDepot,
      submittedAt: application.date_depot || application.submittedAt,
      statut: normalizeStatus(application.statut),
      details: application.details || {
        nom: data.user.nom,
        prenom: data.user.prenom,
        email: data.user.email,
        telephone: data.profile?.telephone,
        dateNaiss: data.profile?.date_naissance,
        nationalite: data.profile?.nationalite,
        adresse: data.profile?.adresse,
        typeBac: data.profile?.diplome_actuel,
        diplomeActuel: data.profile?.diplome_actuel,
        etablissementActuel: data.profile?.etablissement,
        specialiteActuelle: data.profile?.specialite_actuelle,
        anneeBac: data.profile?.annee_obtention,
        moyenneBac: data.profile?.moyenne,
      },
      adminMeta: { internalPriority: "moyenne", internalStatus: "qualification", assignedTo: "" },
    })
  );
  const latestApplication = applications[0] || null;
  const baseRecord = {
    key: String(data.user.id),
    id: data.user.id,
    prenom: data.user.prenom || "",
    nom: data.user.nom || "",
    fullName: [data.user.prenom, data.user.nom].filter(Boolean).join(" ") || data.user.email,
    email: data.user.email,
    telephone: data.profile?.telephone || "Non renseigné",
    nationalite: data.profile?.nationalite || "Non renseignée",
    latestApplicationId: latestApplication?.id || data.user.id,
    latestDate: latestApplication?.dateDepot || data.user.created_at,
    firstDate: data.user.created_at,
    latestStatus: latestApplication?.statut || "En attente",
    latestUniversite: latestApplication?.universite || "Aucune candidature",
    latestProgramme: latestApplication?.specialite || "Aucune candidature",
    latestDiplome: data.profile?.diplome_actuel || "Profil non complété",
    latestYear: data.profile?.annee_obtention || "Non renseignée",
    latestApplication,
    applications,
    documents: data.documents || [],
    profile: data.profile || {},
    candidaturesCount: applications.length,
    pendingCount: applications.filter((application) => application.statut === "En attente").length,
    acceptedCount: applications.filter((application) => application.statut === "Acceptee").length,
    rejectedCount: applications.filter((application) => application.statut === "Rejetee").length,
  };

  return {
    ...baseRecord,
    statusMeta: getStudentStatusMeta({
      ...baseRecord,
      profilCompletion: data.profile?.telephone ? 100 : 50,
      documentsCompletion: data.documents?.length ? 100 : 0,
      academiqueCompletion: data.profile?.diplome_actuel ? 100 : 50,
    }),
  };
}

export default function DetailEtudiantAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadStudent() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expirée. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsLoadingStudent(true);
      setStudentError("");

      try {
        let studentResponse = null;
        let lastNetworkError = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            studentResponse = await getAdminStudent(id);
            lastNetworkError = null;
            break;
          } catch (error) {
            if (error.status === 401 || !isNetworkUnavailableError(error)) {
              throw error;
            }

            lastNetworkError = error;

            if (isActive) {
              setStudentError(getApiRetryingMessage("des étudiants"));
            }

            await wait(600 * (attempt + 1));
          }
        }

        if (lastNetworkError) {
          throw lastNetworkError;
        }

        if (isActive) {
          setStudentError("");
          setStudentData(studentResponse);
        }
      } catch (error) {
        if (!isActive) return;

        if (error.status === 401) {
          const message = "Session expirée. Veuillez vous reconnecter.";
          clearAuthSession();
          navigate("/login", { state: { message } });
          return;
        }

        setStudentError(
          isNetworkUnavailableError(error)
            ? getApiUnavailableMessage("des étudiants")
            : error.status === 403
              ? "Accès refusé. Cette page est réservée aux administrateurs."
              : getApiErrorMessage(error, "Impossible de charger l'étudiant.")
        );
      } finally {
        if (isActive) setIsLoadingStudent(false);
      }
    }

    loadStudent();

    return () => {
      isActive = false;
    };
  }, [id, navigate, reloadKey]);

  const student = useMemo(() => mapStudentDetailToRecord(studentData), [studentData]);

  const history = useMemo(() => {
    if (!student) return [];

    return student.applications.map((application) => ({
      id: `application-${application.id}`,
      title: "Candidature déposée",
      description: `${application.specialite} - ${application.universite}`,
      occurredAt: application.dateDepot,
      tone: "info",
    }));
  }, [student]);

  if (isLoadingStudent && !student) {
    return (
      <AdminLayout
        title="Fiche étudiant"
        subtitle="Consultation du profil et des informations de candidature"
        showSearch={false}
      >
        <section className="campus-section-container">
          <div className="student-profile-feedback">Chargement du profil étudiant...</div>
        </section>
      </AdminLayout>
    );
  }

  if (studentError && !student) {
    return (
      <AdminLayout
        title="Fiche étudiant"
        subtitle="Consultation du profil et des informations de candidature"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Impossible de charger l'étudiant"
            description={studentError}
            actionLabel="Retour aux étudiants"
            actionTo="/admin/etudiants"
            className="admin-empty-state"
          />
          <div className="admin-dashboard-topbar-actions">
            <Button
              className="campus-btn-primary"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Réessayer
            </Button>
          </div>
        </section>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout
        title="Fiche étudiant"
        subtitle="Consultation du profil et des informations de candidature"
        showSearch={false}
      >
        <section className="campus-section-container">
          <EmptyState
            title="Étudiant introuvable"
            description="Ce profil n'existe pas ou n'est plus disponible."
            actionLabel="Retour aux étudiants"
            actionTo="/admin/etudiants"
            className="admin-empty-state"
          />
        </section>
      </AdminLayout>
    );
  }

  const latestApplication = student.latestApplication || { details: {} };
  const uploadedDocuments = Array.isArray(student.documents) ? student.documents : [];
  const documents =
    uploadedDocuments.length > 0
      ? uploadedDocuments.map((document) => ({
          key: String(document.id),
          label: document.type_document || "Document",
          value: document.nom_fichier,
          status: document.statut,
          provided: Boolean(document.nom_fichier),
        }))
      : DOCUMENT_FIELDS.map((documentField) => {
          const value = latestApplication.details?.[documentField.key];

          return {
            ...documentField,
            value,
            status: "",
            provided: Boolean(value),
          };
        });

  return (
    <AdminLayout
      title="Fiche étudiant"
      subtitle="Consultation du profil et des informations de candidature"
      showSearch={false}
    >
      <section className="campus-section-container">
        <div className="admin-application-hero">
          <div className="admin-application-hero-copy">
            <Link to="/admin/etudiants" className="admin-application-back-link">
              Retour aux étudiants
            </Link>
            <span className="admin-section-kicker">Profil étudiant</span>
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
                <span>Université</span>
                <strong>{student.latestUniversite}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Programme</span>
                <strong>{student.latestProgramme}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Diplôme</span>
                <strong>{student.latestDiplome}</strong>
              </div>
              <div className="admin-application-hero-item">
                <span>Année</span>
                <strong>{getFieldValue(student.latestYear, "Non renseignée")}</strong>
              </div>
            </div>
          </div>

          <div className="admin-application-hero-actions">
            {student.latestApplication ? (
              <Button
                className="admin-header-primary-action"
                onClick={() => navigate(`/admin/candidatures/${student.latestApplicationId}`)}
              >
                Voir la candidature
              </Button>
            ) : (
              <Button className="admin-header-primary-action" disabled>
                Aucune candidature
              </Button>
            )}
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
                  <p>Informations personnelles de l'étudiant</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Nom", student.nom],
                  ["Prénom", student.prenom],
                  ["Email", student.email],
                  ["Téléphone", student.telephone],
                  ["Nationalité", student.nationalite],
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
                  <h3>Informations académiques</h3>
                  <p>Données les plus récentes transmises dans le dossier</p>
                </div>
              </div>

              <div className="admin-application-info-grid">
                {[
                  ["Université", student.latestUniversite],
                  ["Programme", student.latestProgramme],
                  ["Diplôme", student.latestDiplome],
                  ["Année", latestApplication.details?.anneeBac],
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
                  <h3>Candidatures</h3>
                  <p>Dossiers de candidature associés à cet étudiant</p>
                </div>
              </div>

              {student.applications.length === 0 ? (
                <p className="admin-note-empty">Aucune candidature pour cet étudiant.</p>
              ) : (
                <div className="admin-application-documents">
                  {student.applications.map((application) => (
                    <div key={application.id} className="admin-application-document-row provided">
                      <div className="admin-application-document-main">
                        <strong>{application.specialite}</strong>
                        <span>
                          {application.universite} - {formatAdminDate(application.dateDepot)}
                        </span>
                      </div>
                      <div className="admin-application-document-side">
                        <StatusBadge status={application.statut} />
                        <Button
                          className="admin-header-secondary-action"
                          onClick={() => navigate(`/admin/candidatures/${application.id}`)}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Documents</h3>
                  <p>Pièces associées au profil et aux candidatures</p>
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
                        {document.status || (document.provided ? "Reçu" : "Manquant")}
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
                  <p>Lecture de la candidature la plus récente du profil</p>
                </div>
              </div>

              <div className="admin-application-summary-grid">
                <div className="admin-application-summary-item">
                  <span>Statut</span>
                  <strong>{student.statusMeta.label}</strong>
                  <StatusBadge status={student.statusMeta.badgeStatus} />
                </div>
                <div className="admin-application-summary-item">
                  <span>Dernier dépôt</span>
                  <strong>{formatAdminDate(student.latestDate)}</strong>
                  <p>{student.latestUniversite}</p>
                </div>
                <div className="admin-application-summary-item">
                  <span>Candidatures</span>
                  <strong>{student.candidaturesCount}</strong>
                  <p>{student.acceptedCount} acceptée(s), {student.rejectedCount} refusée(s)</p>
                </div>
              </div>
            </article>

            <article className="admin-meta-card">
              <div className="admin-meta-card-header">
                <div>
                  <h3>Historique</h3>
                  <p>Chronologie des actions liées à ce profil</p>
                </div>
              </div>

              {history.length === 0 ? (
                <p className="admin-note-empty">Aucun événement n'est disponible pour ce profil.</p>
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
