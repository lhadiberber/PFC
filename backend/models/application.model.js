import { pool } from "../config/db.js";

export async function findApplicationsByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function findApplicationById(id) {
  const [rows] = await pool.execute("SELECT * FROM applications WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

export async function createApplication(userId, application) {
  const {
    universite = "",
    specialite = "",
    niveauDemande = "",
    statut = "En attente",
  } = application;

  const [result] = await pool.execute(
    `INSERT INTO applications
      (user_id, universite, specialite, niveau_demande, statut)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, universite, specialite, niveauDemande, statut]
  );

  return findApplicationById(result.insertId);
}
