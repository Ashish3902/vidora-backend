// src/middlewares/auth.middleware.js - FIXED VERSION
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Access token is required");
    }

    // ✅ FIX: Handle expired tokens gracefully
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw new ApiError(
          401,
          "Access token expired. Please refresh your token or login again."
        );
      } else if (jwtError.name === "JsonWebTokenError") {
        throw new ApiError(401, "Invalid access token");
      } else {
        throw new ApiError(401, "Token verification failed");
      }
    }

    // ✅ FIX: Validate user ID from token
    if (!decodedToken._id || !mongoose.isValidObjectId(decodedToken._id)) {
      throw new ApiError(401, "Invalid token payload");
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token - User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    // ✅ FIX: Proper error handling
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
