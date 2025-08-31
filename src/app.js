// // import express from "express";
// // import cors from "cors";
// // import cookieParser from "cookie-parser";
// // import helmet from "helmet";
// // import rateLimit from "express-rate-limit";

// // // Import all route modules
// // import userRoutes from "./routes/user.routes.js";
// // import videoRoutes from "./routes/video.routes.js";
// // import commentRoutes from "./routes/comment.routes.js";
// // import likeRoutes from "./routes/like.routes.js";
// // import playlistRoutes from "./routes/playlist.routes.js";
// // import subscriptionRoutes from "./routes/subscription.routes.js";
// // import libraryRoutes from "./routes/library.routes.js"; // ✅ ADDED LIBRARY ROUTES
// // import searchRoutes from "./routes/search.routes.js";
// // const app = express();

// // // ==========================================
// // // SECURITY MIDDLEWARE
// // // ==========================================
// // app.use(
// //   helmet({
// //     crossOriginEmbedderPolicy: false, // Fix for video streaming
// //     contentSecurityPolicy: {
// //       directives: {
// //         defaultSrc: ["'self'"],
// //         styleSrc: ["'self'", "'unsafe-inline'"],
// //         scriptSrc: ["'self'"],
// //         imgSrc: ["'self'", "data:", "https:"],
// //         mediaSrc: ["'self'", "https:"], // Allow video streaming
// //       },
// //     },
// //   })
// // );

// // // ==========================================
// // // CORS CONFIGURATION
// // // ==========================================
// // app.use(
// //   cors({
// //     origin: function (origin, callback) {
// //       // Allow requests with no origin (mobile apps, curl, etc.)
// //       const allowedOrigins = [
// //         process.env.CORS_ORIGIN || "http://localhost:5173",
// //         "http://localhost:3000",
// //         "http://localhost:5174",
// //         "http://127.0.0.1:5173",
// //         "http://localhost:8080", // Additional dev port
// //       ];

// //       if (!origin || allowedOrigins.includes(origin)) {
// //         callback(null, true);
// //       } else {
// //         console.warn("⚠️ CORS blocked origin:", origin);
// //         callback(null, false); // ✅ FIXED: Don't throw error, just reject
// //       }
// //     },
// //     credentials: true,
// //     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
// //     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
// //     exposedHeaders: ["X-Total-Count"],
// //     maxAge: 86400, // Cache preflight for 24 hours
// //   })
// // );

// // // Handle preflight requests
// // app.options("*", cors());

// // // ==========================================
// // // BODY PARSING MIDDLEWARE
// // // ==========================================

// // // ✅ FIXED: Safer JSON parsing without verification
// // app.use(
// //   express.json({
// //     limit: "50mb",
// //     strict: true,
// //   })
// // );

// // app.use(
// //   express.urlencoded({
// //     extended: true,
// //     limit: "50mb",
// //     parameterLimit: 1000,
// //   })
// // );

// // app.use(cookieParser());

// // // ==========================================
// // // DEVELOPMENT DEBUGGING MIDDLEWARE
// // // ==========================================
// // if (process.env.NODE_ENV !== "production") {
// //   app.use((req, res, next) => {
// //     const timestamp = new Date().toISOString();
// //     const method = req.method.padEnd(6);
// //     const path = req.path.padEnd(30);

// //     console.log(`🔍 [${timestamp}] ${method} ${path}`);

// //     // Log query params if present
// //     if (Object.keys(req.query).length > 0) {
// //       console.log(`   📋 Query:`, req.query);
// //     }

// //     // Log body for POST/PUT/PATCH (but limit size)
// //     if (
// //       req.body &&
// //       Object.keys(req.body).length > 0 &&
// //       ["POST", "PUT", "PATCH"].includes(req.method)
// //     ) {
// //       const bodyStr = JSON.stringify(req.body);
// //       const truncatedBody =
// //         bodyStr.length > 200 ? bodyStr.substring(0, 200) + "..." : bodyStr;
// //       console.log(`   📄 Body:`, truncatedBody);
// //     }

