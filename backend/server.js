import "dotenv/config";
import app from "./app.js";
import { initializeDatabaseConnection } from "./config/db.js";

const PORT = Number(process.env.PORT) || 5000;

let server;

async function startServer() {
  try {
    const dbInfo = await initializeDatabaseConnection();
    console.log(`✅ Connexion MySQL réussie (${dbInfo.host}/${dbInfo.database})`);

    server = app.listen(PORT, () => {
      console.log(`API PFC Admissions lancee sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Connexion MySQL échouée");
    console.error(`Code: ${error.code || error.name || "UNKNOWN"}`);
    console.error(`Message: ${error.message}`);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`${signal} recu. Arret du serveur...`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    console.log("Serveur arrete proprement.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Arret force apres delai.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

startServer();
