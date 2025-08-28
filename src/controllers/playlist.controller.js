// src/controllers/playlist.controller.js
import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  if (name.trim().length > 100) {
    throw new ApiError(400, "Playlist name cannot exceed 100 characters");
  }

  if (description && description.length > 500) {
    throw new ApiError(400, "Description cannot exceed 500 characters");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner: req.user._id,
    videos: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const isOwner = userId === req.user._id.toString();

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        ...(isOwner ? {} : { isPublic: true }),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $match: { isPublished: true },
          },
          {
            $project: {
              thumbnail: 1,
              title: 1,
              duration: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videosCount: { $size: "$videoDetails" },
        firstVideoThumbnail: { $arrayElemAt: ["$videoDetails.thumbnail", 0] },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videosCount: 1,
        firstVideoThumbnail: 1,
        isPublic: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: { updatedAt: -1 },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const playlists = await Playlist.aggregatePaginate(
    Playlist.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const isOwner = playlist.owner.toString() === req.user._id.toString();
  if (!playlist.isPublic && !isOwner) {
    throw new ApiError(403, "This playlist is private");
  }

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
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
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $match: { isPublished: true },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "videoOwner",
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
            $unwind: "$videoOwner",
          },
        ],
      },
    },
    {
      $addFields: {
        videosCount: { $size: "$videoDetails" },
        totalDuration: { $sum: "$videoDetails.duration" },
      },
    },
  ];

  const [playlistData] = await Playlist.aggregate(pipeline);

  if (!playlistData) {
    throw new ApiError(404, "Playlist not found");
  }

  // Paginate videos
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedVideos = playlistData.videoDetails.slice(startIndex, endIndex);

  const result = {
    ...playlistData,
    videos: paginatedVideos,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(playlistData.videosCount / parseInt(limit)),
      hasNextPage: endIndex < playlistData.videosCount,
      hasPrevPage: parseInt(page) > 1,
    },
  };

  delete result.videoDetails;

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only modify your own playlists");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.isPublished) {
    throw new ApiError(400, "Cannot add unpublished video to playlist");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in this playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videosCount: playlist.videos.length },
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only modify your own playlists");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video not found in this playlist");
  }

  playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videosCount: playlist.videos.length },
        "Video removed from playlist successfully"
      )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description, isPublic } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own playlists");
  }

  if (name !== undefined) {
    if (!name.trim()) {
      throw new ApiError(400, "Playlist name cannot be empty");
    }
    if (name.trim().length > 100) {
      throw new ApiError(400, "Playlist name cannot exceed 100 characters");
    }
    playlist.name = name.trim();
  }

  if (description !== undefined) {
    if (description.length > 500) {
      throw new ApiError(400, "Description cannot exceed 500 characters");
    }
    playlist.description = description.trim();
  }

  if (isPublic !== undefined) {
    playlist.isPublic = Boolean(isPublic);
  }

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own playlists");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
};
