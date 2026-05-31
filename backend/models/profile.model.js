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
  sp.lieu_naissance,
  sp.sexe,
  sp.nationalite,
  sp.adresse,
  sp.wilaya,
  sp.commune,
  sp.diplome_actuel,
  sp.etablissement,
  sp.specialite_actuelle,
  sp.annee_obtention,
  sp.moyenne,
  sp.annee_bac,
  sp.serie_bac,
  sp.moyenne_bac,
  sp.mention_bac,
  sp.numero_inscription_bac,
  sp.lycee_origine,
  sp.wilaya_lycee
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
    lieu_naissance: row.lieu_naissance || "",
    sexe: row.sexe || "",
    nationalite: row.nationalite || "",
    adresse: row.adresse || "",
    wilaya: row.wilaya || "",
    commune: row.commune || "",
    diplome_actuel: row.diplome_actuel || "",
    etablissement: row.etablissement || "",
    specialite_actuelle: row.specialite_actuelle || "",
    annee_obtention: row.annee_obtention || "",
    moyenne: row.moyenne ?? "",
    annee_bac: row.annee_bac || row.annee_obtention || "",
    serie_bac: row.serie_bac || row.diplome_actuel || "",
    moyenne_bac: row.moyenne_bac ?? row.moyenne ?? "",
    mention_bac: row.mention_bac || "",
    numero_inscription_bac: row.numero_inscription_bac || "",
    lycee_origine: row.lycee_origine || row.etablissement || "",
    wilaya_lycee: row.wilaya_lycee || "",
    created_at: row.user_created_at,
  };
}

async function ensureStudentProfileColumn(name, definition) {
  const [columns] = await pool.execute(`SHOW COLUMNS FROM student_profiles LIKE ?`, [name]);

  if (columns.length === 0) {
    await pool.execute(`ALTER TABLE student_profiles ADD COLUMN ${name} ${definition}`);
  }
}

export async function ensureStudentProfilesTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      telephone VARCHAR(30) NULL,
      date_naissance DATE NULL,
      lieu_naissance VARCHAR(120) NULL,
      sexe VARCHAR(20) NULL,
      nationalite VARCHAR(100) NULL,
      adresse VARCHAR(255) NULL,
      wilaya VARCHAR(120) NULL,
      commune VARCHAR(120) NULL,
      diplome_actuel VARCHAR(120) NULL,
      etablissement VARCHAR(160) NULL,
      specialite_actuelle VARCHAR(160) NULL,
      annee_obtention SMALLINT UNSIGNED NULL,
      moyenne DECIMAL(5,2) NULL,
      annee_bac SMALLINT UNSIGNED NULL,
      serie_bac VARCHAR(120) NULL,
      moyenne_bac DECIMAL(5,2) NULL,
      mention_bac VARCHAR(60) NULL,
      numero_inscription_bac VARCHAR(80) NULL,
      lycee_origine VARCHAR(160) NULL,
      wilaya_lycee VARCHAR(120) NULL,
      PRIMARY KEY (id),
      UNIQUE KEY student_profiles_user_id_unique (user_id),
      CONSTRAINT student_profiles_user_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureStudentProfileColumn("lieu_naissance", "VARCHAR(120) NULL AFTER date_naissance");
  await ensureStudentProfileColumn("sexe", "VARCHAR(20) NULL AFTER lieu_naissance");
  await ensureStudentProfileColumn("wilaya", "VARCHAR(120) NULL AFTER adresse");
  await ensureStudentProfileColumn("commune", "VARCHAR(120) NULL AFTER wilaya");
  await ensureStudentProfileColumn("annee_bac", "SMALLINT UNSIGNED NULL AFTER moyenne");
  await ensureStudentProfileColumn("serie_bac", "VARCHAR(120) NULL AFTER annee_bac");
  await ensureStudentProfileColumn("moyenne_bac", "DECIMAL(5,2) NULL AFTER serie_bac");
  await ensureStudentProfileColumn("mention_bac", "VARCHAR(60) NULL AFTER moyenne_bac");
  await ensureStudentProfileColumn(
    "numero_inscription_bac",
    "VARCHAR(80) NULL AFTER mention_bac"
  );
  await ensureStudentProfileColumn("lycee_origine", "VARCHAR(160) NULL AFTER numero_inscription_bac");
  await ensureStudentProfileColumn("wilaya_lycee", "VARCHAR(120) NULL AFTER lycee_origine");
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
        lieu_naissance,
        sexe,
        nationalite,
        adresse,
        wilaya,
        commune,
        diplome_actuel,
        etablissement,
        specialite_actuelle,
        annee_obtention,
        moyenne,
        annee_bac,
        serie_bac,
        moyenne_bac,
        mention_bac,
        numero_inscription_bac,
        lycee_origine,
        wilaya_lycee
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        telephone = VALUES(telephone),
        date_naissance = VALUES(date_naissance),
        lieu_naissance = VALUES(lieu_naissance),
        sexe = VALUES(sexe),
        nationalite = VALUES(nationalite),
        adresse = VALUES(adresse),
        wilaya = VALUES(wilaya),
        commune = VALUES(commune),
        diplome_actuel = VALUES(diplome_actuel),
        etablissement = VALUES(etablissement),
        specialite_actuelle = VALUES(specialite_actuelle),
        annee_obtention = VALUES(annee_obtention),
        moyenne = VALUES(moyenne),
        annee_bac = VALUES(annee_bac),
        serie_bac = VALUES(serie_bac),
        moyenne_bac = VALUES(moyenne_bac),
        mention_bac = VALUES(mention_bac),
        numero_inscription_bac = VALUES(numero_inscription_bac),
        lycee_origine = VALUES(lycee_origine),
        wilaya_lycee = VALUES(wilaya_lycee)`,
      [
        userId,
        normalizeNullableText(profile.telephone),
        normalizeDate(profile.date_naissance),
        normalizeNullableText(profile.lieu_naissance),
        normalizeNullableText(profile.sexe),
        normalizeNullableText(profile.nationalite),
        normalizeNullableText(profile.adresse),
        normalizeNullableText(profile.wilaya),
        normalizeNullableText(profile.commune),
        normalizeNullableText(profile.diplome_actuel || profile.serie_bac),
        normalizeNullableText(profile.etablissement || profile.lycee_origine),
        normalizeNullableText(profile.specialite_actuelle || profile.serie_bac),
        normalizeYear(profile.annee_obtention || profile.annee_bac),
        normalizeAverage(profile.moyenne || profile.moyenne_bac),
        normalizeYear(profile.annee_bac || profile.annee_obtention),
        normalizeNullableText(profile.serie_bac || profile.diplome_actuel),
        normalizeAverage(profile.moyenne_bac || profile.moyenne),
        normalizeNullableText(profile.mention_bac),
        normalizeNullableText(profile.numero_inscription_bac),
        normalizeNullableText(profile.lycee_origine || profile.etablissement),
        normalizeNullableText(profile.wilaya_lycee),
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
