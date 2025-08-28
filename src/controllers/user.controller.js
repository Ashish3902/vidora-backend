// ==============================
// FILE: src/controllers/user.controller.js
// ==============================
import mongoose from "mongoose";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// Optional models (wrap usage to avoid crashes if absent)
let Video = null;
let Subscription = null;
try {
  const mVideo = await import("../models/video.model.js");
  Video = mVideo.Video;
} catch {}
try {
  const mSub = await import("../models/subscription.model.js");
  Subscription = mSub.Subscription;
} catch {}

// ------------------------------
// Helpers
// ------------------------------
const isObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) &&
  String(new mongoose.Types.ObjectId(id)) === String(id);

const pick = (obj, fields) =>
  fields.reduce((acc, f) => {
    if (obj[f] !== undefined) acc[f] = obj[f];
    return acc;
  }, {});

const setAuthCookies = (res, accessToken, refreshToken) => {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  if (accessToken)
    res.cookie("accessToken", accessToken, {
      ...opts,
      maxAge: 24 * 60 * 60 * 1000,
    });
  if (refreshToken)
    res.cookie("refreshToken", refreshToken, {
      ...opts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

// ------------------------------
// Auth
// ------------------------------

// Register (supports multipart via multer fields {avatar, coverImage} OR direct URLs in body)
export const registerUser = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    fullName,
    bio,
    location,
    social = {},
    avatar: avatarUrlFromBody,
    coverImage: coverUrlFromBody,
  } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "username, email and password are required");
  }

  const exists = await User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { username: username.toLowerCase().trim() },
    ],
  });
  if (exists)
    throw new ApiError(409, "User with email/username already exists");

  // Cloudinary uploads if files present
  let avatarUrl = avatarUrlFromBody;
  let coverUrl = coverUrlFromBody;

  if (req.files?.avatar?.[0]) {
    const up = await uploadOnCloudinary(req.files.avatar[0].path, "avatars");
    avatarUrl = up?.secure_url || avatarUrlFromBody;
  }
  if (req.files?.coverImage?.[0]) {
    const up = await uploadOnCloudinary(req.files.coverImage[0].path, "covers");
    coverUrl = up?.secure_url || coverUrlFromBody;
  }

  if (!avatarUrl) throw new ApiError(400, "Avatar is required");

  const user = await User.create({
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password,
    fullName,
    bio,
    location,
    social,
    avatar: avatarUrl,
    coverImage: coverUrl || "",
  });

  // (Optional) email verification skeleton
  // const rawEmailToken = crypto.randomBytes(32).toString("hex");
  // user.emailVerificationToken = crypto.createHash("sha256").update(rawEmailToken).digest("hex");
  // user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(201, user.toJSON(), "User registered successfully"));
});

// Login (email or username allowed)
export const loginUser = asyncHandler(async (req, res) => {
  const { emailOrUsername, email, username, password } = req.body;

  const loginId = (emailOrUsername || email || username || "")
    .toLowerCase()
    .trim();
  if (!loginId || !password)
    throw new ApiError(400, "login id and password are required");

  const user = await User.findOne({
    $or: [{ email: loginId }, { username: loginId }],
  }).select("+password +refreshToken");

  if (!user) throw new ApiError(404, "User not found");
  if (user.status && user.status !== "active") {
    throw new ApiError(403, `Account is ${user.status}`);
  }

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user.toJSON(), accessToken, refreshToken },
        "Login successful"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const provided =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers["x-refresh-token"];

  if (!provided) throw new ApiError(401, "No refresh token provided");

  const jwt = (await import("jsonwebtoken")).default;
  let payload;
  try {
    const secret =
      process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
    payload = jwt.verify(provided, secret);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload._id || payload.id).select(
    "+refreshToken"
  );
  if (!user || user.refreshToken !== provided) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  const accessToken = user.generateAccessToken();
  const newRefresh = user.generateRefreshToken();
  user.refreshToken = newRefresh;
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, newRefresh);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefresh },
        "Token refreshed"
      )
    );
});

// ------------------------------
// Current / Get / Search
// ------------------------------
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ FIX: Validate ObjectId before query (This was missing at line 233)
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid user id format");
  }

  const user = await User.findById(id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

// ✅ FIXED: Add validation to getCurrentUser as well
export const getCurrentUser = asyncHandler(async (req, res) => {
  // ✅ FIX: Validate user ID from JWT token
  if (!req.user || !mongoose.isValidObjectId(req.user._id)) {
    throw new ApiError(401, "Invalid user session. Please log in again.");
  }

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

export const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  const page = Math.max(parseInt(req.query.page || "1"), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "12"), 1), 50);
  const skip = (page - 1) * limit;

  const filter = q
    ? {
        $or: [
          { username: { $regex: q, $options: "i" } },
          { fullName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      items: items.map((u) => u.toJSON()),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    })
  );
});

// ------------------------------
// Profile updates
// ------------------------------
export const updateProfile = asyncHandler(async (req, res) => {
  const incoming = pick(req.body, ["fullName", "bio", "location", "social"]);
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (incoming.fullName !== undefined) user.fullName = incoming.fullName;
  if (incoming.bio !== undefined) user.bio = incoming.bio;
  if (incoming.location !== undefined) user.location = incoming.location;
  if (incoming.social !== undefined) {
    user.social = { ...(user.social || {}), ...(incoming.social || {}) };
  }

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Profile updated"));
});