// //     // Log auth status
// //     if (req.headers.authorization) {
// //       console.log(`   🔐 Auth: Token present`);
// //     }

// //     next();
// //   });
// // }

// // // ==========================================
// // // RATE LIMITING
// // // ==========================================
// // const authLimiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100,
// //   message: {
// //     success: false,
// //     error: "Too many authentication attempts, please try again later",
// //     retryAfter: "15 minutes",
// //   },
// //   standardHeaders: true,
// //   legacyHeaders: false,
// //   keyGenerator: (req) => {
// //     return req.ip + ":" + req.headers["user-agent"];
// //   },
// // });

// // // Apply rate limiting to auth endpoints
// // app.use("/api/users/login", authLimiter);
// // app.use("/api/users/register", authLimiter);
// // app.use("/api/users/refresh-token", authLimiter);

// // // General API rate limiter (more lenient)
// // const apiLimiter = rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   max: 1000, // 1000 requests per 15 minutes
// //   standardHeaders: true,
// //   legacyHeaders: false,
// // });

// // app.use("/api/", apiLimiter);

// // // ==========================================
// // // HEALTH CHECK ROUTES
// // // ==========================================

// // // Root health check
// // app.get("/", (req, res) => {
// //   res.json({
// //     success: true,
// //     message: "🚀 Video Platform API is running!",
// //     timestamp: new Date().toISOString(),
// //     environment: process.env.NODE_ENV || "development",
// //     version: "1.0.0",
// //   });
// // });

// // // Detailed API health check
// // app.get("/api/health", (req, res) => {
// //   const healthInfo = {
// //     success: true,
// //     status: "✅ Healthy",
// //     timestamp: new Date().toISOString(),
// //     uptime: `${Math.floor(process.uptime())} seconds`,
// //     memory: {
// //       used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
// //       total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
// //     },
// //     routes: {
// //       users: "✅ Mounted at /api/users",
// //       videos: "✅ Mounted at /api/videos",
// //       comments: "✅ Mounted at /api/comments",
// //       likes: "✅ Mounted at /api/likes",
// //       playlists: "✅ Mounted at /api/playlists",
// //       subscriptions: "✅ Mounted at /api/subscriptions",
// //       library: "✅ Mounted at /api/library", // ✅ ADDED
// //     },
// //     features: {
// //       authentication: "✅ JWT + Refresh Token",
// //       fileUpload: "✅ Multer + Cloud Storage",
// //       videoStreaming: "✅ HLS + Progressive",
// //       library: "✅ Watch Later, History, Liked", // ✅ ADDED
// //       realtime: "✅ WebSocket Events",
// //     },
// //   };

// //   res.json(healthInfo);
// // });

// // // ==========================================
// // // API ROUTES MOUNTING
// // // ==========================================

// // console.log("🚀 Mounting API routes...");

// // // Mount routes with enhanced logging
// // const mountRoute = (path, router, name) => {
// //   app.use(
// //     path,
// //     (req, res, next) => {
// //       if (process.env.NODE_ENV !== "production") {
// //         console.log(
// //           `📍 [${name.toUpperCase()}] ${req.method} ${path}${req.path}`
// //         );
// //       }
// //       next();
// //     },
// //     router
// //   );
// //   console.log(`✅ ${name} routes mounted at ${path}`);
// // };

// // // Mount all routes
// // mountRoute("/api/users", userRoutes, "User");
// // mountRoute("/api/videos", videoRoutes, "Video");
// // mountRoute("/api/comments", commentRoutes, "Comment");
// // mountRoute("/api/likes", likeRoutes, "Like");
// // mountRoute("/api/playlists", playlistRoutes, "Playlist");
// // mountRoute("/api/subscriptions", subscriptionRoutes, "Subscription");
// // mountRoute("/api/library", libraryRoutes, "Library"); // ✅ ADDED LIBRARY ROUTES

// // console.log("✅ All routes mounted successfully!");

