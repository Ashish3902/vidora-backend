// src/controllers/video.controller.js
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/* ---------- Constants & helpers ---------- */

const CATEGORY_LIST = [
  "General",
  "Music",
  "Gaming",
  "Education",
  "Entertainment",
  "Sports",
  "Technology",
  "Travel",
  "Food",
  "Fitness",
  "Comedy",
  "News",
  "How-to",
  "Vlog",
  "Other",
];

const MAX_LIMIT = 50;

const toInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const toBoolFromString = (v, def) => {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return def;
};

const coercePageLimit = (page, limit) => {
  const p = Math.max(1, toInt(page, 1));
  const l = Math.max(1, Math.min(MAX_LIMIT, toInt(limit, 10)));
  return { page: p, limit: l };
};

const validateTitle = (title) =>
  typeof title === "string" &&
  title.trim().length >= 3 &&
  title.trim().length <= 100;
const validateDescription = (desc) =>
  desc === undefined ||
  desc === null ||
  (typeof desc === "string" && desc.trim().length <= 2000);

const normalizeCategory = (c) => {
  if (!c || typeof c !== "string") return null;
  const exact = CATEGORY_LIST.find((x) => x === c.trim());
  if (exact) return exact;
  const ci = CATEGORY_LIST.find(
    (x) => x.toLowerCase() === c.trim().toLowerCase()
  );
  return ci || null;
};
const normalizeTags = (tags) => {
  if (!tags) return [];
  const arr = Array.isArray(tags)
    ? tags
    : String(tags)
        .split(",")
        .map((t) => t.trim());
  return arr.filter((t) => t.length > 0 && t.length <= 50);
};

const OWNER_PROJECTION = "username email avatar fullName bio";

/* ---------- Public: categories ---------- */
export const getValidCategories = asyncHandler(async (_req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, CATEGORY_LIST, "Categories"));
});

/* ---------- Public: list videos ---------- */
export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    isPublished = "true",
    category,
    duration,
    minViews,
    maxViews,
  } = req.query;

  const { page: P, limit: L } = coercePageLimit(page, limit);
  const match = {};

  if (query) {
    const q = String(query).trim();
    match.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ];
  }
  if (userId && isValidObjectId(userId)) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }
  const pub = toBoolFromString(isPublished, true);
  if (pub !== undefined) match.isPublished = !!pub;
  if (category) match.category = category;

  if (duration) {
    const [min, max] = String(duration)
      .split("-")
      .map((n) => toInt(n, 0));
    if (min && max) match.duration = { $gte: min, $lte: max };
    else if (min) match.duration = { $gte: min };
  }

  const minV = toInt(minViews, undefined);
  const maxV = toInt(maxViews, undefined);
  if (minV !== undefined || maxV !== undefined) {
    match.views = {};
    if (minV !== undefined) match.views.$gte = minV;
    if (maxV !== undefined) match.views.$lte = maxV;
  }

  const sort = { [sortBy]: String(sortType).toLowerCase() === "asc" ? 1 : -1 };

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        category: 1,
        tags: 1,
        likes: 1,
        dislikes: 1,
        createdAt: 1,
        updatedAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
        "owner.fullName": 1,
      },
    },
    { $sort: sort },
  ];

  const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
    page: P,
    limit: L,
  });

  return res.status(200).json(new ApiResponse(200, result, "Videos fetched"));
});

/* ---------- Public: get by id (published) OR owner via auth ---------- */
export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId)
    .populate("owner", OWNER_PROJECTION)
    .lean();
  if (!video) throw new ApiError(404, "Video not found");

  const requesterId = req.user?._id?.toString();
  const isOwner = requesterId && video.owner?._id?.toString() === requesterId;

  if (!video.isPublished && !isOwner) {
    throw new ApiError(403, "This video is not available");
  }

  if (video.isPublished && !isOwner) {
    await Video.updateOne({ _id: video._id }, { $inc: { views: 1 } });
    video.views += 1;
  }

  return res.status(200).json(new ApiResponse(200, video, "Video fetched"));
});

