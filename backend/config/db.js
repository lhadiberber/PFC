import "dotenv/config";
import mysql from "mysql2/promise";

const databaseName = process.env.DB_NAME || "pfc_admissions";

function assertSafeDatabaseName(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("DB_NAME ne doit contenir que des lettres, chiffres et underscores.");
  }
}

const baseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool({
  ...baseConfig,
  database: databaseName,
});

export async function ensureDatabaseExists() {
  assertSafeDatabaseName(databaseName);

  const serverPool = mysql.createPool(baseConfig);

  try {
    await serverPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await serverPool.end();
  }
}

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    return {
      host: baseConfig.host,
      database: databaseName,
    };
  } finally {
    connection.release();
  }
}

export async function initializeDatabaseConnection() {
  await ensureDatabaseExists();
  return testDatabaseConnection();
}
