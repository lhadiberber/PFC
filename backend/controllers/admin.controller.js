import { pool } from "../config/db.js";
import { findAdminDashboardData } from "../models/admin.model.js";

const REQUIRED_DOCUMENT_TYPES = [
  { type: "Diplome", key: "copieBac" },
  { type: "Releve de notes", key: "releveNotes" },
  { type: "Passeport / Carte d'identite", key: "carteIdentite" },
  { type: "Lettre de motivation", key: "photo" },
  { type: "Certificat de langue", key: "residence" },
  { type: "CV", key: "cv" },
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

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

function normalizeApplicationStatus(status) {
  const cleanStatus = String(status || "").trim();

  if (["Acceptée", "Acceptee", "AcceptÃ©e"].includes(cleanStatus)) {
    return "Acceptee";
  }

  if (["Refusée", "Refusee", "RefusÃ©e", "Rejetee", "Rejetée"].includes(cleanStatus)) {
    return "Rejetee";
  }

  return "En attente";
}

function normalizeDocumentStatus(status) {
  const cleanStatus = String(status || "").trim();

  if (["Validé", "Valide", "ValidÃ©"].includes(cleanStatus)) {
    return "Validé";
  }

  if (["Refusé", "Refuse", "RefusÃ©"].includes(cleanStatus)) {
    return "Refusé";
  }

  return "En attente";
}

function buildNumeroDossier(application) {
  const date = new Date(application.date_depot || Date.now());
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `CAND-${year}-${String(application.id).padStart(3, "0")}`;
}

function documentKeyForType(typeDocument) {
  return REQUIRED_DOCUMENT_TYPES.find((document) => document.type === typeDocument)?.key;
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
  const documentDetails = REQUIRED_DOCUMENT_TYPES.reduce((details, requiredDocument) => {
    const document = studentDocuments.find((item) => item.type_document === requiredDocument.type);
    details[requiredDocument.key] = document?.nom_fichier || "";
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

      if (status === "Validé") counts.documentsValides += 1;
      else if (status === "Refusé") counts.documentsRefuses += 1;
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
        SUM(statut = 'Acceptee') AS acceptees,
        SUM(statut = 'Rejetee') AS rejetees
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
