const DOCUMENT_TYPES = [
  {
    type: "Releve de notes du baccalaureat",
    key: "releveNotes",
    aliases: ["Releve de notes"],
    required: true,
  },
  {
    type: "Attestation de reussite au baccalaureat",
    key: "attestationReussite",
    legacyKey: "copieBac",
    aliases: ["Diplome", "Copie du bac ou diplome"],
    required: true,
  },
  {
    type: "Piece d'identite",
    key: "carteIdentite",
    aliases: ["Passeport / Carte d'identite", "Carte d'identite ou passeport"],
    required: true,
  },
  {
    type: "Photo d'identite",
    key: "photo",
    aliases: ["Lettre de motivation"],
    required: true,
  },
  {
    type: "Certificat de residence",
    key: "residence",
    aliases: ["Certificat de langue"],
    required: true,
  },
  {
    type: "Justificatif particulier",
    key: "justificatifParticulier",
    legacyKey: "cv",
    aliases: ["CV"],
    required: false,
  },
];

const PROFILE_FIELDS = [
  "nom",
  "prenom",
  "email",
  "telephone",
  "date_naissance",
  "nationalite",
  "adresse",
];

const ACADEMIC_FIELDS = [
  "diplome_actuel",
  "etablissement",
  "annee_obtention",
  "moyenne",
  "formation",
  "universite",
];

const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((document) => document.required);

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

