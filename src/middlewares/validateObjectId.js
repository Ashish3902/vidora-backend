// src/middlewares/validateObjectId.js - COMPLETELY FIXED
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export const validateObjectId = (req, res, next) => {
  // ✅ FIX: Only validate if ID parameter exists
  const id = req.params.id || req.params.videoId || req.params.channelId;

  if (id && !mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid ID format");
  }

  next();
};

export const validateUserId = (req, res, next) => {
  // ✅ FIX: Only validate if user exists and has _id
  if (req.user && req.user._id && !mongoose.isValidObjectId(req.user._id)) {
    throw new ApiError(401, "Invalid user session. Please log in again.");
  }

  next();
};

// ✅ NEW: Specific middleware for routes that don't need ID validation
export const validateUserOnly = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }
  next();
};
