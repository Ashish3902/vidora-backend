// src/controllers/search.controller.js - Complete search functionality
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ==========================================
// VIDEO SEARCH CONTROLLER
// ==========================================
const searchVideos = asyncHandler(async (req, res) => {
  const {
    query,
    page = 1,
    limit = 12,
    sortBy = "relevance",
    filter = "all",
  } = req.query;

  // Validate search query
  if (!query || query.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  const searchQuery = query.trim();
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  console.log(`🔍 Searching videos for: "${searchQuery}"`);

  try {
    // Build search filter
    let searchFilter = {
      $text: { $search: searchQuery },
      isPublished: true,
    };

    // Add date filters if specified
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      searchFilter.createdAt = { $gte: today };
    } else if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      searchFilter.createdAt = { $gte: weekAgo };
    } else if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      searchFilter.createdAt = { $gte: monthAgo };
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case "relevance":
        sortCriteria = { score: { $meta: "textScore" } };
        break;
      case "date":
        sortCriteria = { createdAt: -1 };
        break;
      case "views":
        sortCriteria = { views: -1 };
        break;
      case "duration":
        sortCriteria = { duration: 1 };
        break;
      default:
        sortCriteria = { score: { $meta: "textScore" } };
    }

    // Execute search with text score projection
    const videos = await Video.find(
      searchFilter,
      { score: { $meta: "textScore" } } // Project text score for relevance
    )
      .populate({
        path: "owner",
        select: "username fullName avatar",
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalVideos = await Video.countDocuments({
      $text: { $search: searchQuery },
      isPublished: true,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalVideos / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    console.log(`✅ Found ${videos.length} videos out of ${totalVideos} total`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalVideos,
            hasNextPage,
            hasPrevPage,
            limit: limitNum,
          },
          searchQuery,
          sortBy,
          filter,
        },
        `Found ${totalVideos} videos for "${searchQuery}"`
      )
    );
  } catch (error) {
    console.error("❌ Video search error:", error);
    throw new ApiError(500, "Failed to search videos");
  }
});

// ==========================================
// USER SEARCH CONTROLLER
// ==========================================
const searchUsers = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;

  if (!query || query.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  const searchQuery = query.trim();
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  console.log(`🔍 Searching users for: "${searchQuery}"`);

  try {
    // Create regex for partial matching
    const regex = new RegExp(searchQuery, "i");

    const searchFilter = {
      $or: [{ username: regex }, { fullName: regex }, { email: regex }],
    };

    const users = await User.find(searchFilter)
      .select("username fullName avatar email")
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalUsers = await User.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalUsers / limitNum);

    console.log(`✅ Found ${users.length} users out of ${totalUsers} total`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalUsers,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
            limit: limitNum,
          },
          searchQuery,
        },
        `Found ${totalUsers} users for "${searchQuery}"`
      )
    );
  } catch (error) {
    console.error("❌ User search error:", error);
    throw new ApiError(500, "Failed to search users");
  }
});

// ==========================================
// SEARCH SUGGESTIONS CONTROLLER
// ==========================================
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { query, limit = 5 } = req.query;

  if (!query || query.trim() === "") {
    return res
      .status(200)
      .json(new ApiResponse(200, { suggestions: [] }, "No suggestions"));
  }

  const searchQuery = query.trim();
  const limitNum = Math.min(10, Math.max(1, parseInt(limit)));

  console.log(`💡 Getting suggestions for: "${searchQuery}"`);

  try {
    // Get video title suggestions using regex
    const regex = new RegExp(`^${searchQuery}`, "i");

    const suggestions = await Video.find({
      title: regex,
      isPublished: true,
    })
      .select("title")
      .limit(limitNum)
      .lean();

    const suggestionTexts = suggestions.map((video) => video.title);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          suggestions: suggestionTexts,
          query: searchQuery,
        },
        "Search suggestions fetched"
      )
    );
  } catch (error) {
    console.error("❌ Search suggestions error:", error);
    throw new ApiError(500, "Failed to get search suggestions");
  }
});

export { searchVideos, searchUsers, getSearchSuggestions };
