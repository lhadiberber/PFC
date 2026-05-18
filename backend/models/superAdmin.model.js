import { pool } from "../config/db.js";
import { normalizeEmail } from "./user.model.js";

const ADMIN_FIELDS = "id, nom, prenom, email, role, is_active, created_at";

function normalizeAdmin(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: row.role || "admin",
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

export async function findAdmins() {
  const [rows] = await pool.execute(
    `SELECT ${ADMIN_FIELDS}
     FROM users
     WHERE role = 'admin'
     ORDER BY created_at DESC, id DESC`
  );

  return rows.map(normalizeAdmin);
}

export async function findUserForAdminManagement(id) {
  const [rows] = await pool.execute(
    `SELECT ${ADMIN_FIELDS}
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return normalizeAdmin(rows[0]);
}

export async function findUserByEmailForAdminManagement(email) {
  const [rows] = await pool.execute(
    `SELECT ${ADMIN_FIELDS}
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizeEmail(email)]
  );

  return normalizeAdmin(rows[0]);
}

export async function createAdmin({ nom, prenom, email, passwordHash }) {
  const [insertResult] = await pool.execute(
    `INSERT INTO users (nom, prenom, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 'admin', 1)`,
    [
      String(nom || "").trim(),
      String(prenom || "").trim(),
      normalizeEmail(email),
      passwordHash,
    ]
  );

  return findUserForAdminManagement(insertResult.insertId);
}

export async function updateAdminStatus(id, isActive) {
  const [updateResult] = await pool.execute(
    "UPDATE users SET is_active = ? WHERE id = ? AND role = 'admin'",
    [isActive ? 1 : 0, id]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findUserForAdminManagement(id);
}

export async function updateAdminInfo(id, { nom, prenom, email }) {
  const [updateResult] = await pool.execute(
    `UPDATE users
     SET nom = ?, prenom = ?, email = ?
     WHERE id = ? AND role = 'admin'`,
    [
      String(nom || "").trim(),
      String(prenom || "").trim(),
      normalizeEmail(email),
      id,
    ]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findUserForAdminManagement(id);
}
