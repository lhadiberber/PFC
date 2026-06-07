import { pool } from "../config/db.js";
import { normalizeEmail } from "./user.model.js";

const ADMIN_FIELDS =
  "id, nom, prenom, email, role, is_active, university_scope, assigned_department, created_at";
const USER_FIELDS =
  "id, nom, prenom, email, role, is_active, university_scope, assigned_department, created_at";

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
    university_scope: row.university_scope || "",
    assigned_department: row.assigned_department || "",
    created_at: row.created_at,
  };
}

function normalizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: row.role || "student",
    is_active: Boolean(row.is_active),
    university_scope: row.university_scope || "",
    assigned_department: row.assigned_department || "",
    created_at: row.created_at,
  };
}

async function countQuery(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return Number(rows[0]?.total || 0);
}

export async function getSuperAdminStats() {
  const [
    totalAdmins,
    adminsActifs,
    adminsDesactives,
    totalUtilisateurs,
    totalEtudiants,
    totalCandidatures,
  ] = await Promise.all([
    countQuery("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'"),
    countQuery("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1"),
    countQuery("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 0"),
    countQuery("SELECT COUNT(*) AS total FROM users"),
    countQuery("SELECT COUNT(*) AS total FROM users WHERE role = 'student'"),
    countQuery("SELECT COUNT(*) AS total FROM applications"),
  ]);

  return {
    totalAdmins,
    adminsActifs,
    adminsDesactives,
    totalUtilisateurs,
    totalEtudiants,
    totalCandidatures,
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

export async function findUsers() {
  const [rows] = await pool.execute(
    `SELECT ${USER_FIELDS}
     FROM users
     ORDER BY created_at DESC, id DESC`
  );

  return rows.map(normalizeUser);
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

export async function createAdmin({
  nom,
  prenom,
  email,
  passwordHash,
  universityScope = "",
  assignedDepartment = "",
}) {
  const [insertResult] = await pool.execute(
    `INSERT INTO users (
       nom,
       prenom,
       email,
       password_hash,
       role,
       is_active,
       university_scope,
       assigned_department
     )
     VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)`,
    [
      String(nom || "").trim(),
      String(prenom || "").trim(),
      normalizeEmail(email),
      passwordHash,
      String(universityScope || "").trim() || null,
      String(assignedDepartment || "").trim() || null,
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

export async function updateAdminInfo(id, { nom, prenom, email, universityScope = "", assignedDepartment = "" }) {
  const [updateResult] = await pool.execute(
    `UPDATE users
     SET nom = ?, prenom = ?, email = ?, university_scope = ?, assigned_department = ?
     WHERE id = ? AND role = 'admin'`,
    [
      String(nom || "").trim(),
      String(prenom || "").trim(),
      normalizeEmail(email),
      String(universityScope || "").trim() || null,
      String(assignedDepartment || "").trim() || null,
      id,
    ]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findUserForAdminManagement(id);
}

export async function updateUserRole(id, role) {
  const [updateResult] = await pool.execute(
    "UPDATE users SET role = ? WHERE id = ? AND role <> 'super_admin'",
    [role, id]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findUserForAdminManagement(id);
}

export async function updateUserStatus(id, isActive) {
  const [updateResult] = await pool.execute(
    "UPDATE users SET is_active = ? WHERE id = ? AND role <> 'super_admin'",
    [isActive ? 1 : 0, id]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findUserForAdminManagement(id);
}
