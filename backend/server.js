import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`API PFC Admissions lancee sur http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} recu. Arret du serveur...`);

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