export const changeUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) throw new ApiError(400, "username required");
  const normalized = username.toLowerCase().trim();
  const exists = await User.findOne({ username: normalized });
  if (exists && String(exists._id) !== String(req.user._id)) {
    throw new ApiError(409, "Username already taken");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { username: normalized } },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Username changed"));
});

export const changeEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "email required");
  const normalized = email.toLowerCase().trim();
  const exists = await User.findOne({ email: normalized });
  if (exists && String(exists._id) !== String(req.user._id)) {
    throw new ApiError(409, "Email already in use");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { email: normalized, isEmailVerified: false } },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Email changed"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    throw new ApiError(400, "Both passwords required");

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const ok = await user.comparePassword(oldPassword);
  if (!ok) throw new ApiError(401, "Old password incorrect");

  user.password = newPassword; // hashed by pre-save
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password updated"));
});

// ------------------------------
// Avatar & Cover (Cloudinary)
// ------------------------------
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.files?.avatar?.[0] && !req.body?.avatar) {
    throw new ApiError(400, "avatar file or URL required");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  let newUrl = req.body?.avatar;
  if (req.files?.avatar?.[0]) {
    const up = await uploadOnCloudinary(req.files.avatar[0].path, "avatars");
    if (!up?.secure_url) throw new ApiError(500, "Upload failed");
    newUrl = up.secure_url;

    // If you store public_id, you can delete old asset:
    // if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
  }

  user.avatar = newUrl;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Avatar updated"));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  if (!req.files?.coverImage?.[0] && !req.body?.coverImage) {
    throw new ApiError(400, "coverImage file or URL required");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  let newUrl = req.body?.coverImage;
  if (req.files?.coverImage?.[0]) {
    const up = await uploadOnCloudinary(req.files.coverImage[0].path, "covers");
    if (!up?.secure_url) throw new ApiError(500, "Upload failed");
    newUrl = up.secure_url;

    // If you store public_id, you can delete old asset:
    // if (user.coverPublicId) await deleteFromCloudinary(user.coverPublicId);
  }

  user.coverImage = newUrl || "";
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Cover image updated"));
});

// ------------------------------
// Password reset (skeleton)
// ------------------------------
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "email required");
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Do not disclose existence
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "If the email exists, a reset link was sent")
      );
  }
  const raw = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save({ validateBeforeSave: false });

  // TODO: Send email with reset link containing raw token + user id
  // e.g. `${CLIENT_URL}/reset-password?token=${raw}&id=${user._id}`

  return res
    .status(200)
    .json(new ApiResponse(200, { tokenPreview: raw }, "Reset link sent (dev)"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, userId, newPassword } = req.body;
  if (!token || !userId || !newPassword)
    throw new ApiError(400, "Missing fields");

  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    _id: userId,
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) throw new ApiError(400, "Invalid or expired token");

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been reset"));
});

// ------------------------------
// Subscriptions (requires Subscription model)
// ------------------------------
export const subscribeToChannel = asyncHandler(async (req, res) => {
  if (!Subscription)
    throw new ApiError(500, "Subscription model not available");
  const { channelId } = req.body;
  if (!isObjectId(channelId)) throw new ApiError(400, "Invalid channel id");
  if (String(channelId) === String(req.user._id)) {
    throw new ApiError(400, "Cannot subscribe to yourself");
  }

  const exists = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  if (exists) {
    return res.status(200).json(new ApiResponse(200, {}, "Already subscribed"));
  }

  await Subscription.create({ subscriber: req.user._id, channel: channelId });
  return res.status(201).json(new ApiResponse(201, {}, "Subscribed"));
});

export const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  if (!Subscription)
    throw new ApiError(500, "Subscription model not available");
  const { channelId } = req.body;
  if (!isObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

  await Subscription.deleteOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed"));
});

export const getChannelProfile = asyncHandler(async (req, res) => {
  if (!Subscription)
    throw new ApiError(500, "Subscription model not available");
  const channelId = req.params.channelId;
  if (!isObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

  const [channel, subscribers, subscribedTo, videosCount] = await Promise.all([
    User.findById(channelId),
    Subscription.countDocuments({ channel: channelId }),
    Subscription.countDocuments({ subscriber: channelId }),
    Video ? Video.countDocuments({ owner: channelId }) : Promise.resolve(0),
  ]);

  if (!channel) throw new ApiError(404, "Channel not found");

  return res.status(200).json(
    new ApiResponse(200, {
      channel: channel.toJSON(),
      stats: {
        subscribers,
        subscribedTo,
        videos: videosCount,
      },
    })
  );
});

// ------------------------------
// Watch history (if you store it on user.watchHistory)
// ------------------------------

const getUserByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const user = await User.findOne({
    username: username.toLowerCase(),
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});
// ------------------------------
// Account status
// ------------------------------
export const deactivateAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { status: "inactive" } });
  return res.status(200).json(new ApiResponse(200, {}, "Account deactivated"));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  // Optional: If you store Cloudinary public_ids, delete assets
  // if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
  // if (user.coverPublicId) await deleteFromCloudinary(user.coverPublicId);

  await User.deleteOne({ _id: req.user._id });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(new ApiResponse(200, {}, "Account deleted"));
});
export { getUserByUsername /* other exports */ };
