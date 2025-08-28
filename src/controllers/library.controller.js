// src/controllers/library.controller.js - Complete Library Controller
import mongoose from "mongoose";
import { WatchLater, WatchHistory } from "../models/library.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ==========================================
// WATCH LATER CONTROLLERS
// ==========================================

// Get Watch Later Videos
const getWatchLater = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  console.log(`📚 Getting watch later for user: ${req.user._id}`);

  // Get paginated watch later videos
  const watchLaterVideos = await WatchLater.find({ user: req.user._id })
    .populate({
      path: "video",
      match: { isPublished: true },
      populate: {
        path: "owner",
        select: "username fullName avatar",
      },
    })
    .sort({ addedAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out null videos (unpublished/deleted)
  const validVideos = watchLaterVideos
    .filter((item) => item.video)
    .map((item) => ({
      ...item.video.toObject(),
      addedAt: item.addedAt,
    }));

  // Get total count
  const totalCount = await WatchLater.countDocuments({ user: req.user._id });

  console.log(`✅ Found ${validVideos.length} watch later videos`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: validVideos,
        totalDocs: totalCount,
        limit: limit,
        page: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      "Watch later videos fetched successfully"
    )
  );
});

// Add to Watch Later
const addToWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.body;

  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Valid video ID is required");
  }

  console.log(
    `➕ Adding video ${videoId} to watch later for user ${req.user._id}`
  );

  // Check if video exists and is published
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new ApiError(404, "Video not found or not published");
  }

  // Check if already in watch later
  const existingEntry = await WatchLater.findOne({
    user: req.user._id,
    video: videoId,
  });

  if (existingEntry) {
    throw new ApiError(400, "Video already in watch later list");
  }

  // Create new watch later entry
  const watchLaterEntry = new WatchLater({
    user: req.user._id,
    video: videoId,
  });

  await watchLaterEntry.save();

  console.log(`✅ Successfully added video to watch later`);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { videoId, addedAt: watchLaterEntry.addedAt },
        "Video added to watch later successfully"
      )
    );
});

// Remove from Watch Later
const removeFromWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  console.log(
    `➖ Removing video ${videoId} from watch later for user ${req.user._id}`
  );

  const result = await WatchLater.findOneAndDelete({
    user: req.user._id,
    video: videoId,
  });

  if (!result) {
    throw new ApiError(404, "Video not found in watch later list");
  }

  console.log(`✅ Successfully removed video from watch later`);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId },
        "Video removed from watch later successfully"
      )
    );
});

// ==========================================
// WATCH HISTORY CONTROLLERS
// ==========================================

// Get Watch History
const getWatchHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  console.log(`📚 Getting watch history for user: ${req.user._id}`);

  // Get paginated watch history
  const historyVideos = await WatchHistory.find({ user: req.user._id })
    .populate({
      path: "video",
      match: { isPublished: true },
      populate: {
        path: "owner",
        select: "username fullName avatar",
      },
    })
    .sort({ watchedAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out null videos and add watch metadata
  const validVideos = historyVideos
    .filter((item) => item.video)
    .map((item) => ({
      ...item.video.toObject(),
      watchedAt: item.watchedAt,
      watchDuration: item.watchDuration,
      completed: item.completed,
    }));

  // Get total count
  const totalCount = await WatchHistory.countDocuments({ user: req.user._id });

  console.log(`✅ Found ${validVideos.length} history videos`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: validVideos,
        totalDocs: totalCount,
        limit: limit,
        page: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      "Watch history fetched successfully"
    )
  );
});

// Add to History
const addToHistory = asyncHandler(async (req, res) => {
  const { videoId, watchDuration = 0, completed = false } = req.body;

  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Valid video ID is required");
  }

  console.log(`➕ Adding video ${videoId} to history for user ${req.user._id}`);

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new ApiError(404, "Video not found or not published");
  }

  // Remove existing history entry for this video
  await WatchHistory.findOneAndDelete({
    user: req.user._id,
    video: videoId,
  });

  // Create new history entry
  const historyEntry = new WatchHistory({
    user: req.user._id,
    video: videoId,
    watchDuration,
    completed,
    watchedAt: new Date(),
  });

  await historyEntry.save();

  console.log(`✅ Successfully added video to history`);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        videoId,
        watchedAt: historyEntry.watchedAt,
        watchDuration,
        completed,
      },
      "Video added to history successfully"
    )
  );
});

// Remove from History
const removeFromHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  console.log(
    `➖ Removing video ${videoId} from history for user ${req.user._id}`
  );

  const result = await WatchHistory.findOneAndDelete({
    user: req.user._id,
    video: videoId,
  });

  if (!result) {
    throw new ApiError(404, "Video not found in watch history");
  }

  console.log(`✅ Successfully removed video from history`);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId },
        "Video removed from history successfully"
      )
    );
});

// Clear History
const clearHistory = asyncHandler(async (req, res) => {
  console.log(`🗑️ Clearing all history for user ${req.user._id}`);

  const result = await WatchHistory.deleteMany({ user: req.user._id });

  console.log(`✅ Successfully cleared ${result.deletedCount} history entries`);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCount: result.deletedCount },
        "Watch history cleared successfully"
      )
    );
});

// ==========================================
// LIKED VIDEOS CONTROLLER
// ==========================================

// Get Liked Videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  console.log(`❤️ Getting liked videos for user: ${req.user._id}`);

  // Get paginated liked videos
  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true },
  })
    .populate({
      path: "video",
      match: { isPublished: true },
      populate: {
        path: "owner",
        select: "username fullName avatar",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out null videos and add like metadata
  const validVideos = likedVideos
    .filter((item) => item.video)
    .map((item) => ({
      ...item.video.toObject(),
      likedAt: item.createdAt,
    }));

  // Get total count
  const totalCount = await Like.countDocuments({
    likedBy: req.user._id,
    video: { $exists: true },
  });

  console.log(`✅ Found ${validVideos.length} liked videos`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: validVideos,
        totalDocs: totalCount,
        limit: limit,
        page: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      "Liked videos fetched successfully"
    )
  );
});

// Export all controllers
export {
  // Watch Later
  getWatchLater,
  addToWatchLater,
  removeFromWatchLater,

  // Watch History
  getWatchHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,

  // Liked Videos
  getLikedVideos,
};
