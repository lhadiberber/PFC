import { pool } from "../config/db.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ email, passwordHash, role = "student" }) {
  const [result] = await pool.execute(
    "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
    [email, passwordHash, role]
  );

  return findUserById(result.insertId);
}
