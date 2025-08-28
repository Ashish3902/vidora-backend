// src/routes/library.routes.js - Dedicated Library Routes
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

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

// Apply authentication to all routes
router.use(verifyJWT);

// ==========================================
// WATCH LATER ROUTES
// ==========================================

// GET /api/library/watchlater - Get watch later videos
router.get("/watchlater", getWatchLater);

// POST /api/library/watchlater - Add video to watch later
router.post("/watchlater", addToWatchLater);

// DELETE /api/library/watchlater/:videoId - Remove from watch later
router.delete("/watchlater/:videoId", validateObjectId, removeFromWatchLater);

// ==========================================
// WATCH HISTORY ROUTES
// ==========================================

// GET /api/library/history - Get watch history
router.get("/history", getWatchHistory);

// POST /api/library/history - Add video to history
router.post("/history", addToHistory);

// DELETE /api/library/history - Clear all history
router.delete("/history", clearHistory);

// DELETE /api/library/history/:videoId - Remove specific video from history
router.delete("/history/:videoId", validateObjectId, removeFromHistory);

// ==========================================
// LIKED VIDEOS ROUTES
// ==========================================

// GET /api/library/liked - Get liked videos
router.get("/liked", getLikedVideos);

// ==========================================
// LIBRARY STATUS & INFO ROUTES
// ==========================================

// GET /api/library/status - Library system status
router.get("/status", (req, res) => {
  res.json({
    status: "✅ Library system operational",
    user: req.user._id,
    features: {
      watchLater: "✅ Active",
      history: "✅ Active",
      liked: "✅ Active",
    },
    endpoints: {
      watchLater: [
        "GET /api/library/watchlater",
        "POST /api/library/watchlater",
        "DELETE /api/library/watchlater/:videoId",
      ],
      history: [
        "GET /api/library/history",
        "POST /api/library/history",
        "DELETE /api/library/history",
        "DELETE /api/library/history/:videoId",
      ],
      liked: ["GET /api/library/liked"],
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
