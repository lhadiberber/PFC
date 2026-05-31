import { pool } from "../config/db.js";

const APPLICATION_FIELDS = `
  id,
  student_id,
  domaine,
  filiere,
  annee_universitaire,
  etablissement,
  faculte_institut,
  wilaya_etablissement,
  type_etablissement,
  universite,
  formation,
  niveau,
  motivation,
  statut,
  date_depot,
  commentaire_admin
`;

const REQUIRED_APPLICATION_COLUMNS = new Set([
  "id",
  "student_id",
  "domaine",
  "filiere",
  "annee_universitaire",
  "etablissement",
  "faculte_institut",
  "wilaya_etablissement",
  "type_etablissement",
  "universite",
  "formation",
  "niveau",
  "motivation",
  "statut",
  "date_depot",
  "commentaire_admin",
]);

function normalizeText(value) {
  return String(value || "").trim();
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
    annee_universitaire: row.annee_universitaire || "",
    etablissement: row.etablissement || row.universite || "",
    faculte_institut: row.faculte_institut || "",
    wilaya_etablissement: row.wilaya_etablissement || "",
    type_etablissement: row.type_etablissement || "",
    universite: row.universite || "",
    formation: row.formation || "",
    niveau: row.niveau || "",
    motivation: row.motivation || "",
    statut: row.statut || "En attente",
    date_depot: row.date_depot,
    commentaire_admin: row.commentaire_admin || "",
  };
}

async function ensureApplicationColumn(name, definition) {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'applications'
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [name]
  );

  if (columns.length === 0) {
    await pool.execute(`ALTER TABLE applications ADD COLUMN ${name} ${definition}`);
  }
}

async function assertApplicationsTableShape() {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications'`
  );

  const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));
  const missingColumns = [...REQUIRED_APPLICATION_COLUMNS].filter(
    (column) => !columnNames.has(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Table applications incomplete. Colonnes manquantes: ${missingColumns.join(", ")}.`
    );
  }
}

export async function ensureApplicationsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      student_id INT UNSIGNED NOT NULL,
      domaine VARCHAR(160) NULL,
      filiere VARCHAR(160) NULL,
      annee_universitaire VARCHAR(20) NULL,
      etablissement VARCHAR(160) NULL,
      faculte_institut VARCHAR(180) NULL,
      wilaya_etablissement VARCHAR(120) NULL,
      type_etablissement VARCHAR(120) NULL,
      universite VARCHAR(160) NOT NULL,
      formation VARCHAR(160) NOT NULL,
      niveau VARCHAR(80) NOT NULL,
      motivation TEXT NOT NULL,
      statut ENUM('En attente', 'Acceptée', 'Refusée') NOT NULL DEFAULT 'En attente',
      date_depot TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      commentaire_admin TEXT NULL,
      PRIMARY KEY (id),
      INDEX applications_student_id_index (student_id),
      CONSTRAINT applications_student_id_fk
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureApplicationColumn("domaine", "VARCHAR(160) NULL AFTER student_id");
  await ensureApplicationColumn("filiere", "VARCHAR(160) NULL AFTER domaine");
  await ensureApplicationColumn("annee_universitaire", "VARCHAR(20) NULL AFTER filiere");
  await ensureApplicationColumn("etablissement", "VARCHAR(160) NULL AFTER annee_universitaire");
  await ensureApplicationColumn("faculte_institut", "VARCHAR(180) NULL AFTER etablissement");
  await ensureApplicationColumn("wilaya_etablissement", "VARCHAR(120) NULL AFTER faculte_institut");
  await ensureApplicationColumn("type_etablissement", "VARCHAR(120) NULL AFTER wilaya_etablissement");
  await assertApplicationsTableShape();
}

export async function createApplication(studentId, application) {
  const etablissement = normalizeText(application.etablissement || application.universite);
  const filiere = normalizeText(application.filiere || application.formation);
  const niveau = normalizeText(application.niveau) || "Première année universitaire";
  const motivation =
    normalizeText(application.motivation) || "Candidature en première année universitaire.";

  const [insertResult] = await pool.execute(
    `INSERT INTO applications (
       student_id,
       domaine,
       filiere,
       annee_universitaire,
       etablissement,
       faculte_institut,
       wilaya_etablissement,
       type_etablissement,
       universite,
       formation,
       niveau,
       motivation
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      normalizeText(application.domaine),
      filiere,
      normalizeText(application.annee_universitaire),
      etablissement,
      normalizeText(application.faculte_institut),
      normalizeText(application.wilaya_etablissement),
      normalizeText(application.type_etablissement),
      etablissement,
      filiere,
      niveau,
      motivation,
    ]
  );

  return findApplicationByIdForStudent(insertResult.insertId, studentId);
}

export async function findApplicationsByStudentId(studentId) {
  const [rows] = await pool.execute(
    `SELECT ${APPLICATION_FIELDS}
     FROM applications
     WHERE student_id = ?
     ORDER BY date_depot DESC, id DESC`,
    [studentId]
  );

  return rows.map(normalizeApplication);
}

export async function findApplicationByIdForStudent(id, studentId) {
  const [rows] = await pool.execute(
    `SELECT ${APPLICATION_FIELDS}
     FROM applications
     WHERE id = ? AND student_id = ?
     LIMIT 1`,
    [id, studentId]
  );

  return normalizeApplication(rows[0]);
}
