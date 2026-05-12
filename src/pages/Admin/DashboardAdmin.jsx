import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdmissions } from "../../context/AdmissionsContext";
import { getAdminDashboard } from "../../services/adminService";
import {
  getAdminActionAlerts,
  formatAdminDate,
  formatAdminDateTime,
  getAdminChartInsights,
  getAdminMetadataInsights,
  getAdminProcessingFunnel,
  getAdminRecentActivity,
  getAdminStats,
  getAdminTreatmentQueue,
  getAdminWorkQueue,
  getAdminWorkQueueRows,
  toAdminApplication,
} from "../../utils/adminApplications";
import "../../index.css";

function normalize(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

function getSeverityTone(level) {
  switch (level) {
    case "danger":
      return "danger";
    case "warning":
      return "warning";
    case "positive":
      return "positive";
    case "info":
      return "info";
    default:
      return "neutral";
  }
}

function DashboardStatIcon({ name }) {
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
    case "files":
      return (
        <svg {...commonProps}>
          <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h6A2.5 2.5 0 0 1 19 5.5v10a2.5 2.5 0 0 1-2.5 2.5H15" />
          <path d="M7.5 8H13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7.5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 7.5 8z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.5v4.8l3 1.8" />
        </svg>
      );
    case "check":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.8 12.3l2.1 2.2 4.5-5" />
        </svg>
      );
    case "close":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.2 9.2l5.6 5.6" />
          <path d="M14.8 9.2l-5.6 5.6" />
        </svg>
      );
    case "student":
      return (
        <svg {...commonProps}>
          <path d="M4 9.5L12 6l8 3.5-8 3.5z" />
          <path d="M8.5 12.2v3.1c0 1.4 1.6 2.7 3.5 2.7s3.5-1.3 3.5-2.7v-3.1" />
          <path d="M20 10v4.5" />
        </svg>
      );
    case "warning":
      return (
        <svg {...commonProps}>
          <path d="M12 4.5l8 14H4z" />
          <path d="M12 9v4.5" />
          <path d="M12 16.6h.01" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
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

function ActivityFeedIcon({ name }) {
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
    case "Soumission":
      return (
        <svg {...commonProps}>
          <path d="M6 4.5h8l4 4V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
          <path d="M14 4.5v4h4" />
          <path d="M9 14.5h6" />
          <path d="M9 10.5h4" />
        </svg>
      );
    case "Validation":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.5 12.3l2.1 2.2 4.8-5.2" />
        </svg>
      );
    case "Refus":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 9l6 6" />
          <path d="M15 9l-6 6" />
        </svg>
      );
    case "Note":
      return (
        <svg {...commonProps}>
          <path d="M7 5h10a2 2 0 0 1 2 2v10l-4-2-4 2-4-2V7a2 2 0 0 1 2-2z" />
          <path d="M9 9h6" />
          <path d="M9 12h4" />
        </svg>
      );
    case "Pilotage":
    case "Revision":
      return (
        <svg {...commonProps}>
          <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7" />
          <path d="M20 4.5v4.2h-4.2" />
          <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.3" />
          <path d="M4 19.5v-4.2h4.2" />
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

DashboardStatIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

ActivityFeedIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

function matchesWorkQueueFilter(application, filter) {
  switch (filter) {
    case "critiques":
      return application.isCritical;
    case "relances":
      return application.needsFollowUp;
    case "decision":
      return application.needsDecision;
    case "nouveaux":
      return application.isNew;
    default:
      return true;
  }
}

function matchesDashboardStatus(application, filter) {
  switch (filter) {
    case "attente":
      return application.statut === "En attente";
    case "acceptee":
      return application.statut === "Acceptee";
    case "refusee":
      return application.statut === "Rejetee";
    default:
      return true;
  }
}

function matchesDashboardPriority(application, filter) {
  switch (filter) {
    case "critiques":
      return application.isCritical;
    case "relances":
      return application.needsFollowUp;
    case "decision":
      return application.needsDecision;
    case "nouveaux":
      return application.isNew;
    case "instruction":
      return application.isUnderReview;
    default:
      return true;
  }
}

function matchesDashboardManualPriority(application, filter) {
  if (filter === "toutes") {
    return true;
  }

  return application.adminMeta?.internalPriority === filter;
}

function matchesDashboardAssignedTo(application, filter) {
  if (filter === "tous") {
    return true;
  }

  if (filter === "non-assigne") {
    return !application.assignedToLabel || application.assignedToLabel === "Non assigne";
  }

  return application.assignedToLabel === filter;
}

function matchesDashboardInternalStatus(application, filter) {
  if (filter === "tous") {
    return true;
  }

  return application.adminMeta?.internalStatus === filter;
}

function matchesDashboardPeriod(application, filter) {
  if (filter === "all") {
    return true;
  }

  if (!application.submittedDate) {
    return false;
  }

  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);

  if (filter === "7j") {
    threshold.setDate(threshold.getDate() - 6);
  } else if (filter === "30j") {
    threshold.setDate(threshold.getDate() - 29);
  } else if (filter === "90j") {
    threshold.setDate(threshold.getDate() - 89);
  }

  return application.submittedDate >= threshold;
}

function getFilterLabel(value, options, fallback = "Tous") {
  return options.find((option) => option.value === value)?.label || fallback;
}

function getWorkQueueRoute(filter) {
  switch (filter) {
    case "critiques":
      return "/admin/candidatures?status=attente&queue=retard";
    case "relances":
      return "/admin/candidatures?status=attente&completion=incomplets";
    case "decision":
      return "/admin/candidatures?status=attente&completion=complets&queue=pret";
    case "nouveaux":
      return "/admin/candidatures?status=attente&queue=today";
    default:
      return "/admin/candidatures?status=attente";
  }
}

function getWorkQueueFooterLabel(filter) {
  switch (filter) {
    case "critiques":
      return "Voir la file critique complete";
    case "relances":
      return "Voir toutes les relances";
    case "decision":
      return "Voir les dossiers prets a arbitrer";
    case "nouveaux":
      return "Voir les nouvelles soumissions";
    default:
      return "Voir toute la file d'instruction";
  }
}

