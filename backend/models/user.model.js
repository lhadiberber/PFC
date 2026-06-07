import { pool } from "../config/db.js";

const PUBLIC_USER_FIELDS =
  "id, nom, prenom, email, role, is_active, university_scope, assigned_department, created_at";
const ALLOWED_ROLES = new Set(["student", "admin", "super_admin"]);
const USER_ROLE_SQL = "ENUM('student', 'admin', 'super_admin')";

async function ensureUserTableShape() {
  await pool.execute(`ALTER TABLE users MODIFY role ${USER_ROLE_SQL} NOT NULL DEFAULT 'student'`);

  const [columns] = await pool.execute("SHOW COLUMNS FROM users LIKE 'is_active'");

  if (columns.length === 0) {
    await pool.execute("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role");
  }

  const [universityScopeColumns] = await pool.execute("SHOW COLUMNS FROM users LIKE 'university_scope'");

  if (universityScopeColumns.length === 0) {
    await pool.execute("ALTER TABLE users ADD COLUMN university_scope VARCHAR(160) NULL AFTER is_active");
  }

  const [assignedDepartmentColumns] = await pool.execute("SHOW COLUMNS FROM users LIKE 'assigned_department'");

  if (assignedDepartmentColumns.length === 0) {
    await pool.execute(
      "ALTER TABLE users ADD COLUMN assigned_department VARCHAR(160) NULL AFTER university_scope"
    );
  }
}

export async function ensureUsersTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(190) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ${USER_ROLE_SQL} NOT NULL DEFAULT 'student',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      university_scope VARCHAR(160) NULL,
      assigned_department VARCHAR(160) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureUserTableShape();
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

export async function findUserByBacRegistrationNumber(registrationNumber) {
  const normalizedRegistrationNumber = String(registrationNumber || "").trim();

  if (!normalizedRegistrationNumber) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT u.*
     FROM users u
     INNER JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.role = 'student'
       AND sp.numero_inscription_bac = ?
     LIMIT 1`,
    [normalizedRegistrationNumber]
  );

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
  const [insertResult] = await pool.execute(
    "INSERT INTO users (nom, prenom, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [String(nom || "").trim(), String(prenom || "").trim(), normalizeEmail(email), passwordHash, safeRole]
  );

  return findUserById(insertResult.insertId);
}
