import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import { useAdmissions } from "../../context/AdmissionsContext";
import {
  clearAuthSession,
  getApiErrorMessage,
  getAuthSession,
  getAuthToken,
  isNetworkUnavailableError,
} from "../../services/authService";
import { getStudentDashboard } from "../../services/studentService";
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
  "adresse",
  "wilaya",
  "commune",
];

const ACADEMIC_FIELDS = [
  "anneeBac",
  "serieBac",
  "moyenneBac",
  "mentionBac",
  "numeroInscriptionBac",
  "lyceeOrigine",
  "wilayaLycee",
  "filiere",
  "specialite",
  "etablissement",
  "universite",
  "niveauDemande",
];

const DOCUMENT_FIELDS = [
  {
    key: "releveNotes",
    label: "Relevé de notes du baccalauréat",
    aliases: ["Relevé de notes du baccalauréat", "Releve de notes"],
  },
  {
    key: "attestationReussite",
    label: "Attestation de réussite au baccalauréat",
    aliases: ["Attestation de réussite au baccalauréat", "Diplome", "copie du bac ou diplome"],
    storageKeys: ["attestationReussite", "copieBac"],
  },
  {
    key: "carteIdentite",
    label: "Pièce d'identité",
    aliases: ["Pièce d'identité", "Passeport / Carte d'identité"],
  },
  {
    key: "photo",
    label: "Photo d'identité",
    aliases: ["Photo d'identité", "Lettre de motivation"],
  },
  {
    key: "residence",
    label: "Certificat de résidence",
    aliases: ["Certificat de résidence", "Certificat de langue"],
  },
  {
    key: "justificatifParticulier",
    label: "Justificatif particulier",
    aliases: ["Justificatif particulier", "CV"],
    storageKeys: ["justificatifParticulier", "cv"],
    optional: true,
  },
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

function normalizeDocumentType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findDocumentByType(documents, expectedDocument) {
  const acceptedTypes = [expectedDocument.key, expectedDocument.label, ...(expectedDocument.aliases || [])]
    .map(normalizeDocumentType);

  return documents.find((document) =>
    acceptedTypes.includes(normalizeDocumentType(document.type_document))
  );
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
    return "Non renseignée";
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
    return "Non renseignée";
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
  if (["Acceptee", "Acceptée"].includes(status)) {
    return "acceptee";
  }

  if (["Rejetee", "Refusée"].includes(status)) {
    return "refusee";
  }

  return "attente";
}

function normalizeDashboardStatus(status) {
  if (["Acceptée", "Acceptee"].includes(status)) {
    return "Acceptee";
  }

  if (["Refusée", "Refusee", "Rejetee"].includes(status)) {
    return "Rejetee";
  }

  return "En attente";
}

function buildNumeroDossier(application) {
  const date = new Date(application.date_depot || application.dateDepot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function mapDashboardApplication(application) {
  if (!application) {
    return null;
  }

  return {
    id: application.id,
    numeroDossier: buildNumeroDossier(application),
    universite: application.universite || "",
    specialite: application.formation || "",
    niveauDemande: application.niveau || "",
    statut: normalizeDashboardStatus(application.statut),
    submittedAt: application.date_depot,
    dateDepot: application.date_depot,
    adminMeta: {
      lastUpdatedAt: application.date_depot,
    },
    details: {},
  };
}

function buildLocalDashboardFallback(sessionUser = {}) {
  return {
    user: {
      id: sessionUser.id || "",
      nom: sessionUser.nom || "",
      prenom: sessionUser.prenom || "",
      email: sessionUser.email || "",
      role: sessionUser.role || "student",
    },
    profile: null,
    applications: {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      latest: null,
    },
    documents: null,
    globalStatus: "",
    recentActivity: [],
  };
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
        label: "Compléter le profil",
        shortLabel: "Profil",
        detail: "Renseignez vos informations personnelles pour préparer votre dossier.",
        path: "/profil",
        tone: "etudiants",
      };
    }

    if (academicCompletion < 100) {
      return {
        label: "Renseigner le baccalauréat",
        shortLabel: "Baccalauréat",
        detail: "Ajoutez vos informations de baccalauréat avant de finaliser la candidature.",
        path: "/student-step1",
        tone: "attente",
      };
    }

    if (documentsCompletion < 100) {
      return {
        label: "Déposer les pièces justificatives",
        shortLabel: "Documents",
        detail: "Joignez les documents demandés pour compléter votre dossier.",
        path: "/student-step3",
        tone: "incomplets",
      };
    }

    return {
      label: "Finaliser la candidature",
      shortLabel: "Finalisation",
      detail: "Votre dossier est prêt. Vous pouvez valider la soumission.",
      path: "/student-recapitulatif",
      tone: "total",
    };
  }

  if (latestApplication.statut === "Acceptee") {
    return {
      label: "Décision favorable rendue",
      shortLabel: "Décision",
      detail: "Votre dossier a été accepté. Consultez le suivi de votre candidature.",
      path: "/mes-candidatures",
      tone: "acceptee",
    };
  }

  if (latestApplication.statut === "Rejetee") {
    return {
      label: "Décision finale disponible",
      shortLabel: "Décision",
      detail: "Une décision finale a été enregistrée sur votre dossier.",
      path: "/mes-candidatures",
      tone: "refusee",
    };
  }

  if (documentsCompletion < 100) {
    return {
      label: "Compléter les documents",
      shortLabel: "Documents",
      detail: "Votre dossier peut encore être consolidé avec les pièces manquantes.",
      path: "/student-step3",
      tone: "incomplets",
    };
  }

  return {
    label: "Dossier en cours d'analyse",
    shortLabel: "Analyse",
    detail: "Votre candidature est en cours de vérification par l'administration.",
    path: "/mes-candidatures",
    tone: "attente",
  };
}