const ROUTE_PARAM_DEFAULTS = {
  completion: "tous",
  filter: "manquants",
  internalStatus: "tous",
  manualPriority: "toutes",
  owner: "tous",
  priority: "toutes",
  query: "",
  queue: "tous",
  specialite: "toutes",
  status: "tous",
  university: "toutes",
};

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { applications, activityLog } = useAdmissions();
  const [adminDashboardData, setAdminDashboardData] = useState(null);
  const [isAdminDashboardLoading, setIsAdminDashboardLoading] = useState(true);
  const [adminDashboardError, setAdminDashboardError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [workQueueFilter, setWorkQueueFilter] = useState("tous");
  const [activeDashboardSection, setActiveDashboardSection] = useState("pilotage");
  const [showDashboardFilters, setShowDashboardFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearchQuery, setRecentSearchQuery] = useState("");
  const [recentStatusFilter, setRecentStatusFilter] = useState("tous");
  const [dashboardPeriod, setDashboardPeriod] = useState(searchParams.get("period") || "all");
  const [dashboardUniversity, setDashboardUniversity] = useState(
    searchParams.get("university") || "toutes"
  );
  const [dashboardStatus, setDashboardStatus] = useState(searchParams.get("status") || "tous");
  const [dashboardPriority, setDashboardPriority] = useState(
    searchParams.get("priority") || "toutes"
  );
  const [dashboardManualPriority, setDashboardManualPriority] = useState(
    searchParams.get("manualPriority") || "toutes"
  );
  const [dashboardAssignedTo, setDashboardAssignedTo] = useState(
    searchParams.get("owner") || "tous"
  );
  const [dashboardInternalStatus, setDashboardInternalStatus] = useState(
    searchParams.get("internalStatus") || "tous"
  );
  const [dashboardSpecialite, setDashboardSpecialite] = useState(
    searchParams.get("specialite") || "toutes"
  );
  const periodOptions = [
    { value: "all", label: "Toute la campagne" },
    { value: "7j", label: "7 derniers jours" },
    { value: "30j", label: "30 derniers jours" },
    { value: "90j", label: "90 derniers jours" },
  ];
  const statusOptions = [
    { value: "tous", label: "Tous les statuts" },
    { value: "attente", label: "En attente" },
    { value: "acceptee", label: "Acceptees" },
    { value: "refusee", label: "Refusees" },
  ];
  const priorityOptions = [
    { value: "toutes", label: "Toutes les priorites" },
    { value: "critiques", label: "Critiques" },
    { value: "relances", label: "Relances" },
    { value: "decision", label: "Prets a arbitrer" },
    { value: "nouveaux", label: "Nouveaux" },
    { value: "instruction", label: "En instruction" },
  ];
  const manualPriorityOptions = [
    { value: "toutes", label: "Toutes les priorites manuelles" },
    { value: "basse", label: "Basse" },
    { value: "moyenne", label: "Moyenne" },
    { value: "haute", label: "Haute" },
    { value: "critique", label: "Critique" },
  ];
  const internalStatusOptions = [
    { value: "tous", label: "Tous les statuts internes" },
    { value: "qualification", label: "Qualification" },
    { value: "instruction", label: "Instruction" },
    { value: "commission", label: "Commission" },
    { value: "decision", label: "Decision" },
    { value: "decision-finalisee", label: "Decision finalisee" },
  ];

  useEffect(() => {
    let isActive = true;

    async function loadAdminDashboard() {
      setIsAdminDashboardLoading(true);
      setAdminDashboardError("");

      try {
        const data = await getAdminDashboard();

        if (isActive) {
          setAdminDashboardData(data);
        }
      } catch (error) {
        if (isActive) {
          setAdminDashboardError(error.message || "Impossible de charger le dashboard admin.");
        }
      } finally {
        if (isActive) {
          setIsAdminDashboardLoading(false);
        }
      }
    }

    loadAdminDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const dashboardApplicationsSource = adminDashboardData?.applications?.length
    ? adminDashboardData.applications
    : applications;
  const dashboardActivitySource = adminDashboardData?.recentActivity?.length
    ? adminDashboardData.recentActivity.map((activity, index) => ({
        id: `${activity.type || "activity"}-${activity.date || index}`,
        applicationId: activity.applicationId || "",
        icon:
          activity.type === "document"
            ? "Note"
            : activity.status === "Acceptee"
              ? "Validation"
              : activity.status === "Rejetee"
                ? "Refus"
                : "Soumission",
        title: activity.title || "Activite",
        description: activity.description || "",
        detail: "",
        actorName: "Plateforme PFC",
        actorRole: "Backend",
        numeroDossier: "",
        occurredAt: activity.date,
        tone:
          activity.status === "Acceptee"
            ? "positive"
            : activity.status === "Rejetee"
              ? "danger"
              : "info",
        status: activity.status || "",
      }))
    : activityLog;

  const adminApplications = useMemo(
    () => dashboardApplicationsSource.map(toAdminApplication),
    [dashboardApplicationsSource]
  );
  const universityOptions = useMemo(
    () => [...new Set(adminApplications.map((application) => application.universite).filter(Boolean))].sort(),
    [adminApplications]
  );
  const specialiteOptions = useMemo(
    () => [...new Set(adminApplications.map((application) => application.specialite).filter(Boolean))].sort(),
    [adminApplications]
  );
  const allDashboardRows = useMemo(
    () => getAdminWorkQueueRows(adminApplications),
    [adminApplications]
  );
  const assignedToOptions = useMemo(
    () =>
      [
        ...new Set(
          allDashboardRows
            .map((application) => application.assignedToLabel)
            .filter((value) => value && value !== "Non assigne")
        ),
      ].sort(),
    [allDashboardRows]
  );

  useEffect(() => {
    setDashboardPeriod(searchParams.get("period") || "all");
    setDashboardUniversity(searchParams.get("university") || "toutes");
    setDashboardStatus(searchParams.get("status") || "tous");
    setDashboardPriority(searchParams.get("priority") || "toutes");
    setDashboardManualPriority(searchParams.get("manualPriority") || "toutes");
    setDashboardAssignedTo(searchParams.get("owner") || "tous");
    setDashboardInternalStatus(searchParams.get("internalStatus") || "tous");
    setDashboardSpecialite(searchParams.get("specialite") || "toutes");
  }, [searchParams]);

  function updateDashboardParams(overrides = {}) {
    const nextValues = {
      period: dashboardPeriod,
      university: dashboardUniversity,
      status: dashboardStatus,
      priority: dashboardPriority,
      manualPriority: dashboardManualPriority,
      owner: dashboardAssignedTo,
      internalStatus: dashboardInternalStatus,
      specialite: dashboardSpecialite,
      ...overrides,
    };

    const params = new URLSearchParams();

    if (nextValues.period && nextValues.period !== "all") {
      params.set("period", nextValues.period);
    }
    if (nextValues.university && nextValues.university !== "toutes") {
      params.set("university", nextValues.university);
    }
    if (nextValues.status && nextValues.status !== "tous") {
      params.set("status", nextValues.status);
    }
    if (nextValues.priority && nextValues.priority !== "toutes") {
      params.set("priority", nextValues.priority);
    }
    if (nextValues.manualPriority && nextValues.manualPriority !== "toutes") {
      params.set("manualPriority", nextValues.manualPriority);
    }
    if (nextValues.owner && nextValues.owner !== "tous") {
      params.set("owner", nextValues.owner);
    }
    if (nextValues.internalStatus && nextValues.internalStatus !== "tous") {
      params.set("internalStatus", nextValues.internalStatus);
    }
    if (nextValues.specialite && nextValues.specialite !== "toutes") {
      params.set("specialite", nextValues.specialite);
    }

    setSearchParams(params, { replace: true });
  }

  const filteredAdminApplications = useMemo(
    () =>
      allDashboardRows.filter((application) => {
        const matchesUniversity =
          dashboardUniversity === "toutes" || application.universite === dashboardUniversity;
        const matchesStatus = matchesDashboardStatus(application, dashboardStatus);
        const matchesPriority = matchesDashboardPriority(application, dashboardPriority);
        const matchesManualPriority = matchesDashboardManualPriority(
          application,
          dashboardManualPriority
        );
        const matchesAssignedTo = matchesDashboardAssignedTo(
          application,
          dashboardAssignedTo
        );
        const matchesInternalStatus = matchesDashboardInternalStatus(
          application,
          dashboardInternalStatus
        );
        const matchesPeriod = matchesDashboardPeriod(application, dashboardPeriod);
        const matchesSpecialite =
          dashboardSpecialite === "toutes" || application.specialite === dashboardSpecialite;

        return (
          matchesUniversity &&
          matchesStatus &&
          matchesPriority &&
          matchesManualPriority &&
          matchesAssignedTo &&
          matchesInternalStatus &&
          matchesPeriod &&
          matchesSpecialite
        );
      }),
    [
      allDashboardRows,
      dashboardAssignedTo,
      dashboardInternalStatus,
      dashboardManualPriority,
      dashboardPeriod,
      dashboardPriority,
      dashboardSpecialite,
      dashboardStatus,
      dashboardUniversity,
    ]
  );
  const dashboardHasResults = filteredAdminApplications.length > 0;
  const dashboardScopeSummary = [
    dashboardPeriod !== "all"
      ? `Periode : ${getFilterLabel(dashboardPeriod, periodOptions, "Toute la campagne")}`
      : null,
    dashboardStatus !== "tous"
      ? `Statut : ${getFilterLabel(dashboardStatus, statusOptions, "Tous les statuts")}`
      : null,
    dashboardPriority !== "toutes"
      ? `Priorite operationnelle : ${getFilterLabel(
          dashboardPriority,
          priorityOptions,
          "Toutes les priorites"
        )}`
      : null,
    dashboardManualPriority !== "toutes"
      ? `Priorite manuelle : ${getFilterLabel(
          dashboardManualPriority,
          manualPriorityOptions,
          "Toutes les priorites manuelles"
        )}`
      : null,
    dashboardAssignedTo !== "tous"
      ? `Affectation : ${dashboardAssignedTo === "non-assigne" ? "Non assigne" : dashboardAssignedTo}`
      : null,
    dashboardInternalStatus !== "tous"
      ? `Statut interne : ${getFilterLabel(
          dashboardInternalStatus,
          internalStatusOptions,
          "Tous les statuts internes"
        )}`
      : null,
    dashboardUniversity !== "toutes" ? `Universite : ${dashboardUniversity}` : null,
    dashboardSpecialite !== "toutes" ? `Specialite : ${dashboardSpecialite}` : null,
  ].filter(Boolean);
  const adminStats = useMemo(
    () => getAdminStats(filteredAdminApplications),
    [filteredAdminApplications]
  );
  const adminRecentActivity = useMemo(
    () => getAdminRecentActivity(filteredAdminApplications, dashboardActivitySource),
    [dashboardActivitySource, filteredAdminApplications]
  );
  const adminAlerts = useMemo(
    () => getAdminActionAlerts(filteredAdminApplications),
    [filteredAdminApplications]
  );
  const chartInsights = useMemo(
    () => getAdminChartInsights(filteredAdminApplications),
    [filteredAdminApplications]
  );
  const metadataInsights = useMemo(
    () => getAdminMetadataInsights(filteredAdminApplications),
    [filteredAdminApplications]
  );
  const processingFunnel = useMemo(
    () => getAdminProcessingFunnel(filteredAdminApplications),
    [filteredAdminApplications]
  );
  const treatmentQueue = useMemo(
    () => getAdminTreatmentQueue(filteredAdminApplications),
    [filteredAdminApplications]
  );
  const adminWorkQueue = useMemo(
    () => getAdminWorkQueue(filteredAdminApplications),
    [filteredAdminApplications]
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchedWorkQueue = useMemo(() => {
    const q = normalize(debouncedQuery || searchQuery);

    return adminWorkQueue.items.filter((application) => {
      if (!q) return true;

      return [
        application.nom,
        application.numeroDossier,
        application.universite,
        application.specialite,
        application.blocker,
        application.workLaneLabel,
      ].some((value) => normalize(value).includes(q));
    });
  }, [adminWorkQueue.items, debouncedQuery, searchQuery]);

  const filteredWorkQueue = useMemo(
    () => searchedWorkQueue.filter((application) => matchesWorkQueueFilter(application, workQueueFilter)),
    [searchedWorkQueue, workQueueFilter]
  );

  const displayedWorkQueue = useMemo(() => filteredWorkQueue.slice(0, 6), [filteredWorkQueue]);

  const workQueueCounts = {
    tous: searchedWorkQueue.length,
    critiques: searchedWorkQueue.filter((application) => application.isCritical).length,
    relances: searchedWorkQueue.filter((application) => application.needsFollowUp).length,
    decision: searchedWorkQueue.filter((application) => application.needsDecision).length,
    nouveaux: searchedWorkQueue.filter((application) => application.isNew).length,
  };

  const applyDashboardMetadataFilter = (overrides = {}) => {
    if (Object.prototype.hasOwnProperty.call(overrides, "manualPriority")) {
      setDashboardManualPriority(overrides.manualPriority);
    }
    if (Object.prototype.hasOwnProperty.call(overrides, "owner")) {
      setDashboardAssignedTo(overrides.owner);
    }
    if (Object.prototype.hasOwnProperty.call(overrides, "internalStatus")) {
      setDashboardInternalStatus(overrides.internalStatus);
    }

    updateDashboardParams(overrides);
  };

  const buildScopedAdminPath = (path, overrides = {}, options = {}) => {
    const [pathname, search = ""] = path.split("?");
    const params = new URLSearchParams(search);
    const scopedValues = {
      university: dashboardUniversity,
      specialite: dashboardSpecialite,
      manualPriority: dashboardManualPriority,
      owner: dashboardAssignedTo,
      internalStatus: dashboardInternalStatus,
    };

    if (options.includeDashboardStatus !== false) {
      scopedValues.status = dashboardStatus;
    }

    if (options.includeSearchQuery && (debouncedQuery || searchQuery).trim()) {
      scopedValues.query = (debouncedQuery || searchQuery).trim();
    }

    Object.entries(scopedValues).forEach(([key, value]) => {
      const defaultValue = ROUTE_PARAM_DEFAULTS[key];
      if (
        value != null &&
        value !== "" &&
        value !== defaultValue &&
        !params.has(key)
      ) {
        params.set(key, value);
      }
    });

    Object.entries(overrides).forEach(([key, value]) => {
      const defaultValue = ROUTE_PARAM_DEFAULTS[key];
      if (value == null || value === "" || value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const navigateToScopedAdminPath = (path, overrides = {}, options = {}) => {
    navigate(buildScopedAdminPath(path, overrides, options));
  };

  const handleResetDashboardFilters = () => {
    setDashboardPeriod("all");
    setDashboardUniversity("toutes");
    setDashboardStatus("tous");
    setDashboardPriority("toutes");
    setDashboardManualPriority("toutes");
    setDashboardAssignedTo("tous");
    setDashboardInternalStatus("tous");
    setDashboardSpecialite("toutes");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      navigateToScopedAdminPath(
        "/admin/candidatures",
        { query: (debouncedQuery || searchQuery).trim() },
        { includeSearchQuery: false }
      );
    }
  };

  const adminStatCards = [
    {
      id: "total",
      label: "Total candidatures",
      value: adminStats.totalCandidatures,
      detail: `${adminStats.receptions7j} deposee(s) sur 7 jours`,
      tone: "total",
      icon: "files",
      path: buildScopedAdminPath("/admin/candidatures"),
    },
    {
      id: "pending",
      label: "En attente",
      value: adminStats.enAttente,
      detail:
        adminStats.backlogCritique > 0
          ? `${adminStats.backlogCritique} retard(s) critique(s)`
          : "A traiter en priorite",
      tone: "attente",
      icon: "clock",
      path: buildScopedAdminPath("/admin/candidatures", { status: "attente" }),
    },
    {
      id: "accepted",
      label: "Acceptees",
      value: adminStats.acceptees,
      detail:
        adminStats.finalisees > 0
          ? `${adminStats.tauxAcceptation}% des decisions`
          : "Aucune decision finalisee",
      tone: "acceptee",
      icon: "check",
      path: buildScopedAdminPath("/admin/candidatures", { status: "acceptee" }),
    },
    {
      id: "refused",
      label: "Refusees",
      value: adminStats.refusees,
      detail:
        adminStats.finalisees > 0
          ? `${adminStats.tauxFinalisation}% du portefeuille traite`
          : "Suivi des arbitrages",
      tone: "refusee",
      icon: "close",
      path: buildScopedAdminPath("/admin/candidatures", { status: "refusee" }),
    },
    {
      id: "students",
      label: "Etudiants inscrits",
      value: adminStats.totalEtudiants,
      detail: `${adminStats.totalCandidatures} candidature(s) deposee(s)`,
      tone: "etudiants",
      icon: "student",
      path: buildScopedAdminPath("/admin/etudiants"),
    },
    {
      id: "incomplete",
      label: "Dossiers incomplets",
      value: adminStats.dossiersIncomplets,
      detail: `${adminStats.documentsManquants} controle(s) documentaire(s)`,
      tone: "incomplets",
      icon: "warning",
      path: buildScopedAdminPath("/admin/candidatures", {
        status: "attente",
        completion: "incomplets",
      }),
    },
  ];

  const backendStats = adminDashboardData?.stats;
  const displayedAdminStatCards = backendStats
    ? adminStatCards.map((card) => {
        if (card.id === "total") {
          return { ...card, value: backendStats.totalCandidatures ?? card.value };
        }
        if (card.id === "pending") {
          return {
            ...card,
            value: backendStats.enAttente ?? card.value,
            detail: `${backendStats.documentsEnAttente ?? 0} document(s) en attente`,
          };
        }
        if (card.id === "accepted") {
          return { ...card, value: backendStats.acceptees ?? card.value };
        }
        if (card.id === "refused") {
          return { ...card, value: backendStats.refusees ?? card.value };
        }
        if (card.id === "students") {
          return { ...card, value: backendStats.totalEtudiants ?? card.value };
        }
        if (card.id === "incomplete") {
          return {
            ...card,
            value: backendStats.dossiersIncomplets ?? card.value,
            detail: `${backendStats.documentsEnAttente ?? 0} document(s) a verifier`,
          };
        }

        return card;
      })
    : adminStatCards;

  const activeFilterCount = dashboardScopeSummary.length;
  const activeAdminAlerts = adminAlerts.filter((alert) => alert.count > 0).slice(0, 4);
  const dashboardQuickActions = [
    {
      id: "candidatures",
      title: "Gerer les candidatures",
      description: "Suivre, filtrer et examiner les dossiers en cours d'instruction.",
      buttonLabel: "Acceder",
      icon: "files",
      tone: "total",
      path: buildScopedAdminPath("/admin/candidatures"),
    },
    {
      id: "etudiants",
      title: "Voir les etudiants",
      description: "Consulter les profils, les inscriptions et les informations de parcours.",
      buttonLabel: "Acceder",
      icon: "student",
      tone: "etudiants",
      path: buildScopedAdminPath("/admin/etudiants"),
    },
    {
      id: "documents",
      title: "Consulter les documents",
      description: "Verifier les pieces manquantes et la completude documentaire.",
      buttonLabel: "Acceder",
      icon: "warning",
      tone: "incomplets",
      path: buildScopedAdminPath("/admin/documents"),
    },
    {
      id: "profil",
      title: "Profil administrateur",
      description: "Mettre a jour vos preferences et informations de session.",
      buttonLabel: "Acceder",
      icon: "check",
      tone: "acceptee",
      path: "/admin/profil",
    },
  ];
  const recentApplicationsSource = useMemo(
    () =>
      [...filteredAdminApplications]
        .sort((first, second) => {
          const firstDate = new Date(first.submittedDate || first.date || 0).getTime();
          const secondDate = new Date(second.submittedDate || second.date || 0).getTime();
          return secondDate - firstDate;
        }),
    [filteredAdminApplications]
  );
  const recentApplicationsBySearch = useMemo(() => {
    const query = normalize(recentSearchQuery);
    if (!query) {
      return recentApplicationsSource;
    }

    return recentApplicationsSource.filter((application) => {
      const haystack = [
        application.nom,
        application.numeroDossier,
        application.universite,
        application.specialite,
      ]
        .map((value) => normalize(value))
        .join(" ");

      return haystack.includes(query);
    });
  }, [recentApplicationsSource, recentSearchQuery]);
  const recentStatusCounts = useMemo(
    () => ({
      tous: recentApplicationsBySearch.length,
      attente: recentApplicationsBySearch.filter((application) => application.statut === "attente")
        .length,
      acceptee: recentApplicationsBySearch.filter(
        (application) => application.statut === "acceptee"
      ).length,
      refusee: recentApplicationsBySearch.filter((application) => application.statut === "refusee")
        .length,
    }),
    [recentApplicationsBySearch]
  );
  const recentFilteredApplications = useMemo(() => {
    if (recentStatusFilter === "tous") {
      return recentApplicationsBySearch;
    }

    return recentApplicationsBySearch.filter(
      (application) => application.statut === recentStatusFilter
    );
  }, [recentApplicationsBySearch, recentStatusFilter]);
  const recentApplications = recentFilteredApplications.slice(0, 6);
  const recentStatusTabs = [
    { id: "tous", label: "Tous", count: recentStatusCounts.tous },
    { id: "attente", label: "En attente", count: recentStatusCounts.attente },
    { id: "acceptee", label: "Acceptees", count: recentStatusCounts.acceptee },
    { id: "refusee", label: "Refusees", count: recentStatusCounts.refusee },
  ];
  const pilotageUniversityChart = chartInsights.volumeByUniversity.slice(0, 5);
  const visibleRecentActivity = adminRecentActivity.slice(0, 6);
  const dashboardSectionTabs = [
    {
      id: "pilotage",
      label: "Pilotage",
      helper: "Priorites, dossiers et activite",
      count: `${adminStats.totalCandidatures} dossiers`,
    },
    {
      id: "traitement",
      label: "Traitement",
      helper: "Files, urgences et relances",
      count: `${adminWorkQueue.summary.totalOpen} ouverts`,
    },
    {
      id: "analyses",
      label: "Analyses",
      helper: "Tunnel, statuts et graphiques",
      count: `${chartInsights.volumeByUniversity.length} vues`,
    },
  ];
  const handleRecentApplicationOpen = (applicationId) => {
    navigate(`/admin/candidatures/${applicationId}`);
  };

  const handleRecentRowKeyDown = (event, applicationId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRecentApplicationOpen(applicationId);
    }
  };

  return (
    <AdminLayout
      title="Tableau de bord administrateur"
      subtitle="Suivi et gestion des candidatures d'admission"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchKeyDown={handleSearchKeyDown}
      searchPlaceholder="Rechercher un etudiant, une universite, une specialite ou un numero de dossier..."
    >
      <section className="campus-section-container">
        <div className="admin-dashboard-topbar">
          <div className="admin-dashboard-topbar-context">
            <span className="admin-page-context neutral">
              {filteredAdminApplications.length} dossier(s) visibles
            </span>
            {activeFilterCount > 0 ? (
              <span className="admin-page-context info">
                {activeFilterCount} filtre(s) actif(s)
              </span>
            ) : (
              <span className="admin-page-context positive">Perimetre global de campagne</span>
            )}
          </div>

          <div className="admin-dashboard-topbar-actions">
            <Button
              className={`admin-filter-tab ${showDashboardFilters ? "active" : ""}`}
              onClick={() => setShowDashboardFilters((current) => !current)}
            >
              {showDashboardFilters ? "Masquer les filtres" : "Afficher les filtres"}
            </Button>
          </div>
        </div>

        <div className="admin-dashboard-section-nav admin-dashboard-section-nav-compact">
          {dashboardSectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-dashboard-section-tab ${
                activeDashboardSection === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveDashboardSection(tab.id)}
            >
              <span className="admin-dashboard-section-label">{tab.label}</span>
              <strong className="admin-dashboard-section-count">{tab.count}</strong>
              <small className="admin-dashboard-section-helper">{tab.helper}</small>
            </button>
          ))}
        </div>
        {showDashboardFilters ? (
        <div className="admin-dashboard-filters-panel">
          <div className="admin-dashboard-filters-header">
            <div className="admin-dashboard-filters-copy">
              <span className="admin-section-kicker">Filtres globaux</span>
              <h3>{filteredAdminApplications.length} dossier(s) dans la vue courante</h3>
              <p>
                Tous les indicateurs, alertes, graphiques et files de travail du dashboard
                utilisent ce perimetre partage.
              </p>
            </div>

            <div className="admin-dashboard-filter-chips">
              {dashboardScopeSummary.length > 0 ? (
                dashboardScopeSummary.map((item) => (
                  <span key={item} className="admin-queue-pill neutral">
                    {item}
                  </span>
                ))
              ) : (
                <span className="admin-queue-pill neutral">Perimetre global de campagne</span>
              )}
            </div>
          </div>

          <div className="admin-toolbar admin-dashboard-toolbar">
            <div className="admin-toolbar-group">
              <label className="admin-toolbar-label" htmlFor="dashboardPeriod">
                Periode
              </label>
              <select
                id="dashboardPeriod"
                className="admin-toolbar-select"
                value={dashboardPeriod}
                onChange={(event) => {
                  const value = event.target.value;
                  setDashboardPeriod(value);
                  updateDashboardParams({ period: value });
                }}
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-toolbar-group">
              <label className="admin-toolbar-label" htmlFor="dashboardStatus">
                Statut
              </label>
              <select
                id="dashboardStatus"
                className="admin-toolbar-select"
                value={dashboardStatus}
                onChange={(event) => {
                  const value = event.target.value;
                  setDashboardStatus(value);
                  updateDashboardParams({ status: value });
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-toolbar-group">
              <label className="admin-toolbar-label" htmlFor="dashboardUniversity">
                Universite
              </label>
              <select
                id="dashboardUniversity"
                className="admin-toolbar-select"
                value={dashboardUniversity}
                onChange={(event) => {
                  const value = event.target.value;
                  setDashboardUniversity(value);
                  updateDashboardParams({ university: value });
                }}
              >
                <option value="toutes">Toutes</option>
                {universityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-toolbar-group">
              <label className="admin-toolbar-label" htmlFor="dashboardSpecialite">
                Specialite
              </label>
              <select
                id="dashboardSpecialite"
                className="admin-toolbar-select"
                value={dashboardSpecialite}
                onChange={(event) => {
                  const value = event.target.value;
                  setDashboardSpecialite(value);
                  updateDashboardParams({ specialite: value });
                }}
              >
                <option value="toutes">Toutes</option>
                {specialiteOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-toolbar-actions">
              <Button className="admin-filter-tab" onClick={handleResetDashboardFilters}>
                Reinitialiser les filtres
              </Button>
              <Button
                className={`admin-filter-tab ${showAdvancedFilters ? "active" : ""}`}
                onClick={() => setShowAdvancedFilters((current) => !current)}
              >
                {showAdvancedFilters ? "Masquer les filtres avances" : "Filtres avances"}
              </Button>
            </div>
          </div>

          {showAdvancedFilters ? (
            <div className="admin-dashboard-advanced-panel">
              <div className="admin-toolbar admin-dashboard-toolbar admin-dashboard-toolbar-secondary">
                <div className="admin-toolbar-group">
                  <label className="admin-toolbar-label" htmlFor="dashboardPriority">
                    Priorite
                  </label>
                  <select
                    id="dashboardPriority"
                    className="admin-toolbar-select"
                    value={dashboardPriority}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDashboardPriority(value);
                      updateDashboardParams({ priority: value });
                    }}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-toolbar-group">
                  <label className="admin-toolbar-label" htmlFor="dashboardManualPriority">
                    Priorite manuelle
                  </label>
                  <select
                    id="dashboardManualPriority"
                    className="admin-toolbar-select"
                    value={dashboardManualPriority}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDashboardManualPriority(value);
                      updateDashboardParams({ manualPriority: value });
                    }}
                  >
                    {manualPriorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-toolbar-group">
                  <label className="admin-toolbar-label" htmlFor="dashboardAssignedTo">
                    Affectation
                  </label>
                  <select
                    id="dashboardAssignedTo"
                    className="admin-toolbar-select"
                    value={dashboardAssignedTo}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDashboardAssignedTo(value);
                      updateDashboardParams({ owner: value });
                    }}
                  >
                    <option value="tous">Toutes les cellules</option>
                    <option value="non-assigne">Non assignes</option>
                    {assignedToOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-toolbar-group">
                  <label className="admin-toolbar-label" htmlFor="dashboardInternalStatus">
                    Statut interne
                  </label>
                  <select
                    id="dashboardInternalStatus"
                    className="admin-toolbar-select"
                    value={dashboardInternalStatus}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDashboardInternalStatus(value);
                      updateDashboardParams({ internalStatus: value });
                    }}
                  >
                    {internalStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        ) : null}

      </section>

      {activeDashboardSection === "pilotage" ? (
        <>
          <section className="campus-section-container">
            <div className="campus-section-header">
              <div>
                <h2>Chiffres cles</h2>
                <p>Les indicateurs essentiels pour suivre rapidement l'etat global des candidatures</p>
              </div>
            </div>

            <div className="admin-primary-stats-grid">
              {displayedAdminStatCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`admin-primary-stat-card admin-primary-stat-card-${card.tone}`}
                  onClick={() => navigate(card.path)}
                >
                  <div className="admin-primary-stat-head">
                    <span className={`admin-primary-stat-icon admin-primary-stat-icon-${card.tone}`}>
                      <DashboardStatIcon name={card.icon} />
                    </span>
                  </div>

                  <div className="admin-primary-stat-body">
                    <strong className="admin-primary-stat-value">{card.value}</strong>
                    <h3 className="admin-primary-stat-label">{card.label}</h3>
                    <p className="admin-primary-stat-detail">{card.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="campus-section-container">
            <div className="campus-section-header">
              <div>
                <h2>Actions rapides</h2>
                <p>Accedez directement aux espaces les plus utiles sans passer par plusieurs ecrans</p>
              </div>
            </div>

            <div className="admin-quick-actions-grid">
              {dashboardQuickActions.map((action) => (
                <div key={action.id} className={`admin-quick-action-card admin-quick-action-card-${action.tone}`}>
                  <div className="admin-quick-action-head">
                    <span className={`admin-quick-action-icon admin-quick-action-icon-${action.tone}`}>
                      <DashboardStatIcon name={action.icon} />
                    </span>
                  </div>

                  <div className="admin-quick-action-body">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>

                  <Button
                    className="admin-quick-action-button"
                    onClick={() => navigate(action.path)}
                  >
                    {action.buttonLabel}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="campus-section-container">
            <div className="campus-section-header">
              <h2>Alertes prioritaires</h2>
              <p>Les sujets qui demandent une action immediate sur le portefeuille courant</p>
            </div>

            {activeAdminAlerts.length === 0 ? (
              <EmptyState
                title="Aucune alerte active"
                description="Le portefeuille filtre ne presente actuellement aucun blocage prioritaire."
                className="admin-empty-state"
              />
            ) : (
              <div className="admin-alerts-priority-grid">
                {activeAdminAlerts.map((alert) => (
                  <div key={alert.id} className={`admin-alert-priority-card ${alert.tone}`}>
                    <div className="admin-alert-priority-head">
                      <span className="admin-alert-priority-count">{alert.count}</span>
                      <span className={`admin-queue-pill ${getSeverityTone(alert.tone)}`}>
                        {alert.title}
                      </span>
                    </div>

                    <p className="admin-alert-priority-problem">{alert.problem}</p>
                    <p className="admin-alert-priority-importance">
                      <strong>Pourquoi c&apos;est important :</strong> {alert.importance}
                    </p>
                    <small className="admin-alert-priority-helper">{alert.helper}</small>

                    <Button
                      className="admin-alert-priority-action"
                      onClick={() => navigate(buildScopedAdminPath(alert.path))}
                    >
                      {alert.actionLabel}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="campus-section-container">
            <div className="campus-section-header">
              <div>
                <h2>Candidatures recentes ({recentFilteredApplications.length})</h2>
                <p>Les derniers dossiers recus sur le perimetre courant, avec leur niveau d'avancement</p>
              </div>
            </div>

            <div className="admin-recent-toolbar">
              <label className="admin-recent-search" htmlFor="recentApplicationsSearch">
                <span className="admin-recent-search-icon" aria-hidden="true">
                  <DashboardStatIcon name="search" />
                </span>
                <input
                  id="recentApplicationsSearch"
                  type="search"
                  value={recentSearchQuery}
                  onChange={(event) => setRecentSearchQuery(event.target.value)}
                  placeholder="Rechercher un candidat, une universite ou une specialite..."
                />
              </label>

              <div className="admin-recent-status-tabs" role="tablist" aria-label="Filtrer les candidatures recentes par statut">
                {recentStatusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`admin-filter-tab ${recentStatusFilter === tab.id ? "active" : ""}`}
                    onClick={() => setRecentStatusFilter(tab.id)}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {recentApplications.length === 0 ? (
              <EmptyState
                title="Aucune candidature recente"
                description={
                  recentSearchQuery.trim() || recentStatusFilter !== "tous"
                    ? "Aucun dossier recent ne correspond a votre recherche ou au statut selectionne."
                    : "Les derniers dossiers apparaitront ici des qu'une candidature correspondra aux filtres courants."
                }
                className="admin-empty-state"
              />
            ) : (
              <>
                <div className="admin-table-container admin-recent-table-container">
                  <table className="admin-table mobile-cards admin-recent-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Universite</th>
                        <th>Specialite</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Progression</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="admin-recent-table-row"
                          tabIndex={0}
                          role="button"
                          onClick={() => handleRecentApplicationOpen(application.id)}
                          onKeyDown={(event) => handleRecentRowKeyDown(event, application.id)}
                        >
                          <td data-label="Nom">
                            <div className="admin-table-meta">
                              <span className="admin-table-meta-text">{application.nom}</span>
                              <span className="admin-table-meta-subtext">
                                {application.numeroDossier}
                              </span>
                            </div>
                          </td>
                          <td data-label="Universite">
                            <div className="admin-table-meta">
                              <span className="admin-table-meta-text">{application.universite}</span>
                              <span className="admin-table-meta-subtext">
                                {application.assignedToLabel}
                              </span>
                            </div>
                          </td>
                          <td data-label="Specialite">
                            <div className="admin-table-meta">
                              <span className="admin-table-meta-text">{application.specialite}</span>
                              <span className="admin-table-meta-subtext">
                                {application.internalStatusLabel}
                              </span>
                            </div>
                          </td>
                          <td data-label="Date">{formatAdminDate(application.submittedDate || application.date)}</td>
                          <td data-label="Statut">
                            <StatusBadge status={application.statut} />
                          </td>
                          <td data-label="Progression">
                            <div className="admin-recent-progress">
                              <div className="admin-recent-progress-item">
                                <span className="admin-recent-progress-label">Profil</span>
                                <ProgressBar
                                  value={application.progress.profil}
                                  label={`${application.progress.profil}%`}
                                  compact
                                />
                              </div>
                              <div className="admin-recent-progress-item">
                                <span className="admin-recent-progress-label">Documents</span>
                                <ProgressBar
                                  value={application.progress.documents}
                                  label={`${application.progress.documents}%`}
                                  compact
                                />
                              </div>
                              <div className="admin-recent-progress-item">
                                <span className="admin-recent-progress-label">Validation finale</span>
                                <ProgressBar
                                  value={application.progress.finale}
                                  label={`${application.progress.finale}%`}
                                  compact
                                />
                              </div>
                            </div>
                          </td>
                          <td data-label="Action">
                            <Button
                              className="admin-table-action-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRecentApplicationOpen(application.id);
                              }}
                            >
                              Voir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-table-footer admin-recent-table-footer">
                  <span className="admin-pagination-info">
                    {recentFilteredApplications.length > recentApplications.length
                      ? `Affichage des ${recentApplications.length} dossiers les plus recents sur ${recentFilteredApplications.length} correspondants.`
                      : `${recentApplications.length} dossier(s) correspondent a la recherche et aux filtres courants.`}
                  </span>
                  <Link to={buildScopedAdminPath("/admin/candidatures")} className="campus-btn-primary">
                    Voir toutes les candidatures
                  </Link>
                </div>
              </>
            )}
          </section>

          <section className="campus-section-container">
            <div className="campus-section-header">
              <div>
                <h2>Vue globale</h2>
                <p>Une lecture simple de la repartition des candidatures par universite</p>
              </div>
            </div>

            {!pilotageUniversityChart.length ? (
              <EmptyState
                title="Aucune repartition disponible"
                description="Le graphique apparaitra ici des qu'au moins une candidature sera visible dans le perimetre courant."
                className="admin-empty-state"
              />
            ) : (
              <div className="admin-mini-chart-card">
                <div className="admin-mini-chart-header">
                  <div>
                    <h3>Candidatures par universite</h3>
                    <p>Top etablissements sur la vue en cours</p>
                  </div>
                  <span className="admin-queue-pill neutral">
                    {filteredAdminApplications.length} dossiers
                  </span>
                </div>

                <div className="admin-chart admin-mini-chart">
                  {pilotageUniversityChart.map((item) => (
                    <div key={item.label} className="chart-row admin-mini-chart-row">
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div className="chart-fill chart-fill-info" style={{ width: `${item.share}%` }} />
                      </div>
                      <span className="chart-value">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="campus-section-container">
            <div className="campus-section-header">
              <h2>Activite recente</h2>
              <p>Les derniers mouvements qui rendent la plateforme vivante et active</p>
            </div>

            <div className="admin-activity-list">
              {visibleRecentActivity.length === 0 ? (
                <EmptyState
                  title="Aucune activite recente"
                  description="Les soumissions et les changements de statut apparaitront ici."
                  className="admin-empty-state"
                />
              ) : (
                visibleRecentActivity.map((item) => (
                  <div key={item.id} className={`admin-activity-item ${item.tone || "neutral"}`}>
                    <div className="admin-activity-icon">
                      <ActivityFeedIcon name={item.icon} />
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-headline">
                        <h3>{item.title}</h3>
                        <span className="admin-activity-time">{item.time}</span>
                      </div>
                      <p className="admin-activity-description">{item.description}</p>
                      <div className="admin-activity-meta">
                        <span>{item.actorName}</span>
                        <span>{item.numeroDossier}</span>
                        <span>{item.occurredAt}</span>
                      </div>
                      {item.detail ? <p className="admin-activity-detail">{item.detail}</p> : null}
                    </div>
                    <div className="admin-activity-side">
                      {item.status ? <StatusBadge status={item.status} /> : null}
                      <Button className="admin-table-action-button" onClick={() => navigate(item.path)}>
                        Voir
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}

      {activeDashboardSection === "analyses" ? (
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Pilotage interne des dossiers</h2>
          <p>Affectation, priorisation manuelle et discipline de suivi sur le portefeuille filtre</p>
        </div>

        {!dashboardHasResults ? (
          <EmptyState
            title="Aucun pilotage a afficher"
            description="Ajoutez des dossiers ou assouplissez les filtres globaux pour visualiser les metadonnees internes."
            className="admin-empty-state"
          />
        ) : (
          <>
            <div className="admin-worklist-overview">
              <div className="admin-worklist-overview-copy">
                <span className="admin-section-kicker">Gouvernance operative</span>
                <h3>{metadataInsights.summary.assignedCount} dossier(s) deja affectes a une cellule</h3>
                <p>
                  {metadataInsights.summary.unassignedPendingCount} dossier(s) ouverts restent sans
                  affectation, {metadataInsights.summary.staleCount} n'ont pas ete actualises depuis
                  au moins 4 jours et {metadataInsights.summary.decisionStageCount} sont deja en
                  circuit de commission ou de decision.
                </p>
              </div>

              <div className="admin-worklist-overview-metrics">
                <div className="admin-worklist-overview-card">
                  <span>Taux d'affectation</span>
                  <strong>{metadataInsights.summary.assignmentRate}%</strong>
                  <small>{metadataInsights.summary.assignedCount} dossiers pilotes par une cellule</small>
                </div>
                <div className="admin-worklist-overview-card">
                  <span>Sans affectation</span>
                  <strong>{metadataInsights.summary.unassignedPendingCount}</strong>
                  <small>Dossiers ouverts encore sans responsable interne</small>
                </div>
                <div className="admin-worklist-overview-card">
                  <span>Notes internes</span>
                  <strong>{metadataInsights.summary.notesCoverageRate}%</strong>
                  <small>{metadataInsights.summary.notesCoverageCount} dossiers avec trace de suivi</small>
                </div>
                <div className="admin-worklist-overview-card">
                  <span>Dossiers dormants</span>
                  <strong>{metadataInsights.summary.staleCount}</strong>
                  <small>Mise a jour interne absente depuis 4 jours ou plus</small>
                </div>
              </div>
            </div>

            <div className="admin-analytics-grid">
              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Priorites internes</h3>
                    <p>Lecture manuelle du portefeuille selon les niveaux de priorisation admin</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {metadataInsights.priorityBreakdown.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="chart-row admin-chart-action-row"
                      onClick={() =>
                        applyDashboardMetadataFilter({ manualPriority: item.key })
                      }
                      title={`Filtrer le dashboard sur la priorite manuelle ${item.label}`}
                    >
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div
                          className={`chart-fill ${
                            item.tone === "danger"
                              ? "chart-fill-danger"
                              : item.tone === "warning"
                                ? "chart-fill-secondary"
                                : item.tone === "positive"
                                  ? "chart-fill-success"
                                  : "chart-fill-info"
                          }`}
                          style={{ width: `${item.share}%` }}
                        />
                      </div>
                      <span className="chart-value">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Statuts internes</h3>
                    <p>Repartition du portefeuille entre qualification, instruction et decision</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {metadataInsights.internalStatusBreakdown.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="chart-row admin-chart-action-row"
                      onClick={() =>
                        applyDashboardMetadataFilter({ internalStatus: item.key })
                      }
                      title={`Filtrer le dashboard sur le statut interne ${item.label}`}
                    >
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div
                          className={`chart-fill ${
                            item.tone === "warning"
                              ? "chart-fill-secondary"
                              : item.tone === "positive"
                                ? "chart-fill-success"
                                : "chart-fill-info"
                          }`}
                          style={{ width: `${item.share}%` }}
                        />
                      </div>
                      <span className="chart-value">{item.share}%</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Charge par cellule</h3>
                    <p>Visibilite immediate sur les equipes ou responsables les plus sollicites</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {metadataInsights.assignmentBreakdown.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="chart-row admin-chart-action-row"
                      onClick={() => applyDashboardMetadataFilter({ owner: item.key })}
                      title={`Filtrer le dashboard sur l'affectation ${item.label}`}
                    >
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div
                          className={`chart-fill ${
                            item.tone === "warning" ? "chart-fill-secondary" : "chart-fill-info"
                          }`}
                          style={{ width: `${item.share}%` }}
                        />
                      </div>
                      <span className="chart-value">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
      ) : null}

      {activeDashboardSection === "analyses" ? (
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Tunnel de traitement</h2>
          <p>Lecture du cycle dossier depuis la reception jusqu'a la decision finale</p>
        </div>

        <div className="admin-funnel-summary">
          <div className="admin-funnel-summary-copy">
            <h3>Etat du portefeuille en instruction</h3>
            <p>
              {processingFunnel.summary.pendingCount} dossier(s) suivent encore le circuit
              d'analyse. {processingFunnel.summary.readyCount} sont deja prets pour arbitrage et{" "}
              {processingFunnel.summary.incompleteCount} demandent encore une relance.
            </p>
          </div>

          <div className="admin-funnel-summary-metrics">
            <div className="admin-funnel-summary-card">
              <span>En instruction</span>
              <strong>{processingFunnel.summary.pendingCount}</strong>
              <small>{processingFunnel.summary.pendingRate}% du portefeuille</small>
            </div>
            <div className="admin-funnel-summary-card">
              <span>Finalises</span>
              <strong>{processingFunnel.summary.finalizedCount}</strong>
              <small>{processingFunnel.summary.finalizationRate}% deja arbitres</small>
            </div>
          </div>
        </div>

        <div className="admin-funnel-track">
          {processingFunnel.stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                className={`admin-funnel-stage ${stage.tone}`}
                onClick={() => navigate(buildScopedAdminPath(stage.path))}
              >
                <div className="admin-funnel-stage-top">
                  <span className="admin-funnel-stage-label">{stage.label}</span>
                  <span className={`admin-queue-pill ${getSeverityTone(stage.tone)}`}>
                    {stage.share}%
                  </span>
                </div>
                <strong className="admin-funnel-stage-count">{stage.count}</strong>
                <p className="admin-funnel-stage-helper">{stage.helper}</p>
                <ProgressBar value={stage.share} label={`${stage.share}%`} compact />
              </button>

              {index < processingFunnel.stages.length - 1 ? (
                <div className="admin-funnel-arrow" aria-hidden="true">
                  <span>→</span>
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>
      ) : null}

      {activeDashboardSection === "analyses" ? (
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Repartition des statuts</h2>
          <p>Distribution globale des candidatures par decision</p>
        </div>

        <div className="campus-universities-grid">
          {[
            [
              "status-attente",
              "En attente",
              adminStats.enAttente,
              buildScopedAdminPath("/admin/candidatures", { status: "attente" }),
            ],
            [
              "status-acceptee",
              "Acceptees",
              adminStats.acceptees,
              buildScopedAdminPath("/admin/candidatures", { status: "acceptee" }),
            ],
            [
              "status-refusee",
              "Refusees",
              adminStats.refusees,
              buildScopedAdminPath("/admin/candidatures", { status: "refusee" }),
            ],
          ].map(([className, label, value, path]) => (
            <button
              key={label}
              type="button"
              className={`campus-university-card admin-surface-button ${className}`}
              onClick={() => navigate(path)}
            >
              <div className="university-header">
                <span className="university-badge">{label}</span>
              </div>
              <h3>{value} candidatures</h3>
              <p>
                {adminStats.totalCandidatures > 0
                  ? Math.round((value / adminStats.totalCandidatures) * 100)
                  : 0}
                % du total
              </p>
              <ProgressBar
                value={
                  adminStats.totalCandidatures > 0
                    ? Math.round((value / adminStats.totalCandidatures) * 100)
                    : 0
                }
              />
              <span className="admin-card-action-hint">Ouvrir la vue filtree</span>
            </button>
          ))}
        </div>
      </section>
      ) : null}

      {activeDashboardSection === "traitement" ? (
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>File de traitement prioritaire</h2>
          <p>Reperez les urgences operationnelles et ouvrez directement la bonne vue de travail</p>
        </div>

        <div className="admin-queue-grid">
          {treatmentQueue.queueCards.map((card) => (
            <div key={card.id} className={`admin-queue-card ${card.tone}`}>
              <div className="admin-queue-card-top">
                <span className="admin-queue-label">{card.label}</span>
                <span className={`admin-queue-pill ${getSeverityTone(card.tone)}`}>
                  {card.count > 0 ? `${card.count} dossier(s)` : "Aucun dossier"}
                </span>
              </div>

              <strong className="admin-queue-count">{card.count}</strong>
              <p className="admin-queue-description">{card.description}</p>
              <small className="admin-queue-helper">{card.helper}</small>

              <Button
                className={card.count > 0 ? "campus-btn-primary" : "admin-filter-tab"}
                onClick={() => navigate(buildScopedAdminPath(card.path))}
              >
                {card.actionLabel}
              </Button>
            </div>
          ))}
        </div>

        <div className="admin-urgent-panel">
          <div className="admin-urgent-panel-header">
            <div>
              <h3>A traiter maintenant</h3>
              <p>Les dossiers les plus urgents sont classes par niveau de blocage et anciennete</p>
            </div>
            <Button
              className="admin-filter-tab"
              onClick={() =>
                navigate(
                  buildScopedAdminPath("/admin/candidatures?status=attente&queue=retard")
                )
              }
            >
              Voir la file critique
            </Button>
          </div>

          {treatmentQueue.urgentApplications.length === 0 ? (
            <EmptyState
              title="Aucune urgence immediate"
              description="Les dossiers prioritaires apparaitront ici des qu'un blocage est detecte."
              className="admin-empty-state"
            />
          ) : (
            <div className="admin-urgent-list">
              {treatmentQueue.urgentApplications.map((application) => (
                <div key={application.id} className="admin-urgent-item">
                  <div className="admin-urgent-main">
                    <div className="admin-urgent-topline">
                      <strong>{application.nom}</strong>
                      <span className={`admin-queue-pill ${getSeverityTone(application.priorityTone)}`}>
                        {application.priorityLabel}
                      </span>
                    </div>
                    <div className="admin-urgent-subline">
                      <span>{application.numeroDossier}</span>
                      <span>{application.universite}</span>
                      <span>{application.specialite}</span>
                    </div>
                    <p className="admin-urgent-blocker">{application.blocker}</p>
                  </div>

                  <div className="admin-urgent-side">
                    <div className="admin-urgent-meta">
                      <span>Depot</span>
                      <strong>{formatAdminDate(application.date)}</strong>
                    </div>
                    <div className="admin-urgent-meta">
                      <span>Anciennete</span>
                      <strong>{application.ageDays} j</strong>
                    </div>
                    <div className="admin-urgent-meta">
                      <span>Statut</span>
                      <StatusBadge status={application.statut} />
                    </div>
                    <div className="admin-urgent-meta admin-urgent-progress">
                      <span>Completude</span>
                      <ProgressBar
                        value={application.progress.finale}
                        label={`${application.progress.finale}%`}
                        compact
                      />
                    </div>
                    <Button
                      className="campus-btn-primary"
                      onClick={() => navigate(`/admin/candidatures/${application.id}`)}
                    >
                      Examiner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      ) : null}

      {activeDashboardSection === "traitement" ? (
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>File de travail operationnelle</h2>
          <p>Priorisez les dossiers ouverts par urgence, blocage et prochaine action</p>
        </div>

        <div className="admin-worklist-overview">
          <div className="admin-worklist-overview-copy">
            <span className="admin-section-kicker">Vue operateur</span>
            <h3>{adminWorkQueue.summary.totalOpen} dossier(s) actifs dans la file d'instruction</h3>
            <p>
              {adminWorkQueue.summary.criticalCount} dossier(s) sont deja critiques,{" "}
              {adminWorkQueue.summary.followUpCount} demandent une relance et{" "}
              {adminWorkQueue.summary.readyCount} peuvent etre arbitres sans attente complementaire.
            </p>
          </div>

          <div className="admin-worklist-overview-metrics">
            <div className="admin-worklist-overview-card">
              <span>Critiques</span>
              <strong>{adminWorkQueue.summary.criticalCount}</strong>
              <small>Dossiers a reprendre en priorite haute</small>
            </div>
            <div className="admin-worklist-overview-card">
              <span>Relances</span>
              <strong>{adminWorkQueue.summary.followUpCount}</strong>
              <small>Informations ou pieces encore attendues</small>
            </div>
            <div className="admin-worklist-overview-card">
              <span>Prets</span>
              <strong>{adminWorkQueue.summary.readyCount}</strong>
              <small>Dossiers complets a arbitrer</small>
            </div>
            <div className="admin-worklist-overview-card">
              <span>Age moyen</span>
              <strong>{adminWorkQueue.summary.averageAge} j</strong>
              <small>Anciennete moyenne des dossiers ouverts</small>
            </div>
          </div>
        </div>

        <div className="admin-filter-tabs">
          {[
            { id: "tous", label: "Toute la file" },
            { id: "critiques", label: "Critiques" },
            { id: "relances", label: "Relances" },
            { id: "decision", label: "Prets a arbitrer" },
            { id: "nouveaux", label: "Nouveaux" },
          ].map((tab) => (
            <Button
              key={tab.id}
              className={`admin-filter-tab ${workQueueFilter === tab.id ? "active" : ""}`}
              onClick={() => setWorkQueueFilter(tab.id)}
            >
              {tab.label} ({workQueueCounts[tab.id]})
            </Button>
          ))}
        </div>

        {filteredWorkQueue.length === 0 ? (
          <EmptyState
            title="Aucun dossier dans cette file"
            description="Aucun dossier ouvert ne correspond a votre recherche ou au filtre selectionne."
            className="admin-empty-state"
          />
        ) : (
          <div className="admin-worklist-list">
            {displayedWorkQueue.map((application) => (
              <article key={application.id} className="admin-worklist-item">
                <div className="admin-worklist-main">
                  <div className="admin-worklist-topline">
                    <div className="admin-worklist-title">
                      <h3>{application.nom}</h3>
                      <p>
                        {application.numeroDossier} · {application.universite} ·{" "}
                        {application.specialite}
                      </p>
                    </div>

                    <div className="admin-worklist-tags">
                      <span className={`admin-queue-pill ${getSeverityTone(application.priorityTone)}`}>
                        {application.priorityLabel}
                      </span>
                      <span className={`admin-queue-pill ${getSeverityTone(application.workLaneTone)}`}>
                        {application.workLaneLabel}
                      </span>
                    </div>
                  </div>

                  <div className="admin-worklist-blocker">
                    <span className="admin-worklist-blocker-label">Blocage principal</span>
                    <strong>{application.blocker}</strong>
                    <p>{application.nextStep}</p>
                  </div>

                  <div className="admin-worklist-progress-grid">
                    <div className="admin-worklist-progress-card">
                      <span>Profil</span>
                      <ProgressBar
                        value={application.progress.profil}
                        label={`${application.progress.profil}%`}
                        compact
                      />
                    </div>
                    <div className="admin-worklist-progress-card">
                      <span>Documents</span>
                      <ProgressBar
                        value={application.progress.documents}
                        label={`${application.progress.documents}%`}
                        compact
                      />
                    </div>
                    <div className="admin-worklist-progress-card">
                      <span>Academique</span>
                      <ProgressBar
                        value={application.progress.academique}
                        label={`${application.progress.academique}%`}
                        compact
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-worklist-side">
                  <div className="admin-worklist-metric">
                    <span>Depot</span>
                    <strong>{formatAdminDate(application.date)}</strong>
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Anciennete</span>
                    <strong>J+{application.ageDays}</strong>
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Niveau de service</span>
                    <strong>{application.serviceLevel}</strong>
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Statut interne</span>
                    <span className={`admin-queue-pill ${getSeverityTone(application.internalStatusTone)}`}>
                      {application.internalStatusLabel}
                    </span>
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Affectation</span>
                    <strong>{application.assignedToLabel}</strong>
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Statut</span>
                    <StatusBadge status={application.statut} />
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Derniere maj</span>
                    <strong>{formatAdminDateTime(application.lastUpdatedAt)}</strong>
                  </div>
                  <div className="admin-worklist-metric">
                    <span>Notes</span>
                    <strong>{application.notesCount} trace(s)</strong>
                  </div>
                  <div className="admin-worklist-metric admin-worklist-metric-stack">
                    <span>Completude globale</span>
                    <ProgressBar
                      value={application.progress.finale}
                      label={`${application.progress.finale}%`}
                      compact
                    />
                  </div>

                  <p className="admin-worklist-footnote">
                    {application.missingDocuments.length > 0
                      ? `Pieces a controler : ${application.missingDocumentsSummary}`
                      : "Dossier administrativement complet a ce stade."}
                  </p>

                  <div className="admin-worklist-actions">
                    <Button
                      className="campus-btn-primary"
                      onClick={() => navigate(application.primaryActionPath)}
                    >
                      {application.primaryActionLabel}
                    </Button>
                    <Button
                      className="admin-filter-tab"
                      onClick={() =>
                        navigate(buildScopedAdminPath(application.secondaryActionPath))
                      }
                    >
                      {application.secondaryActionLabel}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="admin-table-footer admin-worklist-footer">
          <span className="admin-pagination-info">
            {filteredWorkQueue.length > displayedWorkQueue.length
              ? `Affichage des ${displayedWorkQueue.length} dossiers les plus prioritaires sur ${filteredWorkQueue.length}.`
              : `${filteredWorkQueue.length} dossier(s) correspondent aux criteres courants.`}
          </span>
          <Link
            to={buildScopedAdminPath(getWorkQueueRoute(workQueueFilter))}
            className="campus-btn-primary"
          >
            {getWorkQueueFooterLabel(workQueueFilter)}
          </Link>
        </div>
      </section>
      ) : null}

      {activeDashboardSection === "analyses" ? (
      <section className="campus-section-container">
        <div className="campus-section-header">
          <h2>Analyses graphiques</h2>
          <p>Comparaisons de volume, completude, origine et performance sur le portefeuille filtre</p>
        </div>

        {!dashboardHasResults ? (
          <EmptyState
            title="Aucune donnee exploitable"
            description="Les analyses graphiques reapparaitront des qu'un portefeuille correspondra aux filtres globaux."
            className="admin-empty-state"
          />
        ) : (
          <>
            <div className="admin-analytics-grid">
              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Volumes par universite</h3>
                    <p>Les etablissements qui concentrent le plus de dossiers sur cette vue</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {chartInsights.volumeByUniversity.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div className="chart-fill" style={{ width: `${item.share}%` }} />
                      </div>
                      <span className="chart-value">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Origine des candidats</h3>
                    <p>Nationalites les plus representees dans le portefeuille courant</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {chartInsights.nationalityBreakdown.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div className="chart-fill chart-fill-secondary" style={{ width: `${item.share}%` }} />
                      </div>
                      <span className="chart-value">{item.share}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Completude par formation</h3>
                    <p>Moyenne de finalisation des dossiers selon la specialite visee</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {chartInsights.completionBySpeciality.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div
                          className="chart-fill chart-fill-success"
                          style={{ width: `${item.averageProgress}%` }}
                        />
                      </div>
                      <span className="chart-value">{item.averageProgress}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-analytics-card">
                <div className="admin-analytics-card-header">
                  <div>
                    <h3>Taux d'admission par universite</h3>
                    <p>Lecture decisionnelle des etablissements deja arbitres</p>
                  </div>
                </div>

                <div className="admin-chart">
                  {chartInsights.acceptanceByUniversity.map((item) => (
                    <div key={item.label} className="chart-row">
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar">
                        <div
                          className="chart-fill chart-fill-info"
                          style={{ width: `${item.acceptanceRate}%` }}
                        />
                      </div>
                      <span className="chart-value">
                        {item.finalized > 0 ? `${item.acceptanceRate}%` : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-analytics-card admin-analytics-card-wide">
              <div className="admin-analytics-card-header">
                <div>
                  <h3>Flux de dossiers sur 6 semaines</h3>
                  <p>Visualisez la dynamique recente des depots sur le portefeuille filtre</p>
                </div>
              </div>

              <div className="admin-volume-timeline">
                {chartInsights.weeklyFlow.map((item) => (
                  <div key={item.id} className="admin-volume-column">
                    <div className="admin-volume-bar">
                      <div
                        className="admin-volume-bar-fill"
                        style={{ height: `${Math.max(item.heightRatio, item.count > 0 ? 14 : 0)}%` }}
                      />
                    </div>
                    <strong>{item.count}</strong>
                    <span>{item.shortLabel}</span>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
      ) : null}

    </AdminLayout>
  );
}
