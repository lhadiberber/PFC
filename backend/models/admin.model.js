import { pool } from "../config/db.js";

const APPLICATION_FIELDS = `
  a.id,
  a.student_id,
  a.domaine,
  a.filiere,
  a.faculte_institut,
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
  sp.moyenne,
  sp.serie_bac,
  sp.moyenne_bac
`;

const DOCUMENT_FIELDS = `
  d.id,
  d.student_id,
  d.application_id,
  d.type_document,
  d.nom_fichier,
  d.chemin_fichier,
  d.statut,
  d.commentaire_admin,
  d.date_upload,
  u.nom,
  u.prenom
`;

const ADMIN_DOCUMENT_FIELDS = `
  d.id,
  d.student_id,
  d.application_id,
  d.type_document,
  d.nom_fichier,
  d.chemin_fichier,
  d.statut,
  d.commentaire_admin,
  d.date_upload,
  u.nom,
  u.prenom,
  u.email,
  a.universite,
  a.domaine,
  a.filiere,
  a.faculte_institut,
  a.formation,
  a.niveau,
  a.statut AS application_statut,
  a.date_depot
`;

const USER_FIELDS = `
  id,
  nom,
  prenom,
  email,
  role,
  created_at
`;

const STUDENT_PROFILE_FIELDS = `
  u.id,
  u.nom,
  u.prenom,
  u.email,
  u.role,
  u.created_at,
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

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function normalizeScopeValue(value) {
  return String(value || "").trim();
}

function normalizePositiveIntegerId(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function buildAdminScopeFilter(user, alias = "a") {
  if (!user || user.role === "super_admin") {
    return { sql: "", params: [] };
  }

  if (user.role !== "admin") {
    return { sql: " AND 1 = 0", params: [] };
  }

  const universityScope = normalizeScopeValue(user.university_scope);

  if (!universityScope) {
    return { sql: " AND 1 = 0", params: [] };
  }

  const departmentScope = normalizeScopeValue(user.assigned_department);
  const params = [universityScope];
  let sql = ` AND LOWER(TRIM(${alias}.universite)) = LOWER(TRIM(?))`;

  if (departmentScope) {
    sql += ` AND (
      LOWER(TRIM(${alias}.faculte_institut)) = LOWER(TRIM(?))
      OR LOWER(TRIM(${alias}.domaine)) = LOWER(TRIM(?))
      OR LOWER(TRIM(${alias}.filiere)) = LOWER(TRIM(?))
      OR LOWER(TRIM(${alias}.formation)) = LOWER(TRIM(?))
    )`;
    params.push(departmentScope, departmentScope, departmentScope, departmentScope);
  }

  return { sql, params };
}

function normalizeApplication(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    student_id: row.student_id,
    domaine: row.domaine || "",
    filiere: row.filiere || row.formation || "",
    faculte_institut: row.faculte_institut || "",
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
    serie_bac: row.serie_bac || row.diplome_actuel || "",
    moyenne_bac: row.moyenne_bac ?? row.moyenne ?? "",
  };
}

function normalizeDocument(row) {
  return {
    id: row.id,
    student_id: row.student_id,
    application_id: row.application_id,
    type_document: row.type_document || "",
    nom_fichier: row.nom_fichier || "",
    chemin_fichier: row.chemin_fichier || "",
    statut: row.statut || "En attente",
    commentaire_admin: row.commentaire_admin || "",
    date_upload: row.date_upload,
    nom: row.nom || "",
    prenom: row.prenom || "",
  };
}

function normalizeAdminDocument(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    student_id: row.student_id,
    application_id: row.application_id,
    type_document: row.type_document || "",
    nom_fichier: row.nom_fichier || "",
    chemin_fichier: row.chemin_fichier || "",
    statut: row.statut || "En attente",
    commentaire_admin: row.commentaire_admin || "",
    date_upload: row.date_upload,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    universite: row.universite || "",
    formation: row.formation || "",
    niveau: row.niveau || "",
    application_statut: row.application_statut || "",
    date_depot: row.date_depot || null,
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
    created_at: row.created_at,
    telephone: row.telephone || "",
    date_naissance: formatDateOnly(row.date_naissance),
    nationalite: row.nationalite || "",
    adresse: row.adresse || "",
    diplome_actuel: row.diplome_actuel || "",
    etablissement: row.etablissement || "",
    specialite_actuelle: row.specialite_actuelle || "",
    annee_obtention: row.annee_obtention || "",
    moyenne: row.moyenne ?? "",
    candidatures_count: Number(row.candidatures_count || 0),
    latest_status: row.latest_status || "",
    latest_universite: row.latest_universite || "",
    latest_formation: row.latest_formation || "",
    latest_date_depot: row.latest_date_depot || null,
  };
}

export async function findAdminDashboardData(user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const [[applicationsRows], [documentsRows], [studentRows]] = await Promise.all([
    pool.execute(
      `SELECT ${APPLICATION_FIELDS}
       FROM applications a
       INNER JOIN users u ON u.id = a.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE 1 = 1${scopeFilter.sql}
       ORDER BY a.date_depot DESC, a.id DESC`,
      scopeFilter.params
    ),
    pool.execute(
      `SELECT ${DOCUMENT_FIELDS}
       FROM documents d
       INNER JOIN users u ON u.id = d.student_id
       LEFT JOIN applications a ON a.id = d.application_id
       WHERE 1 = 1${scopeFilter.sql}
       ORDER BY d.date_upload DESC, d.id DESC`,
      scopeFilter.params
    ),
    pool.execute(
      `SELECT DISTINCT
         u.id,
         u.nom,
         u.prenom,
         u.email,
         u.role,
         u.created_at
       FROM users u
       ${
         user?.role === "super_admin"
           ? ""
           : "INNER JOIN applications a ON a.student_id = u.id"
       }
       WHERE u.role = 'student'${scopeFilter.sql}
       ORDER BY u.created_at DESC, u.id DESC`,
      scopeFilter.params
    ),
  ]);

  return {
    applications: applicationsRows.map(normalizeApplication),
    documents: documentsRows.map(normalizeDocument),
    students: studentRows.map(normalizeUser),
  };
}

export async function findAdminApplications(user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT ${APPLICATION_FIELDS}
     FROM applications a
     INNER JOIN users u ON u.id = a.student_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE 1 = 1${scopeFilter.sql}
     ORDER BY a.date_depot DESC, a.id DESC`
    ,
    scopeFilter.params
  );

  return rows.map(normalizeApplication);
}

