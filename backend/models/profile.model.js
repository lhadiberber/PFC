import { pool } from "../config/db.js";

const PROFILE_FIELDS = `
  sp.id AS profile_id,
  u.id AS user_id,
  u.nom,
  u.prenom,
  u.email,
  u.role,
  u.created_at AS user_created_at,
  sp.telephone,
  sp.date_naissance,
  sp.nationalite,
  sp.adresse,
  sp.diplome_actuel,
  sp.etablissement,
  sp.specialite_actuelle,
  sp.annee_obtention,
  sp.moyenne
`;

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNullableText(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue || null;
}

function normalizeDate(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue || null;
}

function normalizeYear(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue ? Number(normalizedValue) : null;
}

function normalizeAverage(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue ? Number(normalizedValue) : null;
}

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function buildProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.profile_id || null,
    user_id: row.user_id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    email: row.email || "",
    role: row.role || "student",
    telephone: row.telephone || "",
    date_naissance: formatDateOnly(row.date_naissance),
    nationalite: row.nationalite || "",
    adresse: row.adresse || "",
    diplome_actuel: row.diplome_actuel || "",
    etablissement: row.etablissement || "",
    specialite_actuelle: row.specialite_actuelle || "",
    annee_obtention: row.annee_obtention || "",
    moyenne: row.moyenne ?? "",
    created_at: row.user_created_at,
  };
}

export async function ensureStudentProfilesTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      telephone VARCHAR(30) NULL,
      date_naissance DATE NULL,
      nationalite VARCHAR(100) NULL,
      adresse VARCHAR(255) NULL,
      diplome_actuel VARCHAR(120) NULL,
      etablissement VARCHAR(160) NULL,
      specialite_actuelle VARCHAR(160) NULL,
      annee_obtention SMALLINT UNSIGNED NULL,
      moyenne DECIMAL(5,2) NULL,
      PRIMARY KEY (id),
      UNIQUE KEY student_profiles_user_id_unique (user_id),
      CONSTRAINT student_profiles_user_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function findStudentProfileByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT ${PROFILE_FIELDS}
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );

  return buildProfile(rows[0]);
}

export async function upsertStudentProfile(userId, profile) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE users
       SET nom = ?, prenom = ?, email = ?
       WHERE id = ? AND role = 'student'`,
      [normalizeText(profile.nom), normalizeText(profile.prenom), normalizeText(profile.email), userId]
    );

    await connection.execute(
      `INSERT INTO student_profiles (
        user_id,
        telephone,
        date_naissance,
        nationalite,
        adresse,
        diplome_actuel,
        etablissement,
        specialite_actuelle,
        annee_obtention,
        moyenne
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        telephone = VALUES(telephone),
        date_naissance = VALUES(date_naissance),
        nationalite = VALUES(nationalite),
        adresse = VALUES(adresse),
        diplome_actuel = VALUES(diplome_actuel),
        etablissement = VALUES(etablissement),
        specialite_actuelle = VALUES(specialite_actuelle),
        annee_obtention = VALUES(annee_obtention),
        moyenne = VALUES(moyenne)`,
      [
        userId,
        normalizeNullableText(profile.telephone),
        normalizeDate(profile.date_naissance),
        normalizeNullableText(profile.nationalite),
        normalizeNullableText(profile.adresse),
        normalizeNullableText(profile.diplome_actuel),
        normalizeNullableText(profile.etablissement),
        normalizeNullableText(profile.specialite_actuelle),
        normalizeYear(profile.annee_obtention),
        normalizeAverage(profile.moyenne),
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findStudentProfileByUserId(userId);
}
