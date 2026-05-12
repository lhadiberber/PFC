import { pool } from "../config/db.js";

const APPLICATION_FIELDS = `
  id,
  student_id,
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
    universite: row.universite || "",
    formation: row.formation || "",
    niveau: row.niveau || "",
    motivation: row.motivation || "",
    statut: row.statut || "En attente",
    date_depot: row.date_depot,
    commentaire_admin: row.commentaire_admin || "",
  };
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

  await assertApplicationsTableShape();
}

export async function createApplication(studentId, application) {
  const [result] = await pool.execute(
    `INSERT INTO applications (student_id, universite, formation, niveau, motivation)
     VALUES (?, ?, ?, ?, ?)`,
    [
      studentId,
      normalizeText(application.universite),
      normalizeText(application.formation),
      normalizeText(application.niveau),
      normalizeText(application.motivation),
    ]
  );

  return findApplicationByIdForStudent(result.insertId, studentId);
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
