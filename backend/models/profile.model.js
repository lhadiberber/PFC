import { pool } from "../config/db.js";

export async function findProfileByUserId(userId) {
  const [rows] = await pool.execute("SELECT * FROM profiles WHERE user_id = ? LIMIT 1", [
    userId,
  ]);
  return rows[0] || null;
}

export async function upsertProfile(userId, profile) {
  const {
    nom = "",
    prenom = "",
    dateNaiss = null,
    lieuNaiss = "",
    sexe = "",
    nationalite = "",
    telephone = "",
    pays = "",
    adresse = "",
  } = profile;

  await pool.execute(
    `INSERT INTO profiles
      (user_id, nom, prenom, date_naiss, lieu_naiss, sexe, nationalite, telephone, pays, adresse)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      nom = VALUES(nom),
      prenom = VALUES(prenom),
      date_naiss = VALUES(date_naiss),
      lieu_naiss = VALUES(lieu_naiss),
      sexe = VALUES(sexe),
      nationalite = VALUES(nationalite),
      telephone = VALUES(telephone),
      pays = VALUES(pays),
      adresse = VALUES(adresse)`,
    [userId, nom, prenom, dateNaiss || null, lieuNaiss, sexe, nationalite, telephone, pays, adresse]
  );

  return findProfileByUserId(userId);
}
