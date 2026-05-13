import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const AdmissionsContext = createContext(null);

const STORAGE_KEYS = {
  profile: "studentProfile",
  documents: "studentDocuments",
  draft: "studentApplicationDraft",
};

const defaultProfile = {
  nom: "",
  prenom: "",
  dateNaiss: "",
  lieuNaiss: "",
  sexe: "",
  nationalite: "",
  email: "",
  telephone: "",
  pays: "",
  adresse: "",
};

const REQUIRED_PROFILE_FIELDS = [
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

const defaultPersonalInfo = {
  nom: "",
  prenom: "",
  dateNaiss: "",
  lieuNaiss: "",
  sexe: "",
  nationalite: "",
  telephone: "",
  email: "",
  adresse: "",
  paysCode: "+33",
};

const defaultAcademicInfo = {
  diplomeActuel: "",
  typeBac: "",
  etablissementActuel: "",
  pays: "",
  anneeBac: "",
  moyenneBac: "",
  mention: "",
  specialiteActuelle: "",
  specialite: "",
  universite: "",
  niveauDemande: "",
  motivation: "",
  commentaires: "",
};

const defaultDocuments = {
  copieBac: "",
  releveNotes: "",
  carteIdentite: "",
  photo: "",
  residence: "",
  cv: "",
};

function buildEmptyDraft() {
  return {
    personalInfo: { ...defaultPersonalInfo },
    academicInfo: { ...defaultAcademicInfo },
    documents: { ...defaultDocuments },
  };
}

function parseStoredJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return fallback;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Impossible de lire ${key} depuis localStorage`, error);
    return fallback;
  }
}

function normalizeText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeProfile(profile = {}) {
  return {
    ...defaultProfile,
    nom: normalizeText(profile.nom),
    prenom: normalizeText(profile.prenom),
    dateNaiss: normalizeText(profile.dateNaiss),
    lieuNaiss: normalizeText(profile.lieuNaiss),
    sexe: normalizeText(profile.sexe),
    nationalite: normalizeText(profile.nationalite),
    email: normalizeText(profile.email),
    telephone: normalizeText(profile.telephone),
    pays: normalizeText(profile.pays),
    adresse: normalizeText(profile.adresse),
  };
}

function hasProfileValue(value) {
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
}

export function isStudentProfileComplete(profile = {}) {
  const normalizedProfile = normalizeProfile(profile);

  return REQUIRED_PROFILE_FIELDS.every((field) => hasProfileValue(normalizedProfile[field]));
}

function normalizePersonalInfo(personalInfo = {}) {
  return {
    ...defaultPersonalInfo,
    nom: normalizeText(personalInfo.nom),
    prenom: normalizeText(personalInfo.prenom),
    dateNaiss: normalizeText(personalInfo.dateNaiss),
    lieuNaiss: normalizeText(personalInfo.lieuNaiss),
    sexe: normalizeText(personalInfo.sexe),
    nationalite: normalizeText(personalInfo.nationalite),
    telephone: normalizeText(personalInfo.telephone),
    email: normalizeText(personalInfo.email),
    adresse: normalizeText(personalInfo.adresse),
    paysCode: normalizeText(personalInfo.paysCode, defaultPersonalInfo.paysCode),
  };
}

function normalizeAcademicInfo(academicInfo = {}) {
  return {
    ...defaultAcademicInfo,
    diplomeActuel: normalizeText(academicInfo.diplomeActuel || academicInfo.typeBac),
    typeBac: normalizeText(academicInfo.typeBac || academicInfo.diplomeActuel),
    etablissementActuel: normalizeText(academicInfo.etablissementActuel),
    pays: normalizeText(academicInfo.pays || academicInfo.paysEtude),
    anneeBac: normalizeText(academicInfo.anneeBac),
    moyenneBac: normalizeText(academicInfo.moyenneBac),
    mention: normalizeText(academicInfo.mention),
    specialiteActuelle: normalizeText(academicInfo.specialiteActuelle),
    specialite: normalizeText(academicInfo.specialite),
    universite: normalizeText(academicInfo.universite),
    niveauDemande: normalizeText(academicInfo.niveauDemande || academicInfo.niveau),
    motivation: normalizeText(academicInfo.motivation || academicInfo.lettreMotivation),
    commentaires: normalizeText(academicInfo.commentaires),
  };
}

function normalizeDocuments(documents = {}) {
  return {
    ...defaultDocuments,
    copieBac: normalizeText(documents.copieBac),
    releveNotes: normalizeText(documents.releveNotes),
    carteIdentite: normalizeText(documents.carteIdentite),
    photo: normalizeText(documents.photo),
    residence: normalizeText(documents.residence),
    cv: normalizeText(documents.cv),
  };
}

function normalizeStatus(status) {
  const cleanStatus = normalizeText(status).trim();

  if (["Acceptee", "Acceptée"].includes(cleanStatus)) {
    return "Acceptee";
  }

  if (["Rejetee", "Rejetée", "Refusee", "Refusée"].includes(cleanStatus)) {
    return "Rejetee";
  }

  return "En attente";
}

function normalizeIsoTimestamp(value, fallback = "") {
  const cleanValue = normalizeText(value, fallback);

  if (!cleanValue) {
    return fallback;
  }

  const parsedDate = new Date(cleanValue);
  return Number.isNaN(parsedDate.getTime()) ? fallback : cleanValue;
}

function normalizePriority(priority) {
  const cleanPriority = normalizeText(priority).trim().toLowerCase();

  switch (cleanPriority) {
    case "basse":
    case "low":
      return "basse";
    case "haute":
    case "high":
      return "haute";
    case "critique":
    case "critical":
      return "critique";
    case "moyenne":
    case "medium":
    default:
      return "moyenne";
  }
}

function normalizeInternalStatus(status, applicationStatus = "En attente") {
  const cleanStatus = normalizeText(status).trim().toLowerCase();

  switch (cleanStatus) {
    case "qualification":
      return "qualification";
    case "instruction":
      return "instruction";
    case "commission":
      return "commission";
    case "decision":
      return "decision";
    case "decision-finalisee":
    case "finalisee":
      return "decision-finalisee";
    default:
      return applicationStatus === "Acceptee" || applicationStatus === "Rejetee"
        ? "decision-finalisee"
        : "qualification";
  }
}

function normalizeApplicationNote(note = {}, index = 0) {
  return {
    id: normalizeText(note.id, `note-${index + 1}`),
    content: normalizeText(note.content || note.message).trim(),
    authorName: normalizeText(note.authorName, "Administrateur PFC"),
    authorRole: normalizeText(note.authorRole, "Gestionnaire de la plateforme"),
    createdAt: normalizeIsoTimestamp(note.createdAt, new Date().toISOString()),
  };
}

function normalizeApplicationNotes(notes = []) {
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes
    .map((note, index) => normalizeApplicationNote(note, index))
    .filter((note) => note.content !== "");
}

function normalizeAdminMeta(adminMeta = {}, application = {}) {
  const normalizedStatus = normalizeStatus(application.statut);
  const fallbackUpdatedAt = normalizeIsoTimestamp(
    application.submittedAt || application.dateDepot,
    new Date().toISOString()
  );
  const lastUpdatedAt = normalizeIsoTimestamp(
    adminMeta.lastUpdatedAt || application.lastUpdatedAt,
    fallbackUpdatedAt
  );
  const notes = normalizeApplicationNotes(adminMeta.notes || application.notes);
  let decisionDate = normalizeIsoTimestamp(
    adminMeta.decisionDate || application.decisionDate,
    ""
  );

  if (
    (normalizedStatus === "Acceptee" || normalizedStatus === "Rejetee") &&
    !decisionDate
  ) {
    decisionDate = lastUpdatedAt;
  }

  return {
    internalPriority: normalizePriority(
      adminMeta.internalPriority || application.internalPriority
    ),
    assignedTo: normalizeText(adminMeta.assignedTo || application.assignedTo),
    internalStatus: normalizeInternalStatus(
      adminMeta.internalStatus || application.internalStatus,
      normalizedStatus
    ),
    lastUpdatedAt,
    decisionDate,
    notes,
  };
}

function normalizeDraft(draft = {}) {
  return {
    personalInfo: normalizePersonalInfo(draft.personalInfo),
    academicInfo: normalizeAcademicInfo(draft.academicInfo),
    documents: normalizeDocuments(draft.documents),
  };
}

function profileToPersonalInfo(profile) {
  return {
    nom: normalizeText(profile.nom),
    prenom: normalizeText(profile.prenom),
    dateNaiss: normalizeText(profile.dateNaiss),
    lieuNaiss: normalizeText(profile.lieuNaiss),
    sexe: normalizeText(profile.sexe),
    nationalite: normalizeText(profile.nationalite),
    telephone: normalizeText(profile.telephone),
    email: normalizeText(profile.email),
    adresse: normalizeText(profile.adresse),
  };
}

function hasAnyFilledValue(values, ignoredKeys = []) {
  return Object.entries(values).some(
    ([key, value]) =>
      !ignoredKeys.includes(key) &&
      typeof value === "string" &&
      value.trim() !== ""
  );
}

function hasDraftContent(draft) {
  return (
    hasAnyFilledValue(draft.personalInfo, ["paysCode"]) ||
    hasAnyFilledValue(draft.academicInfo) ||
    hasAnyFilledValue(draft.documents)
  );
}

function formatStorageDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildNumeroDossier(sequence, date) {
  return `CAND-${date.getFullYear()}-${String(sequence).padStart(3, "0")}`;
}

function getPersonDisplayName(details = {}, fallback = "Candidat") {
  const fullName = [normalizeText(details.prenom), normalizeText(details.nom)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || normalizeText(details.email, fallback) || fallback;
}

function readStoredAdminActor() {
  try {
    const rawProfile = localStorage.getItem("adminProfile");
    if (rawProfile) {
      const parsedProfile = JSON.parse(rawProfile);
      return {
        name:
          normalizeText(parsedProfile.fullName) ||
          normalizeText(parsedProfile.email) ||
          "Administrateur PFC",
        role: normalizeText(parsedProfile.role, "Gestionnaire de la plateforme"),
      };
    }
  } catch (error) {
    console.error("Impossible de lire le profil administrateur", error);
  }

  return {
    name: localStorage.getItem("userEmail") || "Administrateur PFC",
    role: "Gestionnaire de la plateforme",
  };
}

function buildActivityId(prefix = "activity") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeActivityEntry(entry = {}, index = 0) {
  const occurredAt = normalizeText(entry.occurredAt, new Date().toISOString());

  return {
    id: normalizeText(entry.id, `activity-${index + 1}`),
    type: normalizeText(entry.type, "activity"),
    applicationId: entry.applicationId ?? null,
    numeroDossier: normalizeText(entry.numeroDossier),
    universite: normalizeText(entry.universite),
    specialite: normalizeText(entry.specialite),
    actorName: normalizeText(entry.actorName, "Plateforme PFC"),
    actorRole: normalizeText(entry.actorRole, "Systeme"),
    title: normalizeText(entry.title, "Activite"),
    description: normalizeText(entry.description),
    detail: normalizeText(entry.detail),
    icon: normalizeText(entry.icon, "Action"),
    tone: normalizeText(entry.tone, "neutral"),
    status: normalizeText(entry.status),
    path: normalizeText(entry.path),
    occurredAt,
  };
}

function prependActivityEntry(entries, nextEntry, limit = 80) {
  return [normalizeActivityEntry(nextEntry), ...entries].slice(0, limit);
}

function buildSubmissionActivity(application) {
  const actorName = getPersonDisplayName(application.details, `Candidat ${application.id}`);

  return normalizeActivityEntry({
    id: buildActivityId("submission"),
    type: "submission",
    applicationId: application.id,
    numeroDossier: application.numeroDossier,
    universite: application.universite,
    specialite: application.specialite,
    actorName,
    actorRole: "Candidat",
    title: "Nouvelle candidature soumise",
    description: `${actorName} a soumis sa candidature en ${application.specialite}.`,
    detail: `${application.numeroDossier} - ${application.universite}`,
    icon: "Soumission",
    tone: "info",
    status: application.statut,
    path: `/admin/candidatures/${application.id}`,
    occurredAt: application.submittedAt || application.dateDepot,
  });
}

function getPriorityLabel(priority) {
  switch (normalizePriority(priority)) {
    case "basse":
      return "Basse";
    case "haute":
      return "Haute";
    case "critique":
      return "Critique";
    case "moyenne":
    default:
      return "Moyenne";
  }
}

function getInternalStatusLabel(status) {
  switch (normalizeInternalStatus(status)) {
    case "instruction":
      return "Instruction";
    case "commission":
      return "Commission";
    case "decision":
      return "Decision";
    case "decision-finalisee":
      return "Decision finalisee";
    case "qualification":
    default:
      return "Qualification";
  }
}

function buildMetadataActivity(application, previousMeta, nextMeta) {
  const adminActor = readStoredAdminActor();
  const actorName = getPersonDisplayName(application.details, `Candidat ${application.id}`);
  const changes = [];

  if (previousMeta.internalPriority !== nextMeta.internalPriority) {
    changes.push(`priorite ${getPriorityLabel(nextMeta.internalPriority)}`);
  }

  if (previousMeta.assignedTo !== nextMeta.assignedTo) {
    changes.push(
      nextMeta.assignedTo ? `affectation ${nextMeta.assignedTo}` : "affectation retiree"
    );
  }

  if (previousMeta.internalStatus !== nextMeta.internalStatus) {
    changes.push(`statut ${getInternalStatusLabel(nextMeta.internalStatus)}`);
  }

  if (changes.length === 0) {
    return null;
  }

  return normalizeActivityEntry({
    id: buildActivityId("metadata"),
    type: "metadata_update",
    applicationId: application.id,
    numeroDossier: application.numeroDossier,
    universite: application.universite,
    specialite: application.specialite,
    actorName: adminActor.name,
    actorRole: adminActor.role,
    title: "Suivi interne mis a jour",
    description: `${adminActor.name} a mis a jour le suivi du dossier de ${actorName}.`,
    detail: changes.join(" | "),
    icon: "Pilotage",
    tone: "warning",
    status: application.statut,
    path: `/admin/candidatures/${application.id}`,
    occurredAt: nextMeta.lastUpdatedAt,
  });
}

function buildNoteActivity(application, note) {
  return normalizeActivityEntry({
    id: buildActivityId("note"),
    type: "note",
    applicationId: application.id,
    numeroDossier: application.numeroDossier,
    universite: application.universite,
    specialite: application.specialite,
    actorName: note.authorName,
    actorRole: note.authorRole,
    title: "Note interne ajoutee",
    description: `${note.authorName} a ajoute une note au dossier ${application.numeroDossier}.`,
    detail:
      note.content.length > 96 ? `${note.content.slice(0, 93).trim()}...` : note.content,
    icon: "Note",
    tone: "info",
    status: application.statut,
    path: `/admin/candidatures/${application.id}`,
    occurredAt: note.createdAt,
  });
}

function buildStatusChangeActivity(application, previousStatus, nextStatus) {
  const adminActor = readStoredAdminActor();
  const actorName = getPersonDisplayName(application.details, `Candidat ${application.id}`);
  const statusLabel =
    nextStatus === "Acceptee"
      ? "Candidature acceptee"
      : nextStatus === "Rejetee"
        ? "Dossier refuse"
        : "Candidature remise en attente";
  const statusTone =
    nextStatus === "Acceptee"
      ? "positive"
      : nextStatus === "Rejetee"
        ? "danger"
        : "warning";
  const statusIcon =
    nextStatus === "Acceptee"
      ? "Validation"
      : nextStatus === "Rejetee"
        ? "Refus"
        : "Revision";

  return normalizeActivityEntry({
    id: buildActivityId("status"),
    type: "status_change",
    applicationId: application.id,
    numeroDossier: application.numeroDossier,
    universite: application.universite,
    specialite: application.specialite,
    actorName: adminActor.name,
    actorRole: adminActor.role,
    title: statusLabel,
    description:
      nextStatus === "Acceptee"
        ? `Le dossier de ${actorName} en ${application.specialite} a ete accepte.`
        : nextStatus === "Rejetee"
          ? `Le dossier de ${actorName} en ${application.specialite} a ete refuse.`
          : `Le dossier de ${actorName} a ete remis en attente.`,
    detail: `${application.numeroDossier} - ${application.universite}`,
    icon: statusIcon,
    tone: statusTone,
    status: nextStatus,
    path: `/admin/candidatures/${application.id}`,
    occurredAt: new Date().toISOString(),
  });
}

function buildInitialActivityLog(applications) {
  return [...applications]
    .sort((first, second) => new Date(second.submittedAt || second.dateDepot) - new Date(first.submittedAt || first.dateDepot))
    .slice(0, 20)
    .map((application) => buildSubmissionActivity(application));
}

function normalizeApplication(application, index) {
  const details = application.details || {};

  return {
    id: application.id ?? index + 1,
    universite: normalizeText(application.universite),
    specialite: normalizeText(application.specialite),
    dateDepot: normalizeText(application.dateDepot, formatStorageDate(new Date())),
    submittedAt: normalizeText(application.submittedAt),
    statut: normalizeStatus(application.statut),
    numeroDossier: normalizeText(
      application.numeroDossier,
      buildNumeroDossier(index + 1, new Date())
    ),
    details: {
      ...normalizePersonalInfo(details),
      ...normalizeAcademicInfo(details),
      ...normalizeDocuments(details),
    },
    adminMeta: normalizeAdminMeta(application.adminMeta || {}, application),
  };
}

export function AdmissionsProvider({ children }) {
  const storedProfile = parseStoredJson(STORAGE_KEYS.profile, null);
  const storedDraft = parseStoredJson(STORAGE_KEYS.draft, null);
  const storedDocuments = parseStoredJson(STORAGE_KEYS.documents, null);
  const [profile, setProfile] = useState(() => normalizeProfile(storedProfile || {}));
  const [hasSavedProfile, setHasSavedProfile] = useState(() =>
    isStudentProfileComplete(storedProfile || {})
  );
  const [applicationDraft, setApplicationDraft] = useState(() => {
    if (storedDraft) {
      return normalizeDraft(storedDraft);
    }

    return {
      ...buildEmptyDraft(),
      documents: normalizeDocuments(storedDocuments || {}),
    };
  });
  const [applications, setApplications] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [lastSubmittedApplication, setLastSubmittedApplication] = useState(null);

  useEffect(() => {
    if (hasDraftContent(applicationDraft)) {
      localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(applicationDraft));
    } else {
      localStorage.removeItem(STORAGE_KEYS.draft);
    }
  }, [applicationDraft]);

  useEffect(() => {
    if (hasAnyFilledValue(applicationDraft.documents)) {
      localStorage.setItem(
        STORAGE_KEYS.documents,
        JSON.stringify({
          ...applicationDraft.documents,
          lastUpdated: new Date().toISOString(),
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.documents);
    }
  }, [applicationDraft.documents]);

  useEffect(() => {
    localStorage.removeItem("studentApplications");
    localStorage.removeItem("admissionsActivityLog");
  }, []);

  const saveProfile = (nextProfile) => {
    const normalizedProfile = normalizeProfile(nextProfile);

    setProfile(normalizedProfile);
    setHasSavedProfile(isStudentProfileComplete(normalizedProfile));
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(normalizedProfile));

    setApplicationDraft((currentDraft) => ({
      ...currentDraft,
      personalInfo: {
        ...currentDraft.personalInfo,
        ...profileToPersonalInfo(normalizedProfile),
      },
    }));
  };

  const updateDraftSection = (section, values) => {
    setApplicationDraft((currentDraft) => ({
      ...currentDraft,
      [section]: {
        ...currentDraft[section],
        ...values,
      },
    }));
  };

  const resetDraft = () => {
    setApplicationDraft((currentDraft) => ({
      personalInfo: hasAnyFilledValue(currentDraft.personalInfo, ["paysCode"])
        ? normalizePersonalInfo(currentDraft.personalInfo)
        : {
            ...defaultPersonalInfo,
            ...profileToPersonalInfo(profile),
          },
      academicInfo: { ...defaultAcademicInfo },
      documents: normalizeDocuments(currentDraft.documents),
    }));
  };

  const submitApplication = () => {
    const submittedAt = new Date();
    const nextId =
      applications.reduce((highestId, application) => {
        const currentId = Number(application.id) || 0;
        return currentId > highestId ? currentId : highestId;
      }, 0) + 1;

    const createdApplication = normalizeApplication({
      id: nextId,
      universite: applicationDraft.academicInfo.universite,
      specialite: applicationDraft.academicInfo.specialite,
      dateDepot: formatStorageDate(submittedAt),
      submittedAt: submittedAt.toISOString(),
      statut: "En attente",
      numeroDossier: buildNumeroDossier(applications.length + 1, submittedAt),
      details: {
        ...normalizePersonalInfo(applicationDraft.personalInfo),
        ...normalizeAcademicInfo(applicationDraft.academicInfo),
        ...normalizeDocuments(applicationDraft.documents),
      },
      adminMeta: {
        internalPriority: "moyenne",
        assignedTo: "",
        internalStatus: "qualification",
        lastUpdatedAt: submittedAt.toISOString(),
        decisionDate: "",
        notes: [],
      },
    }, applications.length);

    setApplications((currentApplications) => [createdApplication, ...currentApplications]);
    setActivityLog((currentEntries) =>
      prependActivityEntry(currentEntries, buildSubmissionActivity(createdApplication))
    );
    setLastSubmittedApplication(createdApplication);
    resetDraft();

    return createdApplication;
  };

  const updateApplicationStatus = (applicationId, nextStatus) => {
    const normalizedNextStatus = normalizeStatus(nextStatus);
    const currentApplication = applications.find(
      (application) => String(application.id) === String(applicationId)
    );

    if (!currentApplication || currentApplication.statut === normalizedNextStatus) {
      return;
    }

    const updatedAt = new Date().toISOString();
    const currentMeta = normalizeAdminMeta(
      currentApplication.adminMeta,
      currentApplication
    );
    const nextAdminMeta = normalizeAdminMeta(
      {
        ...currentMeta,
        internalStatus:
          normalizedNextStatus === "En attente"
            ? currentMeta.internalStatus === "decision-finalisee"
              ? "instruction"
              : currentMeta.internalStatus
            : "decision-finalisee",
        lastUpdatedAt: updatedAt,
        decisionDate:
          normalizedNextStatus === "Acceptee" || normalizedNextStatus === "Rejetee"
            ? updatedAt
            : "",
      },
      {
        ...currentApplication,
        statut: normalizedNextStatus,
        lastUpdatedAt: updatedAt,
        decisionDate:
          normalizedNextStatus === "Acceptee" || normalizedNextStatus === "Rejetee"
            ? updatedAt
            : "",
      }
    );

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        String(application.id) === String(applicationId)
          ? {
              ...application,
              statut: normalizedNextStatus,
              adminMeta: nextAdminMeta,
            }
          : application
      )
    );
    setActivityLog((currentEntries) =>
      prependActivityEntry(
        currentEntries,
        buildStatusChangeActivity(
          currentApplication,
          currentApplication.statut,
          normalizedNextStatus
        )
      )
    );
  };

  const updateApplicationMetadata = (applicationId, metadataUpdates = {}) => {
    const currentApplication = applications.find(
      (application) => String(application.id) === String(applicationId)
    );

    if (!currentApplication) {
      return null;
    }

    const currentMeta = normalizeAdminMeta(
      currentApplication.adminMeta,
      currentApplication
    );
    const updatedAt = new Date().toISOString();
    const nextAdminMeta = normalizeAdminMeta(
      {
        ...currentMeta,
        internalPriority:
          metadataUpdates.internalPriority ?? currentMeta.internalPriority,
        assignedTo: metadataUpdates.assignedTo ?? currentMeta.assignedTo,
        internalStatus: metadataUpdates.internalStatus ?? currentMeta.internalStatus,
        lastUpdatedAt: updatedAt,
        decisionDate:
          currentApplication.statut === "Acceptee" ||
          currentApplication.statut === "Rejetee"
            ? currentMeta.decisionDate || updatedAt
            : "",
      },
      {
        ...currentApplication,
        lastUpdatedAt: updatedAt,
      }
    );

    const hasMeaningfulChange =
      currentMeta.internalPriority !== nextAdminMeta.internalPriority ||
      currentMeta.assignedTo !== nextAdminMeta.assignedTo ||
      currentMeta.internalStatus !== nextAdminMeta.internalStatus;

    if (!hasMeaningfulChange) {
      return currentApplication;
    }

    const updatedApplication = {
      ...currentApplication,
      adminMeta: nextAdminMeta,
    };

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        String(application.id) === String(applicationId)
          ? updatedApplication
          : application
      )
    );

    const metadataActivity = buildMetadataActivity(
      updatedApplication,
      currentMeta,
      nextAdminMeta
    );

    if (metadataActivity) {
      setActivityLog((currentEntries) =>
        prependActivityEntry(currentEntries, metadataActivity)
      );
    }

    return updatedApplication;
  };

  const addApplicationNote = (applicationId, content) => {
    const currentApplication = applications.find(
      (application) => String(application.id) === String(applicationId)
    );
    const trimmedContent = normalizeText(content).trim();

    if (!currentApplication || !trimmedContent) {
      return null;
    }

    const adminActor = readStoredAdminActor();
    const createdAt = new Date().toISOString();
    const note = normalizeApplicationNote({
      id: buildActivityId("note-entry"),
      content: trimmedContent,
      authorName: adminActor.name,
      authorRole: adminActor.role,
      createdAt,
    });
    const currentMeta = normalizeAdminMeta(
      currentApplication.adminMeta,
      currentApplication
    );
    const nextAdminMeta = normalizeAdminMeta(
      {
        ...currentMeta,
        lastUpdatedAt: createdAt,
        notes: [note, ...currentMeta.notes],
        decisionDate:
          currentApplication.statut === "Acceptee" ||
          currentApplication.statut === "Rejetee"
            ? currentMeta.decisionDate || createdAt
            : "",
      },
      {
        ...currentApplication,
        lastUpdatedAt: createdAt,
      }
    );
    const updatedApplication = {
      ...currentApplication,
      adminMeta: nextAdminMeta,
    };

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        String(application.id) === String(applicationId)
          ? updatedApplication
          : application
      )
    );
    setActivityLog((currentEntries) =>
      prependActivityEntry(currentEntries, buildNoteActivity(updatedApplication, note))
    );

    return note;
  };

  const value = useMemo(
    () => ({
      profile,
      hasSavedProfile,
      saveProfile,
      applicationDraft,
      updatePersonalInfo: (values) => updateDraftSection("personalInfo", values),
      updateAcademicInfo: (values) => updateDraftSection("academicInfo", values),
      updateDocuments: (values) => updateDraftSection("documents", values),
      resetDraft,
      applications,
      activityLog,
      submitApplication,
      updateApplicationStatus,
      updateApplicationMetadata,
      addApplicationNote,
      lastSubmittedApplication,
    }),
    [
      applicationDraft,
      applications,
      activityLog,
      addApplicationNote,
      hasSavedProfile,
      lastSubmittedApplication,
      profile,
      updateApplicationMetadata,
    ]
  );

  return <AdmissionsContext.Provider value={value}>{children}</AdmissionsContext.Provider>;
}

AdmissionsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAdmissions() {
  const context = useContext(AdmissionsContext);

  if (!context) {
    throw new Error("useAdmissions must be used within AdmissionsProvider");
  }

  return context;
}
