// src/controllers/history.controller.js
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getWatchHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $unwind: "$watchHistory",
    },
    {
      $sort: { "watchHistory.watchedAt": -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory.video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $match: { isPublished: true },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $unwind: "$video",
    },
    {
      $addFields: {
        "video.watchedAt": "$watchHistory.watchedAt",
      },
    },
    {
      $replaceRoot: { newRoot: "$video" },
    },
  ];

  // Get total count
  const totalCountPipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $project: {
        totalCount: { $size: "$watchHistory" },
      },
    },
  ];

  const [videos, countResult] = await Promise.all([
    User.aggregate(pipeline),
    User.aggregate(totalCountPipeline),
  ]);

  const totalCount = countResult[0]?.totalCount || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: videos,
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

const addToHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new ApiError(404, "Video not found or not published");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Remove existing entry if exists
  user.watchHistory = user.watchHistory.filter(
    (entry) => entry.video.toString() !== videoId
  );

  // Add new entry at the beginning
  user.watchHistory.unshift({
    video: videoId,
    watchedAt: new Date(),
  });

  // Keep only last 1000 entries
  if (user.watchHistory.length > 1000) {
    user.watchHistory = user.watchHistory.slice(0, 1000);
  }

  await user.save();

  return res
    .status(201)
    .json(
      new ApiResponse(201, { video }, "Video added to history successfully")
    );
});

const removeFromHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.watchHistory = user.watchHistory.filter(
    (entry) => entry.video.toString() !== videoId
  );

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video removed from history successfully"));
});

const clearHistory = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { watchHistory: [] } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Watch history cleared successfully"));
});

export { getWatchHistory, addToHistory, removeFromHistory, clearHistory };
