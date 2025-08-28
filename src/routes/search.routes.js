// src/routes/search.routes.js - Dedicated search routes
import { Router } from "express";
import {
  searchVideos,
  searchUsers,
  getSearchSuggestions,
} from "../controllers/search.controller.js";

const router = Router();

// ==========================================
// SEARCH ROUTES
// ==========================================

// GET /api/search/videos - Search videos
router.get("/videos", searchVideos);

// GET /api/search/users - Search users
router.get("/users", searchUsers);

// GET /api/search/suggestions - Get search suggestions
router.get("/suggestions", getSearchSuggestions);

// GET /api/search/status - Search system status
router.get("/status", (req, res) => {
  res.json({
    status: "✅ Search system operational",
    features: {
      videoSearch: "✅ Full-text search with relevance scoring",
      userSearch: "✅ Regex-based partial matching",
      suggestions: "✅ Auto-complete suggestions",
      filters: "✅ Date and sort filters",
    },
    endpoints: {
      "GET /api/search/videos": "Search videos with full-text",
      "GET /api/search/users": "Search users by name/email",
      "GET /api/search/suggestions": "Get search suggestions",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
