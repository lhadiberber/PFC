import { pool } from "../config/db.js";

const PROFILE_FIELDS = `
  u.id,
  u.nom,
  u.prenom,
  u.email,
  u.role,
  sp.id AS profile_id,
  sp.telephone,
  sp.date_naissance,
  sp.nationalite,
  sp.adresse,
  sp.diplome_actuel,
  sp.etablissement,
  sp.specialite_actuelle,
  sp.annee_obtention,
  sp.moyenne
`;

const APPLICATION_FIELDS = `
  id,
  universite,
  formation,
  niveau,
  statut,
  date_depot,
  commentaire_admin
`;

const DOCUMENT_FIELDS = `
  id,
  application_id,
  type_document,
  nom_fichier,
  statut,
  date_upload
`;

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function normalizeStudent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: row.role || "student",
    profile_id: row.profile_id || null,
    telephone: row.telephone || "",
    date_naissance: formatDateOnly(row.date_naissance),
    nationalite: row.nationalite || "",
    adresse: row.adresse || "",
    diplome_actuel: row.diplome_actuel || "",
    etablissement: row.etablissement || "",
    specialite_actuelle: row.specialite_actuelle || "",
    annee_obtention: row.annee_obtention || "",
    moyenne: row.moyenne ?? "",
  };
}

function normalizeApplication(row) {
  return {
    id: row.id,
    universite: row.universite || "",
    formation: row.formation || "",
    niveau: row.niveau || "",
    statut: row.statut || "En attente",
    date_depot: row.date_depot,
    commentaire_admin: row.commentaire_admin || "",
  };
}

function normalizeDocument(row) {
  return {
    id: row.id,
    application_id: row.application_id,
    type_document: row.type_document || "",
    nom_fichier: row.nom_fichier || "",
    statut: row.statut || "En attente",
    date_upload: row.date_upload,
  };
}

export async function findStudentDashboardData(studentId) {
  const [[studentRow], [applicationRows], [documentRows]] = await Promise.all([
    pool.execute(
      `SELECT ${PROFILE_FIELDS}
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = ? AND u.role = 'student'
       LIMIT 1`,
      [studentId]
    ),
    pool.execute(
      `SELECT ${APPLICATION_FIELDS}
       FROM applications
       WHERE student_id = ?
       ORDER BY date_depot DESC, id DESC`,
      [studentId]
    ),
    pool.execute(
      `SELECT ${DOCUMENT_FIELDS}
       FROM documents
       WHERE student_id = ?
       ORDER BY date_upload DESC, id DESC`,
      [studentId]
    ),
  ]);

  return {
    student: normalizeStudent(studentRow[0]),
    applications: applicationRows.map(normalizeApplication),
    documents: documentRows.map(normalizeDocument),
  };
}
