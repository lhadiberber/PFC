import "dotenv/config";
import cors from "cors";
import express from "express";
import { testDatabaseConnection } from "./config/db.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "Bienvenue sur l'API PFC Admissions.",
    health: "/api/health",
    auth: "/api/auth",
    profile: "/api/profile",
    applications: "/api/applications",
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

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
