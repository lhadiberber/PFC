import { pool } from "../config/db.js";

export async function getAdminOverview(_request, response, next) {
  try {
    const [[stats]] = await pool.execute(`
      SELECT
        COUNT(*) AS totalCandidatures,
        SUM(statut = 'En attente') AS enAttente,
        SUM(statut = 'Acceptee') AS acceptees,
        SUM(statut = 'Rejetee') AS rejetees
      FROM applications
    `);

    response.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}
