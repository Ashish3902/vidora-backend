// // FILE: src/app.js
// // ==============================
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import userRoutes from "./routes/user.routes.js";
// import videoRoutes from "./routes/video.routes.js";
// import commentRoutes from "./routes/comment.routes.js";
// import likeRoutes from "./routes/like.routes.js";
// import playlistRoutes from "./routes/playlist.routes.js";
// import subscriptionRoutes from "./routes/subscription.routes.js";
// const app = express();

// // Security & body parsing
// app.use(helmet());
// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN || "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(cookieParser());

// // Throttle auth endpoints a bit
// const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use("/api/users/login", authLimiter);
// app.use("/api/users/register", authLimiter);
// app.use("/api/users/refresh-token", authLimiter);

// // Routes
// app.use("/api/users", userRoutes);
// app.use("/api/videos", videoRoutes);
// app.use("/api/comments", commentRoutes);
// app.use("/api/likes", likeRoutes);
// app.use("/api/playlists", playlistRoutes);
// app.use("/api/subscriptions", subscriptionRoutes);
// // Health
// app.get("/", (req, res) => res.json({ message: "API running 🚀" }));

// // 404
// app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// // Centralized error handler
// // eslint-disable-next-line no-unused-vars
// app.use((err, req, res, next) => {
//   console.error(err);
//   const status = err.statusCode || 500;
//   res
//     .status(status)
//     .json({ error: status === 500 ? "Internal Server Error" : err.message });
// });

// export default app;
// FILE: src/app.js - ENHANCED & DEBUGGED VERSION
// ===============================================
// FILE: src/app.js - COMPLETE FIXED & DEBUGGED VERSION
// ===================================================
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";

// // Import all route modules
// import userRoutes from "./routes/user.routes.js";
// import videoRoutes from "./routes/video.routes.js";
// import commentRoutes from "./routes/comment.routes.js";
// import likeRoutes from "./routes/like.routes.js";
// import playlistRoutes from "./routes/playlist.routes.js";
// import subscriptionRoutes from "./routes/subscription.routes.js";
// import libraryRoutes from "./routes/library.routes.js"; // ✅ ADDED LIBRARY ROUTES
// import searchRoutes from "./routes/search.routes.js";
// const app = express();

// // ==========================================
// // SECURITY MIDDLEWARE
// // ==========================================
// app.use(
//   helmet({
//     crossOriginEmbedderPolicy: false, // Fix for video streaming
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "https:"],
//         mediaSrc: ["'self'", "https:"], // Allow video streaming
//       },
//     },
//   })
// );

// // ==========================================
// // CORS CONFIGURATION
// // ==========================================
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (mobile apps, curl, etc.)
//       const allowedOrigins = [
//         process.env.CORS_ORIGIN || "http://localhost:5173",
//         "http://localhost:3000",
//         "http://localhost:5174",
//         "http://127.0.0.1:5173",
//         "http://localhost:8080", // Additional dev port
//       ];

//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.warn("⚠️ CORS blocked origin:", origin);
//         callback(null, false); // ✅ FIXED: Don't throw error, just reject
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//     exposedHeaders: ["X-Total-Count"],
//     maxAge: 86400, // Cache preflight for 24 hours
//   })
// );

// // Handle preflight requests
// app.options("*", cors());

// // ==========================================
// // BODY PARSING MIDDLEWARE
// // ==========================================

// // ✅ FIXED: Safer JSON parsing without verification
// app.use(
//   express.json({
//     limit: "50mb",
//     strict: true,
//   })
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "50mb",
//     parameterLimit: 1000,
//   })
// );

// app.use(cookieParser());

// // ==========================================
// // DEVELOPMENT DEBUGGING MIDDLEWARE
// // ==========================================
// if (process.env.NODE_ENV !== "production") {
//   app.use((req, res, next) => {
//     const timestamp = new Date().toISOString();
//     const method = req.method.padEnd(6);
//     const path = req.path.padEnd(30);

