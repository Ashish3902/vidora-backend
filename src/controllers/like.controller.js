// src/controllers/like.controller.js - Simplified for video likes only
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle Video Like Only
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  let isLiked;

  if (existingLike) {
    // Remove like
    await Like.findByIdAndDelete(existingLike._id);
    await Video.findByIdAndUpdate(videoId, {
      $inc: { likes: -1 },
    });
    isLiked = false;
  } else {
    // Add like
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    await Video.findByIdAndUpdate(videoId, {
      $inc: { likes: 1 },
    });
    isLiked = true;
  }

  // Get updated video stats
  const updatedVideo = await Video.findById(videoId, "likes dislikes views");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked,
        totalLikes: updatedVideo.likes,
        totalDislikes: updatedVideo.dislikes || 0,
      },
      `Video ${isLiked ? "liked" : "unliked"} successfully`
    )
  );
});

// Toggle Comment Like (kept for comments)
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  let isLiked;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    isLiked = false;
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    isLiked = true;
  }

  // Get updated like count for this comment
  const likeCount = await Like.countDocuments({ comment: commentId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked,
        totalLikes: likeCount,
      },
      `Comment ${isLiked ? "liked" : "unliked"} successfully`
    )
  );
});

export {
  toggleVideoLike,
  toggleCommentLike,
  // getLikedVideos removed - now in library controller
};
