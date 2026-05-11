import { pool } from "../config/db.js";

export async function findDocumentsByApplicationId(applicationId) {
  const [rows] = await pool.execute(
    "SELECT * FROM documents WHERE application_id = ? ORDER BY created_at DESC",
    [applicationId]
  );
  return rows;
}

export async function createDocument(applicationId, document) {
  const { type, originalName, fileName, path, mimeType, size } = document;
  const [result] = await pool.execute(
    `INSERT INTO documents
      (application_id, type, original_name, file_name, path, mime_type, size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [applicationId, type, originalName, fileName, path, mimeType, size]
  );

  const [rows] = await pool.execute("SELECT * FROM documents WHERE id = ? LIMIT 1", [
    result.insertId,
  ]);
  return rows[0] || null;
}