export async function findAdminApplicationById(id, user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const [applicationRows] = await pool.execute(
    `SELECT ${APPLICATION_FIELDS}
     FROM applications a
     INNER JOIN users u ON u.id = a.student_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE a.id = ?${scopeFilter.sql}
     LIMIT 1`,
    [id, ...scopeFilter.params]
  );
  const application = normalizeApplication(applicationRows[0]);

  if (!application) {
    return null;
  }

  const [documentRows] = await pool.execute(
    `SELECT ${DOCUMENT_FIELDS}
     FROM documents d
     INNER JOIN users u ON u.id = d.student_id
     WHERE d.student_id = ? AND (d.application_id = ? OR d.application_id IS NULL)
     ORDER BY d.date_upload DESC, d.id DESC`,
    [application.student_id, application.id]
  );

  return {
    application,
    documents: documentRows.map(normalizeDocument),
  };
}

export async function updateAdminApplicationStatus(id, statut, commentaireAdmin, user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const values = [statut];
  let commentSql = "";

  if (commentaireAdmin !== undefined) {
    commentSql = ", a.commentaire_admin = ?";
    values.push(String(commentaireAdmin || "").trim() || null);
  }

  values.push(id, ...scopeFilter.params);

  const [updateResult] = await pool.execute(
    `UPDATE applications a
     SET a.statut = ?${commentSql}
     WHERE a.id = ?${scopeFilter.sql}`,
    values
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findAdminApplicationById(id, user);
}

export async function findAdminDocuments(user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT ${ADMIN_DOCUMENT_FIELDS}
     FROM documents d
     INNER JOIN users u ON u.id = d.student_id
     LEFT JOIN applications a ON a.id = d.application_id
     WHERE 1 = 1${scopeFilter.sql}
     ORDER BY d.date_upload DESC, d.id DESC`
    ,
    scopeFilter.params
  );

  return rows.map(normalizeAdminDocument);
}

export async function findAdminDocumentById(id, user) {
  const documentId = normalizePositiveIntegerId(id);

  if (!documentId) {
    return null;
  }

  const scopeFilter = buildAdminScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT ${ADMIN_DOCUMENT_FIELDS}
     FROM documents d
     INNER JOIN users u ON u.id = d.student_id
     LEFT JOIN applications a ON a.id = d.application_id
     WHERE d.id = ?${scopeFilter.sql}
     LIMIT 1`,
    [documentId, ...scopeFilter.params]
  );

  return normalizeAdminDocument(rows[0]);
}