// // // ==========================================
// // // API DOCUMENTATION ROUTE
// // // ==========================================
// // app.get("/api/docs", (req, res) => {
// //   res.json({
// //     success: true,
// //     message: "📚 API Documentation",
// //     baseUrl: `${req.protocol}://${req.get("host")}/api`,
// //     endpoints: {
// //       authentication: {
// //         "POST /users/register": "Register new user",
// //         "POST /users/login": "User login",
// //         "POST /users/logout": "User logout",
// //         "POST /users/refresh-token": "Refresh access token",
// //       },
// //       users: {
// //         "GET /users/me": "Get current user",
// //         "PATCH /users/profile": "Update user profile",
// //         "PATCH /users/avatar": "Update user avatar",
// //         "GET /users/search": "Search users",
// //       },
// //       videos: {
// //         "GET /videos": "Get all videos",
// //         "POST /videos": "Upload new video",
// //         "GET /videos/:id": "Get video by ID",
// //         "PATCH /videos/:id": "Update video",
// //         "DELETE /videos/:id": "Delete video",
// //       },
// //       library: {
// //         "GET /library/watchlater": "Get watch later videos",
// //         "POST /library/watchlater": "Add to watch later",
// //         "DELETE /library/watchlater/:videoId": "Remove from watch later",
// //         "GET /library/history": "Get watch history",
// //         "POST /library/history": "Add to history",
// //         "DELETE /library/history": "Clear history",
// //         "GET /library/liked": "Get liked videos",
// //       },
// //       social: {
// //         "POST /likes": "Like/unlike video",
// //         "POST /comments": "Add comment",
// //         "POST /subscriptions": "Subscribe to channel",
// //       },
// //     },
// //     authentication: "Bearer token required for protected endpoints",
// //     rateLimit: "100 auth requests per 15min, 1000 API requests per 15min",
// //     timestamp: new Date().toISOString(),
// //   });
// // });

// // // ==========================================
// // // CATCH-ALL 404 HANDLER
// // // ==========================================
// // app.use("*", (req, res) => {
// //   console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);

// //   // Suggest similar routes
// //   const suggestions = [];
// //   if (req.originalUrl.includes("/user")) suggestions.push("/api/users");
// //   if (req.originalUrl.includes("/video")) suggestions.push("/api/videos");
// //   if (req.originalUrl.includes("/library")) suggestions.push("/api/library");

// //   res.status(404).json({
// //     success: false,
// //     error: "Route not found",
// //     message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
// //     suggestions:
// //       suggestions.length > 0
// //         ? suggestions
// //         : [
// //             "Check /api/docs for available endpoints",
// //             "Verify the HTTP method and path",
// //             "Ensure you're using the correct base URL",
// //           ],
// //     availableRoutes: {
// //       "GET /": "API status",
// //       "GET /api/health": "Detailed health check",
// //       "GET /api/docs": "API documentation",
// //       "POST /api/users/register": "User registration",
// //       "POST /api/users/login": "User login",
// //       "/api/users/*": "User management",
// //       "/api/videos/*": "Video management",
// //       "/api/library/*": "Library features", // ✅ ADDED
// //       "/api/comments/*": "Comments",
// //       "/api/likes/*": "Likes/Dislikes",
// //       "/api/playlists/*": "Playlists",
// //       "/api/subscriptions/*": "Subscriptions",
// //     },
// //     timestamp: new Date().toISOString(),
// //   });
// // });

// // // ==========================================
// // // GLOBAL ERROR HANDLER (Must be last)
// // // ==========================================
// // app.use((err, req, res, next) => {
// //   // Log the error with full context
// //   console.error("❌ Global Error Handler:");
// //   console.error("   URL:", req.method, req.originalUrl);
// //   console.error("   IP:", req.ip);
// //   console.error("   User-Agent:", req.headers["user-agent"]);
// //   console.error("   Error:", err.message);
// //   console.error("   Stack:", err.stack);

// //   // Determine error status
// //   const status = err.statusCode || err.status || 500;

// //   // Handle specific error types
// //   let errorResponse = {
// //     success: false,
// //     error: "Internal Server Error",
// //     message: "Something went wrong on our end",
// //     timestamp: new Date().toISOString(),
// //   };