/* ---------- Protected: publish (create) ---------- */
export const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, category, tags, isPublished = "true" } = req.body;

  if (!validateTitle(title))
    throw new ApiError(400, "Title must be 3–100 characters");
  if (!validateDescription(description))
    throw new ApiError(400, "Description cannot exceed 2000 characters");

  const cat = category ? normalizeCategory(category) : null;
  if (category && !cat) {
    throw new ApiError(
      400,
      `Invalid category. Valid: ${CATEGORY_LIST.join(", ")}`
    );
  }

  // Files (from upload.fields)
  const videoFile = req.files?.videoFile?.[0] || null;
  const thumbnail = req.files?.thumbnail?.[0] || null;

  if (!videoFile) throw new ApiError(400, "Video file is required");

  // Upload video
  let videoUpload;
  try {
    videoUpload = await uploadOnCloudinary(videoFile.path, "videos");
    if (!videoUpload?.secure_url) throw new Error("No secure_url");
  } catch (err) {
    console.error("Video upload error:", err);
    throw new ApiError(500, "Failed to upload video");
  }

  // Upload thumbnail (optional)
  let thumbnailUrl =
    videoUpload.thumbnail || "https://via.placeholder.com/1280x720";
  let thumbnailPublicId = null;

  if (thumbnail) {
    try {
      const th = await uploadOnCloudinary(thumbnail.path, "thumbnails");
      if (th?.secure_url) {
        thumbnailUrl = th.secure_url;
        thumbnailPublicId = th.public_id;
      }
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      // continue with fallback
    }
  }

  const doc = await Video.create({
    title: title.trim(),
    description: (description || "").trim(),
    videoFile: videoUpload.secure_url,
    thumbnail: thumbnailUrl,
    duration: Math.floor(videoUpload.duration || 0),
    category: cat || "General",
    tags: normalizeTags(tags),
    isPublished: toBoolFromString(isPublished, true),
    owner: req.user._id,
    cloudinaryVideoId: videoUpload.public_id,
    cloudinaryThumbnailId: thumbnailPublicId,
  });

  const populated = await Video.findById(doc._id).populate(
    "owner",
    "username email avatar fullName"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Video published"));
});

/* ---------- Protected: update ---------- */
export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const { title, description, category, tags, isPublished } = req.body;
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only update your own videos");

  if (title !== undefined && !validateTitle(title))
    throw new ApiError(400, "Title must be 3–100 characters");
  if (description !== undefined && !validateDescription(description))
    throw new ApiError(400, "Description cannot exceed 2000 characters");

  if (title !== undefined) video.title = title.trim();
  if (description !== undefined) video.description = description.trim();

  if (category !== undefined) {
    if (!category) video.category = "General";
    else {
      const nc = normalizeCategory(category);
      if (!nc)
        throw new ApiError(
          400,
          `Invalid category. Valid: ${CATEGORY_LIST.join(", ")}`
        );
      video.category = nc;
    }
  }

  if (isPublished !== undefined) {
    video.isPublished = toBoolFromString(isPublished, video.isPublished);
  }

  if (tags !== undefined) {
    video.tags = normalizeTags(tags);
  }

  // Optional new thumbnail via upload.single("thumbnail")
  const newThumb = req.file || null;
  if (newThumb) {
    try {
      const th = await uploadOnCloudinary(newThumb.path, "thumbnails");
      if (!th?.secure_url) throw new Error("Thumbnail upload failed");
      if (video.cloudinaryThumbnailId) {
        try {
          await deleteFromCloudinary(video.cloudinaryThumbnailId);
        } catch (err) {
          console.error("Old thumbnail delete error:", err);
        }
      }
      video.thumbnail = th.secure_url;
      video.cloudinaryThumbnailId = th.public_id;
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      throw new ApiError(500, "Failed to upload thumbnail");
    }
  }

  await video.save();

  const updated = await Video.findById(videoId).populate(
    "owner",
    "username email avatar fullName"
  );
  return res.status(200).json(new ApiResponse(200, updated, "Video updated"));
});

/* ---------- Protected: delete ---------- */
export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only delete your own videos");

  try {
    if (video.cloudinaryVideoId)
      await deleteFromCloudinary(video.cloudinaryVideoId, "video");
    if (video.cloudinaryThumbnailId)
      await deleteFromCloudinary(video.cloudinaryThumbnailId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }

  await Video.findByIdAndDelete(videoId);
  return res.status(200).json(new ApiResponse(200, null, "Video deleted"));
});

/* ---------- Protected: toggle publish ---------- */
export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only update your own videos");

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status updated"));
});