function normalizeAscii(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeApplicationStatus(status) {
  const cleanStatus = String(status || "").trim();
  const asciiStatus = normalizeAscii(cleanStatus);

  if (asciiStatus === "acceptee") {
    return "Acceptee";
  }

  if (["refusee", "rejetee"].includes(asciiStatus)) {
    return "Rejetee";
  }

  return "En attente";
}

function normalizeDocumentStatus(status) {
  const cleanStatus = String(status || "").trim();
  const asciiStatus = normalizeAscii(cleanStatus);

  if (asciiStatus === "valide") {
    return "Valide";
  }

  if (asciiStatus === "refuse") {
    return "Refuse";
  }

  return "En attente";
}

function getApplicationDate(application) {
  const rawDate =
    application?.submittedAt ||
    application?.dateDepot ||
    application?.date_depot ||
    application?.created_at ||
    application?.date;
  const parsedDate = new Date(rawDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
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

function percentage(part, total) {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function countApplicationsInRange(applications, start, end) {
  return applications.filter((application) => {
    const applicationDate = getApplicationDate(application);
    return applicationDate && applicationDate >= start && applicationDate < end;
  }).length;
}

function buildDocumentsByStudent(documents) {
  return documents.reduce((groups, document) => {
    const key = String(document.student_id);
    groups.set(key, [...(groups.get(key) || []), document]);
    return groups;
  }, new Map());
}

function buildApplicationDetails(application, documentsByStudent) {
  const studentDocuments = documentsByStudent.get(String(application.student_id)) || [];
  const documentDetails = DOCUMENT_TYPES.reduce((details, requiredDocument) => {
    const acceptedTypes = [requiredDocument.type, ...(requiredDocument.aliases || [])].map((value) =>
      String(value || "")
        .trim()
        .toLowerCase()
    );
    const document = studentDocuments.find((item) =>
      acceptedTypes.includes(String(item.type_document || "").trim().toLowerCase())
    );
    const fileName = document?.nom_fichier || "";
    details[requiredDocument.key] = fileName;

    if (requiredDocument.legacyKey) {
      details[requiredDocument.legacyKey] = fileName;
    }

    return details;
  }, {});

  return {
    nom: application.nom,
    prenom: application.prenom,
    email: application.email,
    telephone: application.telephone,
    dateNaiss: application.date_naissance,
    nationalite: application.nationalite,
    adresse: application.adresse,
    diplomeActuel: application.diplome_actuel,
    typeBac: application.diplome_actuel,
    serieBac: application.serie_bac,
    moyenneBac: application.moyenne_bac,
    domaine: application.domaine,
    filiere: application.filiere,
    faculteInstitut: application.faculte_institut,
    etablissementActuel: application.etablissement,
    anneeBac: application.annee_obtention,
    moyenneBac: application.moyenne,
    specialiteActuelle: application.specialite_actuelle,
    specialite: application.formation,
    universite: application.universite,
    niveauDemande: application.niveau,
    motivation: application.motivation,
    ...documentDetails,
  };
}

function countCompleted(source, fields) {
  return fields.filter((field) => hasValue(source[field])).length;
}

function isApplicationIncomplete(application, documentsByStudent) {
  const details = buildApplicationDetails(application, documentsByStudent);
  const profileComplete = countCompleted(details, PROFILE_FIELDS) === PROFILE_FIELDS.length;
  const academicComplete = countCompleted(details, ACADEMIC_FIELDS) === ACADEMIC_FIELDS.length;
  const documentsComplete = REQUIRED_DOCUMENT_TYPES.every((document) => hasValue(details[document.key]));

  return !profileComplete || !academicComplete || !documentsComplete;
}

// calcul commun aux dashboards admin et super admin
export function buildDashboardStats(applications, documents, students) {
  const now = new Date();
  const today = startOfDay(now);
  const currentWindowStart = addDays(today, -6);
  const nextDay = addDays(today, 1);
  const previousWindowStart = addDays(currentWindowStart, -7);
  const documentsByStudent = buildDocumentsByStudent(documents);

  const statusCounts = applications.reduce(
    (counts, application) => {
      const status = normalizeApplicationStatus(application.statut);

      if (status === "Acceptee") counts.acceptees += 1;
      else if (status === "Rejetee") counts.refusees += 1;
      else counts.enAttente += 1;

      return counts;
    },
    { enAttente: 0, acceptees: 0, refusees: 0 }
  );

  const documentCounts = documents.reduce(
    (counts, document) => {
      const status = normalizeDocumentStatus(document.statut);

      if (status === "Valide") counts.documentsValides += 1;
      else if (status === "Refuse") counts.documentsRefuses += 1;
      else counts.documentsEnAttente += 1;

      return counts;
    },
    { documentsEnAttente: 0, documentsValides: 0, documentsRefuses: 0 }
  );

  const progressRows = applications.map((application) => {
    const details = buildApplicationDetails(application, documentsByStudent);
    const profil = Math.round((countCompleted(details, PROFILE_FIELDS) / PROFILE_FIELDS.length) * 100);
    const documentsProgress = Math.round(
      (REQUIRED_DOCUMENT_TYPES.filter((document) => hasValue(details[document.key])).length /
        REQUIRED_DOCUMENT_TYPES.length) * 100
    );
    const academique = Math.round(
      (countCompleted(details, ACADEMIC_FIELDS) / ACADEMIC_FIELDS.length) * 100
    );

    let finale = Math.round((profil + documentsProgress + academique) / 3);
    if (application.statut === "Acceptee" || application.statut === "Rejetee") {
      finale = 100;
    } else if (application.statut === "En attente") {
      finale = Math.max(finale, 70);
    }

    return {
      application,
      progress: { profil, documents: documentsProgress, academique, finale },
      submittedDate: getApplicationDate(application),
    };
  });

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
    progressRows.map(({ progress }) => Math.round((progress.profil + progress.documents + progress.academique) / 3))
  );
  const backlogCritique = pendingAges.filter((age) => age > 7).length;
  const ancienneteMoyenneBacklog = average(pendingAges);
  const ancienneteMaxBacklog = pendingAges.length > 0 ? Math.max(...pendingAges) : 0;
  const finalisees = statusCounts.acceptees + statusCounts.refusees;
  const dossiersIncomplets = applications.filter((application) =>
    isApplicationIncomplete(application, documentsByStudent)
  ).length;

  return {
    totalCandidatures: applications.length,
    enAttente: statusCounts.enAttente,
    acceptees: statusCounts.acceptees,
    refusees: statusCounts.refusees,
    finalisees,
    totalEtudiants: students.length,
    dossiersIncomplets,
    documentsEnAttente: documentCounts.documentsEnAttente,
    documentsValides: documentCounts.documentsValides,
    documentsRefuses: documentCounts.documentsRefuses,
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
    tauxAcceptation: percentage(statusCounts.acceptees, finalisees),
    partEnAttente: percentage(statusCounts.enAttente, applications.length),
  };
}