// //   // JWT errors
// //   if (err.name === "JsonWebTokenError") {
// //     errorResponse.error = "Invalid token";
// //     errorResponse.message = "Please log in again";
// //     return res.status(401).json(errorResponse);
// //   }

// //   if (err.name === "TokenExpiredError") {
// //     errorResponse.error = "Token expired";
// //     errorResponse.message = "Please refresh your token or log in again";
// //     return res.status(401).json(errorResponse);
// //   }

// //   // Validation errors
// //   if (err.name === "ValidationError") {
// //     errorResponse.error = "Validation failed";
// //     errorResponse.message = err.message;
// //     errorResponse.details = err.errors;
// //     return res.status(400).json(errorResponse);
// //   }

// //   // MongoDB errors
// //   if (err.name === "MongoError" || err.name === "MongoServerError") {
// //     if (err.code === 11000) {
// //       errorResponse.error = "Duplicate entry";
// //       errorResponse.message = "This resource already exists";
// //       return res.status(409).json(errorResponse);
// //     }
// //   }

// //   // CORS errors
// //   if (err.message === "Not allowed by CORS") {
// //     errorResponse.error = "CORS Policy Violation";
// //     errorResponse.message =
// //       "Your origin is not allowed to access this resource";
// //     return res.status(403).json(errorResponse);
// //   }

// //   // Rate limiting errors
// //   if (err.status === 429) {
// //     errorResponse.error = "Rate limit exceeded";
// //     errorResponse.message = "Too many requests, please slow down";
// //     errorResponse.retryAfter = err.retryAfter;
// //     return res.status(429).json(errorResponse);
// //   }

// //   // Custom API errors
// //   if (status < 500) {
// //     errorResponse.error = err.message || "Bad Request";
// //     errorResponse.message = err.message || "The request could not be processed";
// //   }

// //   // Add debug info in development
// //   if (process.env.NODE_ENV !== "production") {
// //     errorResponse.debug = {
// //       stack: err.stack,
// //       details: err,
// //     };
// //   }

// //   res.status(status).json(errorResponse);
// // });

// // // ==========================================
// // // GRACEFUL SHUTDOWN HANDLERS
// // // ==========================================
// // process.on("uncaughtException", (err) => {
// //   console.error("❌ Uncaught Exception:", err);
// //   console.error("🔄 Shutting down gracefully...");
// //   process.exit(1);
// // });

// // process.on("unhandledRejection", (reason, promise) => {
// //   console.error("❌ Unhandled Rejection at:", promise);
// //   console.error("❌ Reason:", reason);
// //   console.error("🔄 Shutting down gracefully...");
// //   process.exit(1);
// // });

// // // Export the app
// // export default app;
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
// import libraryRoutes from "./routes/library.routes.js";
// import searchRoutes from "./routes/search.routes.js";

// const app = express();

// // ==========================================
// // SECURITY MIDDLEWARE
// // ==========================================
// app.use(
//   helmet({
//     crossOriginEmbedderPolicy: false, // Allow video streaming
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "https:"],
//         mediaSrc: ["'self'", "https:"], // Video streaming
//         connectSrc: ["'self'", "https:", "ws:", "wss:"], // WebSocket
//       },
//     },
//   })
// );

