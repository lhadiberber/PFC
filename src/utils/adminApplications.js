const PROFILE_FIELDS = [
  "nom",
  "prenom",
  "dateNaiss",
  "lieuNaiss",
  "nationalite",
  "telephone",
  "email",
];

const DOCUMENT_FIELDS = [
  "copieBac",
  "releveNotes",
  "carteIdentite",
  "photo",
  "residence",
  "cv",
];

const DOCUMENT_LABELS = {
  copieBac: "Copie du bac",
  releveNotes: "Releve de notes",
  carteIdentite: "Carte d'identite",
  photo: "Photo",
  residence: "Residence",
  cv: "CV",
};

const ACADEMIC_FIELDS = ["typeBac", "anneeBac", "moyenneBac", "specialite", "universite"];

const PRIORITY_META = {
  basse: { key: "basse", label: "Basse", tone: "neutral", weight: 0 },
  moyenne: { key: "moyenne", label: "Moyenne", tone: "info", weight: 25 },
  haute: { key: "haute", label: "Haute", tone: "warning", weight: 60 },
  critique: { key: "critique", label: "Critique", tone: "danger", weight: 120 },
};

const INTERNAL_STATUS_META = {
  qualification: { key: "qualification", label: "Qualification", tone: "info" },
  instruction: { key: "instruction", label: "Instruction", tone: "warning" },
  commission: { key: "commission", label: "Commission", tone: "warning" },
  decision: { key: "decision", label: "Decision", tone: "positive" },
  "decision-finalisee": {
    key: "decision-finalisee",
    label: "Decision finalisee",
    tone: "neutral",
  },
};

function countFilled(fields, source) {
  return fields.filter((field) => {
    const value = source?.[field];
    return typeof value === "string" ? value.trim() !== "" : Boolean(value);
  }).length;
}

