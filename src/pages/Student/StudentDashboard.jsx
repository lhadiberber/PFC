import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAdmissions } from "../../context/AdmissionsContext";
import "../../index.css";

const PROFILE_FIELDS = [
  "nom",
  "prenom",
  "dateNaiss",
  "lieuNaiss",
  "sexe",
  "nationalite",
  "email",
  "telephone",
  "pays",
  "adresse",
];

const ACADEMIC_FIELDS = [
  "diplomeActuel",
  "etablissementActuel",
  "pays",
  "anneeBac",
  "moyenneBac",
  "specialiteActuelle",
  "specialite",
  "universite",
  "niveauDemande",
];

const DOCUMENT_FIELDS = [
  { key: "copieBac", label: "Copie du bac ou diplome" },
  { key: "releveNotes", label: "Releve de notes" },
  { key: "carteIdentite", label: "Carte d'identite ou passeport" },
  { key: "photo", label: "Photo d'identite" },
  { key: "residence", label: "Justificatif de residence" },
  { key: "cv", label: "CV" },
];

function hasValue(value) {
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
}

function pickFirstFilled(sources, key) {
  for (const source of sources) {
    const candidate = source?.[key];
    if (hasValue(candidate)) {
      return candidate;
    }
  }

  return "";
}

function buildMergedRecord(keys, sources) {
  return keys.reduce((record, key) => {
    record[key] = pickFirstFilled(sources, key);
    return record;
  }, {});
}