// // ==========================================
// // CORS CONFIGURATION (CRITICAL FOR VERCEL)
// // ==========================================
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       const allowedOrigins = [
//         process.env.CORS_ORIGIN || "http://localhost:5173",
//         "http://localhost:3000",
//         "http://localhost:5174",
//         "http://127.0.0.1:5173",
//         "https://momentum-jqml-git-main-aashu01s-projects.vercel.app", // ✅ YOUR VERCEL URL
//         // Add more Vercel URLs as needed
//       ];

//       // Allow requests without origin (mobile apps, curl, etc.)
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.warn("⚠️ CORS blocked origin:", origin);
//         callback(null, false);
//       }
//     },
//     credentials: true,
//     methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//     exposedHeaders: ["X-Total-Count", "X-Page-Count"],
//     maxAge: 86400, // 24 hours cache for preflight
//   })
// );

// // Handle preflight OPTIONS requests explicitly
// app.options("*", (req, res) => {
//   res.header("Access-Control-Allow-Origin", req.headers.origin);
//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
//   );
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Content-Type,Authorization,X-Requested-With"
//   );
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.sendStatus(200);
// });

// // ==========================================
// // BODY PARSING MIDDLEWARE
// // ==========================================
// app.use(express.json({ limit: "50mb", strict: true }));
// app.use(
//   express.urlencoded({
//     limit: "50mb",
//     extended: true,
//     parameterLimit: 1000,
//   })
// );
// app.use(cookieParser());

// // ==========================================
// // RATE LIMITING
// // ==========================================
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Max 100 requests per window
//   message: {
//     success: false,
//     error: "Too many authentication attempts, please try again later",
//     retryAfter: "15 minutes",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) =>
//     req.ip + ":" + (req.headers["user-agent"] || "unknown"),
// });

// // Apply rate limiting to auth endpoints
// app.use("/api/users/login", authLimiter);
// app.use("/api/users/register", authLimiter);
// app.use("/api/users/refresh-token", authLimiter);

// // General API rate limiter
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000, // Max 1000 requests per window
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use("/api/", apiLimiter);

// // Search rate limiter
// const searchLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 60, // Max 60 searches per minute
// });
// app.use("/api/search", searchLimiter);

// // ==========================================
// // DEVELOPMENT LOGGING
// // ==========================================
// if (process.env.NODE_ENV !== "production") {
//   app.use((req, res, next) => {
//     console.log(`🔍 ${req.method} ${req.originalUrl}`);
//     if (Object.keys(req.query).length > 0) {
//       console.log("   Query:", req.query);
//     }
//     if (req.headers.authorization) {
//       console.log("   🔐 Auth: Token present");
//     }
//     next();
//   });
// }

// // ==========================================
// // ROUTE MOUNTING FUNCTION
// // ==========================================
// function mountRoute(path, router, name, description) {
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
//   console.log(`✅ ${name} routes mounted at ${path} - ${description}`);
// }

// // ==========================================
// // MOUNT ALL ROUTES
// // ==========================================
// console.log("🚀 Mounting API routes...");

// mountRoute(
//   "/api/users",
//   userRoutes,
//   "User",
//   "Authentication & Profile Management"
// );
// mountRoute("/api/videos", videoRoutes, "Video", "Video Upload & Management");
// mountRoute(
//   "/api/comments",
//   commentRoutes,
//   "Comment",
//   "Video Comments & Replies"
// );
// mountRoute("/api/likes", likeRoutes, "Like", "Like/Dislike System");
// mountRoute("/api/playlists", playlistRoutes, "Playlist", "User Playlists");
// mountRoute(
//   "/api/subscriptions",
//   subscriptionRoutes,
//   "Subscription",
//   "Channel Subscriptions"
// );
// mountRoute(
//   "/api/library",
//   libraryRoutes,
//   "Library",
//   "Watch Later, History & Liked Videos"
// );
// mountRoute(
//   "/api/search",
//   searchRoutes,
//   "Search",
//   "Full-text Video & User Search"
// );

// console.log("✅ All routes mounted successfully!");

// // ==========================================
// // HEALTH CHECK ROUTES
// // ==========================================
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "🚀 Video Platform API is running!",
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || "development",
//     version: "2.0.0",
//     features: {
//       authentication: "✅ JWT + Refresh Token",
//       videoStreaming: "✅ HLS + Progressive",
//       library: "✅ Watch Later, History, Liked",
//       search: "✅ Full-text Video & User Search",
//       realtime: "✅ WebSocket Events",
//     },
//   });
// });

// app.get("/api/health", (req, res) => {
//   res.json({
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
//       library: "✅ Mounted at /api/library",
//       search: "✅ Mounted at /api/search",
//     },
//     database: {
//       status: "✅ Connected",
//       indexes: "✅ Text indexes created for search",
//     },
//   });
// });

// // API Documentation
// app.get("/api/docs", (req, res) => {
//   res.json({
//     success: true,
//     message: "📚 Video Platform API Documentation",
//     baseUrl: `${req.protocol}://${req.get("host")}/api`,
//     version: "2.0.0",
//     endpoints: {
//       authentication: {
//         "POST /users/register": "Register new user account",
//         "POST /users/login": "User authentication",
//         "POST /users/logout": "User logout",
//         "POST /users/refresh-token": "Refresh access token",
//       },
//       videos: {
//         "GET /videos": "Get all published videos",
//         "POST /videos": "Upload new video",
//         "GET /videos/:id": "Get video by ID",
//         "PATCH /videos/:id": "Update video details",
//         "DELETE /videos/:id": "Delete video",
//       },
//       library: {
//         "GET /library/watchlater": "Get watch later videos",
//         "POST /library/watchlater": "Add video to watch later",
//         "DELETE /library/watchlater/:videoId": "Remove from watch later",
//         "GET /library/history": "Get watch history",
//         "GET /library/liked": "Get liked videos",
//       },
//       search: {
//         "GET /search/videos": "Search videos with full-text",
//         "GET /search/users": "Search users by name/email",
//       },
//     },
//     timestamp: new Date().toISOString(),
//   });
// });

// // ==========================================
// // ERROR HANDLERS
// // ==========================================

// // 404 Handler
// app.use("*", (req, res) => {
//   console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);

//   res.status(404).json({
//     success: false,
//     error: "Route not found",
//     message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
//     availableRoutes: {
//       "GET /": "API status",
//       "GET /api/health": "Detailed health check",
//       "GET /api/docs": "API documentation",
//       "/api/users/*": "User management & authentication",
//       "/api/videos/*": "Video upload & management",
//       "/api/library/*": "Library features",
//       "/api/search/*": "Search functionality",
//     },
//     timestamp: new Date().toISOString(),
//   });
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//   console.error("❌ Global Error Handler:");
//   console.error("   URL:", req.method, req.originalUrl);
//   console.error("   IP:", req.ip);
//   console.error("   Error:", err.message);
//   console.error("   Stack:", err.stack);

//   const status = err.statusCode || err.status || 500;

//   let errorResponse = {
//     success: false,
//     error: "Internal Server Error",
//     message: "Something went wrong on our end",
//     timestamp: new Date().toISOString(),
//   };

//   // Handle specific error types
//   if (err.name === "JsonWebTokenError") {
//     errorResponse = {
//       success: false,
//       error: "Invalid token",
//       message: "Please log in again",
//       timestamp: new Date().toISOString(),
//     };
//     return res.status(401).json(errorResponse);
//   }

//   if (err.name === "TokenExpiredError") {
//     errorResponse = {
//       success: false,
//       error: "Token expired",
//       message: "Please refresh your token or log in again",
//       timestamp: new Date().toISOString(),
//     };
//     return res.status(401).json(errorResponse);
//   }

//   // Custom API errors
//   if (status >= 400 && status < 500) {
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
// // GRACEFUL SHUTDOWN
// // ==========================================
// process.on("uncaughtException", (err) => {
//   console.error("❌ Uncaught Exception:", err);
//   process.exit(1);
// });

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("❌ Unhandled Rejection:", reason);
//   process.exit(1);
// });

// export default app;
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
import libraryRoutes from "./routes/library.routes.js";
import searchRoutes from "./routes/search.routes.js";

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow video streaming
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "https:"],
        connectSrc: [
          "'self'",
          "https:",
          "ws:",
          "wss:",
          "https://vidora-frontend-vb.onrender.com", // ✅ Allow frontend domain
        ],
      },
    },
  })
);