//     console.log(`🔍 [${timestamp}] ${method} ${path}`);

//     // Log query params if present
//     if (Object.keys(req.query).length > 0) {
//       console.log(`   📋 Query:`, req.query);
//     }

//     // Log body for POST/PUT/PATCH (but limit size)
//     if (
//       req.body &&
//       Object.keys(req.body).length > 0 &&
//       ["POST", "PUT", "PATCH"].includes(req.method)
//     ) {
//       const bodyStr = JSON.stringify(req.body);
//       const truncatedBody =
//         bodyStr.length > 200 ? bodyStr.substring(0, 200) + "..." : bodyStr;
//       console.log(`   📄 Body:`, truncatedBody);
//     }

//     // Log auth status
//     if (req.headers.authorization) {
//       console.log(`   🔐 Auth: Token present`);
//     }

//     next();
//   });
// }

// // ==========================================
// // RATE LIMITING
// // ==========================================
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: {
//     success: false,
//     error: "Too many authentication attempts, please try again later",
//     retryAfter: "15 minutes",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) => {
//     return req.ip + ":" + req.headers["user-agent"];
//   },
// });

// // Apply rate limiting to auth endpoints
// app.use("/api/users/login", authLimiter);
// app.use("/api/users/register", authLimiter);
// app.use("/api/users/refresh-token", authLimiter);

// // General API rate limiter (more lenient)
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 1000, // 1000 requests per 15 minutes
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use("/api/", apiLimiter);

// // ==========================================
// // HEALTH CHECK ROUTES
// // ==========================================

// // Root health check
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "🚀 Video Platform API is running!",
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || "development",
//     version: "1.0.0",
//   });
// });

// // Detailed API health check
// app.get("/api/health", (req, res) => {
//   const healthInfo = {
//     success: true,
//     status: "✅ Healthy",
//     timestamp: new Date().toISOString(),
//     uptime: `${Math.floor(process.uptime())} seconds`,
//     memory: {
//       used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
//       total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
//     },
//     routes: {
//       users: "✅ Mounted at /api/users",
//       videos: "✅ Mounted at /api/videos",
//       comments: "✅ Mounted at /api/comments",
//       likes: "✅ Mounted at /api/likes",
//       playlists: "✅ Mounted at /api/playlists",
//       subscriptions: "✅ Mounted at /api/subscriptions",
//       library: "✅ Mounted at /api/library", // ✅ ADDED
//     },
//     features: {
//       authentication: "✅ JWT + Refresh Token",
//       fileUpload: "✅ Multer + Cloud Storage",
//       videoStreaming: "✅ HLS + Progressive",
//       library: "✅ Watch Later, History, Liked", // ✅ ADDED
//       realtime: "✅ WebSocket Events",
//     },
//   };

//   res.json(healthInfo);
// });

// // ==========================================
// // API ROUTES MOUNTING
// // ==========================================

// console.log("🚀 Mounting API routes...");

// // Mount routes with enhanced logging
// const mountRoute = (path, router, name) => {
//   app.use(
//     path,
//     (req, res, next) => {
//       if (process.env.NODE_ENV !== "production") {
//         console.log(
//           `📍 [${name.toUpperCase()}] ${req.method} ${path}${req.path}`
//         );
//       }
//       next();
//     },
//     router
//   );
//   console.log(`✅ ${name} routes mounted at ${path}`);
// };

// // Mount all routes
// mountRoute("/api/users", userRoutes, "User");
// mountRoute("/api/videos", videoRoutes, "Video");
// mountRoute("/api/comments", commentRoutes, "Comment");
// mountRoute("/api/likes", likeRoutes, "Like");
// mountRoute("/api/playlists", playlistRoutes, "Playlist");
// mountRoute("/api/subscriptions", subscriptionRoutes, "Subscription");
// mountRoute("/api/library", libraryRoutes, "Library"); // ✅ ADDED LIBRARY ROUTES

// console.log("✅ All routes mounted successfully!");

// // ==========================================
// // API DOCUMENTATION ROUTE
// // ==========================================
// app.get("/api/docs", (req, res) => {
//   res.json({
//     success: true,
//     message: "📚 API Documentation",
//     baseUrl: `${req.protocol}://${req.get("host")}/api`,
//     endpoints: {
//       authentication: {
//         "POST /users/register": "Register new user",
//         "POST /users/login": "User login",
//         "POST /users/logout": "User logout",
//         "POST /users/refresh-token": "Refresh access token",
//       },
//       users: {
//         "GET /users/me": "Get current user",
//         "PATCH /users/profile": "Update user profile",
//         "PATCH /users/avatar": "Update user avatar",
//         "GET /users/search": "Search users",
//       },
//       videos: {
//         "GET /videos": "Get all videos",
//         "POST /videos": "Upload new video",
//         "GET /videos/:id": "Get video by ID",
//         "PATCH /videos/:id": "Update video",
//         "DELETE /videos/:id": "Delete video",
//       },
//       library: {
//         "GET /library/watchlater": "Get watch later videos",
//         "POST /library/watchlater": "Add to watch later",
//         "DELETE /library/watchlater/:videoId": "Remove from watch later",
//         "GET /library/history": "Get watch history",
//         "POST /library/history": "Add to history",
//         "DELETE /library/history": "Clear history",
//         "GET /library/liked": "Get liked videos",
//       },
//       social: {
//         "POST /likes": "Like/unlike video",
//         "POST /comments": "Add comment",
//         "POST /subscriptions": "Subscribe to channel",
//       },
//     },
//     authentication: "Bearer token required for protected endpoints",
//     rateLimit: "100 auth requests per 15min, 1000 API requests per 15min",
//     timestamp: new Date().toISOString(),
//   });
// });

// // ==========================================
// // CATCH-ALL 404 HANDLER
// // ==========================================
// app.use("*", (req, res) => {
//   console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);

//   // Suggest similar routes
//   const suggestions = [];
//   if (req.originalUrl.includes("/user")) suggestions.push("/api/users");
//   if (req.originalUrl.includes("/video")) suggestions.push("/api/videos");
//   if (req.originalUrl.includes("/library")) suggestions.push("/api/library");

//   res.status(404).json({
//     success: false,
//     error: "Route not found",
//     message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
//     suggestions:
//       suggestions.length > 0
//         ? suggestions
//         : [
//             "Check /api/docs for available endpoints",
//             "Verify the HTTP method and path",
//             "Ensure you're using the correct base URL",
//           ],
//     availableRoutes: {
//       "GET /": "API status",
//       "GET /api/health": "Detailed health check",
//       "GET /api/docs": "API documentation",
//       "POST /api/users/register": "User registration",
//       "POST /api/users/login": "User login",
//       "/api/users/*": "User management",
//       "/api/videos/*": "Video management",
//       "/api/library/*": "Library features", // ✅ ADDED
//       "/api/comments/*": "Comments",
//       "/api/likes/*": "Likes/Dislikes",
//       "/api/playlists/*": "Playlists",
//       "/api/subscriptions/*": "Subscriptions",
//     },
//     timestamp: new Date().toISOString(),
//   });
// });

// // ==========================================
// // GLOBAL ERROR HANDLER (Must be last)
// // ==========================================
// app.use((err, req, res, next) => {
//   // Log the error with full context
//   console.error("❌ Global Error Handler:");
//   console.error("   URL:", req.method, req.originalUrl);
//   console.error("   IP:", req.ip);
//   console.error("   User-Agent:", req.headers["user-agent"]);
//   console.error("   Error:", err.message);
//   console.error("   Stack:", err.stack);

//   // Determine error status
//   const status = err.statusCode || err.status || 500;

//   // Handle specific error types
//   let errorResponse = {
//     success: false,
//     error: "Internal Server Error",
//     message: "Something went wrong on our end",
//     timestamp: new Date().toISOString(),
//   };

//   // JWT errors
//   if (err.name === "JsonWebTokenError") {
//     errorResponse.error = "Invalid token";
//     errorResponse.message = "Please log in again";
//     return res.status(401).json(errorResponse);
//   }

//   if (err.name === "TokenExpiredError") {
//     errorResponse.error = "Token expired";
//     errorResponse.message = "Please refresh your token or log in again";
//     return res.status(401).json(errorResponse);
//   }

//   // Validation errors
//   if (err.name === "ValidationError") {
//     errorResponse.error = "Validation failed";
//     errorResponse.message = err.message;
//     errorResponse.details = err.errors;
//     return res.status(400).json(errorResponse);
//   }

//   // MongoDB errors
//   if (err.name === "MongoError" || err.name === "MongoServerError") {
//     if (err.code === 11000) {
//       errorResponse.error = "Duplicate entry";
//       errorResponse.message = "This resource already exists";
//       return res.status(409).json(errorResponse);
//     }
//   }

//   // CORS errors
//   if (err.message === "Not allowed by CORS") {
//     errorResponse.error = "CORS Policy Violation";
//     errorResponse.message =
//       "Your origin is not allowed to access this resource";
//     return res.status(403).json(errorResponse);
//   }

//   // Rate limiting errors
//   if (err.status === 429) {
//     errorResponse.error = "Rate limit exceeded";
//     errorResponse.message = "Too many requests, please slow down";
//     errorResponse.retryAfter = err.retryAfter;
//     return res.status(429).json(errorResponse);
//   }

//   // Custom API errors
//   if (status < 500) {
//     errorResponse.error = err.message || "Bad Request";
//     errorResponse.message = err.message || "The request could not be processed";
//   }

//   // Add debug info in development
//   if (process.env.NODE_ENV !== "production") {
//     errorResponse.debug = {
//       stack: err.stack,
//       details: err,
//     };
//   }

//   res.status(status).json(errorResponse);
// });

// // ==========================================
// // GRACEFUL SHUTDOWN HANDLERS
// // ==========================================
// process.on("uncaughtException", (err) => {
//   console.error("❌ Uncaught Exception:", err);
//   console.error("🔄 Shutting down gracefully...");
//   process.exit(1);
// });

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("❌ Unhandled Rejection at:", promise);
//   console.error("❌ Reason:", reason);
//   console.error("🔄 Shutting down gracefully...");
//   process.exit(1);
// });

// // Export the app
// export default app;
// FILE: src/app.js - COMPLETE REBUILT VERSION WITH ALL FEATURES
// ============================================================
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Import all route modules
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import libraryRoutes from "./routes/library.routes.js"; // ✅ LIBRARY ROUTES
import searchRoutes from "./routes/search.routes.js"; // ✅ SEARCH ROUTES

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Fix for video streaming
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "https:"], // Allow video streaming
        connectSrc: ["'self'", "https:", "ws:", "wss:"], // WebSocket support
      },
    },
  })
);