function countCompletedFields(record, keys) {
  return keys.filter((key) => hasValue(record[key])).length;
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function formatDate(value) {
  if (!value) {
    return "Non renseignee";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "Non renseignee";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value) {
  if (!value) {
    return "Aucune";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffInDays = Math.floor((Date.now() - date.getTime()) / 86400000);

  if (diffInDays <= 0) {
    return "Aujourd'hui";
  }

  if (diffInDays === 1) {
    return "Hier";
  }

  if (diffInDays < 7) {
    return `Il y a ${diffInDays} j`;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function getCompletionColor(percentage) {
  if (percentage >= 90) {
    return "#059669";
  }

  if (percentage >= 65) {
    return "#2563eb";
  }

  if (percentage >= 40) {
    return "#d97706";
  }

  return "#dc2626";
}

function getStatusTone(status) {
  if (status === "Acceptee") {
    return "acceptee";
  }

  if (status === "Rejetee") {
    return "refusee";
  }

  return "attente";
}

function buildFinalProgress(latestApplication, averageCompletion, missingDocumentsCount) {
  if (!latestApplication) {
    if (averageCompletion === 100) {
      return 55;
    }

    return Math.round(averageCompletion * 0.4);
  }

  if (latestApplication.statut === "Acceptee" || latestApplication.statut === "Rejetee") {
    return 100;
  }

  if (missingDocumentsCount > 0) {
    return 58;
  }

  return 78;
}

function buildCurrentStep({
  latestApplication,
  profileCompletion,
  academicCompletion,
  documentsCompletion,
}) {
  if (!latestApplication) {
    if (profileCompletion < 100) {
      return {
        label: "Completer le profil",
        shortLabel: "Profil",
        detail: "Renseignez vos informations personnelles pour preparer votre dossier.",
        path: "/profil",
        tone: "etudiants",
      };
    }

    if (academicCompletion < 100) {
      return {
        label: "Renseigner le parcours academique",
        shortLabel: "Academique",
        detail: "Ajoutez vos informations de formation avant de finaliser la candidature.",
        path: "/student-step2",
        tone: "attente",
      };
    }

    if (documentsCompletion < 100) {
      return {
        label: "Deposer les pieces justificatives",
        shortLabel: "Documents",
        detail: "Joignez les documents demandes pour rendre le dossier complet.",
        path: "/student-step3",
        tone: "incomplets",
      };
    }

    return {
      label: "Finaliser la candidature",
      shortLabel: "Finalisation",
      detail: "Votre dossier est pret. Vous pouvez maintenant valider la soumission.",
      path: "/student-recapitulatif",
      tone: "total",
    };
  }

  if (latestApplication.statut === "Acceptee") {
    return {
      label: "Decision favorable rendue",
      shortLabel: "Decision",
      detail: "Votre dossier a ete accepte. Consultez le suivi de votre candidature.",
      path: "/mes-candidatures",
      tone: "acceptee",
    };
  }

  if (latestApplication.statut === "Rejetee") {
    return {
      label: "Decision finale disponible",
      shortLabel: "Decision",
      detail: "Une decision finale a ete enregistree sur votre dossier.",
      path: "/mes-candidatures",
      tone: "refusee",
    };
  }

  if (documentsCompletion < 100) {
    return {
      label: "Completer les documents",
      shortLabel: "Documents",
      detail: "Votre dossier peut encore etre consolide avec les pieces manquantes.",
      path: "/student-step3",
      tone: "incomplets",
    };
  }

  return {
    label: "Dossier en cours d'analyse",
    shortLabel: "Analyse",
    detail: "Votre candidature est en cours de verification par l'administration.",
    path: "/mes-candidatures",
    tone: "attente",
  };
}

function getStatusPresentation(latestApplication, missingDocumentsCount) {
  if (!latestApplication) {
    return {
      label: "A finaliser",
      description:
        "Votre candidature n'a pas encore ete soumise. Finalisez les informations manquantes pour lancer l'etude du dossier.",
      helper: "La soumission declenchera l'analyse administrative de votre candidature.",
    };
  }

  if (latestApplication.statut === "Acceptee") {
    return {
      label: "Acceptee",
      description:
        "Une decision favorable a ete enregistree sur votre derniere candidature. Consultez le detail du dossier pour la suite.",
      helper: "Pensez a suivre les prochaines etapes demandees par l'etablissement.",
    };
  }

  if (latestApplication.statut === "Rejetee") {
    return {
      label: "Rejetee",
      description:
        "Une decision finale a ete prise sur votre dossier. Vous pouvez consulter le detail pour suivre l'historique de traitement.",
      helper: "Le detail du dossier reste disponible pour vos archives.",
    };
  }

  if (missingDocumentsCount > 0) {
    return {
      label: "En attente",
      description:
        "Votre dossier est bien enregistre, mais certaines pieces peuvent encore etre completees pour consolider l'instruction.",
      helper: "Ajoutez les documents manquants pour eviter tout retard de traitement.",
    };
  }

  return {
    label: "En attente",
    description:
      "Votre candidature a ete transmise et se trouve actuellement dans la file de traitement administrative.",
    helper: "Vous serez informe des evolutions majeures directement depuis cet espace.",
  };
}

function StudentDashboardIcon({ name }) {
  switch (name) {
    case "status":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l7 3v6c0 4.2-2.8 8.1-7 9-4.2-.9-7-4.8-7-9V6l7-3z" />
          <path d="M9.5 12.5l1.7 1.7 3.8-4.2" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case "documents":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      );
    case "missing":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
        </svg>
      );
    case "step":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M8 12h2" />
          <path d="M14 12h2" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      );
    case "edit":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="m16.5 3.5 4 4L8 20l-4 1 1-4 11.5-13.5z" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

StudentDashboardIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

export default function StudentDashboard() {
  const { applicationDraft, applications, profile, activityLog } = useAdmissions();

  const latestApplication = useMemo(
    () =>
      [...applications].sort((first, second) => {
        const firstDate = new Date(first.submittedAt || first.dateDepot || 0);
        const secondDate = new Date(second.submittedAt || second.dateDepot || 0);
        return secondDate - firstDate;
      })[0],
    [applications]
  );

  const mergedProfile = useMemo(
    () =>
      buildMergedRecord(PROFILE_FIELDS, [
        profile,
        applicationDraft.personalInfo,
        latestApplication?.details,
      ]),
    [applicationDraft.personalInfo, latestApplication, profile]
  );

  const mergedAcademic = useMemo(
    () =>
      buildMergedRecord(ACADEMIC_FIELDS, [
        applicationDraft.academicInfo,
        latestApplication?.details,
      ]),
    [applicationDraft.academicInfo, latestApplication]
  );

  const documents = useMemo(
    () =>
      DOCUMENT_FIELDS.map((document) => {
        const fileName = pickFirstFilled(
          [applicationDraft.documents, latestApplication?.details],
          document.key
        );

        return {
          ...document,
          fileName,
          isSubmitted: hasValue(fileName),
        };
      }),
    [applicationDraft.documents, latestApplication]
  );

  const profileCompletion = useMemo(
    () => toPercent(countCompletedFields(mergedProfile, PROFILE_FIELDS), PROFILE_FIELDS.length),
    [mergedProfile]
  );

  const academicCompletion = useMemo(
    () => toPercent(countCompletedFields(mergedAcademic, ACADEMIC_FIELDS), ACADEMIC_FIELDS.length),
    [mergedAcademic]
  );

  const submittedDocumentsCount = documents.filter((document) => document.isSubmitted).length;
  const missingDocuments = documents.filter((document) => !document.isSubmitted);
  const documentsCompletion = toPercent(submittedDocumentsCount, documents.length);
  const averageCompletion = Math.round(
    (profileCompletion + academicCompletion + documentsCompletion) / 3
  );
  const finalValidationProgress = buildFinalProgress(
    latestApplication,
    averageCompletion,
    missingDocuments.length
  );

  const userName =
    mergedProfile.prenom ||
    latestApplication?.details?.prenom ||
    applicationDraft.personalInfo.prenom ||
    "Etudiant";

  const statusPresentation = getStatusPresentation(
    latestApplication,
    missingDocuments.length
  );

  const currentStep = buildCurrentStep({
    latestApplication,
    profileCompletion,
    academicCompletion,
    documentsCompletion,
  });

  const recentActivity = useMemo(() => {
    const applicationIds = new Set(applications.map((application) => String(application.id)));
    const publicEntries = activityLog
      .filter(
        (entry) =>
          applicationIds.has(String(entry.applicationId)) &&
          ["submission", "status_change"].includes(entry.type)
      )
      .sort((first, second) => new Date(second.occurredAt) - new Date(first.occurredAt))
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        detail: entry.detail,
        tone: entry.tone || "neutral",
        status: entry.status,
        rawDate: entry.occurredAt,
        displayDate: formatDateTime(entry.occurredAt),
        timeLabel: formatRelativeTime(entry.occurredAt),
        icon: entry.type === "status_change" ? "status" : "folder",
      }));

    if (publicEntries.length > 0) {
      return publicEntries.slice(0, 4);
    }

    if (!latestApplication) {
      return [];
    }

    return [
      {
        id: `fallback-${latestApplication.id}`,
        title: "Candidature deposee",
        description: `Votre dossier ${latestApplication.numeroDossier} a ete depose pour ${latestApplication.specialite}.`,
        detail: latestApplication.universite,
        tone: "info",
        status: latestApplication.statut,
        rawDate: latestApplication.submittedAt || latestApplication.dateDepot,
        displayDate: formatDateTime(latestApplication.submittedAt || latestApplication.dateDepot),
        timeLabel: formatRelativeTime(latestApplication.submittedAt || latestApplication.dateDepot),
        icon: "folder",
      },
    ];
  }, [activityLog, applications, latestApplication]);

  const lastUpdate =
    recentActivity[0]?.rawDate ||
    latestApplication?.adminMeta?.lastUpdatedAt ||
    latestApplication?.submittedAt ||
    latestApplication?.dateDepot ||
    "";

  const summaryCards = [
    {
      id: "status",
      label: "Statut de la candidature",
      value: statusPresentation.label,
      detail: latestApplication
        ? `${latestApplication.numeroDossier} - ${formatDate(latestApplication.submittedAt || latestApplication.dateDepot)}`
        : "Aucune candidature finalisee pour le moment",
      icon: "status",
      tone: latestApplication ? getStatusTone(latestApplication.statut) : "attente",
      to: latestApplication ? "/mes-candidatures" : currentStep.path,
      textValue: true,
    },
    {
      id: "profile",
      label: "Profil complete",
      value: `${profileCompletion}%`,
      detail:
        profileCompletion === 100
          ? "Vos informations personnelles sont completes."
          : "Des informations personnelles restent a renseigner.",
      icon: "profile",
      tone: profileCompletion === 100 ? "acceptee" : "etudiants",
      to: "/profil",
    },
    {
      id: "documents",
      label: "Documents deposes",
      value: `${submittedDocumentsCount}/${documents.length}`,
      detail:
        submittedDocumentsCount === documents.length
          ? "Toutes les pieces attendues sont presentes."
          : `${missingDocuments.length} document(s) reste(nt) a ajouter.`,
      icon: "documents",
      tone: missingDocuments.length === 0 ? "acceptee" : "attente",
      to: "/student-step3",
    },
    {
      id: "missing",
      label: "Documents manquants",
      value: String(missingDocuments.length),
      detail:
        missingDocuments.length === 0
          ? "Aucune piece manquante sur le dossier actuel."
          : "Des pieces justificatives manquent encore.",
      icon: "missing",
      tone: missingDocuments.length === 0 ? "acceptee" : "incomplets",
      to: "/student-step3",
    },
    {
      id: "step",
      label: "Etape actuelle",
      value: currentStep.shortLabel,
      detail: currentStep.detail,
      icon: "step",
      tone: currentStep.tone,
      to: currentStep.path,
      textValue: true,
    },
    {
      id: "activity",
      label: "Derniere activite",
      value: recentActivity[0]?.timeLabel || "Aucune",
      detail:
        recentActivity[0]?.title ||
        "Les mouvements recents de votre dossier apparaitront ici.",
      icon: "activity",
      tone: recentActivity[0]?.tone === "positive" ? "acceptee" : "total",
      to: "/mes-candidatures",
      textValue: true,
    },
  ];

  const progressItems = [
    {
      id: "profile",
      label: "Profil personnel",
      value: profileCompletion,
      caption:
        profileCompletion === 100
          ? "Informations personnelles completes"
          : "Mettez a jour vos donnees de contact et votre identite",
    },
    {
      id: "academic",
      label: "Informations academiques",
      value: academicCompletion,
      caption:
        academicCompletion === 100
          ? "Parcours academique renseigne"
          : "Ajoutez ou completez votre cursus et votre specialite",
    },
    {
      id: "documents",
      label: "Documents",
      value: documentsCompletion,
      caption:
        missingDocuments.length === 0
          ? "Toutes les pieces requises sont deposees"
          : `${missingDocuments.length} piece(s) justificative(s) manque(nt) encore`,
    },
    {
      id: "final",
      label: "Validation finale",
      value: finalValidationProgress,
      caption:
        latestApplication?.statut === "Acceptee" || latestApplication?.statut === "Rejetee"
          ? "Decision finale enregistree sur le dossier"
          : latestApplication
            ? "Votre candidature suit actuellement le circuit administratif"
            : "La finalisation sera disponible une fois le dossier complet",
    },
  ];

  const alerts = useMemo(() => {
    const nextAlerts = [];

    if (!latestApplication) {
      nextAlerts.push({
        id: "submit",
        count: "01",
        title: "Candidature a finaliser",
        problem: "Votre dossier n'a pas encore ete soumis.",
        importance:
          "La candidature ne peut pas etre analysee tant que vous n'avez pas valide le recapitulatif final.",
        helper: "Finalisez votre dossier pour lancer le traitement administratif.",
        actionLabel: "Finaliser",
        path: currentStep.path,
        tone: "warning",
      });
    }

    if (missingDocuments.length > 0) {
      nextAlerts.push({
        id: "documents",
        count: String(missingDocuments.length).padStart(2, "0"),
        title: "Documents manquants",
        problem: `${missingDocuments.length} piece(s) justificative(s) restent a deposer.`,
        importance:
          "Un dossier incomplet peut retarder ou bloquer l'analyse de votre candidature.",
        helper: "Ajoutez les pieces manquantes depuis votre espace documents.",
        actionLabel: "Ajouter",
        path: "/student-step3",
        tone: "danger",
      });
    }

    if (profileCompletion < 100) {
      nextAlerts.push({
        id: "profile",
        count: `${100 - profileCompletion}%`,
        title: "Profil incomplet",
        problem: "Certaines informations personnelles ne sont pas encore renseignees.",
        importance:
          "Vos coordonnees et donnees d'identite doivent etre completes pour fiabiliser le dossier.",
        helper: "Mettez a jour le profil avant toute nouvelle candidature.",
        actionLabel: "Completer",
        path: "/profil",
        tone: "info",
      });
    }

    if (nextAlerts.length === 0) {
      nextAlerts.push({
        id: "ready",
        count: "OK",
        title: "Dossier a jour",
        problem: "Aucune action immediate n'est requise pour le moment.",
        importance:
          "Votre dossier est complet et le suivi peut maintenant se faire depuis les candidatures.",
        helper: "Consultez regulierement le statut de votre dossier pour connaitre les prochaines etapes.",
        actionLabel: "Suivre",
        path: "/mes-candidatures",
        tone: "positive",
      });
    }

    return nextAlerts.slice(0, 3);
  }, [currentStep.path, latestApplication, missingDocuments.length, profileCompletion]);

  const quickActions = [
    {
      id: "profile",
      title: "Completer mon profil",
      description: "Mettez a jour vos informations personnelles et vos coordonnees.",
      icon: "profile",
      tone: "etudiants",
      buttonLabel: "Ouvrir",
      to: "/profil",
    },
    {
      id: "documents",
      title: "Ajouter mes documents",
      description: "Deposez les pieces justificatives demandees pour le dossier.",
      icon: "documents",
      tone: "incomplets",
      buttonLabel: "Gerer",
      to: "/student-step3",
    },
    {
      id: "application",
      title: "Voir ma candidature",
      description: "Consultez le recapitulatif et le statut des dossiers deja soumis.",
      icon: "folder",
      tone: "total",
      buttonLabel: "Voir",
      to: "/mes-candidatures",
    },
    {
      id: "draft",
      title: "Poursuivre mon dossier",
      description: "Reprenez l'etape en cours pour finaliser votre candidature.",
      icon: "edit",
      tone: "acceptee",
      buttonLabel: "Continuer",
      to: currentStep.path,
    },
  ];

  return (
    <div className="student-dashboard-shell">
      <section className="student-dashboard-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Espace etudiant</span>
          <h1>Tableau de bord etudiant</h1>
          <p className="student-dashboard-subtitle">
            Suivez l'avancement de votre candidature et completez votre dossier.
          </p>
          <p className="student-dashboard-welcome">
            Bonjour {userName}, retrouvez ici les informations essentielles pour gerer votre
            candidature en toute serenite.
          </p>
        </div>

        <div className="student-dashboard-hero-meta">
          <span className="admin-page-context info">
            {applications.length} candidature(s)
          </span>
          <span className={`admin-page-context ${latestApplication ? "neutral" : "warning"}`}>
            {latestApplication
              ? `Dernier dossier ${latestApplication.numeroDossier}`
              : "Dossier en preparation"}
          </span>
          <span className="admin-page-context neutral">
            Mis a jour le {formatDateTime(lastUpdate)}
          </span>
        </div>
      </section>

      <section className="campus-section-container student-dashboard-panel">
        <div className="campus-section-header student-dashboard-section-head">
          <div>
            <h2>Resume de votre dossier</h2>
            <p>Les indicateurs essentiels pour comprendre rapidement ou en est votre candidature.</p>
          </div>
        </div>

        <div className="admin-primary-stats-grid student-dashboard-stats">
          {summaryCards.map((card) => (
            <Link
              key={card.id}
              to={card.to}
              className={`admin-primary-stat-card admin-primary-stat-card-${card.tone} student-summary-card`}
            >
              <div className="admin-primary-stat-head">
                <span className="admin-primary-stat-icon">
                  <StudentDashboardIcon name={card.icon} />
                </span>
              </div>

              <div className="admin-primary-stat-body">
                <strong
                  className={`admin-primary-stat-value ${
                    card.textValue ? "student-summary-card-text" : ""
                  }`}
                >
                  {card.value}
                </strong>
                <h3 className="admin-primary-stat-label">{card.label}</h3>
                <p className="admin-primary-stat-detail">{card.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="student-dashboard-split-grid">
        <section className="campus-section-container student-dashboard-panel">
          <div className="campus-section-header student-dashboard-section-head">
            <div>
              <h2>Progression du dossier</h2>
              <p>Visualisez en un coup d'oeil les volets deja completes et ceux a terminer.</p>
            </div>
          </div>

          <div className="student-dashboard-progress-list">
            {progressItems.map((item) => (
              <div key={item.id} className="student-progress-row">
                <div className="student-progress-copy">
                  <div className="student-progress-head">
                    <h3>{item.label}</h3>
                    <span>{item.value}%</span>
                  </div>
                  <p>{item.caption}</p>
                </div>

                <ProgressBar
                  value={item.value}
                  color={getCompletionColor(item.value)}
                  label={`${item.value}%`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="campus-section-container student-dashboard-panel">
          <div className="campus-section-header student-dashboard-section-head">
            <div>
              <h2>Statut de ma candidature</h2>
              <p>Consultez l'etat global de votre dernier dossier et les prochaines etapes utiles.</p>
            </div>
          </div>

          <div className="student-dashboard-status-card">
            <div className="student-dashboard-status-head">
              {latestApplication ? (
                <StatusBadge status={latestApplication.statut} />
              ) : (
                <span className="student-dashboard-draft-badge">A finaliser</span>
              )}
              <span
                className={`admin-page-context ${
                  currentStep.tone === "acceptee"
                    ? "positive"
                    : currentStep.tone === "refusee"
                      ? "danger"
                      : currentStep.tone === "incomplets"
                        ? "warning"
                        : "info"
                }`}
              >
                {currentStep.label}
              </span>
            </div>

            <div className="student-dashboard-status-copy">
              <h3>{statusPresentation.label}</h3>
              <p>{statusPresentation.description}</p>
              <small>{statusPresentation.helper}</small>
            </div>

            <div className="student-dashboard-status-meta">
              <div className="student-dashboard-status-item">
                <span>Numero de dossier</span>
                <strong>{latestApplication?.numeroDossier || "Brouillon en cours"}</strong>
              </div>
              <div className="student-dashboard-status-item">
                <span>Formation</span>
                <strong>
                  {latestApplication?.specialite || mergedAcademic.specialite || "A renseigner"}
                </strong>
              </div>
              <div className="student-dashboard-status-item">
                <span>Universite</span>
                <strong>
                  {latestApplication?.universite || mergedAcademic.universite || "A renseigner"}
                </strong>
              </div>
              <div className="student-dashboard-status-item">
                <span>Derniere mise a jour</span>
                <strong>{formatDate(lastUpdate)}</strong>
              </div>
            </div>

            <div className="student-dashboard-panel-actions">
              <Link to="/mes-candidatures" className="student-dashboard-link">
                Voir ma candidature
              </Link>
              <Link to={currentStep.path} className="student-dashboard-ghost-link">
                Poursuivre mon dossier
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="student-dashboard-split-grid">
        <section className="campus-section-container student-dashboard-panel">
          <div className="campus-section-header student-dashboard-section-head student-dashboard-section-head-inline">
            <div>
              <h2>Documents du dossier</h2>
              <p>Reperez les pieces deja deposees et celles qui restent a fournir.</p>
            </div>
            <span
              className={`admin-page-context ${
                missingDocuments.length === 0 ? "positive" : "warning"
              }`}
            >
              {submittedDocumentsCount}/{documents.length} pieces
            </span>
          </div>

          <div className="student-dashboard-documents-list">
            {documents.map((document) => (
              <div key={document.key} className="student-document-row">
                <div className="student-document-copy">
                  <h3>{document.label}</h3>
                  <p>
                    {document.isSubmitted
                      ? document.fileName
                      : "Aucun fichier depose pour le moment"}
                  </p>
                </div>

                <span
                  className={`student-document-status ${
                    document.isSubmitted ? "is-submitted" : "is-missing"
                  }`}
                >
                  {document.isSubmitted ? "Depose" : "Manquant"}
                </span>
              </div>
            ))}
          </div>

          <div className="student-dashboard-panel-actions">
            <Link to="/student-step3" className="student-dashboard-link">
              Ajouter ou modifier mes documents
            </Link>
          </div>
        </section>

        <section className="campus-section-container student-dashboard-panel">
          <div className="campus-section-header student-dashboard-section-head">
            <div>
              <h2>A faire</h2>
              <p>Les points qui demandent votre attention pour garder un dossier complet.</p>
            </div>
          </div>

          <div className="student-dashboard-alerts-grid">
            {alerts.map((alert) => (
              <div key={alert.id} className={`admin-alert-priority-card ${alert.tone}`}>
                <div className="admin-alert-priority-head">
                  <span className="admin-alert-priority-count">{alert.count}</span>
                  <span
                    className={`admin-page-context ${
                      alert.tone === "danger"
                        ? "danger"
                        : alert.tone === "warning"
                          ? "warning"
                          : alert.tone === "positive"
                            ? "positive"
                            : "info"
                    }`}
                  >
                    {alert.title}
                  </span>
                </div>

                <p className="admin-alert-priority-problem">{alert.problem}</p>
                <p className="admin-alert-priority-importance">
                  <strong>Pourquoi c'est important :</strong> {alert.importance}
                </p>
                <small className="admin-alert-priority-helper">{alert.helper}</small>

                <Link to={alert.path} className="student-dashboard-alert-link">
                  {alert.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="campus-section-container student-dashboard-panel">
        <div className="campus-section-header student-dashboard-section-head">
          <div>
            <h2>Historique recent</h2>
            <p>Retrouvez les mouvements les plus importants sur votre dossier.</p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <EmptyState
            title="Aucune activite recente"
            description="Vos soumissions et les evolutions de statut apparaitront ici."
            actionLabel="Completer mon dossier"
            actionTo={currentStep.path}
            className="admin-empty-state"
          />
        ) : (
          <div className="admin-activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className={`admin-activity-item ${item.tone}`}>
                <div className="admin-activity-icon">
                  <StudentDashboardIcon name={item.icon} />
                </div>

                <div className="admin-activity-content">
                  <div className="admin-activity-headline">
                    <h3>{item.title}</h3>
                    <span className="admin-activity-time">{item.timeLabel}</span>
                  </div>
                  <p>{item.description}</p>
                  {item.detail ? <p className="admin-activity-detail">{item.detail}</p> : null}
                </div>

                <div className="student-dashboard-activity-side">
                  {item.status ? <StatusBadge status={item.status} /> : null}
                  <span className="student-dashboard-activity-date">{item.displayDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="campus-section-container student-dashboard-panel">
        <div className="campus-section-header student-dashboard-section-head">
          <div>
            <h2>Actions rapides</h2>
            <p>Accedez directement aux ecrans les plus utiles pour poursuivre votre candidature.</p>
          </div>
        </div>

        <div className="admin-quick-actions-grid student-dashboard-actions-grid">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className={`admin-quick-action-card admin-quick-action-card-${action.tone}`}
            >
              <div className="admin-quick-action-head">
                <span className="admin-quick-action-icon">
                  <StudentDashboardIcon name={action.icon} />
                </span>
              </div>

              <div className="admin-quick-action-body">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>

              <Link
                to={action.to}
                className="student-dashboard-action-link admin-quick-action-button"
              >
                {action.buttonLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