// ==========================================
// CORS CONFIGURATION
// ==========================================
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CORS_ORIGIN || "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "https://momentum-jqml-git-main-aashu01s-projects.vercel.app",
        "https://vidora-frontend-vb.onrender.com", // ✅ Render frontend
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("⚠️ CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS")); // ✅ explicit rejection
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    maxAge: 86400, // 24h cache
  })
);

// Handle preflight OPTIONS
app.options("*", cors());

// ==========================================
// BODY PARSING MIDDLEWARE
// ==========================================
app.use(express.json({ limit: "50mb", strict: true }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 1000,
  })
);
app.use(cookieParser());

// ==========================================
// RATE LIMITING
// ==========================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.ip + ":" + (req.headers["user-agent"] || "unknown"),
});
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/refresh-token", authLimiter);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use("/api/search", searchLimiter);

// ==========================================
// DEVELOPMENT LOGGING
// ==========================================
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.query).length > 0) console.log("   Query:", req.query);
    if (req.headers.authorization) console.log("   🔐 Auth: Token present");
    next();
  });
}

// ==========================================
// ROUTE MOUNTING FUNCTION
// ==========================================
function mountRoute(path, router, name, description) {
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
}

// ==========================================
// MOUNT ALL ROUTES
// ==========================================
console.log("🚀 Mounting API routes...");

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
);
mountRoute(
  "/api/search",
  searchRoutes,
  "Search",
  "Full-text Video & User Search"
);

