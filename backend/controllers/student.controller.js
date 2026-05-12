import { findStudentDashboardData } from "../models/student.model.js";

const PROFILE_FIELDS = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prenom" },
  { key: "email", label: "Email" },
  { key: "telephone", label: "Telephone" },
  { key: "date_naissance", label: "Date de naissance" },
  { key: "nationalite", label: "Nationalite" },
  { key: "adresse", label: "Adresse" },
  { key: "diplome_actuel", label: "Diplome actuel" },
  { key: "etablissement", label: "Etablissement" },
  { key: "specialite_actuelle", label: "Specialite actuelle" },
  { key: "annee_obtention", label: "Annee d'obtention" },
  { key: "moyenne", label: "Moyenne" },
];

const REQUIRED_DOCUMENT_TYPES = [
  "Diplome",
  "Releve de notes",
  "Passeport / Carte d'identite",
  "Lettre de motivation",
  "Certificat de langue",
  "CV",
];

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

function toPercent(completed, total) {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function normalizeStatus(status) {
  const cleanStatus = String(status || "").trim();

  if (["Acceptée", "Acceptee", "AcceptÃ©e"].includes(cleanStatus)) {
    return "Acceptée";
  }

  if (["Refusée", "Refusee", "RefusÃ©e", "Rejetee", "Rejetée"].includes(cleanStatus)) {
    return "Refusée";
  }

  if (["Validé", "Valide", "ValidÃ©"].includes(cleanStatus)) {
    return "Validé";
  }

  if (["Refusé", "Refuse", "RefusÃ©"].includes(cleanStatus)) {
    return "Refusé";
  }

  return "En attente";
}

function buildProfileSummary(student) {
  const missingFields = PROFILE_FIELDS.filter((field) => !hasValue(student[field.key])).map(
    (field) => field.label
  );
  const completion = toPercent(PROFILE_FIELDS.length - missingFields.length, PROFILE_FIELDS.length);

  return {
    profilExiste: Boolean(student.profile_id),
    status: missingFields.length === 0 ? "Complet" : "Incomplet",
    completion,
    missingFields,
  };
}

function buildApplicationsSummary(applications) {
  const normalizedApplications = applications.map((application) => ({
    ...application,
    statut: normalizeStatus(application.statut),
  }));
  const latest = normalizedApplications[0] || null;

  return {
    total: normalizedApplications.length,
    pending: normalizedApplications.filter((application) => application.statut === "En attente")
      .length,
    accepted: normalizedApplications.filter((application) => application.statut === "Acceptée")
      .length,
    rejected: normalizedApplications.filter((application) => application.statut === "Refusée")
      .length,
    latest,
  };
}

function buildDocumentsSummary(documents) {
  const normalizedDocuments = documents.map((document) => ({
    ...document,
    statut: normalizeStatus(document.statut),
  }));
  const uploadedTypes = new Set(normalizedDocuments.map((document) => document.type_document));
  const missing = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));

  return {
    total: normalizedDocuments.length,
    pending: normalizedDocuments.filter((document) => document.statut === "En attente").length,
    validated: normalizedDocuments.filter((document) => document.statut === "Validé").length,
    rejected: normalizedDocuments.filter((document) => document.statut === "Refusé").length,
    missing,
    completion: toPercent(REQUIRED_DOCUMENT_TYPES.length - missing.length, REQUIRED_DOCUMENT_TYPES.length),
    requiredTotal: REQUIRED_DOCUMENT_TYPES.length,
    items: normalizedDocuments,
  };
}

function buildGlobalStatus(profile, applications, documents) {
  if (profile.status !== "Complet") {
    return "Profil à compléter";
  }

  if (documents.completion < 100) {
    return "Documents à compléter";
  }

  if (applications.total === 0) {
    return "Aucune candidature";
  }

  if (applications.latest?.statut === "Acceptée") {
    return "Candidature acceptée";
  }

  if (applications.latest?.statut === "En attente") {
    return "Candidature en attente";
  }

  return "Dossier complet";
}

function buildRecentActivity(applications, documents) {
  const applicationActivities = applications.map((application) => ({
    type: "application",
    title:
      normalizeStatus(application.statut) === "En attente"
        ? "Candidature déposée"
        : `Candidature ${normalizeStatus(application.statut).toLowerCase()}`,
    description: `Votre candidature en ${application.formation || "formation"} a ete mise a jour.`,
    date: application.date_depot,
    status: normalizeStatus(application.statut),
  }));

  const documentActivities = documents.map((document) => ({
    type: "document",
    title: "Document ajouté",
    description: `${document.type_document || "Document"} depose: ${document.nom_fichier}.`,
    date: document.date_upload,
    status: normalizeStatus(document.statut),
  }));

  return [...applicationActivities, ...documentActivities]
    .filter((activity) => activity.date)
    .sort((first, second) => new Date(second.date) - new Date(first.date))
    .slice(0, 5);
}

export async function getStudentDashboard(request, response, next) {
  try {
    const { student, applications, documents } = await findStudentDashboardData(request.user.id);

    if (!student) {
      response.status(404).json({
        success: false,
        message: "Etudiant introuvable.",
      });
      return;
    }

    const profileSummary = buildProfileSummary(student);
    const applicationsSummary = buildApplicationsSummary(applications);
    const documentsSummary = buildDocumentsSummary(documents);

    response.json({
      success: true,
      user: {
        id: student.id,
        nom: student.nom,
        prenom: student.prenom,
        email: student.email,
        role: student.role,
      },
      profile: profileSummary,
      applications: applicationsSummary,
      documents: documentsSummary,
      globalStatus: buildGlobalStatus(profileSummary, applicationsSummary, documentsSummary),
      recentActivity: buildRecentActivity(applications, documents),
    });
  } catch (error) {
    next(error);
  }
}