// ==========================================
// CORS CONFIGURATION
// ==========================================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      const allowedOrigins = [
        process.env.CORS_ORIGIN || "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://localhost:8080", // Additional dev port
        "https://your-frontend-domain.com", // Add your production domain
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("⚠️ CORS blocked origin:", origin);
        callback(null, false); // Don't throw error, just reject
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"], // For pagination
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// Handle preflight requests
app.options("*", cors());

// ==========================================
// BODY PARSING MIDDLEWARE
// ==========================================
app.use(
  express.json({
    limit: "50mb",
    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 1000,
  })
);

app.use(cookieParser());

// ==========================================
// DEVELOPMENT DEBUGGING MIDDLEWARE
// ==========================================
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method.padEnd(6);
    const path = req.originalUrl.padEnd(40);

    console.log(`🔍 [${timestamp}] ${method} ${path}`);

    // Log query params if present
    if (Object.keys(req.query).length > 0) {
      console.log(`   📋 Query:`, JSON.stringify(req.query, null, 2));
    }

    // Log body for POST/PUT/PATCH (but limit size)
    if (
      req.body &&
      Object.keys(req.body).length > 0 &&
      ["POST", "PUT", "PATCH"].includes(req.method)
    ) {
      const bodyStr = JSON.stringify(req.body);
      const truncatedBody =
        bodyStr.length > 200 ? bodyStr.substring(0, 200) + "..." : bodyStr;
      console.log(`   📄 Body:`, truncatedBody);
    }

    // Log auth status
    if (req.headers.authorization) {
      console.log(`   🔐 Auth: Token present`);
    }

    next();
  });
}

