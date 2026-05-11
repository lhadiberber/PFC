import "dotenv/config";
import path from "node:path";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import documentRoutes from "./routes/document.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";

const app = express();
const uploadDir = process.env.UPLOAD_DIR || "uploads";

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(`/${uploadDir}`, express.static(path.resolve(process.cwd(), uploadDir)));

app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "Bienvenue sur l'API PFC Admissions.",
    health: "/api/health",
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

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
