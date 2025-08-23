// app.ts

import type { Express } from "express";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "swagger";

import authRoutes from "./api/auth-cartesia.js";
import voiceRoutes from "./api/voice.js";
import { errorHandler, notFound } from "./middlewares.js";

// Загрузка переменных окружения
dotenv.config();

const app: Express = express();

// Базовые middleware
app.use(helmet()); // Безопасность
app.use(cors()); // CORS
app.use(morgan("combined")); // Логирование
app.use(express.json({ limit: "10mb" })); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded данных

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум 100 запросов с одного IP за окно
  message: {
    success: false,
    error: {
      type: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again later.",
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Voice API is running",
    timestamp: new Date().toISOString(),
    // eslint-disable-next-line node/no-process-env
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// API routes
app.use("/cartesia/voices", voiceRoutes);
app.use("/cartesia/auth", authRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware (должен быть последним)
app.use(errorHandler);

export default app;
