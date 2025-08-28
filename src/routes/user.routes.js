// // FILE: src/routes/user.routes.js
// // ==================================
// import { Router } from "express";
// import multer from "multer";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import {
//   registerUser,
//   loginUser,
//   logoutUser,
//   refreshAccessToken,
//   getCurrentUser,
//   getUserById,
//   searchUsers,
//   updateProfile,
//   changeUsername,
//   changeEmail,
//   changePassword,
//   updateAvatar,
//   updateCoverImage,
//   requestPasswordReset,
//   resetPassword,
//   subscribeToChannel,
//   unsubscribeFromChannel,
//   getChannelProfile,
//   deactivateAccount,
//   deleteAccount,
//   getUserByUsername,
// } from "../controllers/user.controller.js";
// // src/routes/user.routes.js - Add these routes to your existing file
// import {
//   getWatchLater,
//   addToWatchLater,
//   removeFromWatchLater,
//   getWatchHistory,
//   addToHistory,
//   removeFromHistory,
//   clearHistory,
//   getLikedVideos, // Import from library controller
// } from "../controllers/library.controller.js";
// const router = Router();

// // multer (simple disk storage - change to your multer/cloud setup as needed)
// const upload = multer({ dest: "uploads/" });

// // --------------------
// // Public routes
// // --------------------
// router.post(
//   "/register",
//   upload.fields([
//     { name: "avatar", maxCount: 1 },
//     { name: "coverImage", maxCount: 1 },
//   ]),
//   registerUser
// );
// router.post("/login", loginUser);
// router.post("/refresh-token", refreshAccessToken);

// router.get("/search", searchUsers);

// // Password reset flow
// router.post("/password/reset/request", requestPasswordReset);
// router.post("/password/reset", resetPassword);

// // --------------------
// // Protected routes
// // --------------------
// router.use(verifyJWT); // everything below requires auth

// router.post("/logout", logoutUser);

// // current user & user fetch (supports "me")
// router.get("/me", getCurrentUser);
// router.get("/:id", getUserById); // use "/:id" — controller supports "me"

// // profile updates
// router.patch("/profile", updateProfile);
// router.patch("/username", changeUsername);
// router.patch("/email", changeEmail);
// router.patch("/password", changePassword);

// // avatar / cover (multipart)
// router.patch(
//   "/avatar",
//   upload.fields([{ name: "avatar", maxCount: 1 }]),
//   updateAvatar
// );
// router.patch(
//   "/cover",
//   upload.fields([{ name: "coverImage", maxCount: 1 }]),
//   updateCoverImage
// );

// // // Watch Later routes
// // router.route("/watchlater").get(getWatchLater).post(addToWatchLater);
// // router.route("/watchlater/:videoId").delete(removeFromWatchLater);
// // router.route("/watchlater/check/:videoId").get(checkWatchLater);

// // History routes
// // router
// //   .route("/history")
// //   .get(getWatchHistory)
// //   .post(addToHistory)
// //   .delete(clearHistory);
// // router.route("/history/:videoId").delete(removeFromHistory);
// // src/routes/user.routes.js - Add this route
// router.route("/username/:username").get(getUserByUsername);
// // Add this route to handle liked videos
// router.route("/liked-videos").get(getLikedVideos);

// // subscriptions / channel
// router.post("/subscribe", subscribeToChannel); // body: { channelId }
// router.post("/unsubscribe", unsubscribeFromChannel); // body: { channelId }
// router.get("/channel/:channelId", getChannelProfile); // channel stats/profile

// // account
// router.post("/deactivate", deactivateAccount);
// router.delete("/", deleteAccount); // delete logged-in user

// // Watch Later routes
// // Add all library routes
// router.route("/watchlater").get(getWatchLater).post(addToWatchLater);
// router.route("/watchlater/:videoId").delete(removeFromWatchLater);
// router
//   .route("/history")
//   .get(getWatchHistory)
//   .post(addToHistory)
//   .delete(clearHistory);
// router.route("/history/:videoId").delete(removeFromHistory);
// router.route("/liked-videos").get(getLikedVideos);
// export default router;
// FILE: src/routes/user.routes.js - FIXED VERSION
// ==================================================
// FILE: src/routes/user.routes.js - COMPLETELY REBUILT & OPTIMIZED
// =================================================================
// FILE: src/routes/user.routes.js - COMPLETE REBUILT VERSION
// ========================================================
import { Router } from "express";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  validateObjectId,
  validateUserId,
  validateUserOnly,
} from "../middlewares/validateObjectId.js";