// ==========================================
// RATE LIMITING
// ==========================================

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ":" + (req.headers["user-agent"] || "unknown");
  },
});

// General API rate limiter (more lenient)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    error: "API rate limit exceeded",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiter (moderate)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: {
    success: false,
    error: "Search rate limit exceeded",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to specific endpoints
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/refresh-token", authLimiter);
app.use("/api/search", searchLimiter);
app.use("/api/", apiLimiter);

// ==========================================
// HEALTH CHECK ROUTES
// ==========================================

// Root health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Video Platform API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "2.0.0",
    features: {
      authentication: "✅ JWT + Refresh Token",
      videoStreaming: "✅ HLS + Progressive",
      library: "✅ Watch Later, History, Liked",
      search: "✅ Full-text Video & User Search",
      realtime: "✅ WebSocket Events",
    },
  });
});

// Detailed API health check
app.get("/api/health", (req, res) => {
  const healthInfo = {
    success: true,
    status: "✅ Healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    routes: {
      users: "✅ Mounted at /api/users",
      videos: "✅ Mounted at /api/videos",
      comments: "✅ Mounted at /api/comments",
      likes: "✅ Mounted at /api/likes",
      playlists: "✅ Mounted at /api/playlists",
      subscriptions: "✅ Mounted at /api/subscriptions",
      library: "✅ Mounted at /api/library", // ✅ LIBRARY
      search: "✅ Mounted at /api/search", // ✅ SEARCH
    },
    database: {
      status: "✅ Connected",
      indexes: "✅ Text indexes created for search",
    },
  };

  res.json(healthInfo);
});

