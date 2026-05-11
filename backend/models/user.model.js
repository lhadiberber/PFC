import { pool } from "../config/db.js";

const PUBLIC_USER_FIELDS = "id, nom, prenom, email, role, created_at";
const ALLOWED_ROLES = new Set(["student", "admin"]);

export async function ensureUsersTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(190) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function findUserByEmail(email) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [
    normalizeEmail(email),
  ]);

  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ? LIMIT 1`, [
    id,
  ]);

  return rows[0] || null;
}

export async function createUser({ nom, prenom, email, passwordHash, role = "student" }) {
  const safeRole = ALLOWED_ROLES.has(role) ? role : "student";
  const [result] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [String(nom || "").trim(), String(prenom || "").trim(), normalizeEmail(email), passwordHash, safeRole]
  );

  return findUserById(result.insertId);
}