function getApplicationDate(application) {
  const rawDate = application.submittedAt || application.dateDepot || application.date;
  const parsedDate = new Date(rawDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function startOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(date) {
  const nextDate = startOfDay(date);
  const dayIndex = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - dayIndex);
  return nextDate;
}

function formatShortDate(date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function countApplicationsInRange(applications, start, end) {
  return applications.filter((application) => {
    const applicationDate = getApplicationDate(application);
    return applicationDate && applicationDate >= start && applicationDate < end;
  }).length;
}

function getAgeInDays(date, now = new Date()) {
  if (!date) {
    return 0;
  }

  const diff = startOfDay(now).getTime() - startOfDay(date).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function normalizeCategoryLabel(value, fallback = "Non renseigne") {
  const label = typeof value === "string" ? value.trim() : "";
  return label || fallback;
}

function percentage(part, total) {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function buildProcessingSnapshot(application, now = new Date()) {
  const normalizedApplication = toAdminApplication(application);
  const progress = getAdminProgress(normalizedApplication);
  const missingDocuments = getMissingDocuments(normalizedApplication);
  const submittedDate = getApplicationDate(normalizedApplication);
  const ageDays = getAgeInDays(submittedDate, now);
  const isPending = normalizedApplication.statut === "En attente";
  const isComplete =
    progress.profil === 100 && progress.documents === 100 && progress.academique === 100;
  const isReceivedToday = submittedDate !== null && isSameDay(submittedDate, now);
  const isRecentSubmission = isPending && ageDays <= 1;
  const isIncomplete = isPending && !isComplete && !isRecentSubmission;
  const isUnderReview = isPending && isComplete && !isRecentSubmission && ageDays <= 5;
  const isReadyDecision = isPending && isComplete && ageDays > 5;
  const isDelayed = isPending && ageDays > 7;
  const isDocumentCritical = isPending && progress.documents < 50;

  return {
    ...normalizedApplication,
    progress,
    missingDocuments,
    submittedDate,
    ageDays,
    isPending,
    isComplete,
    isReceivedToday,
    isRecentSubmission,
    isIncomplete,
    isUnderReview,
    isReadyDecision,
    isDelayed,
    isDocumentCritical,
  };
}

function formatMissingDocumentsSummary(missingDocuments) {
  if (missingDocuments.length === 0) {
    return "Dossier complet";
  }

  if (missingDocuments.length === 1) {
    return missingDocuments[0].label;
  }

  return `${missingDocuments[0].label} + ${missingDocuments.length - 1} autre(s)`;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  const diffInMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} h`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `Il y a ${diffInDays} j`;
}

export function formatAdminDate(dateString) {
  if (!dateString) {
    return "Non renseignee";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatAdminDateTime(dateString) {
  if (!dateString) {
    return "Non renseignee";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCompletenessLevel(progress) {
  if (progress.finale >= 95) {
    return "complet";
  }

  if (progress.finale >= 80) {
    return "avance";
  }

  if (progress.finale >= 60) {
    return "partiel";
  }

  return "fragile";
}

export function getAdminPriorityMeta(priority = "moyenne") {
  return PRIORITY_META[priority] || PRIORITY_META.moyenne;
}

export function getInternalStatusMeta(status = "qualification") {
  return INTERNAL_STATUS_META[status] || INTERNAL_STATUS_META.qualification;
}

export function toAdminApplication(application) {
  const nomComplet = [application.details?.prenom, application.details?.nom]
    .filter(Boolean)
    .join(" ")
    .trim();
  const progress = getAdminProgress(application);
  const priorityMeta = getAdminPriorityMeta(application.adminMeta?.internalPriority);
  const internalStatusMeta = getInternalStatusMeta(application.adminMeta?.internalStatus);
  const notes = Array.isArray(application.adminMeta?.notes) ? application.adminMeta.notes : [];
  const lastUpdatedAt =
    application.adminMeta?.lastUpdatedAt || application.submittedAt || application.dateDepot;
  const decisionDate = application.adminMeta?.decisionDate || "";

  return {
    ...application,
    nom: nomComplet || application.details?.email || `Candidat ${application.id}`,
    date: application.dateDepot,
    adminMeta: {
      internalPriority: priorityMeta.key,
      internalPriorityLabel: priorityMeta.label,
      internalPriorityTone: priorityMeta.tone,
      assignedTo: application.adminMeta?.assignedTo || "",
      internalStatus: internalStatusMeta.key,
      internalStatusLabel: internalStatusMeta.label,
      internalStatusTone: internalStatusMeta.tone,
      lastUpdatedAt,
      decisionDate,
      notes,
      notesCount: notes.length,
      processingDelay: getApplicationAgeInDays(application),
      completenessLevel: getCompletenessLevel(progress),
    },
  };
}

export function getAdminProgress(application) {
  const details = application.details || {};
  const profil = Math.round((countFilled(PROFILE_FIELDS, details) / PROFILE_FIELDS.length) * 100);
  const documents = Math.round(
    (countFilled(DOCUMENT_FIELDS, details) / DOCUMENT_FIELDS.length) * 100
  );
  const academique = Math.round(
    (countFilled(ACADEMIC_FIELDS, details) / ACADEMIC_FIELDS.length) * 100
  );

  let finale = Math.round((profil + documents + academique) / 3);
  if (application.statut === "Acceptee" || application.statut === "Rejetee") {
    finale = 100;
  } else if (application.statut === "En attente") {
    finale = Math.max(finale, 70);
  }

  return { profil, documents, academique, finale };
}

export function getApplicationAgeInDays(application, now = new Date()) {
  return getAgeInDays(getApplicationDate(application), now);
}

function sortQueueRows(first, second) {
  if (second.priorityScore !== first.priorityScore) {
    return second.priorityScore - first.priorityScore;
  }

  if (second.ageDays !== first.ageDays) {
    return second.ageDays - first.ageDays;
  }

  return new Date(first.dateDepot) - new Date(second.dateDepot);
}

function buildWorkQueueRow(application, now = new Date()) {
  const snapshot = buildProcessingSnapshot(application, now);
  const dossierQuery = encodeURIComponent(snapshot.numeroDossier || snapshot.nom || snapshot.id);
  const detailPath = `/admin/candidatures/${snapshot.id}`;
  const documentsPath = `/admin/documents?query=${dossierQuery}&status=attente`;
  const defaultQueuePath = `/admin/candidatures?query=${dossierQuery}`;
  const manualPriority = getAdminPriorityMeta(snapshot.adminMeta?.internalPriority);

  let priorityScore = 0;
  let priorityLabel = "Suivi";
  let priorityTone = "neutral";
  let blocker = "Aucun blocage critique";
  let workLaneLabel = "Suivi courant";
  let workLaneTone = "neutral";
  let serviceLevel = "Sous controle";
  let nextStep = "Poursuivre l'instruction du dossier dans la file courante.";
  let primaryActionLabel = "Examiner";
  let secondaryActionLabel = "Ouvrir la file";
  let secondaryActionPath = defaultQueuePath;

  if (snapshot.isDelayed) {
    priorityScore = 400 + snapshot.ageDays;
    priorityLabel = "Critique";
    priorityTone = "danger";
    blocker = `En attente depuis ${snapshot.ageDays} jours`;
    workLaneLabel = "Retard de traitement";
    workLaneTone = "danger";
    serviceLevel = "SLA depasse";
    nextStep = "Prioriser une decision ou une relance avant la prochaine revue quotidienne.";
    primaryActionLabel = "Debloquer";
    secondaryActionLabel =
      snapshot.missingDocuments.length > 0 ? "Voir les pieces" : "Voir la file critique";
    secondaryActionPath =
      snapshot.missingDocuments.length > 0
        ? documentsPath
        : "/admin/candidatures?status=attente&queue=retard";
  } else if (snapshot.isDocumentCritical) {
    priorityScore = 320 + snapshot.missingDocuments.length * 10;
    priorityLabel = "Haute";
    priorityTone = "warning";
    blocker = `Pieces manquantes : ${formatMissingDocumentsSummary(snapshot.missingDocuments)}`;
    workLaneLabel = "Relance documentaire";
    workLaneTone = "warning";
    serviceLevel = "Relance sous 24 h";
    nextStep = "Verifier la recevabilite documentaire puis orienter une relance ciblee au candidat.";
    primaryActionLabel = "Voir les pieces";
    secondaryActionLabel = "Examiner";
    secondaryActionPath = detailPath;
  } else if (snapshot.isIncomplete) {
    priorityScore = 220 + snapshot.ageDays;
    priorityLabel = "Moyenne";
    priorityTone = "warning";
    blocker =
      snapshot.missingDocuments.length > 0
        ? `Completude partielle : ${formatMissingDocumentsSummary(snapshot.missingDocuments)}`
        : "Informations administratives a completer";
    workLaneLabel = "Relance administrative";
    workLaneTone = "warning";
    serviceLevel = "Relance sous 48 h";
    nextStep = "Completer les volets manquants avant passage en instruction pedagogique.";
    primaryActionLabel = "Examiner";
    secondaryActionLabel =
      snapshot.missingDocuments.length > 0 ? "Voir les pieces" : "Voir la file";
    secondaryActionPath =
      snapshot.missingDocuments.length > 0
        ? documentsPath
        : "/admin/candidatures?status=attente&completion=incomplets";
  } else if (snapshot.isReadyDecision) {
    priorityScore = 180 + snapshot.ageDays;
    priorityLabel = "Pret";
    priorityTone = "positive";
    blocker = "Pret pour arbitrage";
    workLaneLabel = "Arbitrage";
    workLaneTone = "positive";
    serviceLevel = "Decision attendue";
    nextStep = "Le dossier est complet et peut sortir rapidement du backlog apres arbitrage.";
    primaryActionLabel = "Arbitrer";
    secondaryActionLabel = "Voir la file";
    secondaryActionPath = "/admin/candidatures?status=attente&completion=complets&queue=pret";
  } else if (snapshot.isReceivedToday && snapshot.isPending) {
    priorityScore = 140;
    priorityLabel = "Nouveau";
    priorityTone = "info";
    blocker = "Soumission du jour";
    workLaneLabel = "Qualification initiale";
    workLaneTone = "info";
    serviceLevel = "A orienter aujourd'hui";
    nextStep = "Controler rapidement la recevabilite et affecter le dossier au bon circuit.";
    primaryActionLabel = "Qualifier";
    secondaryActionLabel = "Voir les nouveaux";
    secondaryActionPath = "/admin/candidatures?status=attente&queue=today";
  } else if (snapshot.isUnderReview) {
    priorityScore = 120 + snapshot.ageDays;
    priorityLabel = "Analyse";
    priorityTone = "info";
    blocker = "Instruction pedagogique en cours";
    workLaneLabel = "Instruction";
    workLaneTone = "info";
    serviceLevel = "Analyse en cours";
    nextStep = "Poursuivre l'etude du dossier avant presentation a l'arbitrage.";
    primaryActionLabel = "Examiner";
    secondaryActionLabel = "Voir la file";
    secondaryActionPath = "/admin/candidatures?status=attente&queue=review";
  } else if (snapshot.statut === "Acceptee" || snapshot.statut === "Rejetee") {
    priorityScore = 40;
    priorityLabel = "Cloture";
    priorityTone = "neutral";
    blocker = "Decision deja finalisee";
    workLaneLabel = "Cloture";
    workLaneTone = "neutral";
    serviceLevel = "Archive";
    nextStep = "Le dossier a deja quitte le circuit d'instruction.";
    primaryActionLabel = "Consulter";
    secondaryActionLabel = "Voir le dossier";
    secondaryActionPath = detailPath;
  }

  priorityScore += manualPriority.weight;

  if (
    manualPriority.weight >= 60 &&
    priorityTone !== "danger" &&
    priorityTone !== "warning"
  ) {
    priorityLabel = manualPriority.label;
    priorityTone = manualPriority.tone;
  }

  return {
    ...snapshot,
    priorityScore,
    priorityLabel,
    priorityTone,
    blocker,
    workLaneLabel,
    workLaneTone,
    serviceLevel,
    nextStep,
    primaryActionLabel,
    primaryActionPath: detailPath,
    secondaryActionLabel,
    secondaryActionPath,
    missingDocumentsSummary: formatMissingDocumentsSummary(snapshot.missingDocuments),
    assignedToLabel: snapshot.adminMeta?.assignedTo || "Non assigne",
    internalStatusLabel: snapshot.adminMeta?.internalStatusLabel || "Qualification",
    internalStatusTone: snapshot.adminMeta?.internalStatusTone || "info",
    notesCount: snapshot.adminMeta?.notesCount || 0,
    lastUpdatedAt: snapshot.adminMeta?.lastUpdatedAt || snapshot.submittedAt || snapshot.dateDepot,
    isCritical: snapshot.isDelayed || snapshot.isDocumentCritical,
    needsFollowUp: snapshot.isIncomplete || snapshot.isDocumentCritical,
    needsDecision: snapshot.isReadyDecision,
    isNew: snapshot.isRecentSubmission || snapshot.isReceivedToday,
  };
}

export function getMissingDocuments(application) {
  const details = application.details || {};

  return DOCUMENT_FIELDS.filter((field) => {
    const value = details[field];
    return typeof value !== "string" || value.trim() === "";
  }).map((field) => ({
    key: field,
    label: DOCUMENT_LABELS[field],
  }));
}

export function getAdminStats(applications) {
  const now = new Date();
  const today = startOfDay(now);
  const currentWindowStart = addDays(today, -6);
  const nextDay = addDays(today, 1);
  const previousWindowStart = addDays(currentWindowStart, -7);
  const uniqueStudents = new Set(
    applications.map((application) => application.details?.email || application.numeroDossier)
  );
  const progressRows = applications.map((application) => ({
    application,
    progress: getAdminProgress(application),
    submittedDate: getApplicationDate(application),
  }));
  const acceptees = applications.filter((application) => application.statut === "Acceptee").length;
  const refusees = applications.filter((application) => application.statut === "Rejetee").length;
  const enAttente = applications.filter((application) => application.statut === "En attente").length;
  const finalisees = acceptees + refusees;

  const dossiersIncomplets = progressRows.filter(
    ({ progress }) =>
      progress.profil < 100 || progress.documents < 100 || progress.academique < 100
  ).length;

  const documentsManquants = progressRows.filter(
    ({ progress }) => progress.documents < 100
  ).length;

  const pendingAges = progressRows
    .filter(({ application }) => application.statut === "En attente")
    .map(({ submittedDate }) => getAgeInDays(submittedDate, now));

  const receptions7j = countApplicationsInRange(applications, currentWindowStart, nextDay);
  const receptions7jPrecedent = countApplicationsInRange(
    applications,
    previousWindowStart,
    currentWindowStart
  );
  const moyenneCompletude = average(
    progressRows.map(({ progress }) =>
      Math.round((progress.profil + progress.documents + progress.academique) / 3)
    )
  );
  const backlogCritique = pendingAges.filter((age) => age > 7).length;
  const ancienneteMoyenneBacklog = average(pendingAges);
  const ancienneteMaxBacklog = pendingAges.length > 0 ? Math.max(...pendingAges) : 0;

  return {
    totalCandidatures: applications.length,
    enAttente,
    acceptees,
    refusees,
    finalisees,
    totalEtudiants: uniqueStudents.size,
    dossiersIncomplets,
    candidaturesNonTraitees: enAttente,
    documentsManquants,
    receptions7j,
    receptions7jPrecedent,
    deltaReceptions7j: receptions7j - receptions7jPrecedent,
    tauxVariationReceptions7j:
      receptions7jPrecedent === 0
        ? receptions7j > 0
          ? 100
          : 0
        : Math.round(((receptions7j - receptions7jPrecedent) / receptions7jPrecedent) * 100),
    moyenneCompletude,
    backlogCritique,
    ancienneteMoyenneBacklog,
    ancienneteMaxBacklog,
    tauxFinalisation: percentage(finalisees, applications.length),
    tauxAcceptation: percentage(acceptees, finalisees),
    partEnAttente: percentage(enAttente, applications.length),
  };
}

export function getAdminTreatmentQueue(applications) {
  const now = new Date();
  const queueRows = applications.map((application) => buildWorkQueueRow(application, now));

  const pendingRows = queueRows.filter((row) => row.isPending);
  const urgentApplications = [...pendingRows]
    .sort(sortQueueRows)
    .slice(0, 5);

  const queueCards = [
    {
      id: "retard",
      label: "Dossiers en retard",
      count: pendingRows.filter((row) => row.isDelayed).length,
      description: "En attente depuis plus de 7 jours",
      helper: "Priorite critique pour l'equipe d'instruction",
      tone: pendingRows.some((row) => row.isDelayed) ? "danger" : "neutral",
      path: "/admin/candidatures?status=attente&queue=retard",
      actionLabel: "Ouvrir la file",
    },
    {
      id: "incomplets",
      label: "Dossiers incomplets",
      count: pendingRows.filter((row) => !row.isComplete).length,
      description: "Pieces ou informations a completer avant arbitrage",
      helper: "Relances administratives a planifier",
      tone: pendingRows.some((row) => !row.isComplete) ? "warning" : "neutral",
      path: "/admin/candidatures?status=attente&completion=incomplets",
      actionLabel: "Voir les relances",
    },
    {
      id: "documents",
      label: "Documents critiques",
      count: pendingRows.filter((row) => row.isDocumentCritical).length,
      description: "Completude documentaire inferieure a 50%",
      helper: "Controle prioritaire des pieces justificatives",
      tone: pendingRows.some((row) => row.isDocumentCritical) ? "warning" : "neutral",
      path: "/admin/documents?filter=critiques&status=attente",
      actionLabel: "Verifier les pieces",
    },
    {
      id: "pret",
      label: "Prets pour decision",
      count: pendingRows.filter((row) => row.isReadyDecision).length,
      description: "Dossiers complets en attente d'arbitrage final",
      helper: "Peuvent sortir rapidement du backlog",
      tone: pendingRows.some((row) => row.isReadyDecision) ? "positive" : "neutral",
      path: "/admin/candidatures?status=attente&completion=complets&queue=pret",
      actionLabel: "Passer en revue",
    },
    {
      id: "today",
      label: "Soumissions du jour",
      count: pendingRows.filter((row) => row.isReceivedToday).length,
      description: "Nouveaux dossiers arrives aujourd'hui",
      helper: "A orienter rapidement dans la file de traitement",
      tone: pendingRows.some((row) => row.isReceivedToday) ? "info" : "neutral",
      path: "/admin/candidatures?status=attente&queue=today",
      actionLabel: "Consulter",
    },
  ];

  return {
    queueCards,
    urgentApplications,
  };
}

export function getAdminWorkQueueRows(applications) {
  const now = new Date();
  return applications
    .map((application) => buildWorkQueueRow(application, now))
    .sort(sortQueueRows);
}

export function getAdminWorkQueue(applications) {
  const rows = getAdminWorkQueueRows(applications);
  const pendingRows = rows.filter((row) => row.isPending).sort(sortQueueRows);

  return {
    items: pendingRows,
    summary: {
      totalOpen: pendingRows.length,
      criticalCount: pendingRows.filter((row) => row.isCritical).length,
      followUpCount: pendingRows.filter((row) => row.needsFollowUp).length,
      readyCount: pendingRows.filter((row) => row.needsDecision).length,
      newCount: pendingRows.filter((row) => row.isNew).length,
      averageAge: average(pendingRows.map((row) => row.ageDays)),
    },
  };
}

export function getAdminMetadataInsights(applications) {
  const now = new Date();
  const rows = getAdminWorkQueueRows(applications);
  const pendingRows = rows.filter((row) => row.isPending);
  const assignedRows = rows.filter(
    (row) => row.assignedToLabel && row.assignedToLabel !== "Non assigne"
  );
  const notedRows = rows.filter((row) => (row.notesCount || 0) > 0);
  const staleRows = pendingRows.filter((row) => {
    if (!row.lastUpdatedAt) {
      return false;
    }

    return getAgeInDays(new Date(row.lastUpdatedAt), now) >= 4;
  });
  const unassignedPending = pendingRows.filter(
    (row) => !row.assignedToLabel || row.assignedToLabel === "Non assigne"
  );

  const buildBreakdown = (getEntry, limit = 5) => {
    const totals = rows.reduce((accumulator, row) => {
      const entry = getEntry(row);
      const label = normalizeCategoryLabel(entry.label, "Non renseigne");
      const current = accumulator[label] || {
        key: entry.key || label,
        label,
        count: 0,
        tone: entry.tone || "neutral",
      };

      current.count += 1;
      accumulator[label] = current;
      return accumulator;
    }, {});

    return Object.values(totals)
      .map((entry) => ({
        ...entry,
        share: percentage(entry.count, rows.length),
      }))
      .sort((first, second) => second.count - first.count)
      .slice(0, limit);
  };

  const priorityBreakdown = buildBreakdown((row) => ({
    key: row.adminMeta?.internalPriority || "moyenne",
    label: row.adminMeta?.internalPriorityLabel,
    tone: row.adminMeta?.internalPriorityTone,
  }));

  const internalStatusBreakdown = buildBreakdown((row) => ({
    key: row.adminMeta?.internalStatus || "qualification",
    label: row.adminMeta?.internalStatusLabel,
    tone: row.adminMeta?.internalStatusTone,
  }));

  const assignmentBreakdown = buildBreakdown((row) => ({
    key: row.assignedToLabel && row.assignedToLabel !== "Non assigne" ? row.assignedToLabel : "non-assigne",
    label: row.assignedToLabel || "Non assigne",
    tone: row.assignedToLabel && row.assignedToLabel !== "Non assigne" ? "info" : "warning",
  }));

  return {
    summary: {
      total: rows.length,
      assignmentRate: percentage(assignedRows.length, rows.length),
      notesCoverageRate: percentage(notedRows.length, rows.length),
      assignedCount: assignedRows.length,
      unassignedPendingCount: unassignedPending.length,
      notesCoverageCount: notedRows.length,
      staleCount: staleRows.length,
      criticalPriorityCount: rows.filter(
        (row) => row.adminMeta?.internalPriority === "critique"
      ).length,
      decisionStageCount: pendingRows.filter(
        (row) =>
          row.adminMeta?.internalStatus === "decision" ||
          row.adminMeta?.internalStatus === "commission"
      ).length,
    },
    priorityBreakdown,
    internalStatusBreakdown,
    assignmentBreakdown,
  };
}

export function getAdminActionAlerts(applications) {
  const rows = getAdminWorkQueueRows(applications);
  const pendingRows = rows.filter((row) => row.isPending);
  const incompleteRows = pendingRows.filter((row) => !row.isComplete);
  const delayedRows = pendingRows.filter((row) => row.isDelayed);
  const documentRows = pendingRows.filter((row) => row.missingDocuments.length > 0);
  const readyRows = pendingRows.filter((row) => row.isReadyDecision);

  const alerts = [
    {
      id: "incomplets",
      title: "Dossiers incomplets",
      count: incompleteRows.length,
      tone: incompleteRows.length > 0 ? "warning" : "neutral",
      problem: "Des candidats n'ont pas fourni toutes les pieces requises.",
      importance: "Retarde l'instruction et peut bloquer le passage en decision.",
      helper:
        incompleteRows.length > 0
          ? `Exemple : ${incompleteRows[0].numeroDossier} - ${incompleteRows[0].nom}`
          : "Aucun dossier incomplet sur cette vue.",
      path: "/admin/candidatures?status=attente&completion=incomplets",
      actionLabel: "Voir",
    },
    {
      id: "attente",
      title: "Candidatures a traiter",
      count: pendingRows.length,
      tone: delayedRows.length > 0 ? "danger" : pendingRows.length > 0 ? "info" : "neutral",
      problem: "Des candidatures sont encore en attente d'examen par l'administration.",
      importance: "Un volume trop eleve allonge les delais de traitement de la campagne.",
      helper:
        delayedRows.length > 0
          ? `${delayedRows.length} dossier(s) ont deja depasse le seuil de 7 jours.`
          : "Le portefeuille en attente reste a absorber.",
      path: "/admin/candidatures?status=attente",
      actionLabel: "Voir",
    },
    {
      id: "documents",
      title: "Documents manquants",
      count: documentRows.length,
      tone: documentRows.length > 0 ? "warning" : "neutral",
      problem: "Des pieces justificatives restent a controler ou a relancer.",
      importance: "Sans documents valides, le dossier ne peut pas etre instruit correctement.",
      helper:
        documentRows.length > 0
          ? `Exemple : ${documentRows[0].numeroDossier} - ${documentRows[0].missingDocumentsSummary}`
          : "Aucune piece manquante sur cette vue.",
      path: "/admin/documents?filter=manquants&status=attente",
      actionLabel: "Voir",
    },
    {
      id: "decision",
      title: "Prets pour decision",
      count: readyRows.length,
      tone: readyRows.length > 0 ? "positive" : "neutral",
      problem: "Des dossiers complets peuvent passer en arbitrage final.",
      importance: "Permet de faire avancer rapidement la campagne et de reduire le backlog.",
      helper:
        readyRows.length > 0
          ? `Prochain dossier : ${readyRows[0].numeroDossier} - ${readyRows[0].nom}`
          : "Aucun arbitrage immediat sur cette vue.",
      path: "/admin/candidatures?status=attente&completion=complets&queue=pret",
      actionLabel: "Voir",
    },
  ];

  return alerts;
}

export function getAdminChartInsights(applications) {
  const rows = getAdminWorkQueueRows(applications);

  const buildCountBreakdown = (labelSelector, fallback = "Non renseigne", limit = 5) => {
    const totals = rows.reduce((accumulator, row) => {
      const label = normalizeCategoryLabel(labelSelector(row), fallback);
      accumulator[label] = (accumulator[label] || 0) + 1;
      return accumulator;
    }, {});

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);

    return Object.entries(totals)
      .map(([label, count]) => ({
        label,
        count,
        share: percentage(count, total),
      }))
      .sort((first, second) => second.count - first.count)
      .slice(0, limit);
  };

  const volumeByUniversity = buildCountBreakdown((row) => row.universite, "Etablissement non renseigne");
  const nationalityBreakdown = buildCountBreakdown(
    (row) => row.details?.nationalite,
    "Nationalite non renseignee"
  );

  const completionBySpeciality = Object.values(
    rows.reduce((accumulator, row) => {
      const label = normalizeCategoryLabel(row.specialite, "Formation non renseignee");
      const entry = accumulator[label] || {
        label,
        totalProgress: 0,
        totalCount: 0,
      };

      entry.totalProgress += row.progress.finale;
      entry.totalCount += 1;
      accumulator[label] = entry;
      return accumulator;
    }, {})
  )
    .map((entry) => ({
      label: entry.label,
      averageProgress: Math.round(entry.totalProgress / entry.totalCount),
      count: entry.totalCount,
    }))
    .sort((first, second) => second.averageProgress - first.averageProgress)
    .slice(0, 5);

  const acceptanceByUniversity = Object.values(
    rows.reduce((accumulator, row) => {
      const label = normalizeCategoryLabel(row.universite, "Etablissement non renseigne");
      const entry = accumulator[label] || {
        label,
        accepted: 0,
        finalized: 0,
        total: 0,
      };

      entry.total += 1;

      if (row.statut === "Acceptee" || row.statut === "Rejetee") {
        entry.finalized += 1;
      }

      if (row.statut === "Acceptee") {
        entry.accepted += 1;
      }

      accumulator[label] = entry;
      return accumulator;
    }, {})
  )
    .map((entry) => ({
      label: entry.label,
      acceptanceRate: percentage(entry.accepted, entry.finalized),
      accepted: entry.accepted,
      finalized: entry.finalized,
      total: entry.total,
    }))
    .sort((first, second) => {
      if (second.acceptanceRate !== first.acceptanceRate) {
        return second.acceptanceRate - first.acceptanceRate;
      }

      return second.finalized - first.finalized;
    })
    .slice(0, 5);

  const currentWeekStart = startOfWeek(new Date());
  const weeklyFlow = Array.from({ length: 6 }, (_, index) => {
    const weekStart = addDays(currentWeekStart, -7 * (5 - index));
    const weekEnd = addDays(weekStart, 7);
    const count = rows.filter((row) => row.submittedDate && row.submittedDate >= weekStart && row.submittedDate < weekEnd).length;

    return {
      id: `${weekStart.toISOString()}-${weekEnd.toISOString()}`,
      label:
        index === 5
          ? "Cette semaine"
          : `${formatShortDate(weekStart)} - ${formatShortDate(addDays(weekEnd, -1))}`,
      shortLabel: formatShortDate(weekStart),
      count,
    };
  });

  const maxWeeklyCount = Math.max(1, ...weeklyFlow.map((item) => item.count));

  return {
    volumeByUniversity,
    nationalityBreakdown,
    completionBySpeciality,
    acceptanceByUniversity,
    weeklyFlow: weeklyFlow.map((item) => ({
      ...item,
      heightRatio: Math.round((item.count / maxWeeklyCount) * 100),
    })),
  };
}

export function getAdminProcessingFunnel(applications) {
  const now = new Date();
  const rows = applications.map((application) => buildProcessingSnapshot(application, now));
  const total = rows.length;
  const pendingRows = rows.filter((row) => row.isPending);
  const finalizedRows = rows.filter((row) => row.statut === "Acceptee" || row.statut === "Rejetee");

  const stages = [
    {
      id: "soumis",
      label: "Soumis",
      count: rows.filter((row) => row.isRecentSubmission).length,
      helper: "Recu depuis moins de 48 h et en cours de qualification",
      tone: "info",
      path: "/admin/candidatures?status=attente&queue=recent",
    },
    {
      id: "incomplets",
      label: "Incomplets",
      count: rows.filter((row) => row.isIncomplete).length,
      helper: "Relance administrative ou piece attendue",
      tone: "warning",
      path: "/admin/candidatures?status=attente&completion=incomplets",
    },
    {
      id: "etude",
      label: "En cours d'etude",
      count: rows.filter((row) => row.isUnderReview).length,
      helper: "Dossiers complets actuellement en analyse",
      tone: "info",
      path: "/admin/candidatures?status=attente&queue=review",
    },
    {
      id: "pret",
      label: "Prets pour decision",
      count: rows.filter((row) => row.isReadyDecision).length,
      helper: "Peuvent etre arbitres sans relance complementaire",
      tone: "positive",
      path: "/admin/candidatures?status=attente&completion=complets&queue=pret",
    },
    {
      id: "acceptes",
      label: "Acceptes",
      count: rows.filter((row) => row.statut === "Acceptee").length,
      helper: "Decisions favorables deja notifiees",
      tone: "positive",
      path: "/admin/candidatures?status=acceptee",
    },
    {
      id: "refuses",
      label: "Refuses",
      count: rows.filter((row) => row.statut === "Rejetee").length,
      helper: "Decisions definitives enregistrees",
      tone: "neutral",
      path: "/admin/candidatures?status=refusee",
    },
  ].map((stage) => ({
    ...stage,
    share: percentage(stage.count, total),
  }));

  const readyCount = stages.find((stage) => stage.id === "pret")?.count || 0;
  const incompleteCount = stages.find((stage) => stage.id === "incomplets")?.count || 0;

  return {
    stages,
    summary: {
      pendingCount: pendingRows.length,
      finalizedCount: finalizedRows.length,
      readyCount,
      incompleteCount,
      finalizationRate: percentage(finalizedRows.length, total),
      pendingRate: percentage(pendingRows.length, total),
    },
  };
}

export function getAdminRecentActivity(applications, activityLog = []) {
  const visibleIds = new Set(applications.map((application) => String(application.id)));

  if (Array.isArray(activityLog) && activityLog.length > 0) {
    return activityLog
      .filter((entry) => visibleIds.has(String(entry.applicationId)))
      .sort((first, second) => new Date(second.occurredAt) - new Date(first.occurredAt))
      .slice(0, 6)
      .map((entry) => ({
        id: entry.id,
        icon: entry.icon || "Action",
        title: entry.title,
        description: entry.description,
        detail: entry.detail,
        actorName: entry.actorName || "Plateforme PFC",
        actorRole: entry.actorRole || "Systeme",
        numeroDossier: entry.numeroDossier || "",
        time: formatRelativeTime(entry.occurredAt),
        occurredAt: formatAdminDate(entry.occurredAt),
        tone: entry.tone || "neutral",
        path: entry.path || (entry.applicationId ? `/admin/candidatures/${entry.applicationId}` : "/admin/candidatures"),
        status: entry.status || "",
      }));
  }

  return [...applications]
    .sort((first, second) => new Date(second.dateDepot) - new Date(first.dateDepot))
    .slice(0, 6)
    .map((application) => ({
      id: application.id,
      icon:
        application.statut === "Acceptee"
          ? "Validation"
          : application.statut === "Rejetee"
            ? "Refus"
            : "Soumission",
      title:
        application.statut === "Acceptee"
          ? "Candidature acceptee"
          : application.statut === "Rejetee"
            ? "Candidature refusee"
            : "Nouvelle candidature soumise",
      description: `${toAdminApplication(application).nom} - ${application.specialite} - ${application.universite}`,
      detail: application.numeroDossier,
      actorName: "Plateforme PFC",
      actorRole: "Historique importe",
      numeroDossier: application.numeroDossier,
      time: formatRelativeTime(application.submittedAt || application.dateDepot),
      occurredAt: formatAdminDate(application.submittedAt || application.dateDepot),
      tone:
        application.statut === "Acceptee"
          ? "positive"
          : application.statut === "Rejetee"
            ? "danger"
            : "info",
      path: `/admin/candidatures/${application.id}`,
      status: application.statut,
    }));
}