export async function updateAdminDocumentStatus(id, statut, commentaireAdmin, user) {
  const documentId = normalizePositiveIntegerId(id);

  if (!documentId) {
    return null;
  }

  const scopeFilter = buildAdminScopeFilter(user);
  const values = [statut];
  let commentSql = "";

  if (commentaireAdmin !== undefined) {
    commentSql = ", d.commentaire_admin = ?";
    values.push(String(commentaireAdmin || "").trim() || null);
  }

  values.push(documentId, ...scopeFilter.params);

  const [updateResult] = await pool.execute(
    `UPDATE documents d
     LEFT JOIN applications a ON a.id = d.application_id
     SET d.statut = ?${commentSql}
     WHERE d.id = ?${scopeFilter.sql}`,
    values
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findAdminDocumentById(documentId, user);
}

export async function findAdminStudents(user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT
       ${STUDENT_PROFILE_FIELDS},
       COUNT(a.id) AS candidatures_count,
       latest.statut AS latest_status,
       latest.universite AS latest_universite,
       latest.formation AS latest_formation,
       latest.date_depot AS latest_date_depot
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN applications a ON a.student_id = u.id
     LEFT JOIN (
       SELECT a1.*
       FROM applications a1
       INNER JOIN (
         SELECT student_id, MAX(date_depot) AS latest_date
         FROM applications
         GROUP BY student_id
       ) a2 ON a2.student_id = a1.student_id AND a2.latest_date = a1.date_depot
     ) latest ON latest.student_id = u.id
     WHERE u.role = 'student'${scopeFilter.sql}
     GROUP BY u.id, sp.id, latest.id
     ORDER BY u.created_at DESC, u.id DESC`,
    scopeFilter.params
  );

  return rows.map(normalizeStudent);
}

export async function findAdminStudentById(id, user) {
  const [studentRows] = await pool.execute(
    `SELECT ${STUDENT_PROFILE_FIELDS}
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.id = ? AND u.role = 'student'
     LIMIT 1`,
    [id]
  );
  const student = normalizeStudent(studentRows[0]);

  if (!student) {
    return null;
  }

  const scopeFilter = buildAdminScopeFilter(user);
  const [applicationRows] = await pool.execute(
    `SELECT ${APPLICATION_FIELDS}
     FROM applications a
     INNER JOIN users u ON u.id = a.student_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE a.student_id = ?${scopeFilter.sql}
     ORDER BY a.date_depot DESC, a.id DESC`,
    [id, ...scopeFilter.params]
  );

  if (user?.role === "admin" && applicationRows.length === 0) {
    return null;
  }

  const [documentRows] = await pool.execute(
    `SELECT ${DOCUMENT_FIELDS}
     FROM documents d
     INNER JOIN users u ON u.id = d.student_id
     LEFT JOIN applications a ON a.id = d.application_id
     WHERE d.student_id = ?${scopeFilter.sql}
     ORDER BY d.date_upload DESC, d.id DESC`,
    [id, ...scopeFilter.params]
  );

  return {
    student,
    applications: applicationRows.map(normalizeApplication),
    documents: documentRows.map(normalizeDocument),
  };
}

export async function findAdminOverviewStats(user) {
  const scopeFilter = buildAdminScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS totalCandidatures,
       SUM(statut = 'En attente') AS enAttente,
       SUM(statut IN ('Acceptée', 'Acceptee')) AS acceptees,
       SUM(statut IN ('Refusée', 'Refusee', 'Rejetee')) AS rejetees
     FROM applications a
     WHERE 1 = 1${scopeFilter.sql}`,
    scopeFilter.params
  );

  return rows[0] || {};
}
