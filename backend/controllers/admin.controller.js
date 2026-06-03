import { pool } from "../config/db.js";
import {
  findAdminApplicationById,
  findAdminApplications,
  findAdminDashboardData,
  findAdminDocumentById,
  findAdminDocuments,
  findAdminStudentById,
  findAdminStudents,
  updateAdminApplicationStatus,
  updateAdminDocumentStatus,
} from "../models/admin.model.js";

const DOCUMENT_TYPES = [
  {
    type: "Relevé de notes du baccalauréat",
    key: "releveNotes",
    aliases: ["Releve de notes"],
    required: true,
  },
  {
    type: "Attestation de réussite au baccalauréat",
    key: "attestationReussite",
    legacyKey: "copieBac",
    aliases: ["Diplome", "Copie du bac ou diplome"],
    required: true,
  },
  {
    type: "Pièce d'identité",
    key: "carteIdentite",
    aliases: ["Passeport / Carte d'identite", "Carte d'identite ou passeport"],
    required: true,
  },
  {
    type: "Photo d'identité",
    key: "photo",
    aliases: ["Lettre de motivation"],
    required: true,
  },
  {
    type: "Certificat de résidence",
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
const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((document) => document.required);

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

const DB_STATUS_PENDING = "En attente";
const DB_STATUS_ACCEPTED = "Acceptée";
const DB_STATUS_REJECTED = "Refusée";
const DB_DOCUMENT_STATUS_VALIDATED = "Validé";
const DB_DOCUMENT_STATUS_REFUSED = "Refusé";

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

function normalizeApplicationStatus(status) {
  const cleanStatus = String(status || "").trim();

  if (["Acceptée", "Acceptee"].includes(cleanStatus)) {
    return "Acceptee";
  }

  if (["Refusée", "Refusee", "Rejetee", "Rejetée"].includes(cleanStatus)) {
    return "Rejetee";
  }

  return "En attente";
}

function normalizeRequestedAdminStatus(status) {
  const cleanStatus = String(status || "").trim().toLowerCase();

  if (cleanStatus === "en attente") {
    return DB_STATUS_PENDING;
  }

  if (cleanStatus.startsWith("accept")) {
    return DB_STATUS_ACCEPTED;
  }

  if (cleanStatus.startsWith("refus") || cleanStatus.startsWith("rejet")) {
    return DB_STATUS_REJECTED;
  }

  return null;
}

function normalizeDocumentStatus(status) {
  const cleanStatus = String(status || "").trim();

  if (["Validé", "Valide"].includes(cleanStatus)) {
    return "Valide";
  }

  if (["Refusé", "Refuse"].includes(cleanStatus)) {
    return "Refuse";
  }

  return "En attente";
}

function normalizeRequestedDocumentStatus(status) {
  const cleanStatus = String(status || "").trim().toLowerCase();

  if (cleanStatus === "en attente") {
    return DB_STATUS_PENDING;
  }

  if (cleanStatus.startsWith("valid")) {
    return DB_DOCUMENT_STATUS_VALIDATED;
  }

  if (cleanStatus.startsWith("refus")) {
    return DB_DOCUMENT_STATUS_REFUSED;
  }

  return null;
}

function buildDocumentFileUrl(request, cheminFichier) {
  const normalizedPath = String(cheminFichier || "").replace(/\\/g, "/").replace(/^\/+/, "");

  if (!normalizedPath) {
    return "";
  }

  return `/${normalizedPath}`;
}

function buildNumeroDossier(application) {
  const date = new Date(application.date_depot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function normalizeDocumentType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
    const acceptedTypes = [requiredDocument.type, ...(requiredDocument.aliases || [])].map(
      normalizeDocumentType
    );
    const document = studentDocuments.find((item) =>
      acceptedTypes.includes(normalizeDocumentType(item.type_document))
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

function mapApplicationForFrontend(application, documentsByStudent) {
  const statut = normalizeApplicationStatus(application.statut);

  return {
    id: application.id,
    student_id: application.student_id,
    numeroDossier: buildNumeroDossier(application),
    universite: application.universite,
    specialite: application.formation,
    niveauDemande: application.niveau,
    motivation: application.motivation,
    dateDepot: application.date_depot,
    submittedAt: application.date_depot,
    statut,
    details: buildApplicationDetails(application, documentsByStudent),
    adminMeta: {
      internalPriority: "moyenne",
      assignedTo: "",
      internalStatus:
        statut === "En attente" ? "qualification" : "decision-finalisee",
      lastUpdatedAt: application.date_depot,
      decisionDate: statut === "En attente" ? "" : application.date_depot,
      notes: application.commentaire_admin
        ? [
            {
              id: `comment-${application.id}`,
              text: application.commentaire_admin,
              createdAt: application.date_depot,
            },
          ]
        : [],
    },
  };
}

function mapApplicationListItem(application, documentsByStudent) {
  const details = buildApplicationDetails(application, documentsByStudent);

  return {
    id: application.id,
    student_id: application.student_id,
    nom: application.nom,
    prenom: application.prenom,
    email: application.email,
    universite: application.universite,
    formation: application.formation,
    niveau: application.niveau,
    statut: normalizeApplicationStatus(application.statut),
    date_depot: application.date_depot,
    numeroDossier: buildNumeroDossier(application),
    specialite: application.formation,
    dateDepot: application.date_depot,
    submittedAt: application.date_depot,
    details,
  };
}

function mapApplicationDetail(application, documents) {
  const documentsByStudent = buildDocumentsByStudent(documents);

  return {
    ...mapApplicationForFrontend(application, documentsByStudent),
    student: {
      id: application.student_id,
      nom: application.nom,
      prenom: application.prenom,
      email: application.email,
    },
    profile: {
      telephone: application.telephone,
      date_naissance: application.date_naissance,
      nationalite: application.nationalite,
      adresse: application.adresse,
      diplome_actuel: application.diplome_actuel,
      etablissement: application.etablissement,
      specialite_actuelle: application.specialite_actuelle,
      annee_obtention: application.annee_obtention,
      moyenne: application.moyenne,
    },
    documents: documents.map((document) => ({
      id: document.id,
      application_id: document.application_id,
      type_document: document.type_document,
      nom_fichier: document.nom_fichier,
      statut: normalizeDocumentStatus(document.statut),
      date_upload: document.date_upload,
    })),
    commentaire_admin: application.commentaire_admin || "",
  };
}

function buildStudentGlobalStatus(student) {
  const status = normalizeApplicationStatus(student.latest_status);

  if (!student.candidatures_count) {
    return "Aucune candidature";
  }

  if (status === "Acceptee") {
    return "Accepté";
  }

  if (status === "Rejetee") {
    return "Refusé";
  }

  return "En attente";
}

function mapStudentListItem(student) {
  return {
    id: student.id,
    nom: student.nom,
    prenom: student.prenom,
    email: student.email,
    telephone: student.telephone,
    created_at: student.created_at,
    candidaturesCount: student.candidatures_count,
    statutGlobal: buildStudentGlobalStatus(student),
    latestStatus: normalizeApplicationStatus(student.latest_status),
    latestUniversite: student.latest_universite,
    latestFormation: student.latest_formation,
    latestDateDepot: student.latest_date_depot,
    profile: {
      nationalite: student.nationalite,
      diplome_actuel: student.diplome_actuel,
      annee_obtention: student.annee_obtention,
    },
  };
}

function mapStudentDetail(studentDetail) {
  const documentsByStudent = buildDocumentsByStudent(studentDetail.documents);

  return {
    user: {
      id: studentDetail.student.id,
      nom: studentDetail.student.nom,
      prenom: studentDetail.student.prenom,
      email: studentDetail.student.email,
      role: studentDetail.student.role,
      created_at: studentDetail.student.created_at,
    },
    profile: {
      telephone: studentDetail.student.telephone,
      date_naissance: studentDetail.student.date_naissance,
      nationalite: studentDetail.student.nationalite,
      adresse: studentDetail.student.adresse,
      diplome_actuel: studentDetail.student.diplome_actuel,
      etablissement: studentDetail.student.etablissement,
      specialite_actuelle: studentDetail.student.specialite_actuelle,
      annee_obtention: studentDetail.student.annee_obtention,
      moyenne: studentDetail.student.moyenne,
    },
    applications: studentDetail.applications.map((application) =>
      mapApplicationListItem(application, documentsByStudent)
    ),
    documents: studentDetail.documents.map((document) => ({
      id: document.id,
      application_id: document.application_id,
      type_document: document.type_document,
      nom_fichier: document.nom_fichier,
      statut: normalizeDocumentStatus(document.statut),
      date_upload: document.date_upload,
    })),
  };
}

function countCompleted(source, fields) {
  return fields.filter((field) => hasValue(source[field])).length;
}

function isApplicationIncomplete(application, documentsByStudent) {
  const details = buildApplicationDetails(application, documentsByStudent);
  const profileComplete = countCompleted(details, [
    "nom",
    "prenom",
    "email",
    "telephone",
    "dateNaiss",
    "nationalite",
    "adresse",
  ]) === PROFILE_FIELDS.length;
  const academicComplete = countCompleted(details, [
    "diplomeActuel",
    "etablissementActuel",
    "anneeBac",
    "moyenneBac",
    "specialite",
    "universite",
  ]) === ACADEMIC_FIELDS.length;
  const documentsComplete = REQUIRED_DOCUMENT_TYPES.every((document) =>
    hasValue(details[document.key])
  );

  return !profileComplete || !academicComplete || !documentsComplete;
}

function buildStats(applications, documents, students, documentsByStudent) {
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

  return {
    totalCandidatures: applications.length,
    ...statusCounts,
    totalEtudiants: students.length,
    dossiersIncomplets: applications.filter((application) =>
      isApplicationIncomplete(application, documentsByStudent)
    ).length,
    ...documentCounts,
  };
}

function buildRecentApplications(applications) {
  return applications.slice(0, 8).map((application) => ({
    id: application.id,
    nom: application.nom,
    prenom: application.prenom,
    universite: application.universite,
    formation: application.formation,
    date_depot: application.date_depot,
    statut: normalizeApplicationStatus(application.statut),
  }));
}

function buildPendingDocuments(documents) {
  return documents
    .filter((document) => normalizeDocumentStatus(document.statut) === "En attente")
    .slice(0, 8)
    .map((document) => ({
      id: document.id,
      student_id: document.student_id,
      nom: document.nom,
      prenom: document.prenom,
      type_document: document.type_document,
      nom_fichier: document.nom_fichier,
      date_upload: document.date_upload,
      statut: normalizeDocumentStatus(document.statut),
    }));
}

function mapAdminDocument(document, request) {
  return {
    id: document.id,
    student_id: document.student_id,
    application_id: document.application_id,
    type_document: document.type_document,
    nom_fichier: document.nom_fichier,
    chemin_fichier: document.chemin_fichier,
    file_url: buildDocumentFileUrl(request, document.chemin_fichier),
    statut: normalizeDocumentStatus(document.statut),
    date_upload: document.date_upload,
    student: {
      id: document.student_id,
      nom: document.nom,
      prenom: document.prenom,
      email: document.email,
    },
    application: document.application_id
      ? {
          id: document.application_id,
          universite: document.universite,
          formation: document.formation,
          niveau: document.niveau,
          statut: normalizeApplicationStatus(document.application_statut),
          date_depot: document.date_depot,
        }
      : null,
  };
}

function buildRecentActivity(applications, documents, students) {
  const applicationActivity = applications.slice(0, 6).map((application) => {
    const status = normalizeApplicationStatus(application.statut);

    return {
      type: "application",
      title:
        status === "En attente"
          ? "Nouvelle candidature"
          : `Candidature ${status === "Acceptee" ? "acceptée" : "refusée"}`,
      description: `${application.prenom} ${application.nom} a depose une candidature en ${application.formation}.`,
      date: application.date_depot,
      status,
    };
  });
  const documentActivity = documents.slice(0, 6).map((document) => ({
    type: "document",
    title: "Document ajouté",
    description: `${document.prenom} ${document.nom} a depose ${document.type_document}.`,
    date: document.date_upload,
    status: normalizeDocumentStatus(document.statut),
  }));
  const studentActivity = students.slice(0, 4).map((student) => ({
    type: "student",
    title: "Nouvel étudiant inscrit",
    description: `${student.prenom} ${student.nom} a cree un compte etudiant.`,
    date: student.created_at,
    status: "",
  }));

  return [...applicationActivity, ...documentActivity, ...studentActivity]
    .filter((activity) => activity.date)
    .sort((first, second) => new Date(second.date) - new Date(first.date))
    .slice(0, 8);
}

export async function getAdminOverview(_request, response, next) {
  try {
    const [[stats]] = await pool.execute(`
      SELECT
        COUNT(*) AS totalCandidatures,
        SUM(statut = 'En attente') AS enAttente,
        SUM(statut IN ('Acceptée', 'Acceptee')) AS acceptees,
        SUM(statut IN ('Refusée', 'Refusee', 'Rejetee')) AS rejetees
      FROM applications
    `);

    response.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getAdminDashboard(_request, response, next) {
  try {
    const { applications, documents, students } = await findAdminDashboardData();
    const documentsByStudent = buildDocumentsByStudent(documents);
    const stats = buildStats(applications, documents, students, documentsByStudent);

    response.json({
      success: true,
      stats,
      recentApplications: buildRecentApplications(applications),
      applications: applications.map((application) =>
        mapApplicationForFrontend(application, documentsByStudent)
      ),
      statusDistribution: {
        enAttente: stats.enAttente,
        acceptees: stats.acceptees,
        refusees: stats.refusees,
      },
      documentsToReview: {
        total: stats.documentsEnAttente,
        items: buildPendingDocuments(documents),
      },
      recentActivity: buildRecentActivity(applications, documents, students),
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminApplications(_request, response, next) {
  try {
    const applications = await findAdminApplications();
    const { documents } = await findAdminDashboardData();
    const documentsByStudent = buildDocumentsByStudent(documents);

    response.json({
      success: true,
      applications: applications.map((application) =>
        mapApplicationListItem(application, documentsByStudent)
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminApplication(request, response, next) {
  try {
    const applicationDetail = await findAdminApplicationById(request.params.id);

    if (!applicationDetail) {
      response.status(404).json({
        success: false,
        message: "Candidature introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      application: mapApplicationDetail(applicationDetail.application, applicationDetail.documents),
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminDocuments(request, response, next) {
  try {
    const documents = await findAdminDocuments();

    response.json({
      success: true,
      documents: documents.map((document) => mapAdminDocument(document, request)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminDocument(request, response, next) {
  try {
    const document = await findAdminDocumentById(request.params.id);

    if (!document) {
      response.status(404).json({
        success: false,
        message: "Document introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      document: mapAdminDocument(document, request),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminDocumentStatusController(request, response, next) {
  try {
    const statut = normalizeRequestedDocumentStatus(request.body.statut);

    if (!statut) {
      response.status(400).json({
        success: false,
        message: "Statut invalide. Utilisez En attente, Valide ou Refuse.",
      });
      return;
    }

    const document = await updateAdminDocumentStatus(request.params.id, statut);

    if (!document) {
      response.status(404).json({
        success: false,
        message: "Document introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      message: "Statut du document mis a jour.",
      document: mapAdminDocument(document, request),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminApplicationStatusController(request, response, next) {
  try {
    const statut = normalizeRequestedAdminStatus(request.body.statut);

    if (!statut) {
      response.status(400).json({
        success: false,
        message: "Statut invalide. Utilisez En attente, Acceptée ou Refusée.",
      });
      return;
    }

    const updatedApplication = await updateAdminApplicationStatus(
      request.params.id,
      statut,
      request.body.commentaire_admin
    );

    if (!updatedApplication) {
      response.status(404).json({
        success: false,
        message: "Candidature introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      message: "Statut de la candidature mis a jour.",
      application: mapApplicationDetail(updatedApplication.application, updatedApplication.documents),
    });
  } catch (error) {
    next(error);
  }
}

export async function listAdminStudents(_request, response, next) {
  try {
    const students = await findAdminStudents();

    response.json({
      success: true,
      students: students.map(mapStudentListItem),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminStudent(request, response, next) {
  try {
    const studentDetail = await findAdminStudentById(request.params.id);

    if (!studentDetail) {
      response.status(404).json({
        success: false,
        message: "Etudiant introuvable.",
      });
      return;
    }

    response.json({
      success: true,
      student: mapStudentDetail(studentDetail),
    });
  } catch (error) {
    next(error);
  }
}
