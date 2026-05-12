import { pool } from "../config/db.js";

const APPLICATION_FIELDS = `
  a.id,
  a.student_id,
  a.universite,
  a.formation,
  a.niveau,
  a.motivation,
  a.statut,
  a.date_depot,
  a.commentaire_admin,
  u.nom,
  u.prenom,
  u.email,
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

const DOCUMENT_FIELDS = `
  d.id,
  d.student_id,
  d.application_id,
  d.type_document,
  d.nom_fichier,
  d.statut,
  d.date_upload,
  u.nom,
  u.prenom
`;

const USER_FIELDS = `
  id,
  nom,
  prenom,
  email,
  role,
  created_at
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

function normalizeApplication(row) {
  return {
    id: row.id,
    student_id: row.student_id,
    universite: row.universite || "",
    formation: row.formation || "",
    niveau: row.niveau || "",
    motivation: row.motivation || "",
    statut: row.statut || "En attente",
    date_depot: row.date_depot,
    commentaire_admin: row.commentaire_admin || "",
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
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

function normalizeDocument(row) {
  return {
    id: row.id,
    student_id: row.student_id,
    application_id: row.application_id,
    type_document: row.type_document || "",
    nom_fichier: row.nom_fichier || "",
    statut: row.statut || "En attente",
    date_upload: row.date_upload,
    nom: row.nom || "",
    prenom: row.prenom || "",
  };
}

function normalizeUser(row) {
  return {
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: row.role || "student",
    created_at: row.created_at,
  };
}

export async function findAdminDashboardData() {
  const [[applicationsRows], [documentsRows], [studentRows]] = await Promise.all([
    pool.execute(
      `SELECT ${APPLICATION_FIELDS}
       FROM applications a
       INNER JOIN users u ON u.id = a.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       ORDER BY a.date_depot DESC, a.id DESC`
    ),
    pool.execute(
      `SELECT ${DOCUMENT_FIELDS}
       FROM documents d
       INNER JOIN users u ON u.id = d.student_id
       ORDER BY d.date_upload DESC, d.id DESC`
    ),
    pool.execute(
      `SELECT ${USER_FIELDS}
       FROM users
       WHERE role = 'student'
       ORDER BY created_at DESC, id DESC`
    ),
  ]);

  return {
    applications: applicationsRows.map(normalizeApplication),
    documents: documentsRows.map(normalizeDocument),
    students: studentRows.map(normalizeUser),
  };
}