/* ---------- Protected: owner stats ---------- */
export const getVideoStats = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only view stats for your own videos");

  const stats = {
    views: video.views,
    likes: video.likes || 0,
    dislikes: video.dislikes || 0,
    engagementRate:
      video.views > 0
        ? Number((((video.likes || 0) / video.views) * 100).toFixed(2))
        : 0,
    duration: video.duration,
    isPublished: video.isPublished,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };

  return res.status(200).json(new ApiResponse(200, stats, "Video stats"));
});
//searchvideo
export const searchVideos = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10, sortBy = "relevance" } = req.query;

  const { page: P, limit: L } = coercePageLimit(page, limit);

  const query = String(q || "").trim();
  if (query.length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  // If you have a MongoDB text index (e.g., on title/description/tags), set this to true
  // and add { score: { $meta: "textScore" } } usage for relevance sorting.
  const hasTextIndex = false;

  const pipeline = [];

  if (hasTextIndex) {
    pipeline.push({
      $match: { isPublished: true, $text: { $search: query } },
    });
  } else {
    pipeline.push({
      $match: {
        isPublished: true,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
      },
    });
  }

  // Join owner (channel) info
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" }
  );

  // Sorting options
  if (sortBy === "date") {
    pipeline.push({ $sort: { createdAt: -1 } });
  } else if (sortBy === "views") {
    pipeline.push({ $sort: { views: -1 } });
  } else if (sortBy === "duration") {
    pipeline.push({ $sort: { duration: 1 } });
  } else if (hasTextIndex) {
    // relevance by text score if text index is enabled
    pipeline.push({ $sort: { score: { $meta: "textScore" } } });
  } else {
    // fallback: newest first
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // Project safe fields
  pipeline.push({
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      category: 1,
      tags: 1,
      likes: 1,
      dislikes: 1,
      createdAt: 1,
      "owner._id": 1,
      "owner.username": 1,
      "owner.fullName": 1,
      "owner.avatar": 1,
      ...(hasTextIndex ? { score: { $meta: "textScore" } } : {}),
    },
  });

  const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
    page: P,
    limit: L,
  });

  return res.status(200).json(new ApiResponse(200, result, "Search results fetched successfully"));
});

/* ---------- Protected: upload status ---------- */
export const getVideoUploadStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId).populate(
    "owner",
    "username email avatar fullName"
  );
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner._id.toString() !== req.user._id.toString())
    throw new ApiError(403, "Only owner can view upload status");

  const status = {
    id: video._id,
    title: video.title,
    isPublished: video.isPublished,
    uploadStatus: video.videoFile ? "completed" : "processing",
    processingStatus: video.duration ? "completed" : "processing",
    thumbnailStatus: video.thumbnail ? "completed" : "processing",
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };

  return res.status(200).json(new ApiResponse(200, status, "Upload status"));
});

/* ---------- Public: trending ---------- */
export const getTrendingVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, timeRange = "7d" } = req.query;
  const { page: P, limit: L } = coercePageLimit(page, limit);

  const cutoff = new Date();
  const tr = String(timeRange || "7d").toLowerCase();
  if (tr === "1d") cutoff.setDate(cutoff.getDate() - 1);
  else if (tr === "7d") cutoff.setDate(cutoff.getDate() - 7);
  else if (tr === "30d") cutoff.setDate(cutoff.getDate() - 30);
  else cutoff.setDate(cutoff.getDate() - 7);

  const pipeline = [
    { $match: { isPublished: true, createdAt: { $gte: cutoff } } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ["$views", 1] },
            { $multiply: ["$likes", 2] },
            { $multiply: [{ $subtract: ["$likes", "$dislikes"] }, 3] },
          ],
        },
      },
    },
    { $sort: { score: -1 } },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        category: 1,
        tags: 1,
        likes: 1,
        dislikes: 1,
        score: 1,
        createdAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
        "owner.fullName": 1,
      },
    },
  ];

  const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
    page: P,
    limit: L,
  });

  return res.status(200).json(new ApiResponse(200, result, "Trending"));
});

/* ---------- Public/Protected: user videos ---------- */
export const getUserVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, isPublished } = req.query;
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

  const { page: P, limit: L } = coercePageLimit(page, limit);

  const requesterId = req.user?._id?.toString();
  const isOwner = requesterId && userId === requesterId;

  const match = { owner: new mongoose.Types.ObjectId(userId) };
  if (isOwner) {
    if (isPublished !== undefined) {
      const pub = toBoolFromString(isPublished, undefined);
      if (pub !== undefined) match.isPublished = pub;
    }
  } else {
    match.isPublished = true;
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        category: 1,
        tags: 1,
        likes: 1,
        dislikes: 1,
        createdAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
        "owner.fullName": 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ];

  const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
    page: P,
    limit: L,
  });

  return res.status(200).json(new ApiResponse(200, result, "User videos"));
});
