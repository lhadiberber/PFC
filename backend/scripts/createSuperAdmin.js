import bcrypt from "bcrypt";
import { initializeDatabaseConnection, pool } from "../config/db.js";
import {
  createUser,
  ensureUsersTable,
  findUserByEmail,
  normalizeEmail,
} from "../models/user.model.js";

const SALT_ROUNDS = 10;

function readRequiredEnv(name) {
  const value = String(process.env[name] || "").trim();

  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }

  return value;
}

async function createSuperAdmin() {
  await initializeDatabaseConnection();
  await ensureUsersTable();

  const nom = readRequiredEnv("SUPER_ADMIN_NOM");
  const prenom = readRequiredEnv("SUPER_ADMIN_PRENOM");
  const email = normalizeEmail(readRequiredEnv("SUPER_ADMIN_EMAIL"));
  const password = readRequiredEnv("SUPER_ADMIN_PASSWORD");

  if (password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD doit contenir au moins 8 caracteres.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    console.log(`Compte deja existant pour ${email}. Aucun changement effectue.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({
    nom,
    prenom,
    email,
    passwordHash,
    role: "super_admin",
  });

  console.log(`Compte super_admin cree avec succes: ${user.email}`);
}

try {
  await createSuperAdmin();
} catch (error) {
  console.error("Creation du super administrateur impossible.");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