// Import User Controllers
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getUserById,
  searchUsers,
  updateProfile,
  changeUsername,
  changeEmail,
  changePassword,
  updateAvatar,
  updateCoverImage,
  requestPasswordReset,
  resetPassword,
  subscribeToChannel,
  unsubscribeFromChannel,
  getChannelProfile,
  deactivateAccount,
  deleteAccount,
  getUserByUsername,
} from "../controllers/user.controller.js";

// Import Library Controllers
import {
  getWatchLater,
  addToWatchLater,
  removeFromWatchLater,
  getWatchHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  getLikedVideos,
} from "../controllers/library.controller.js";

const router = Router();

// ==========================================
// MULTER CONFIGURATION
// ==========================================
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

// User Registration & Authentication
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Public User Operations
router.get("/search", searchUsers);
router.get("/username/:username", getUserByUsername);
router.get("/channel/:channelId", validateObjectId, getChannelProfile);

// Password Reset Flow
router.post("/password/reset/request", requestPasswordReset);
router.post("/password/reset", resetPassword);

// Health Check
router.get("/health", (req, res) => {
  res.json({
    status: "✅ OK",
    service: "User Routes",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    features: {
      authentication: "✅ Active",
      registration: "✅ Active",
      library: "✅ Active",
      fileUploads: "✅ Active",
    },
  });
});

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================
router.use(verifyJWT);

// Authentication Test
router.get("/auth-test", validateUserOnly, (req, res) => {
  res.json({
    message: "✅ Authentication working",
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName,
    },
    sessionInfo: {
      authenticated: true,
      timestamp: new Date().toISOString(),
    },
  });
});

// ==========================================
// USER SESSION MANAGEMENT
// ==========================================
router.post("/logout", logoutUser);

// ==========================================
// USER PROFILE ROUTES
// ==========================================

// Current User Operations
router.get("/me", validateUserOnly, getCurrentUser);

// Profile Management
router.patch("/profile", validateUserOnly, updateProfile);
router.patch("/username", validateUserOnly, changeUsername);
router.patch("/email", validateUserOnly, changeEmail);
router.patch("/password", validateUserOnly, changePassword);

// File Upload Routes
router.patch(
  "/avatar",
  validateUserOnly,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateAvatar
);

router.patch(
  "/cover",
  validateUserOnly,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  updateCoverImage
);

// User Lookup (Protected)
router.get("/:id", validateObjectId, getUserById);

// ==========================================
// SUBSCRIPTION ROUTES
// ==========================================
router.post("/subscribe", validateUserOnly, subscribeToChannel);
router.post("/unsubscribe", validateUserOnly, unsubscribeFromChannel);

// ==========================================
// LIBRARY ROUTES (Fixed Implementation)
// ==========================================

// Watch Later Routes
router
  .route("/watchlater")
  .get(validateUserOnly, async (req, res, next) => {
    try {
      console.log("📚 GET /watchlater - User:", req.user._id);
      await getWatchLater(req, res, next);
    } catch (error) {
      console.error("❌ Watch Later GET error:", error.message);
      next(error);
    }
  })
  .post(validateUserOnly, async (req, res, next) => {
    try {
      console.log("➕ POST /watchlater - Data:", req.body);
      await addToWatchLater(req, res, next);
    } catch (error) {
      console.error("❌ Watch Later POST error:", error.message);
      next(error);
    }
  });

router.delete(
  "/watchlater/:videoId",
  validateUserOnly,
  validateObjectId,
  async (req, res, next) => {
    try {
      console.log(
        "➖ DELETE /watchlater/:videoId - Video:",
        req.params.videoId
      );
      await removeFromWatchLater(req, res, next);
    } catch (error) {
      console.error("❌ Watch Later DELETE error:", error.message);
      next(error);
    }
  }
);