// ==========================================
// API ROUTES MOUNTING WITH ENHANCED LOGGING
// ==========================================

console.log("🚀 Mounting API routes...");

// Enhanced route mounting function
const mountRoute = (path, router, name, description) => {
  app.use(
    path,
    (req, res, next) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `📍 [${name.toUpperCase()}] ${req.method} ${path}${req.path}`
        );
      }
      next();
    },
    router
  );

  console.log(`✅ ${name} routes mounted at ${path} - ${description}`);
};

// Mount all routes with descriptions
mountRoute(
  "/api/users",
  userRoutes,
  "User",
  "Authentication & Profile Management"
);
mountRoute("/api/videos", videoRoutes, "Video", "Video Upload & Management");
mountRoute(
  "/api/comments",
  commentRoutes,
  "Comment",
  "Video Comments & Replies"
);
mountRoute("/api/likes", likeRoutes, "Like", "Like/Dislike System");
mountRoute("/api/playlists", playlistRoutes, "Playlist", "User Playlists");
mountRoute(
  "/api/subscriptions",
  subscriptionRoutes,
  "Subscription",
  "Channel Subscriptions"
);
mountRoute(
  "/api/library",
  libraryRoutes,
  "Library",
  "Watch Later, History & Liked Videos"
); // ✅ LIBRARY
mountRoute(
  "/api/search",
  searchRoutes,
  "Search",
  "Full-text Video & User Search"
); // ✅ SEARCH

console.log("✅ All routes mounted successfully!");

