import "dotenv/config";
import path from "node:path";
import cors from "cors";
import express from "express";
import { testDatabaseConnection } from "./config/db.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import documentRoutes from "./routes/document.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import studentRoutes from "./routes/student.routes.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";

const app = express();

app.disable("x-powered-by");

const defaultClientOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
];
const configuredClientOrigins = [process.env.CLIENT_URL, process.env.FRONTEND_URL]
  .filter(Boolean)
  .join(",")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedClientOrigins = new Set([...defaultClientOrigins, ...configuredClientOrigins]);
const isDevelopment = (process.env.NODE_ENV || "development") !== "production";

function isPrivateNetworkHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function isLocalDevOrigin(origin) {
  if (!isDevelopment) {
    return false;
  }

  try {
    const parsedOrigin = new URL(origin);
    return (
      ["http:", "https:"].includes(parsedOrigin.protocol) &&
      Boolean(parsedOrigin.port) &&
      isPrivateNetworkHostname(parsedOrigin.hostname)
    );
  } catch (_error) {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedClientOrigins.has(origin) || isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origine CORS non autorisee."));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads")));

app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "Bienvenue sur l'API PFC Admissions.",
    health: "/api/health",
    auth: "/api/auth",
    profile: "/api/profile",
    applications: "/api/applications",
    documents: "/api/documents",
    student: "/api/student",
    admin: "/api/admin",
    superAdmin: "/api/super-admin",
  });
});

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    message: "API PFC Admissions operationnelle.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/db", async (_request, response, next) => {
  try {
    const dbInfo = await testDatabaseConnection();

    response.json({
      success: true,
      message: "Connexion MySQL operationnelle.",
      database: dbInfo.database,
      host: dbInfo.host,
    });
  } catch (error) {
    error.statusCode = 503;
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