console.log("✅ All routes mounted successfully!");

// ==========================================
// HEALTH CHECK ROUTES
// ==========================================
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

app.get("/api/health", (req, res) => {
  res.json({
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
      library: "✅ Mounted at /api/library",
      search: "✅ Mounted at /api/search",
    },
    database: {
      status: "✅ Connected",
      indexes: "✅ Text indexes created for search",
    },
  });
});

// ==========================================
// API DOCUMENTATION
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
      videos: {
        "GET /videos": "Get all published videos",
        "POST /videos": "Upload new video",
        "GET /videos/:id": "Get video by ID",
        "PATCH /videos/:id": "Update video details",
        "DELETE /videos/:id": "Delete video",
      },
      library: {
        "GET /library/watchlater": "Get watch later videos",
        "POST /library/watchlater": "Add video to watch later",
        "DELETE /library/watchlater/:videoId": "Remove from watch later",
        "GET /library/history": "Get watch history",
        "GET /library/liked": "Get liked videos",
      },
      search: {
        "GET /search/videos": "Search videos with full-text",
        "GET /search/users": "Search users by name/email",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ERROR HANDLERS
// ==========================================
app.use("*", (req, res) => {
  console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableRoutes: {
      "GET /": "API status",
      "GET /api/health": "Detailed health check",
      "GET /api/docs": "API documentation",
      "/api/users/*": "User management & authentication",
      "/api/videos/*": "Video upload & management",
      "/api/library/*": "Library features",
      "/api/search/*": "Search functionality",
    },
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:");
  console.error("   URL:", req.method, req.originalUrl);
  console.error("   IP:", req.ip);
  console.error("   Error:", err.message);
  console.error("   Stack:", err.stack);

  const status = err.statusCode || err.status || 500;
  let errorResponse = {
    success: false,
    error: "Internal Server Error",
    message: "Something went wrong on our end",
    timestamp: new Date().toISOString(),
  };

  if (err.name === "JsonWebTokenError") {
    errorResponse = {
      success: false,
      error: "Invalid token",
      message: "Please log in again",
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorResponse);
  }

  if (err.name === "TokenExpiredError") {
    errorResponse = {
      success: false,
      error: "Token expired",
      message: "Please refresh your token or log in again",
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(errorResponse);
  }

  if (err.message === "Not allowed by CORS") {
    errorResponse = {
      success: false,
      error: "CORS Policy Violation",
      message: "Your origin is not allowed to access this resource",
      timestamp: new Date().toISOString(),
    };
    return res.status(403).json(errorResponse);
  }

  if (status >= 400 && status < 500) {
    errorResponse.error = err.message || "Bad Request";
    errorResponse.message = err.message || "The request could not be processed";
  }

  if (process.env.NODE_ENV !== "production") {
    errorResponse.debug = {
      stack: err.stack,
      details: err,
    };
  }

  res.status(status).json(errorResponse);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

export default app;