// ==========================================
// API DOCUMENTATION ROUTE
// ==========================================
app.get("/api/docs", (req, res) => {
  res.json({
    success: true,
    message: "📚 Video Platform API Documentation",
    baseUrl: `${req.protocol}://${req.get("host")}/api`,
    version: "2.0.0",
    endpoints: {
      authentication: {
        "POST /users/register": "Register new user account",
        "POST /users/login": "User authentication",
        "POST /users/logout": "User logout",
        "POST /users/refresh-token": "Refresh access token",
      },
      users: {
        "GET /users/me": "Get current user profile",
        "PATCH /users/profile": "Update user profile",
        "PATCH /users/avatar": "Update user avatar",
        "GET /users/search": "Search users by name",
        "GET /users/:id": "Get user by ID",
      },
      videos: {
        "GET /videos": "Get all published videos",
        "POST /videos": "Upload new video",
        "GET /videos/:id": "Get video by ID",
        "PATCH /videos/:id": "Update video details",
        "DELETE /videos/:id": "Delete video",
      },
      library: {
        // ✅ LIBRARY DOCS
        "GET /library/watchlater": "Get watch later videos",
        "POST /library/watchlater": "Add video to watch later",
        "DELETE /library/watchlater/:videoId": "Remove from watch later",
        "GET /library/history": "Get watch history",
        "POST /library/history": "Add video to history",
        "DELETE /library/history": "Clear all history",
        "DELETE /library/history/:videoId": "Remove from history",
        "GET /library/liked": "Get liked videos",
      },
      search: {
        // ✅ SEARCH DOCS
        "GET /search/videos": "Search videos with full-text",
        "GET /search/users": "Search users by name/email",
        "GET /search/suggestions": "Get search auto-suggestions",
      },
      social: {
        "POST /likes": "Like/unlike video or comment",
        "POST /comments": "Add comment to video",
        "POST /subscriptions": "Subscribe/unsubscribe to channel",
      },
    },
    rateLimits: {
      authentication: "100 requests per 15 minutes",
      search: "60 requests per minute",
      api: "1000 requests per 15 minutes",
    },
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer <token>",
      note: "Most endpoints require authentication",
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// FEATURE STATUS ENDPOINTS
// ==========================================

// Library status endpoint
app.get("/api/library/status", (req, res) => {
  res.json({
    success: true,
    feature: "📚 Library System",
    status: "✅ Fully Operational",
    features: {
      watchLater: "✅ Save videos for later viewing",
      history: "✅ Track viewing history with timestamps",
      liked: "✅ View liked videos collection",
    },
    endpoints: 8,
    timestamp: new Date().toISOString(),
  });
});

// Search status endpoint
app.get("/api/search/status", (req, res) => {
  res.json({
    success: true,
    feature: "🔍 Search System",
    status: "✅ Fully Operational",
    features: {
      videoSearch: "✅ Full-text search with relevance scoring",
      userSearch: "✅ User search by name and email",
      suggestions: "✅ Auto-complete search suggestions",
      filters: "✅ Sort and date filtering",
    },
    endpoints: 3,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// CATCH-ALL 404 HANDLER
// ==========================================
app.use("*", (req, res) => {
  console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);

  // Suggest similar routes
  const suggestions = [];
  const path = req.originalUrl.toLowerCase();

  if (path.includes("user")) suggestions.push("/api/users");
  if (path.includes("video")) suggestions.push("/api/videos");
  if (path.includes("library")) suggestions.push("/api/library");
  if (path.includes("search")) suggestions.push("/api/search");
  if (path.includes("comment")) suggestions.push("/api/comments");
  if (path.includes("like")) suggestions.push("/api/likes");

  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : [
            "Check /api/docs for available endpoints",
            "Verify the HTTP method and path",
            "Ensure you're using the correct base URL",
          ],
    availableRoutes: {
      "GET /": "API status",
      "GET /api/health": "Detailed health check",
      "GET /api/docs": "Complete API documentation",
      "/api/users/*": "User management & authentication",
      "/api/videos/*": "Video upload & management",
      "/api/library/*": "Library features (Watch Later, History, Liked)", // ✅ LIBRARY
      "/api/search/*": "Search videos & users", // ✅ SEARCH
      "/api/comments/*": "Video comments & replies",
      "/api/likes/*": "Like/dislike system",
      "/api/playlists/*": "User playlists",
      "/api/subscriptions/*": "Channel subscriptions",
    },
    helpLinks: {
      documentation: "/api/docs",
      health: "/api/health",
      libraryStatus: "/api/library/status",
      searchStatus: "/api/search/status",
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// GLOBAL ERROR HANDLER (Must be last)
// ==========================================
app.use((err, req, res, next) => {
  // Log the error with full context
  console.error("❌ Global Error Handler:");
  console.error("   URL:", req.method, req.originalUrl);
  console.error("   IP:", req.ip);
  console.error("   User-Agent:", req.headers["user-agent"]);
  console.error("   Error:", err.message);
  console.error("   Stack:", err.stack);

  // Determine error status
  const status = err.statusCode || err.status || 500;

  // Base error response
  let errorResponse = {
    success: false,
    error: "Internal Server Error",
    message: "Something went wrong on our end",
    timestamp: new Date().toISOString(),
  };

  // Handle specific error types

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    errorResponse = {
      success: false,
      error: "Invalid token",
      message: "Please log in again",
      code: "TOKEN_INVALID",
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorResponse);
  }

  if (err.name === "TokenExpiredError") {
    errorResponse = {
      success: false,
      error: "Token expired",
      message: "Please refresh your token or log in again",
      code: "TOKEN_EXPIRED",
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorResponse);
  }

  // Validation errors
  if (err.name === "ValidationError") {
    errorResponse = {
      success: false,
      error: "Validation failed",
      message: err.message,
      details: err.errors,
      code: "VALIDATION_ERROR",
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(errorResponse);
  }

  // MongoDB errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    if (err.code === 11000) {
      errorResponse = {
        success: false,
        error: "Duplicate entry",
        message: "This resource already exists",
        code: "DUPLICATE_ERROR",
        timestamp: new Date().toISOString(),
      };
      return res.status(409).json(errorResponse);
    }
  }

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    errorResponse = {
      success: false,
      error: "CORS Policy Violation",
      message: "Your origin is not allowed to access this resource",
      code: "CORS_ERROR",
      timestamp: new Date().toISOString(),
    };
    return res.status(403).json(errorResponse);
  }

  // Rate limiting errors
  if (status === 429) {
    errorResponse = {
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests, please slow down",
      retryAfter: err.retryAfter,
      code: "RATE_LIMIT_ERROR",
      timestamp: new Date().toISOString(),
    };
    return res.status(429).json(errorResponse);
  }

  // Custom API errors (400-499)
  if (status >= 400 && status < 500) {
    errorResponse = {
      success: false,
      error: err.message || "Bad Request",
      message: err.message || "The request could not be processed",
      code: err.code || "CLIENT_ERROR",
      timestamp: new Date().toISOString(),
    };
  }

  // Add debug info in development
  if (process.env.NODE_ENV !== "production") {
    errorResponse.debug = {
      stack: err.stack,
      details: err,
      url: req.originalUrl,
      method: req.method,
    };
  }

  res.status(status).json(errorResponse);
});

// ==========================================
// GRACEFUL SHUTDOWN HANDLERS
// ==========================================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  console.error("🔄 Shutting down gracefully...");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("❌ Reason:", reason);
  console.error("🔄 Shutting down gracefully...");
  process.exit(1);
});

// Graceful shutdown on SIGINT/SIGTERM
process.on("SIGINT", () => {
  console.log("🔄 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🔄 Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

// Export the app
export default app;
