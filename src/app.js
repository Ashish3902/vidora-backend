// src/app.js - Production-Optimized Video Platform Backend
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import connectDB from "./config/db.js";

// Import all route modules
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy (important for deployment platforms)
app.set("trust proxy", 1);

// Compression middleware for better performance
app.use(compression());

// Body parsing middleware with increased limits for video uploads
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
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com",
        ],
        mediaSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://vidora-three.vercel.app"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("combined"));
} else {
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://vidora-three.vercel.app",
      "https://vidora-frontend.vercel.app", // In case you change domain
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ];

    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-File-Name",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Rate limiting with different limits for different endpoints
const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
      });
    },
  });

// General API rate limit
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === "production" ? 100 : 1000,
  "Too many requests from this IP, please try again later."
);

// Stricter limits for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per 15 minutes
  "Too many authentication attempts, please try again later."
);

// Upload limiter
const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  "Upload limit exceeded, please try again later."
);

// Apply rate limiting
app.use("/api", generalLimiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/videos", uploadLimiter);

// Health check endpoint (before other routes)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vidora API is running! 🎬",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    uptime: process.uptime(),
    status: {
      database: "connected",
      server: "healthy",
    },
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    services: {
      api: "operational",
      database: "operational",
      cloudinary: "operational",
      cors: "configured",
    },
    endpoints: [
      "/api/users",
      "/api/videos",
      "/api/comments",
      "/api/likes",
      "/api/subscriptions",
      "/api/library",
    ],
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/library", libraryRoutes);

// Catch-all route for undefined endpoints
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /api/health - Health check",
      "GET /api/status - Service status",
      "POST /api/users/register - User registration",
      "POST /api/users/login - User login",
      "GET /api/videos - Get all videos",
      "POST /api/videos - Upload video",
      "GET /api/comments/:videoId - Get comments",
      "POST /api/likes/toggle/v/:videoId - Toggle video like",
      "GET /api/subscriptions/subscribed - Get subscriptions",
      "GET /api/library/watchlater - Get watch later",
    ],
  });
});

// Handle non-API routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    hint: "All API endpoints should start with /api/",
  });
});

// Enhanced global error handler
app.use((err, req, res, next) => {
  // Log error for debugging (in production, integrate with logging service)
  console.error("Error Details:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message =
      "Validation Error: " +
      Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
  } else if (err.name === "MongoError" || err.name === "MongooseError") {
    statusCode = 500;
    message = "Database Error";
  } else if (err.name === "MulterError") {
    statusCode = 400;
    message = "File Upload Error: " + err.message;
  } else if (err.code === "CORS_ERROR") {
    statusCode = 403;
    message = "CORS Error: Origin not allowed";
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal Server Error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      path: req.path,
      method: req.method,
    }),
  });
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error);
  process.exit(1);
});

export default app;
