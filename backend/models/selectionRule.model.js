import { pool } from "../config/db.js";

const RULE_FIELDS = `
  id,
  filiere,
  moyenne_min,
  series_acceptees,
  documents_obligatoires,
  university_scope,
  assigned_department,
  created_by,
  created_at,
  updated_at
`;

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeComparable(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeNullableText(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue || null;
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseArray(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(normalizeText).filter(Boolean) : [];
  } catch {
    return String(value)
      .split(",")
      .map(normalizeText)
      .filter(Boolean);
  }
}

function stringifyArray(value) {
  return JSON.stringify(parseArray(value));
}

function normalizeRule(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    filiere: row.filiere || "",
    moyenne_min: Number(row.moyenne_min || 0),
    series_acceptees: parseArray(row.series_acceptees),
    documents_obligatoires: parseArray(row.documents_obligatoires),
    university_scope: row.university_scope || "",
    assigned_department: row.assigned_department || "",
    created_by: row.created_by || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildRuleScopeFilter(user, alias = "sr") {
  if (!user || user.role === "super_admin") {
    return { sql: "", params: [] };
  }

  if (user.role !== "admin" || !normalizeText(user.university_scope)) {
    return { sql: " AND 1 = 0", params: [] };
  }

  const params = [user.university_scope];
  let sql = ` AND LOWER(TRIM(${alias}.university_scope)) = LOWER(TRIM(?))`;

  if (normalizeText(user.assigned_department)) {
    sql += ` AND (${alias}.assigned_department IS NULL OR ${alias}.assigned_department = '' OR LOWER(TRIM(${alias}.assigned_department)) = LOWER(TRIM(?)))`;
    params.push(user.assigned_department);
  }

  return { sql, params };
}

function applicationMatchesRule(application, rule) {
  const applicationFields = [
    application.filiere,
    application.formation,
    application.domaine,
    application.faculte_institut,
  ].map(normalizeComparable);
  const ruleFiliere = normalizeComparable(rule.filiere);

  if (ruleFiliere && !applicationFields.includes(ruleFiliere)) {
    return false;
  }

  if (rule.university_scope && normalizeComparable(application.universite) !== normalizeComparable(rule.university_scope)) {
    return false;
  }

  if (rule.assigned_department) {
    const departmentFields = [
      application.faculte_institut,
      application.domaine,
      application.filiere,
      application.formation,
    ].map(normalizeComparable);

    return departmentFields.includes(normalizeComparable(rule.assigned_department));
  }

  return true;
}

function documentMatches(document, requiredDocument) {
  const uploadedType = normalizeComparable(document.type_document);
  const requiredType = normalizeComparable(requiredDocument);

  return uploadedType.includes(requiredType) || requiredType.includes(uploadedType);
}

export async function ensureSelectionRulesTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS selection_rules (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      filiere VARCHAR(160) NOT NULL,
      moyenne_min DECIMAL(5,2) NOT NULL DEFAULT 0,
      series_acceptees TEXT NULL,
      documents_obligatoires TEXT NULL,
      university_scope VARCHAR(160) NULL,
      assigned_department VARCHAR(160) NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX selection_rules_scope_index (university_scope, assigned_department),
      INDEX selection_rules_filiere_index (filiere),
      CONSTRAINT selection_rules_created_by_fk
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function findSelectionRules(user) {
  const scopeFilter = buildRuleScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT ${RULE_FIELDS}
     FROM selection_rules sr
     WHERE 1 = 1${scopeFilter.sql}
     ORDER BY sr.updated_at DESC, sr.id DESC`,
    scopeFilter.params
  );

  return rows.map(normalizeRule);
}

export async function createSelectionRule(user, rule) {
  if (user.role === "admin" && !normalizeText(user.university_scope)) {
    const error = new Error("Aucun périmètre université n'est affecté à cet administrateur.");
    error.statusCode = 403;
    throw error;
  }

  const universityScope =
    user.role === "admin" ? user.university_scope : normalizeNullableText(rule.university_scope);
  const assignedDepartment =
    user.role === "admin"
      ? normalizeNullableText(user.assigned_department || rule.assigned_department)
      : normalizeNullableText(rule.assigned_department);

  const [insertResult] = await pool.execute(
    `INSERT INTO selection_rules (
       filiere,
       moyenne_min,
       series_acceptees,
       documents_obligatoires,
       university_scope,
       assigned_department,
       created_by
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizeText(rule.filiere),
      normalizeNumber(rule.moyenne_min),
      stringifyArray(rule.series_acceptees),
      stringifyArray(rule.documents_obligatoires),
      universityScope,
      assignedDepartment,
      user.id,
    ]
  );

  return findSelectionRuleById(insertResult.insertId, user);
}

export async function findSelectionRuleById(id, user) {
  const scopeFilter = buildRuleScopeFilter(user);
  const [rows] = await pool.execute(
    `SELECT ${RULE_FIELDS}
     FROM selection_rules sr
     WHERE sr.id = ?${scopeFilter.sql}
     LIMIT 1`,
    [id, ...scopeFilter.params]
  );

  return normalizeRule(rows[0]);
}

export async function updateSelectionRule(id, user, rule) {
  const scopeFilter = buildRuleScopeFilter(user);
  const universityScope =
    user.role === "admin" ? user.university_scope : normalizeNullableText(rule.university_scope);
  const assignedDepartment =
    user.role === "admin"
      ? normalizeNullableText(user.assigned_department || rule.assigned_department)
      : normalizeNullableText(rule.assigned_department);

  const [updateResult] = await pool.execute(
    `UPDATE selection_rules sr
     SET sr.filiere = ?,
         sr.moyenne_min = ?,
         sr.series_acceptees = ?,
         sr.documents_obligatoires = ?,
         sr.university_scope = ?,
         sr.assigned_department = ?
     WHERE sr.id = ?${scopeFilter.sql}`,
    [
      normalizeText(rule.filiere),
      normalizeNumber(rule.moyenne_min),
      stringifyArray(rule.series_acceptees),
      stringifyArray(rule.documents_obligatoires),
      universityScope,
      assignedDepartment,
      id,
      ...scopeFilter.params,
    ]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  return findSelectionRuleById(id, user);
}

export async function deleteSelectionRule(id, user) {
  const scopeFilter = buildRuleScopeFilter(user);
  const [deleteResult] = await pool.execute(
    `DELETE sr
     FROM selection_rules sr
     WHERE sr.id = ?${scopeFilter.sql}`,
    [id, ...scopeFilter.params]
  );

  return deleteResult.affectedRows > 0;
}

export function evaluateApplicationPreselection(application, documents, rules) {
  const matchingRule = rules.find((rule) => applicationMatchesRule(application, rule));

  if (!matchingRule) {
    return {
      status: "non_evalue",
      label: "Non évalué",
      ruleId: null,
      reasons: ["Aucune règle ne correspond à cette candidature."],
    };
  }

  const reasons = [];
  const requiredDocuments = matchingRule.documents_obligatoires;
  const missingDocuments = requiredDocuments.filter(
    (requiredDocument) => !documents.some((document) => documentMatches(document, requiredDocument))
  );

  if (missingDocuments.length > 0) {
    reasons.push(`Documents manquants : ${missingDocuments.join(", ")}.`);
  }

  const moyenneBac = normalizeNumber(application.moyenne_bac || application.moyenne);
  if (moyenneBac < matchingRule.moyenne_min) {
    reasons.push(`Moyenne bac insuffisante (${moyenneBac || 0}/20).`);
  }

  const seriesAcceptees = matchingRule.series_acceptees.map(normalizeComparable);
  const serieBac = normalizeComparable(application.serie_bac || application.diplome_actuel);
  if (seriesAcceptees.length > 0 && !seriesAcceptees.includes(serieBac)) {
    reasons.push("Série du bac non acceptée par la règle.");
  }

  let status = "eligible";
  if (missingDocuments.length > 0) {
    status = "incomplet";
  } else if (reasons.length > 0) {
    status = "non_eligible";
  }

  const labels = {
    eligible: "Éligible",
    incomplet: "Incomplet",
    non_eligible: "Non éligible",
  };

  return {
    status,
    label: labels[status],
    ruleId: matchingRule.id,
    ruleFiliere: matchingRule.filiere,
    reasons,
  };
}
