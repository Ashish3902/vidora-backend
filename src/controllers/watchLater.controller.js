// src/controllers/watchLater.controller.js
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getWatchLater = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchLater",
        foreignField: "_id",
        as: "watchLaterVideos",
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
      $project: {
        watchLaterVideos: {
          $slice: ["$watchLaterVideos", skip, limit],
        },
        totalCount: { $size: "$watchLater" },
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  if (!result.length) {
    throw new ApiError(404, "User not found");
  }

  const { watchLaterVideos, totalCount } = result[0];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: watchLaterVideos,
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

const addToWatchLater = asyncHandler(async (req, res) => {
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

  if (user.watchLater.includes(videoId)) {
    throw new ApiError(400, "Video already in watch later list");
  }

  user.watchLater.push(videoId);
  await user.save();

  return res
    .status(201)
    .json(
      new ApiResponse(201, { video }, "Video added to watch later successfully")
    );
});

const removeFromWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { watchLater: videoId } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Video removed from watch later successfully")
    );
});

const checkWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isInWatchLater = user.watchLater.includes(videoId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isInWatchLater },
        "Watch later status checked successfully"
      )
    );
});

export {
  getWatchLater,
  addToWatchLater,
  removeFromWatchLater,
  checkWatchLater,
};