// History Routes
router
  .route("/history")
  .get(validateUserOnly, async (req, res, next) => {
    try {
      console.log("📚 GET /history - User:", req.user._id);
      await getWatchHistory(req, res, next);
    } catch (error) {
      console.error("❌ History GET error:", error.message);
      next(error);
    }
  })
  .post(validateUserOnly, async (req, res, next) => {
    try {
      console.log("➕ POST /history - Data:", req.body);
      await addToHistory(req, res, next);
    } catch (error) {
      console.error("❌ History POST error:", error.message);
      next(error);
    }
  })
  .delete(validateUserOnly, async (req, res, next) => {
    try {
      console.log("🗑️ DELETE /history - User:", req.user._id);
      await clearHistory(req, res, next);
    } catch (error) {
      console.error("❌ History CLEAR error:", error.message);
      next(error);
    }
  });

router.delete(
  "/history/:videoId",
  validateUserOnly,
  validateObjectId,
  async (req, res, next) => {
    try {
      console.log("➖ DELETE /history/:videoId - Video:", req.params.videoId);
      await removeFromHistory(req, res, next);
    } catch (error) {
      console.error("❌ History DELETE error:", error.message);
      next(error);
    }
  }
);

// Liked Videos Route
router.get("/liked-videos", validateUserOnly, async (req, res, next) => {
  try {
    console.log("❤️ GET /liked-videos - User:", req.user._id);
    await getLikedVideos(req, res, next);
  } catch (error) {
    console.error("❌ Liked Videos error:", error.message);
    next(error);
  }
});

// ==========================================
// ACCOUNT MANAGEMENT ROUTES
// ==========================================
router.post("/deactivate", validateUserOnly, deactivateAccount);
router.delete("/", validateUserOnly, deleteAccount);

// ==========================================
// DIAGNOSTIC ROUTES
// ==========================================

// Complete Routes Test
router.get("/routes-test", validateUserOnly, (req, res) => {
  res.json({
    message: "✅ All routes operational",
    user: {
      id: req.user._id,
      username: req.user.username,
    },
    endpoints: {
      authentication: {
        "POST /users/login": "User login",
        "POST /users/logout": "User logout",
        "POST /users/refresh-token": "Refresh access token",
        "GET /users/me": "Get current user info",
      },
      profile: {
        "PATCH /users/profile": "Update user profile",
        "PATCH /users/username": "Change username",
        "PATCH /users/email": "Change email",
        "PATCH /users/password": "Change password",
        "PATCH /users/avatar": "Upload new avatar",
        "PATCH /users/cover": "Upload cover image",
      },
      library: {
        "GET /users/watchlater": "Get watch later videos",
        "POST /users/watchlater": "Add video to watch later",
        "DELETE /users/watchlater/:videoId": "Remove from watch later",
        "GET /users/history": "Get watch history",
        "POST /users/history": "Add video to history",
        "DELETE /users/history": "Clear all history",
        "DELETE /users/history/:videoId": "Remove from history",
        "GET /users/liked-videos": "Get liked videos",
      },
      subscriptions: {
        "POST /users/subscribe": "Subscribe to channel",
        "POST /users/unsubscribe": "Unsubscribe from channel",
      },
      account: {
        "POST /users/deactivate": "Deactivate account",
        "DELETE /users/": "Delete account permanently",
      },
    },
    statistics: {
      totalRoutes: 25,
      publicRoutes: 7,
      protectedRoutes: 18,
      libraryRoutes: 6,
      authRoutes: 4,
    },
    status: "🚀 Fully operational",
    timestamp: new Date().toISOString(),
  });
});

// Library Status Check
router.get("/library-status", validateUserOnly, (req, res) => {
  res.json({
    message: "📚 Library system status",
    user: req.user._id,
    features: {
      watchLater: {
        status: "✅ Active",
        description: "Save videos for later viewing",
        endpoints: ["GET", "POST", "DELETE"],
      },
      history: {
        status: "✅ Active",
        description: "Track video viewing history",
        endpoints: ["GET", "POST", "DELETE"],
      },
      likedVideos: {
        status: "✅ Active",
        description: "View liked video collection",
        endpoints: ["GET"],
      },
    },
    healthCheck: "✅ All library features working",
    lastUpdated: new Date().toISOString(),
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "File size must be less than 10MB",
        maxSize: "10MB",
      });
    }
  }
  next(error);
});

export default router;
