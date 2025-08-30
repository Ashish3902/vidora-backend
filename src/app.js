import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Import all your route files
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";

const app = express();

// Connect to MongoDB
connectDB();

// Basic middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Security headers with Helmet
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Logging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("combined"));
}

// CORS Configuration
const corsOptions = {
  origin:
    process.env.CORS_ORIGIN === "*"
      ? true
      : process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // More requests in dev
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/library", libraryRoutes);

// 404 Handler for unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      "/api/health",
      "/api/users",
      "/api/videos",
      "/api/comments",
      "/api/likes",
      "/api/subscriptions",
      "/api/library",
    ],
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production") {
    if (statusCode === 500) {
      message = "Internal Server Error";
    }

    // Log error for debugging (you can integrate with logging service)
    console.error("Production Error:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
});

export default app;
