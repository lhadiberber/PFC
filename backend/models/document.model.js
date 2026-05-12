import { pool } from "../config/db.js";

const DOCUMENT_FIELDS = `
  id,
  student_id,
  application_id,
  type_document,
  nom_fichier,
  chemin_fichier,
  statut,
  date_upload
`;

const REQUIRED_DOCUMENT_COLUMNS = new Set([
  "id",
  "student_id",
  "application_id",
  "type_document",
  "nom_fichier",
  "chemin_fichier",
  "statut",
  "date_upload",
]);

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeId(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue ? Number(normalizedValue) : null;
}

function normalizeDocument(row) {
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
    date_upload: row.date_upload,
  };
}

async function assertDocumentsTableShape() {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents'`
  );

  const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));
  const missingColumns = [...REQUIRED_DOCUMENT_COLUMNS].filter(
    (column) => !columnNames.has(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(`Table documents incomplete. Colonnes manquantes: ${missingColumns.join(", ")}.`);
  }
}

export async function ensureDocumentsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      student_id INT UNSIGNED NOT NULL,
      application_id INT UNSIGNED NULL,
      type_document VARCHAR(80) NOT NULL,
      nom_fichier VARCHAR(255) NOT NULL,
      chemin_fichier VARCHAR(255) NOT NULL,
      statut ENUM('En attente', 'Validé', 'Refusé') NOT NULL DEFAULT 'En attente',
      date_upload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX documents_student_id_index (student_id),
      INDEX documents_application_id_index (application_id),
      CONSTRAINT documents_student_id_fk
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT documents_application_id_fk
        FOREIGN KEY (application_id) REFERENCES applications(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await assertDocumentsTableShape();
}

export async function applicationBelongsToStudent(applicationId, studentId) {
  if (!applicationId) {
    return true;
  }

  const [rows] = await pool.execute(
    "SELECT id FROM applications WHERE id = ? AND student_id = ? LIMIT 1",
    [applicationId, studentId]
  );

  return rows.length > 0;
}

export async function createDocument(studentId, document) {
  const applicationId = normalizeId(document.application_id);

  const [result] = await pool.execute(
    `INSERT INTO documents (
      student_id,
      application_id,
      type_document,
      nom_fichier,
      chemin_fichier
    )
    VALUES (?, ?, ?, ?, ?)`,
    [
      studentId,
      applicationId,
      normalizeText(document.type_document),
      normalizeText(document.nom_fichier),
      normalizeText(document.chemin_fichier),
    ]
  );

  return findDocumentByIdForStudent(result.insertId, studentId);
}

export async function findDocumentsByStudentId(studentId) {
  const [rows] = await pool.execute(
    `SELECT ${DOCUMENT_FIELDS}
     FROM documents
     WHERE student_id = ?
     ORDER BY date_upload DESC, id DESC`,
    [studentId]
  );

  return rows.map(normalizeDocument);
}

export async function findDocumentByIdForStudent(id, studentId) {
  const [rows] = await pool.execute(
    `SELECT ${DOCUMENT_FIELDS}
     FROM documents
     WHERE id = ? AND student_id = ?
     LIMIT 1`,
    [id, studentId]
  );

  return normalizeDocument(rows[0]);
}

export async function deleteDocumentByIdForStudent(id, studentId) {
  const document = await findDocumentByIdForStudent(id, studentId);

  if (!document) {
    return null;
  }

  await pool.execute("DELETE FROM documents WHERE id = ? AND student_id = ?", [id, studentId]);

  return document;
}