function getStatusPresentation(latestApplication, missingDocumentsCount) {
  if (!latestApplication) {
    return {
      label: "À finaliser",
      description:
        "Votre candidature n'a pas encore été soumise. Complétez les informations manquantes pour lancer l'instruction du dossier.",
      helper: "La soumission déclenchera l'analyse administrative de votre candidature.",
    };
  }

  if (latestApplication.statut === "Acceptee") {
    return {
      label: "Acceptée",
      description:
        "Une décision favorable a été enregistrée sur votre candidature. Consultez le détail du dossier pour connaître la suite.",
      helper: "Pensez à suivre les prochaines étapes indiquées par l'établissement.",
    };
  }

  if (latestApplication.statut === "Rejetee") {
    return {
      label: "Non retenue",
      description:
        "Une décision finale a été prise sur votre dossier. Vous pouvez consulter le détail pour en suivre l'historique.",
      helper: "Le détail du dossier reste disponible pour vos archives.",
    };
  }

  if (missingDocumentsCount > 0) {
    return {
      label: "En attente",
      description:
        "Votre dossier est bien enregistré, mais certaines pièces peuvent encore être complétées pour faciliter l'instruction.",
      helper: "Ajoutez les documents manquants pour éviter tout retard de traitement.",
    };
  }

  return {
    label: "En attente",
    description:
      "Votre candidature a été transmise. Elle est actuellement en cours d'étude par l'administration.",
    helper: "Vous serez informé des évolutions depuis cet espace.",
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
    case "support":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v12H7l-3 3V5z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
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
  const navigate = useNavigate();
  const { applicationDraft, profile } = useAdmissions();
  const [dashboardData, setDashboardData] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      const token = getAuthToken();

      if (!token) {
        const message = "Session absente ou expirée. Veuillez vous reconnecter.";
        clearAuthSession();
        navigate("/login", { state: { message } });
        return;
      }

      setIsDashboardLoading(true);
      setDashboardError("");

      try {
        const dashboardResponse = await getStudentDashboard();

        if (isActive) {
          setDashboardData(dashboardResponse);
        }
      } catch (error) {
        if (isActive) {
          if (error.status === 401) {
            const message = "Session expirée. Veuillez vous reconnecter.";
            clearAuthSession();
            navigate("/login", { state: { message } });
            return;
          }

          setDashboardData(buildLocalDashboardFallback(getAuthSession()?.user));
          setDashboardError(
            isNetworkUnavailableError(error)
              ? ""
              : getApiErrorMessage(
                  error,
                  "Les données serveur sont indisponibles. Affichage temporaire des données locales."
                )
          );
        }
      } finally {
        if (isActive) {
          setIsDashboardLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [navigate, reloadKey]);

  const latestBackendApplication = useMemo(
    () => mapDashboardApplication(dashboardData?.applications?.latest),
    [dashboardData]
  );

  const latestApplication = latestBackendApplication;

  const mergedProfile = useMemo(
    () =>
      buildMergedRecord(PROFILE_FIELDS, [
        dashboardData?.user,
        profile,
        applicationDraft.personalInfo,
        latestApplication?.details,
      ]),
    [applicationDraft.personalInfo, dashboardData, latestApplication, profile]
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
    () => {
      const apiDocuments = dashboardData?.documents?.items || [];

      if (apiDocuments.length > 0 || dashboardData?.documents) {
        return DOCUMENT_FIELDS.map((document) => {
          const apiDocument = findDocumentByType(apiDocuments, document);

          return {
            ...document,
            fileName: apiDocument?.nom_fichier || "",
            status: apiDocument?.statut || "En attente",
            isSubmitted: Boolean(apiDocument),
          };
        });
      }

      return DOCUMENT_FIELDS.map((document) => {
        const fileName = (document.storageKeys || [document.key])
          .map((key) => pickFirstFilled([applicationDraft.documents, latestApplication?.details], key))
          .find(hasValue) || "";

        return {
          ...document,
          fileName,
          isSubmitted: hasValue(fileName),
        };
      });
    },
    [applicationDraft.documents, dashboardData, latestApplication]
  );

  const profileCompletion = useMemo(
    () =>
      dashboardData?.profile
        ? dashboardData.profile.completion
        : toPercent(countCompletedFields(mergedProfile, PROFILE_FIELDS), PROFILE_FIELDS.length),
    [dashboardData, mergedProfile]
  );

  const academicCompletion = useMemo(
    () => toPercent(countCompletedFields(mergedAcademic, ACADEMIC_FIELDS), ACADEMIC_FIELDS.length),
    [mergedAcademic]
  );

  const requiredDocuments = documents.filter((document) => !document.optional);
  const submittedRequiredDocumentsCount = requiredDocuments.filter((document) => document.isSubmitted).length;
  const missingDocuments = requiredDocuments.filter((document) => !document.isSubmitted);
  const documentsCompletion =
    dashboardData?.documents?.completion ??
    toPercent(submittedRequiredDocumentsCount, requiredDocuments.length);
  const applicationsTotal = dashboardData?.applications?.total ?? 0;
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
    "candidat(e)";

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
    if (dashboardData?.recentActivity?.length) {
      return dashboardData.recentActivity.map((entry, index) => ({
        id: `${entry.type || "activity"}-${entry.date || index}`,
        title: entry.title || "Activite du dossier",
        description: entry.description || "",
        detail: entry.type === "application" ? latestApplication?.universite : "",
        tone: entry.status === "Acceptée" ? "positive" : "info",
        status: normalizeDashboardStatus(entry.status),
        rawDate: entry.date,
        displayDate: formatDateTime(entry.date),
        timeLabel: formatRelativeTime(entry.date),
        icon: entry.type === "document" ? "documents" : "folder",
      }));
    }

    if (!latestApplication) {
      return [];
    }

    return [
      {
        id: `fallback-${latestApplication.id}`,
        title: "Candidature déposée",
        description: `Votre dossier ${latestApplication.numeroDossier} a été déposé pour ${latestApplication.specialite}.`,
        detail: latestApplication.universite,
        tone: "info",
        status: latestApplication.statut,
        rawDate: latestApplication.submittedAt || latestApplication.dateDepot,
        displayDate: formatDateTime(latestApplication.submittedAt || latestApplication.dateDepot),
        timeLabel: formatRelativeTime(latestApplication.submittedAt || latestApplication.dateDepot),
        icon: "folder",
      },
    ];
  }, [dashboardData, latestApplication]);

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
      value: dashboardData?.globalStatus || statusPresentation.label,
      detail: latestApplication
        ? `${latestApplication.numeroDossier} - ${formatDate(latestApplication.submittedAt || latestApplication.dateDepot)}`
        : "Aucune candidature finalisée pour le moment.",
      icon: "status",
      tone: latestApplication ? getStatusTone(latestApplication.statut) : "attente",
      to: latestApplication ? "/mes-candidatures" : currentStep.path,
      textValue: true,
    },
    {
      id: "profile",
      label: "Profil complété",
      value: `${profileCompletion}%`,
      detail:
        profileCompletion === 100
          ? "Vos informations personnelles sont complètes."
          : "Des informations personnelles restent à renseigner.",
      icon: "profile",
      tone: profileCompletion === 100 ? "acceptee" : "etudiants",
      to: "/profil",
    },
    {
      id: "documents",
      label: "Documents déposés",
      value: `${dashboardData?.documents?.total ?? submittedRequiredDocumentsCount}/${requiredDocuments.length}`,
      detail:
        submittedRequiredDocumentsCount === requiredDocuments.length
          ? "Toutes les pièces attendues sont présentes."
          : `${missingDocuments.length} pièce(s) restante(s) à déposer.`,
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
          ? "Aucune pièce manquante sur le dossier actuel."
          : "Des pièces justificatives manquent encore.",
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
      label: "Dernière activité",
      value: recentActivity[0]?.timeLabel || "Aucune",
      detail:
        recentActivity[0]?.title ||
        "Les mouvements récents de votre dossier apparaîtront ici.",
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
          ? "Informations personnelles complètes."
          : "Renseignez vos données de contact et d'identité.",
    },
    {
      id: "academic",
      label: "Baccalauréat",
      value: academicCompletion,
      caption:
        academicCompletion === 100
          ? "Informations du baccalauréat complètes."
          : "Complétez vos informations de baccalauréat.",
    },
    {
      id: "documents",
      label: "Documents",
      value: documentsCompletion,
      caption:
        missingDocuments.length === 0
          ? "Toutes les pièces requises sont déposées."
          : `${missingDocuments.length} pièce(s) justificative(s) manquante(s).`,
    },
    {
      id: "final",
      label: "Validation finale",
      value: finalValidationProgress,
      caption:
        latestApplication?.statut === "Acceptee" || latestApplication?.statut === "Rejetee"
          ? "Décision finale enregistrée sur le dossier."
          : latestApplication
            ? "Votre candidature suit actuellement le circuit administratif."
            : "La finalisation sera disponible une fois le dossier complet.",
    },
  ];

  const alerts = useMemo(() => {
    const nextAlerts = [];

    if (!latestApplication) {
      nextAlerts.push({
        id: "submit",
        count: "01",
        title: "Candidature à finaliser",
        problem: "Votre dossier n'a pas encore été soumis.",
        importance:
          "La candidature ne peut être instruite qu'après validation du récapitulatif final.",
        helper: "Finalisez votre dossier pour déclencher le traitement administratif.",
        actionLabel: "Finaliser",
        path: currentStep.path,
        tone: "warning",
      });
    }

    if (missingDocuments.length > 0) {
      nextAlerts.push({
        id: "documents",
        count: String(missingDocuments.length).padStart(2, "0"),
        title: "Pièces manquantes",
        problem: `${missingDocuments.length} pièce(s) justificative(s) restent à déposer.`,
        importance:
          "Un dossier incomplet peut retarder ou bloquer l'instruction de votre candidature.",
        helper: "Ajoutez les pièces manquantes depuis votre espace documents.",
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
        problem: "Certaines informations personnelles ne sont pas encore renseignées.",
        importance:
          "Vos coordonnées et données d'identité doivent être complètes pour fiabiliser le dossier.",
        helper: "Mettez à jour votre profil avant toute nouvelle candidature.",
        actionLabel: "Compléter",
        path: "/profil",
        tone: "info",
      });
    }

    if (nextAlerts.length === 0) {
      nextAlerts.push({
        id: "ready",
        count: "OK",
        title: "Dossier à jour",
        problem: "Aucune action immédiate n'est requise.",
        importance:
          "Votre dossier est complet. Le suivi s'effectue depuis la section candidatures.",
        helper: "Consultez régulièrement le statut de votre dossier pour connaître les prochaines étapes.",
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
      title: "Compléter mon profil",
      description: "Mettez à jour vos informations personnelles et vos coordonnées.",
      icon: "profile",
      tone: "etudiants",
      buttonLabel: "Ouvrir",
      to: "/profil",
    },
    {
      id: "documents",
      title: "Ajouter mes documents",
      description: "Déposez les pièces justificatives requises pour votre dossier.",
      icon: "documents",
      tone: "incomplets",
      buttonLabel: "Gérer",
      to: "/student-step3",
    },
    {
      id: "application",
      title: "Voir ma candidature",
      description: "Consultez le récapitulatif et le suivi de vos dossiers soumis.",
      icon: "folder",
      tone: "total",
      buttonLabel: "Voir",
      to: "/mes-candidatures",
    },
    {
      id: "draft",
      title: "Poursuivre mon dossier",
      description: "Reprenez l'étape en cours pour finaliser votre candidature.",
      icon: "edit",
      tone: "acceptee",
      buttonLabel: "Continuer",
      to: currentStep.path,
    },
    {
      id: "support",
      title: "Contacter l'administration",
      description: "Posez une question sur votre dossier ou signalez une difficulté.",
      icon: "support",
      tone: "etudiants",
      buttonLabel: "Écrire",
      href: "mailto:admissions@pfc.dz?subject=Question%20sur%20mon%20dossier%20PFC",
    },
  ];

  if (isDashboardLoading && !dashboardData) {
    return (
      <div className="student-dashboard-shell">
        <section className="student-dashboard-hero">
          <div className="student-dashboard-hero-copy">
            <span className="student-dashboard-kicker">Espace étudiant</span>
            <h1>Chargement en cours</h1>
            <p className="student-dashboard-subtitle">
              Récupération de vos données, veuillez patienter.
            </p>
          </div>
        </section>

        <section className="campus-section-container student-dashboard-panel">
          <div className="student-profile-feedback">Chargement en cours...</div>
        </section>
      </div>
    );
  }

  if (dashboardError && !dashboardData) {
    return (
      <div className="student-dashboard-shell">
        <section className="student-dashboard-hero">
          <div className="student-dashboard-hero-copy">
            <span className="student-dashboard-kicker">Espace étudiant</span>
            <h1>Tableau de bord indisponible</h1>
            <p className="student-dashboard-subtitle">{dashboardError}</p>
          </div>
        </section>

        <section className="campus-section-container student-dashboard-panel">
          <EmptyState
            title="Impossible de charger vos données"
            description="Vérifiez que le serveur est accessible, puis réessayez."
            actionLabel="Retour au profil"
            actionTo="/profil"
            className="admin-empty-state"
          />
          <div className="student-dashboard-panel-actions">
            <button
              type="button"
              className="student-application-button student-application-button-primary"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Réessayer
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="student-dashboard-shell">
      <section className="student-dashboard-hero">
        <div className="student-dashboard-hero-copy">
          <span className="student-dashboard-kicker">Espace étudiant</span>
          <h1>Tableau de bord</h1>
          <p className="student-dashboard-subtitle">
            Suivez l'avancement de votre dossier et complétez les informations manquantes.
          </p>
          <p className="student-dashboard-welcome">
            Bonjour {userName}, retrouvez ici les informations essentielles liées à votre candidature.
          </p>
        </div>

        <div className="student-dashboard-hero-meta">
          <span className="admin-page-context info">
            {applicationsTotal} candidature(s)
          </span>
          <span className={`admin-page-context ${latestApplication ? "neutral" : "warning"}`}>
            {latestApplication
              ? `Dernier dossier ${latestApplication.numeroDossier}`
              : "Dossier en préparation"}
          </span>
          <span className="admin-page-context neutral">
            Mis à jour le {formatDateTime(lastUpdate)}
          </span>
        </div>
      </section>

      {dashboardError ? (
        <div className="student-profile-feedback student-profile-feedback-error" role="alert">
          {dashboardError}
        </div>
      ) : null}

      {isDashboardLoading ? (
        <div className="student-profile-feedback">Actualisation du tableau de bord...</div>
      ) : null}

      <section className="campus-section-container student-dashboard-panel">
        <div className="campus-section-header student-dashboard-section-head">
          <div>
            <h2>Résumé de votre dossier</h2>
            <p>Les indicateurs essentiels pour évaluer rapidement l'état de votre candidature.</p>
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
              <p>Visualisez les volets complétés et ceux qui restent à renseigner.</p>
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
              <p>Consultez l'état de votre dernier dossier et les prochaines étapes à suivre.</p>
            </div>
          </div>

          <div className="student-dashboard-status-card">
            <div className="student-dashboard-status-head">
              {latestApplication ? (
                <StatusBadge status={latestApplication.statut} />
              ) : (
                <span className="student-dashboard-draft-badge">À finaliser</span>
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
                <span>Numéro de dossier</span>
                <strong>{latestApplication?.numeroDossier || "Brouillon en cours"}</strong>
              </div>
              <div className="student-dashboard-status-item">
                <span>Formation souhaitée</span>
                <strong>
                  {latestApplication?.specialite || mergedAcademic.filiere || mergedAcademic.specialite || "À renseigner"}
                </strong>
              </div>
              <div className="student-dashboard-status-item">
                <span>Établissement</span>
                <strong>
                  {latestApplication?.universite || mergedAcademic.etablissement || mergedAcademic.universite || "À renseigner"}
                </strong>
              </div>
              <div className="student-dashboard-status-item">
                <span>Dernière mise à jour</span>
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
              <p>Repérez les pièces déjà déposées et celles qui restent à fournir.</p>
            </div>
            <span
              className={`admin-page-context ${
                missingDocuments.length === 0 ? "positive" : "warning"
              }`}
            >
              {submittedRequiredDocumentsCount}/{requiredDocuments.length} pièces obligatoires
            </span>
          </div>

          <div className="student-dashboard-documents-list">
            {documents.map((document) => (
              <div key={document.key} className="student-document-row">
                <div className="student-document-copy">
                  <h3>{document.label}</h3>
                  {document.optional ? <small>Optionnel</small> : null}
                  <p>
                    {document.isSubmitted
                      ? document.fileName
                      : "Aucun fichier déposé pour le moment."}
                  </p>
                </div>

                <span
                  className={`student-document-status ${
                    document.isSubmitted ? "is-submitted" : "is-missing"
                  }`}
                >
                  {document.isSubmitted ? "Déposé" : "Manquant"}
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
              <h2>Points d'attention</h2>
              <p>Les éléments qui nécessitent votre attention pour maintenir un dossier complet.</p>
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
            <h2>Historique récent</h2>
            <p>Retrouvez les derniers mouvements enregistrés sur votre dossier.</p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <EmptyState
            title="Aucune activité récente"
            description="Vos soumissions et les évolutions de statut apparaîtront ici."
            actionLabel="Compléter mon dossier"
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
            <p>Les raccourcis essentiels pour avancer dans votre candidature.</p>
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

              {action.href ? (
                <a
                  href={action.href}
                  className="student-dashboard-action-link admin-quick-action-button"
                >
                  {action.buttonLabel}
                </a>
              ) : (
                <Link
                  to={action.to}
                  className="student-dashboard-action-link admin-quick-action-button"
                >
                  {action.buttonLabel}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

