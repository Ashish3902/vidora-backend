// //listen my backend running properly so i will provide you all info regarding my backend then we will make a best frontend .we will not try to make any new pages and debug only given page.
// user related:
// // ==============================
// // FILE: src/controllers/user.controller.js
// // ==============================
// import mongoose from "mongoose";
// import crypto from "crypto";
// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import {
//   uploadOnCloudinary,
//   deleteFromCloudinary,
// } from "../utils/cloudinary.js";

// // Optional models (wrap usage to avoid crashes if absent)
// let Video = null;
// let Subscription = null;
// try {
//   const mVideo = await import("../models/video.model.js");
//   Video = mVideo.Video;
// } catch {}
// try {
//   const mSub = await import("../models/subscription.model.js");
//   Subscription = mSub.Subscription;
// } catch {}

// // ------------------------------
// // Helpers
// // ------------------------------
// const isObjectId = (id) =>
//   mongoose.Types.ObjectId.isValid(id) &&
//   String(new mongoose.Types.ObjectId(id)) === String(id);

// const pick = (obj, fields) =>
//   fields.reduce((acc, f) => {
//     if (obj[f] !== undefined) acc[f] = obj[f];
//     return acc;
//   }, {});

// const setAuthCookies = (res, accessToken, refreshToken) => {
//   const opts = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//   };
//   if (accessToken)
//     res.cookie("accessToken", accessToken, {
//       ...opts,
//       maxAge: 24 * 60 * 60 * 1000,
//     });
//   if (refreshToken)
//     res.cookie("refreshToken", refreshToken, {
//       ...opts,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
// };

// // ------------------------------
// // Auth
// // ------------------------------

// // Register (supports multipart via multer fields {avatar, coverImage} OR direct URLs in body)
// export const registerUser = asyncHandler(async (req, res) => {
//   const {
//     username,
//     email,
//     password,
//     fullName,
//     bio,
//     location,
//     social = {},
//     avatar: avatarUrlFromBody,
//     coverImage: coverUrlFromBody,
//   } = req.body;

//   if (!username || !email || !password) {
//     throw new ApiError(400, "username, email and password are required");
//   }

//   const exists = await User.findOne({
//     $or: [
//       { email: email.toLowerCase().trim() },
//       { username: username.toLowerCase().trim() },
//     ],
//   });
//   if (exists)
//     throw new ApiError(409, "User with email/username already exists");

//   // Cloudinary uploads if files present
//   let avatarUrl = avatarUrlFromBody;
//   let coverUrl = coverUrlFromBody;

//   if (req.files?.avatar?.[0]) {
//     const up = await uploadOnCloudinary(req.files.avatar[0].path, "avatars");
//     avatarUrl = up?.secure_url || avatarUrlFromBody;
//   }
//   if (req.files?.coverImage?.[0]) {
//     const up = await uploadOnCloudinary(req.files.coverImage[0].path, "covers");
//     coverUrl = up?.secure_url || coverUrlFromBody;
//   }

//   if (!avatarUrl) throw new ApiError(400, "Avatar is required");

//   const user = await User.create({
//     username: username.toLowerCase().trim(),
//     email: email.toLowerCase().trim(),
//     password,
//     fullName,
//     bio,
//     location,
//     social,
//     avatar: avatarUrl,
//     coverImage: coverUrl || "",
//   });

//   // (Optional) email verification skeleton
//   // const rawEmailToken = crypto.randomBytes(32).toString("hex");
//   // user.emailVerificationToken = crypto.createHash("sha256").update(rawEmailToken).digest("hex");
//   // user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
//   await user.save();

//   return res
//     .status(201)
//     .json(new ApiResponse(201, user.toJSON(), "User registered successfully"));
// });

// // Login (email or username allowed)
// export const loginUser = asyncHandler(async (req, res) => {
//   const { emailOrUsername, email, username, password } = req.body;

//   const loginId = (emailOrUsername || email || username || "")
//     .toLowerCase()
//     .trim();
//   if (!loginId || !password)
//     throw new ApiError(400, "login id and password are required");

//   const user = await User.findOne({
//     $or: [{ email: loginId }, { username: loginId }],
//   }).select("+password +refreshToken");

//   if (!user) throw new ApiError(404, "User not found");
//   if (user.status && user.status !== "active") {
//     throw new ApiError(403, `Account is ${user.status}`);
//   }

//   const ok = await user.comparePassword(password);
//   if (!ok) throw new ApiError(401, "Invalid credentials");

//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();

//   user.refreshToken = refreshToken;
//   user.lastLogin = new Date();
//   await user.save({ validateBeforeSave: false });

//   setAuthCookies(res, accessToken, refreshToken);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         { user: user.toJSON(), accessToken, refreshToken },
//         "Login successful"
//       )
//     );
// });

// export const logoutUser = asyncHandler(async (req, res) => {
//   await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
//   res.clearCookie("accessToken");
//   res.clearCookie("refreshToken");
//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Logged out successfully"));
// });

// export const refreshAccessToken = asyncHandler(async (req, res) => {
//   const provided =
//     req.cookies?.refreshToken ||
//     req.body?.refreshToken ||
//     req.headers["x-refresh-token"];

//   if (!provided) throw new ApiError(401, "No refresh token provided");

//   const jwt = (await import("jsonwebtoken")).default;
//   let payload;
//   try {
//     const secret =
//       process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
//     payload = jwt.verify(provided, secret);
//   } catch {
//     throw new ApiError(401, "Invalid refresh token");
//   }

//   const user = await User.findById(payload._id || payload.id).select(
//     "+refreshToken"
//   );
//   if (!user || user.refreshToken !== provided) {
//     throw new ApiError(401, "Refresh token mismatch");
//   }

//   const accessToken = user.generateAccessToken();
//   const newRefresh = user.generateRefreshToken();
//   user.refreshToken = newRefresh;
//   await user.save({ validateBeforeSave: false });

//   setAuthCookies(res, accessToken, newRefresh);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         { accessToken, refreshToken: newRefresh },
//         "Token refreshed"
//       )
//     );
// });

// // ------------------------------
// // Current / Get / Search
// // ------------------------------
// export const getCurrentUser = asyncHandler(async (req, res) => {
//   return res
//     .status(200)
//     .json(new ApiResponse(200, req.user.toJSON(), "Current user"));
// });

// export const getUserById = asyncHandler(async (req, res) => {
//   const id = req.params.id === "me" ? req.user._id : req.params.id;
//   if (!isObjectId(String(id))) throw new ApiError(400, "Invalid user id");
//   const user = await User.findById(id);
//   if (!user) throw new ApiError(404, "User not found");
//   return res
//     .status(200)
//     .json(new ApiResponse(200, user.toJSON(), "User fetched"));
// });

// export const searchUsers = asyncHandler(async (req, res) => {
//   const q = (req.query.q || "").trim();
//   const page = Math.max(parseInt(req.query.page || "1"), 1);
//   const limit = Math.min(Math.max(parseInt(req.query.limit || "12"), 1), 50);
//   const skip = (page - 1) * limit;

//   const filter = q
//     ? {
//         $or: [
//           { username: { $regex: q, $options: "i" } },
//           { fullName: { $regex: q, $options: "i" } },
//           { email: { $regex: q, $options: "i" } },
//         ],
//       }
//     : {};

//   const [items, total] = await Promise.all([
//     User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
//     User.countDocuments(filter),
//   ]);

//   return res.status(200).json(
//     new ApiResponse(200, {
//       items: items.map((u) => u.toJSON()),
//       page,
//       limit,
//       total,
//       pages: Math.ceil(total / limit),
//     })
//   );
// });

// // ------------------------------
// // Profile updates
// // ------------------------------
// export const updateProfile = asyncHandler(async (req, res) => {
//   const incoming = pick(req.body, ["fullName", "bio", "location", "social"]);
//   const user = await User.findById(req.user._id);
//   if (!user) throw new ApiError(404, "User not found");

//   if (incoming.fullName !== undefined) user.fullName = incoming.fullName;
//   if (incoming.bio !== undefined) user.bio = incoming.bio;
//   if (incoming.location !== undefined) user.location = incoming.location;
//   if (incoming.social !== undefined) {
//     user.social = { ...(user.social || {}), ...(incoming.social || {}) };
//   }

//   await user.save();

//   return res
//     .status(200)
//     .json(new ApiResponse(200, user.toJSON(), "Profile updated"));
// });

// export const changeUsername = asyncHandler(async (req, res) => {
//   const { username } = req.body;
//   if (!username) throw new ApiError(400, "username required");
//   const normalized = username.toLowerCase().trim();
//   const exists = await User.findOne({ username: normalized });
//   if (exists && String(exists._id) !== String(req.user._id)) {
//     throw new ApiError(409, "Username already taken");
//   }
//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     { $set: { username: normalized } },
//     { new: true }
//   );
//   return res
//     .status(200)
//     .json(new ApiResponse(200, user.toJSON(), "Username changed"));
// });

// export const changeEmail = asyncHandler(async (req, res) => {
//   const { email } = req.body;
//   if (!email) throw new ApiError(400, "email required");
//   const normalized = email.toLowerCase().trim();
//   const exists = await User.findOne({ email: normalized });
//   if (exists && String(exists._id) !== String(req.user._id)) {
//     throw new ApiError(409, "Email already in use");
//   }
//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     { $set: { email: normalized, isEmailVerified: false } },
//     { new: true }
//   );
//   return res
//     .status(200)
//     .json(new ApiResponse(200, user.toJSON(), "Email changed"));
// });

// export const changePassword = asyncHandler(async (req, res) => {
//   const { oldPassword, newPassword } = req.body;
//   if (!oldPassword || !newPassword)
//     throw new ApiError(400, "Both passwords required");

//   const user = await User.findById(req.user._id).select("+password");
//   if (!user) throw new ApiError(404, "User not found");

//   const ok = await user.comparePassword(oldPassword);
//   if (!ok) throw new ApiError(401, "Old password incorrect");

//   user.password = newPassword; // hashed by pre-save
//   await user.save();

//   return res.status(200).json(new ApiResponse(200, {}, "Password updated"));
// });

// // ------------------------------
// // Avatar & Cover (Cloudinary)
// // ------------------------------
// export const updateAvatar = asyncHandler(async (req, res) => {
//   if (!req.files?.avatar?.[0] && !req.body?.avatar) {
//     throw new ApiError(400, "avatar file or URL required");
//   }

//   const user = await User.findById(req.user._id);
//   if (!user) throw new ApiError(404, "User not found");

//   let newUrl = req.body?.avatar;
//   if (req.files?.avatar?.[0]) {
//     const up = await uploadOnCloudinary(req.files.avatar[0].path, "avatars");
//     if (!up?.secure_url) throw new ApiError(500, "Upload failed");
//     newUrl = up.secure_url;

//     // If you store public_id, you can delete old asset:
//     // if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
//   }

//   user.avatar = newUrl;
//   await user.save();

//   return res
//     .status(200)
//     .json(new ApiResponse(200, user.toJSON(), "Avatar updated"));
// });

// export const updateCoverImage = asyncHandler(async (req, res) => {
//   if (!req.files?.coverImage?.[0] && !req.body?.coverImage) {
//     throw new ApiError(400, "coverImage file or URL required");
//   }

//   const user = await User.findById(req.user._id);
//   if (!user) throw new ApiError(404, "User not found");

//   let newUrl = req.body?.coverImage;
//   if (req.files?.coverImage?.[0]) {
//     const up = await uploadOnCloudinary(req.files.coverImage[0].path, "covers");
//     if (!up?.secure_url) throw new ApiError(500, "Upload failed");
//     newUrl = up.secure_url;

//     // If you store public_id, you can delete old asset:
//     // if (user.coverPublicId) await deleteFromCloudinary(user.coverPublicId);
//   }

//   user.coverImage = newUrl || "";
//   await user.save();

//   return res
//     .status(200)
//     .json(new ApiResponse(200, user.toJSON(), "Cover image updated"));
// });

// // ------------------------------
// // Password reset (skeleton)
// // ------------------------------
// export const requestPasswordReset = asyncHandler(async (req, res) => {
//   const { email } = req.body;
//   if (!email) throw new ApiError(400, "email required");
//   const user = await User.findOne({ email: email.toLowerCase().trim() });
//   if (!user) {
//     // Do not disclose existence
//     return res
//       .status(200)
//       .json(
//         new ApiResponse(200, {}, "If the email exists, a reset link was sent")
//       );
//   }
//   const raw = crypto.randomBytes(32).toString("hex");
//   user.passwordResetToken = crypto
//     .createHash("sha256")
//     .update(raw)
//     .digest("hex");
//   user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
//   await user.save({ validateBeforeSave: false });

//   // TODO: Send email with reset link containing raw token + user id
//   // e.g. `${CLIENT_URL}/reset-password?token=${raw}&id=${user._id}`

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { tokenPreview: raw }, "Reset link sent (dev)"));
// });

// export const resetPassword = asyncHandler(async (req, res) => {
//   const { token, userId, newPassword } = req.body;
//   if (!token || !userId || !newPassword)
//     throw new ApiError(400, "Missing fields");

//   const hashed = crypto.createHash("sha256").update(token).digest("hex");
//   const user = await User.findOne({
//     _id: userId,
//     passwordResetToken: hashed,
//     passwordResetExpires: { $gt: new Date() },
//   }).select("+passwordResetToken +passwordResetExpires");

//   if (!user) throw new ApiError(400, "Invalid or expired token");

//   user.password = newPassword;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Password has been reset"));
// });

// // ------------------------------
// // Subscriptions (requires Subscription model)
// // ------------------------------
// export const subscribeToChannel = asyncHandler(async (req, res) => {
//   if (!Subscription)
//     throw new ApiError(500, "Subscription model not available");
//   const { channelId } = req.body;
//   if (!isObjectId(channelId)) throw new ApiError(400, "Invalid channel id");
//   if (String(channelId) === String(req.user._id)) {
//     throw new ApiError(400, "Cannot subscribe to yourself");
//   }

//   const exists = await Subscription.findOne({
//     subscriber: req.user._id,
//     channel: channelId,
//   });
//   if (exists) {
//     return res.status(200).json(new ApiResponse(200, {}, "Already subscribed"));
//   }

//   await Subscription.create({ subscriber: req.user._id, channel: channelId });
//   return res.status(201).json(new ApiResponse(201, {}, "Subscribed"));
// });

// export const unsubscribeFromChannel = asyncHandler(async (req, res) => {
//   if (!Subscription)
//     throw new ApiError(500, "Subscription model not available");
//   const { channelId } = req.body;
//   if (!isObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

//   await Subscription.deleteOne({
//     subscriber: req.user._id,
//     channel: channelId,
//   });
//   return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed"));
// });

// export const getChannelProfile = asyncHandler(async (req, res) => {
//   if (!Subscription)
//     throw new ApiError(500, "Subscription model not available");
//   const channelId = req.params.channelId;
//   if (!isObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

//   const [channel, subscribers, subscribedTo, videosCount] = await Promise.all([
//     User.findById(channelId),
//     Subscription.countDocuments({ channel: channelId }),
//     Subscription.countDocuments({ subscriber: channelId }),
//     Video ? Video.countDocuments({ owner: channelId }) : Promise.resolve(0),
//   ]);

//   if (!channel) throw new ApiError(404, "Channel not found");

//   return res.status(200).json(
//     new ApiResponse(200, {
//       channel: channel.toJSON(),
//       stats: {
//         subscribers,
//         subscribedTo,
//         videos: videosCount,
//       },
//     })
//   );
// });

// // ------------------------------
// // Watch history (if you store it on user.watchHistory)
// // ------------------------------
// export const getWatchHistory = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id).populate({
//     path: "watchHistory",
//     select: "title thumbnail duration owner createdAt",
//     populate: { path: "owner", select: "username avatar fullName" },
//   });
//   return res.status(200).json(new ApiResponse(200, user?.watchHistory || []));
// });

// export const addToWatchHistory = asyncHandler(async (req, res) => {
//   const { videoId } = req.body;
//   if (!isObjectId(videoId)) throw new ApiError(400, "Invalid video id");
//   await User.findByIdAndUpdate(req.user._id, {
//     $addToSet: { watchHistory: videoId },
//   });
//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Added to watch history"));
// });

// // ------------------------------
// // Account status
// // ------------------------------
// export const deactivateAccount = asyncHandler(async (req, res) => {
//   await User.findByIdAndUpdate(req.user._id, { $set: { status: "inactive" } });
//   return res.status(200).json(new ApiResponse(200, {}, "Account deactivated"));
// });

// export const deleteAccount = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);
//   if (!user) throw new ApiError(404, "User not found");

//   // Optional: If you store Cloudinary public_ids, delete assets
//   // if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
//   // if (user.coverPublicId) await deleteFromCloudinary(user.coverPublicId);

//   await User.deleteOne({ _id: req.user._id });

//   res.clearCookie("accessToken");
//   res.clearCookie("refreshToken");

//   return res.status(200).json(new ApiResponse(200, {}, "Account deleted"));
// });
// // ==============================
// // FILE: src/middlewares/auth.middleware.js
// // ==============================
// import jwt from "jsonwebtoken";
// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";

// /**
//  * Extract access token from:
//  * - Authorization header: "Bearer <token>"
//  * - Cookie: accessToken (requires cookie-parser and CORS credentials)
//  */
// function getAccessToken(req) {
//   const auth = req.headers.authorization || req.headers.Authorization;
//   if (auth && typeof auth === "string") {
//     const [scheme, token] = auth.split(" ");
//     if (/^Bearer$/i.test(scheme) && token) return token.trim();
//   }
//   if (req.cookies && req.cookies.accessToken) {
//     return req.cookies.accessToken;
//   }
//   return null;
// }

// /**
//  * JWT verification middleware
//  * - Verifies JWT with ACCESS_TOKEN_SECRET
//  * - Loads user and attaches to req.user (without password)
//  * - Sends precise error messages for common failure modes
//  */
// export const verifyJWT = async (req, _res, next) => {
//   try {
//     const token = getAccessToken(req);
//     if (!token) throw new ApiError(401, "Unauthorized - No token provided");

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     } catch (err) {
//       if (err.name === "TokenExpiredError") {
//         throw new ApiError(401, "Unauthorized - Token expired");
//       }
//       if (err.name === "JsonWebTokenError") {
//         throw new ApiError(401, "Unauthorized - Malformed token");
//       }
//       throw new ApiError(401, "Unauthorized - Token verification failed");
//     }

//     const userId = decoded._id || decoded.id;
//     if (!userId)
//       throw new ApiError(401, "Unauthorized - Invalid token payload");

//     const user = await User.findById(userId).select("-password");
//     if (!user) throw new ApiError(404, "User not found");

//     req.user = user;
//     return next();
//   } catch (err) {
//     return next(
//       err instanceof ApiError ? err : new ApiError(401, "Unauthorized")
//     );
//   }
// };
// // ==============================
// // FILE: src/models/user.model.js
// // ==============================
// import mongoose, { Schema } from "mongoose";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// const SocialSchema = new Schema(
//   {
//     youtube: { type: String, trim: true },
//     twitter: { type: String, trim: true },
//     instagram: { type: String, trim: true },
//     linkedin: { type: String, trim: true },
//     github: { type: String, trim: true },
//     website: { type: String, trim: true },
//   },
//   { _id: false }
// );

// const UserSchema = new Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//       minlength: 3,
//       maxlength: 30,
//       match: /^[a-z0-9_\.]+$/i, // letters, numbers, underscore, dot
//     },
//     fullName: {
//       type: String,
//       trim: true,
//       maxlength: 60,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match:
//         /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/,
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//       select: false, // exclude by default
//     },
//     avatar: {
//       type: String,
//       required: true, // per your earlier spec
//       trim: true,
//     },
//     coverImage: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     bio: { type: String, trim: true, maxlength: 200 },
//     location: { type: String, trim: true, maxlength: 60 },
//     social: { type: SocialSchema, default: {} },

//     role: { type: String, enum: ["user", "admin"], default: "user" },

//     // Auth & security
//     refreshToken: { type: String, select: false },
//     isEmailVerified: { type: Boolean, default: false },
//     emailVerificationToken: { type: String, select: false },
//     emailVerificationExpires: { type: Date, select: false },
//     passwordResetToken: { type: String, select: false },
//     passwordResetExpires: { type: Date, select: false },

//     // App features
//     watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],

//     lastLogin: { type: Date },
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// // Indexes
// UserSchema.index({ username: 1 }, { unique: true });
// UserSchema.index({ email: 1 }, { unique: true });

// // Pre-save: hash password if modified
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Instance methods
// UserSchema.methods.comparePassword = async function (candidate) {
//   return bcrypt.compare(candidate, this.password);
// };

// UserSchema.methods.generateAccessToken = function () {
//   return jwt.sign(
//     { _id: this._id, role: this.role },
//     process.env.ACCESS_TOKEN_SECRET,
//     { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
//   );
// };

// UserSchema.methods.generateRefreshToken = function () {
//   return jwt.sign(
//     { _id: this._id },
//     process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
//     { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
//   );
// };

// UserSchema.methods.getPublicProfile = function () {
//   const {
//     _id,
//     username,
//     fullName,
//     email,
//     avatar,
//     coverImage,
//     bio,
//     location,
//     social,
//     role,
//     isEmailVerified,
//     lastLogin,
//     createdAt,
//     updatedAt,
//   } = this;
//   return {
//     _id,
//     username,
//     fullName,
//     email,
//     avatar,
//     coverImage,
//     bio,
//     location,
//     social,
//     role,
//     isEmailVerified,
//     lastLogin,
//     createdAt,
//     updatedAt,
//   };
// };

// // Hide sensitive fields in JSON
// function hideSensitive(doc, ret) {
//   delete ret.password;
//   delete ret.refreshToken;
//   delete ret.emailVerificationToken;
//   delete ret.emailVerificationExpires;
//   delete ret.passwordResetToken;
//   delete ret.passwordResetExpires;
//   delete ret.__v;
//   return ret;
// }
// UserSchema.set("toJSON", { virtuals: true, transform: hideSensitive });
// UserSchema.set("toObject", { virtuals: true, transform: hideSensitive });

// export const User = mongoose.model("User", UserSchema);.
// // FILE: src/routes/user.routes.js
// // ==================================
// import { Router } from "express";
// import multer from "multer";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import {
//   registerUser,
//   loginUser,
//   logoutUser,
//   refreshAccessToken,
//   getCurrentUser,
//   getUserById,
//   searchUsers,
//   updateProfile,
//   changeUsername,
//   changeEmail,
//   changePassword,
//   updateAvatar,
//   updateCoverImage,
//   requestPasswordReset,
//   resetPassword,
//   subscribeToChannel,
//   unsubscribeFromChannel,
//   getChannelProfile,
//   getWatchHistory,
//   addToWatchHistory,
//   deactivateAccount,
//   deleteAccount,
// } from "../controllers/user.controller.js";

// const router = Router();

// // multer (simple disk storage - change to your multer/cloud setup as needed)
// const upload = multer({ dest: "uploads/" });

// // --------------------
// // Public routes
// // --------------------
// router.post(
//   "/register",
//   upload.fields([
//     { name: "avatar", maxCount: 1 },
//     { name: "coverImage", maxCount: 1 },
//   ]),
//   registerUser
// );
// router.post("/login", loginUser);
// router.post("/refresh-token", refreshAccessToken);

// router.get("/search", searchUsers);

// // Password reset flow
// router.post("/password/reset/request", requestPasswordReset);
// router.post("/password/reset", resetPassword);

// // --------------------
// // Protected routes
// // --------------------
// router.use(verifyJWT); // everything below requires auth

// router.post("/logout", logoutUser);

// // current user & user fetch (supports "me")
// router.get("/me", getCurrentUser);
// router.get("/:id", getUserById); // use "/:id" — controller supports "me"

// // profile updates
// router.patch("/profile", updateProfile);
// router.patch("/username", changeUsername);
// router.patch("/email", changeEmail);
// router.patch("/password", changePassword);

// // avatar / cover (multipart)
// router.patch(
//   "/avatar",
//   upload.fields([{ name: "avatar", maxCount: 1 }]),
//   updateAvatar
// );
// router.patch(
//   "/cover",
//   upload.fields([{ name: "coverImage", maxCount: 1 }]),
//   updateCoverImage
// );

// // watch history
// router.get("/history", getWatchHistory);
// router.post("/history", addToWatchHistory);

// // subscriptions / channel
// router.post("/subscribe", subscribeToChannel); // body: { channelId }
// router.post("/unsubscribe", unsubscribeFromChannel); // body: { channelId }
// router.get("/channel/:channelId", getChannelProfile); // channel stats/profile

// // account
// router.post("/deactivate", deactivateAccount);
// router.delete("/", deleteAccount); // delete logged-in user

// export default router;
// videos related:
// // src/controllers/video.controller.js
// import mongoose, { isValidObjectId } from "mongoose";
// import { Video } from "../models/video.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import {
//   uploadOnCloudinary,
//   deleteFromCloudinary,
// } from "../utils/cloudinary.js";

// /* ---------- Constants & helpers ---------- */

// const CATEGORY_LIST = [
//   "General",
//   "Music",
//   "Gaming",
//   "Education",
//   "Entertainment",
//   "Sports",
//   "Technology",
//   "Travel",
//   "Food",
//   "Fitness",
//   "Comedy",
//   "News",
//   "How-to",
//   "Vlog",
//   "Other",
// ];

// const MAX_LIMIT = 50;

// const toInt = (v, def = 0) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : def;
// };
// const toBoolFromString = (v, def) => {
//   if (v === undefined || v === null) return def;
//   if (typeof v === "boolean") return v;
//   const s = String(v).toLowerCase();
//   if (s === "true") return true;
//   if (s === "false") return false;
//   return def;
// };

// const coercePageLimit = (page, limit) => {
//   const p = Math.max(1, toInt(page, 1));
//   const l = Math.max(1, Math.min(MAX_LIMIT, toInt(limit, 10)));
//   return { page: p, limit: l };
// };

// const validateTitle = (title) =>
//   typeof title === "string" &&
//   title.trim().length >= 3 &&
//   title.trim().length <= 100;
// const validateDescription = (desc) =>
//   desc === undefined ||
//   desc === null ||
//   (typeof desc === "string" && desc.trim().length <= 2000);

// const normalizeCategory = (c) => {
//   if (!c || typeof c !== "string") return null;
//   const exact = CATEGORY_LIST.find((x) => x === c.trim());
//   if (exact) return exact;
//   const ci = CATEGORY_LIST.find(
//     (x) => x.toLowerCase() === c.trim().toLowerCase()
//   );
//   return ci || null;
// };
// const normalizeTags = (tags) => {
//   if (!tags) return [];
//   const arr = Array.isArray(tags)
//     ? tags
//     : String(tags)
//         .split(",")
//         .map((t) => t.trim());
//   return arr.filter((t) => t.length > 0 && t.length <= 50);
// };

// const OWNER_PROJECTION = "username email avatar fullName bio";

// /* ---------- Public: categories ---------- */
// export const getValidCategories = asyncHandler(async (_req, res) => {
//   return res
//     .status(200)
//     .json(new ApiResponse(200, CATEGORY_LIST, "Categories"));
// });

// /* ---------- Public: list videos ---------- */
// export const getAllVideos = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 10,
//     query = "",
//     sortBy = "createdAt",
//     sortType = "desc",
//     userId,
//     isPublished = "true",
//     category,
//     duration,
//     minViews,
//     maxViews,
//   } = req.query;

//   const { page: P, limit: L } = coercePageLimit(page, limit);
//   const match = {};

//   if (query) {
//     const q = String(query).trim();
//     match.$or = [
//       { title: { $regex: q, $options: "i" } },
//       { description: { $regex: q, $options: "i" } },
//       { tags: { $in: [new RegExp(q, "i")] } },
//     ];
//   }
//   if (userId && isValidObjectId(userId)) {
//     match.owner = new mongoose.Types.ObjectId(userId);
//   }
//   const pub = toBoolFromString(isPublished, true);
//   if (pub !== undefined) match.isPublished = !!pub;
//   if (category) match.category = category;

//   if (duration) {
//     const [min, max] = String(duration)
//       .split("-")
//       .map((n) => toInt(n, 0));
//     if (min && max) match.duration = { $gte: min, $lte: max };
//     else if (min) match.duration = { $gte: min };
//   }

//   const minV = toInt(minViews, undefined);
//   const maxV = toInt(maxViews, undefined);
//   if (minV !== undefined || maxV !== undefined) {
//     match.views = {};
//     if (minV !== undefined) match.views.$gte = minV;
//     if (maxV !== undefined) match.views.$lte = maxV;
//   }

//   const sort = { [sortBy]: String(sortType).toLowerCase() === "asc" ? 1 : -1 };

//   const pipeline = [
//     { $match: match },
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner",
//       },
//     },
//     { $unwind: "$owner" },
//     {
//       $project: {
//         videoFile: 1,
//         thumbnail: 1,
//         title: 1,
//         description: 1,
//         duration: 1,
//         views: 1,
//         isPublished: 1,
//         category: 1,
//         tags: 1,
//         likes: 1,
//         dislikes: 1,
//         createdAt: 1,
//         updatedAt: 1,
//         "owner._id": 1,
//         "owner.username": 1,
//         "owner.avatar": 1,
//         "owner.fullName": 1,
//       },
//     },
//     { $sort: sort },
//   ];

//   const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
//     page: P,
//     limit: L,
//   });

//   return res.status(200).json(new ApiResponse(200, result, "Videos fetched"));
// });

// /* ---------- Public: get by id (published) OR owner via auth ---------- */
// export const getVideoById = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

//   const video = await Video.findById(videoId)
//     .populate("owner", OWNER_PROJECTION)
//     .lean();
//   if (!video) throw new ApiError(404, "Video not found");

//   const requesterId = req.user?._id?.toString();
//   const isOwner = requesterId && video.owner?._id?.toString() === requesterId;

//   if (!video.isPublished && !isOwner) {
//     throw new ApiError(403, "This video is not available");
//   }

//   if (video.isPublished && !isOwner) {
//     await Video.updateOne({ _id: video._id }, { $inc: { views: 1 } });
//     video.views += 1;
//   }

//   return res.status(200).json(new ApiResponse(200, video, "Video fetched"));
// });

// /* ---------- Protected: publish (create) ---------- */
// export const publishAVideo = asyncHandler(async (req, res) => {
//   const { title, description, category, tags, isPublished = "true" } = req.body;

//   if (!validateTitle(title))
//     throw new ApiError(400, "Title must be 3–100 characters");
//   if (!validateDescription(description))
//     throw new ApiError(400, "Description cannot exceed 2000 characters");

//   const cat = category ? normalizeCategory(category) : null;
//   if (category && !cat) {
//     throw new ApiError(
//       400,
//       `Invalid category. Valid: ${CATEGORY_LIST.join(", ")}`
//     );
//   }

//   // Files (from upload.fields)
//   const videoFile = req.files?.videoFile?.[0] || null;
//   const thumbnail = req.files?.thumbnail?.[0] || null;

//   if (!videoFile) throw new ApiError(400, "Video file is required");

//   // Upload video
//   let videoUpload;
//   try {
//     videoUpload = await uploadOnCloudinary(videoFile.path, "videos");
//     if (!videoUpload?.secure_url) throw new Error("No secure_url");
//   } catch (err) {
//     console.error("Video upload error:", err);
//     throw new ApiError(500, "Failed to upload video");
//   }

//   // Upload thumbnail (optional)
//   let thumbnailUrl =
//     videoUpload.thumbnail || "https://via.placeholder.com/1280x720";
//   let thumbnailPublicId = null;

//   if (thumbnail) {
//     try {
//       const th = await uploadOnCloudinary(thumbnail.path, "thumbnails");
//       if (th?.secure_url) {
//         thumbnailUrl = th.secure_url;
//         thumbnailPublicId = th.public_id;
//       }
//     } catch (err) {
//       console.error("Thumbnail upload error:", err);
//       // continue with fallback
//     }
//   }

//   const doc = await Video.create({
//     title: title.trim(),
//     description: (description || "").trim(),
//     videoFile: videoUpload.secure_url,
//     thumbnail: thumbnailUrl,
//     duration: Math.floor(videoUpload.duration || 0),
//     category: cat || "General",
//     tags: normalizeTags(tags),
//     isPublished: toBoolFromString(isPublished, true),
//     owner: req.user._id,
//     cloudinaryVideoId: videoUpload.public_id,
//     cloudinaryThumbnailId: thumbnailPublicId,
//   });

//   const populated = await Video.findById(doc._id).populate(
//     "owner",
//     "username email avatar fullName"
//   );

//   return res
//     .status(201)
//     .json(new ApiResponse(201, populated, "Video published"));
// });

// /* ---------- Protected: update ---------- */
// export const updateVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

//   const { title, description, category, tags, isPublished } = req.body;
//   const video = await Video.findById(videoId);
//   if (!video) throw new ApiError(404, "Video not found");
//   if (video.owner.toString() !== req.user._id.toString())
//     throw new ApiError(403, "You can only update your own videos");

//   if (title !== undefined && !validateTitle(title))
//     throw new ApiError(400, "Title must be 3–100 characters");
//   if (description !== undefined && !validateDescription(description))
//     throw new ApiError(400, "Description cannot exceed 2000 characters");

//   if (title !== undefined) video.title = title.trim();
//   if (description !== undefined) video.description = description.trim();

//   if (category !== undefined) {
//     if (!category) video.category = "General";
//     else {
//       const nc = normalizeCategory(category);
//       if (!nc)
//         throw new ApiError(
//           400,
//           `Invalid category. Valid: ${CATEGORY_LIST.join(", ")}`
//         );
//       video.category = nc;
//     }
//   }

//   if (isPublished !== undefined) {
//     video.isPublished = toBoolFromString(isPublished, video.isPublished);
//   }

//   if (tags !== undefined) {
//     video.tags = normalizeTags(tags);
//   }

//   // Optional new thumbnail via upload.single("thumbnail")
//   const newThumb = req.file || null;
//   if (newThumb) {
//     try {
//       const th = await uploadOnCloudinary(newThumb.path, "thumbnails");
//       if (!th?.secure_url) throw new Error("Thumbnail upload failed");
//       if (video.cloudinaryThumbnailId) {
//         try {
//           await deleteFromCloudinary(video.cloudinaryThumbnailId);
//         } catch (err) {
//           console.error("Old thumbnail delete error:", err);
//         }
//       }
//       video.thumbnail = th.secure_url;
//       video.cloudinaryThumbnailId = th.public_id;
//     } catch (err) {
//       console.error("Thumbnail upload error:", err);
//       throw new ApiError(500, "Failed to upload thumbnail");
//     }
//   }

//   await video.save();

//   const updated = await Video.findById(videoId).populate(
//     "owner",
//     "username email avatar fullName"
//   );
//   return res.status(200).json(new ApiResponse(200, updated, "Video updated"));
// });

// /* ---------- Protected: delete ---------- */
// export const deleteVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

//   const video = await Video.findById(videoId);
//   if (!video) throw new ApiError(404, "Video not found");
//   if (video.owner.toString() !== req.user._id.toString())
//     throw new ApiError(403, "You can only delete your own videos");

//   try {
//     if (video.cloudinaryVideoId)
//       await deleteFromCloudinary(video.cloudinaryVideoId, "video");
//     if (video.cloudinaryThumbnailId)
//       await deleteFromCloudinary(video.cloudinaryThumbnailId);
//   } catch (err) {
//     console.error("Cloudinary delete error:", err);
//   }

//   await Video.findByIdAndDelete(videoId);
//   return res.status(200).json(new ApiResponse(200, null, "Video deleted"));
// });

// /* ---------- Protected: toggle publish ---------- */
// export const togglePublishStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

//   const video = await Video.findById(videoId);
//   if (!video) throw new ApiError(404, "Video not found");
//   if (video.owner.toString() !== req.user._id.toString())
//     throw new ApiError(403, "You can only update your own videos");

//   video.isPublished = !video.isPublished;
//   await video.save();

//   return res
//     .status(200)
//     .json(new ApiResponse(200, video, "Publish status updated"));
// });

// /* ---------- Protected: owner stats ---------- */
// export const getVideoStats = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

//   const video = await Video.findById(videoId);
//   if (!video) throw new ApiError(404, "Video not found");
//   if (video.owner.toString() !== req.user._id.toString())
//     throw new ApiError(403, "You can only view stats for your own videos");

//   const stats = {
//     views: video.views,
//     likes: video.likes || 0,
//     dislikes: video.dislikes || 0,
//     engagementRate:
//       video.views > 0
//         ? Number((((video.likes || 0) / video.views) * 100).toFixed(2))
//         : 0,
//     duration: video.duration,
//     isPublished: video.isPublished,
//     createdAt: video.createdAt,
//     updatedAt: video.updatedAt,
//   };

//   return res.status(200).json(new ApiResponse(200, stats, "Video stats"));
// });
// //searchvideo
// export const searchVideos = asyncHandler(async (req, res) => {
//   const { q, page = 1, limit = 10, sortBy = "relevance" } = req.query;

//   const { page: P, limit: L } = coercePageLimit(page, limit);

//   const query = String(q || "").trim();
//   if (query.length < 2) {
//     throw new ApiError(400, "Search query must be at least 2 characters long");
//   }

//   // If you have a MongoDB text index (e.g., on title/description/tags), set this to true
//   // and add { score: { $meta: "textScore" } } usage for relevance sorting.
//   const hasTextIndex = false;

//   const pipeline = [];

//   if (hasTextIndex) {
//     pipeline.push({
//       $match: { isPublished: true, $text: { $search: query } },
//     });
//   } else {
//     pipeline.push({
//       $match: {
//         isPublished: true,
//         $or: [
//           { title: { $regex: query, $options: "i" } },
//           { description: { $regex: query, $options: "i" } },
//           { tags: { $in: [new RegExp(query, "i")] } },
//         ],
//       },
//     });
//   }

//   // Join owner (channel) info
//   pipeline.push(
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner",
//       },
//     },
//     { $unwind: "$owner" }
//   );

//   // Sorting options
//   if (sortBy === "date") {
//     pipeline.push({ $sort: { createdAt: -1 } });
//   } else if (sortBy === "views") {
//     pipeline.push({ $sort: { views: -1 } });
//   } else if (sortBy === "duration") {
//     pipeline.push({ $sort: { duration: 1 } });
//   } else if (hasTextIndex) {
//     // relevance by text score if text index is enabled
//     pipeline.push({ $sort: { score: { $meta: "textScore" } } });
//   } else {
//     // fallback: newest first
//     pipeline.push({ $sort: { createdAt: -1 } });
//   }

//   // Project safe fields
//   pipeline.push({
//     $project: {
//       videoFile: 1,
//       thumbnail: 1,
//       title: 1,
//       description: 1,
//       duration: 1,
//       views: 1,
//       category: 1,
//       tags: 1,
//       likes: 1,
//       dislikes: 1,
//       createdAt: 1,
//       "owner._id": 1,
//       "owner.username": 1,
//       "owner.fullName": 1,
//       "owner.avatar": 1,
//       ...(hasTextIndex ? { score: { $meta: "textScore" } } : {}),
//     },
//   });

//   const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
//     page: P,
//     limit: L,
//   });

//   return res.status(200).json(new ApiResponse(200, result, "Search results fetched successfully"));
// });

// /* ---------- Protected: upload status ---------- */
// export const getVideoUploadStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

//   const video = await Video.findById(videoId).populate(
//     "owner",
//     "username email avatar fullName"
//   );
//   if (!video) throw new ApiError(404, "Video not found");
//   if (video.owner._id.toString() !== req.user._id.toString())
//     throw new ApiError(403, "Only owner can view upload status");

//   const status = {
//     id: video._id,
//     title: video.title,
//     isPublished: video.isPublished,
//     uploadStatus: video.videoFile ? "completed" : "processing",
//     processingStatus: video.duration ? "completed" : "processing",
//     thumbnailStatus: video.thumbnail ? "completed" : "processing",
//     createdAt: video.createdAt,
//     updatedAt: video.updatedAt,
//   };

//   return res.status(200).json(new ApiResponse(200, status, "Upload status"));
// });

// /* ---------- Public: trending ---------- */
// export const getTrendingVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, timeRange = "7d" } = req.query;
//   const { page: P, limit: L } = coercePageLimit(page, limit);

//   const cutoff = new Date();
//   const tr = String(timeRange || "7d").toLowerCase();
//   if (tr === "1d") cutoff.setDate(cutoff.getDate() - 1);
//   else if (tr === "7d") cutoff.setDate(cutoff.getDate() - 7);
//   else if (tr === "30d") cutoff.setDate(cutoff.getDate() - 30);
//   else cutoff.setDate(cutoff.getDate() - 7);

//   const pipeline = [
//     { $match: { isPublished: true, createdAt: { $gte: cutoff } } },
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner",
//       },
//     },
//     { $unwind: "$owner" },
//     {
//       $addFields: {
//         score: {
//           $add: [
//             { $multiply: ["$views", 1] },
//             { $multiply: ["$likes", 2] },
//             { $multiply: [{ $subtract: ["$likes", "$dislikes"] }, 3] },
//           ],
//         },
//       },
//     },
//     { $sort: { score: -1 } },
//     {
//       $project: {
//         videoFile: 1,
//         thumbnail: 1,
//         title: 1,
//         description: 1,
//         duration: 1,
//         views: 1,
//         category: 1,
//         tags: 1,
//         likes: 1,
//         dislikes: 1,
//         score: 1,
//         createdAt: 1,
//         "owner._id": 1,
//         "owner.username": 1,
//         "owner.avatar": 1,
//         "owner.fullName": 1,
//       },
//     },
//   ];

//   const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
//     page: P,
//     limit: L,
//   });

//   return res.status(200).json(new ApiResponse(200, result, "Trending"));
// });

// /* ---------- Public/Protected: user videos ---------- */
// export const getUserVideos = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const { page = 1, limit = 10, isPublished } = req.query;
//   if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

//   const { page: P, limit: L } = coercePageLimit(page, limit);

//   const requesterId = req.user?._id?.toString();
//   const isOwner = requesterId && userId === requesterId;

//   const match = { owner: new mongoose.Types.ObjectId(userId) };
//   if (isOwner) {
//     if (isPublished !== undefined) {
//       const pub = toBoolFromString(isPublished, undefined);
//       if (pub !== undefined) match.isPublished = pub;
//     }
//   } else {
//     match.isPublished = true;
//   }

//   const pipeline = [
//     { $match: match },
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner",
//       },
//     },
//     { $unwind: "$owner" },
//     {
//       $project: {
//         videoFile: 1,
//         thumbnail: 1,
//         title: 1,
//         description: 1,
//         duration: 1,
//         views: 1,
//         isPublished: 1,
//         category: 1,
//         tags: 1,
//         likes: 1,
//         dislikes: 1,
//         createdAt: 1,
//         "owner._id": 1,
//         "owner.username": 1,
//         "owner.avatar": 1,
//         "owner.fullName": 1,
//       },
//     },
//     { $sort: { createdAt: -1 } },
//   ];

//   const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
//     page: P,
//     limit: L,
//   });

//   return res.status(200).json(new ApiResponse(200, result, "User videos"));
// });
// // src/middlewares/multer.middleware.js
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { ApiError } from "../utils/ApiError.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Ensure temp directory exists
// const TEMP_DIR = path.resolve(process.cwd(), "public", "temp");
// if (!fs.existsSync(TEMP_DIR)) {
//   fs.mkdirSync(TEMP_DIR, { recursive: true });
// }

// // Size limits
// export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
// export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// // Allowed types
// export const ALLOWED_VIDEO_TYPES = new Set([
//   "video/mp4",
//   "video/avi",
//   "video/mov",
//   "video/wmv",
//   "video/flv",
//   "video/webm",
//   "video/mkv",
// ]);

// export const ALLOWED_IMAGE_TYPES = new Set([
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/webp",
//   "image/gif",
// ]);

// // Storage
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, TEMP_DIR),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname || "");
//     const name = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
//     cb(null, name);
//   },
// });

// // File filter (type-level validation; size enforced by limits)
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "videoFile") {
//     if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
//       return cb(
//         new ApiError(
//           400,
//           `Invalid video format. Allowed: ${Array.from(ALLOWED_VIDEO_TYPES)
//             .map((t) => t.split("/")[1])
//             .join(", ")}`
//         )
//       );
//     }
//   } else if (file.fieldname === "thumbnail") {
//     if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
//       return cb(
//         new ApiError(
//           400,
//           `Invalid image format. Allowed: ${Array.from(ALLOWED_IMAGE_TYPES)
//             .map((t) => t.split("/")[1])
//             .join(", ")}`
//         )
//       );
//     }
//   }
//   cb(null, true);
// };

// // Generic multi-file uploader (used for create)
// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     // Multer’s fileSize applies to each file separately.
//     // We set the max to video size; thumbnail is validated in controller too.
//     fileSize: MAX_VIDEO_SIZE,
//     files: 3,
//   },
// });

// // Single-purpose helpers
// export const uploadVideo = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: MAX_VIDEO_SIZE },
// });

// export const uploadImage = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: MAX_IMAGE_SIZE },
// });

// // Centralized Multer error handler (use right after multer middleware in routes)
// export const handleMulterError = (error, _req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     // Multer codes: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE, etc.
//     let message = "Upload error.";
//     if (error.code === "LIMIT_FILE_SIZE") {
//       message = "File too large. Max 500MB for video and 5MB for images.";
//     } else if (error.code === "LIMIT_FILE_COUNT") {
//       message = "Too many files. Only videoFile and thumbnail are allowed.";
//     } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
//       message =
//         'Unexpected file field. Allowed fields: "videoFile", "thumbnail".';
//     }
//     return res.status(400).json({ success: false, message, code: error.code });
//   }

//   if (error instanceof ApiError) {
//     return res
//       .status(error.statusCode)
//       .json({ success: false, message: error.message });
//   }

//   return next(error);
// };
//  import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const videoSchema = new Schema(
//   {
//     videoFile: {
//       type: String, // cloudinary url
//       required: true,
//     },
//     thumbnail: {
//       type: String, // cloudinary url
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//       minlength: [3, "Title must be at least 3 characters"],
//       maxlength: [100, "Title cannot exceed 100 characters"],
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: [2000, "Description cannot exceed 2000 characters"],
//     },
//     duration: {
//       type: Number,
//       required: true,
//       min: [0, "Duration cannot be negative"],
//     },
//     views: {
//       type: Number,
//       default: 0,
//       min: [0, "Views cannot be negative"],
//     },
//     likes: {
//       type: Number,
//       default: 0,
//       min: [0, "Likes cannot be negative"],
//     },
//     dislikes: {
//       type: Number,
//       default: 0,
//       min: [0, "Dislikes cannot be negative"],
//     },
//     isPublished: {
//       type: Boolean,
//       default: true,
//     },
//     category: {
//       type: String,
//       default: "General",
//       enum: [
//         "General",
//         "Music",
//         "Gaming",
//         "Education",
//         "Entertainment",
//         "Sports",
//         "Technology",
//         "Travel",
//         "Food",
//         "Fitness",
//         "Comedy",
//         "News",
//         "How-to",
//         "Vlog",
//         "Other",
//       ],
//     },
//     tags: [
//       {
//         type: String,
//         trim: true,
//         maxlength: [50, "Tag cannot exceed 50 characters"],
//       },
//     ],
//     owner: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     cloudinaryVideoId: {
//       type: String,
//       required: true,
//     },
//     cloudinaryThumbnailId: {
//       type: String,
//     },
//     // Video metadata
//     resolution: {
//       type: String,
//     },
//     format: {
//       type: String,
//     },
//     size: {
//       type: Number, // in bytes
//     },
//     // Engagement tracking
//     watchTime: {
//       type: Number,
//       default: 0, // total watch time in seconds
//     },
//     averageWatchTime: {
//       type: Number,
//       default: 0, // average watch time per view in seconds
//     },
//     // Privacy settings
//     isPrivate: {
//       type: Boolean,
//       default: false,
//     },
//     allowComments: {
//       type: Boolean,
//       default: true,
//     },
//     allowLikes: {
//       type: Boolean,
//       default: true,
//     },
//     // SEO fields
//     metaTitle: {
//       type: String,
//       maxlength: [60, "Meta title cannot exceed 60 characters"],
//     },
//     metaDescription: {
//       type: String,
//       maxlength: [160, "Meta description cannot exceed 160 characters"],
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: {
//       virtuals: true,
//       transform: function (doc, ret) {
//         // Add computed fields
//         ret.engagementRate = ret.views > 0 ? ((ret.likes || 0) / ret.views * 100).toFixed(2) : 0;
//         ret.durationFormatted = formatDuration(ret.duration);
//         ret.viewsFormatted = formatViews(ret.views);
//         return ret;
//       },
//     },
//   }
// );

// // Helper functions for formatting
// const formatDuration = (seconds) => {
//   if (!seconds) return "0:00";
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const secs = seconds % 60;

//   if (hours > 0) {
//     return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   }
//   return `${minutes}:${secs.toString().padStart(2, '0')}`;
// };

// const formatViews = (views) => {
//   if (!views) return "0 views";
//   if (views >= 1000000) {
//     return `${(views / 1000000).toFixed(1)}M views`;
//   } else if (views >= 1000) {
//     return `${(views / 1000).toFixed(1)}K views`;
//   }
//   return `${views} views`;
// };

// // Indexes for better performance
// videoSchema.index({ title: "text", description: "text", tags: "text" });
// videoSchema.index({ owner: 1, createdAt: -1 });
// videoSchema.index({ category: 1, isPublished: 1 });
// videoSchema.index({ views: -1 });
// videoSchema.index({ likes: -1 });
// videoSchema.index({ createdAt: -1 });

// // Virtual for like ratio
// videoSchema.virtual("likeRatio").get(function () {
//   const total = this.likes + this.dislikes;
//   return total > 0 ? ((this.likes / total) * 100).toFixed(1) : 0;
// });

// // Instance methods
// videoSchema.methods.incrementViews = async function () {
//   this.views += 1;
//   return await this.save();
// };

// videoSchema.methods.addLike = async function () {
//   this.likes += 1;
//   return await this.save();
// };

// videoSchema.methods.removeLike = async function () {
//   if (this.likes > 0) {
//     this.likes -= 1;
//   }
//   return await this.save();
// };

// videoSchema.methods.addDislike = async function () {
//   this.dislikes += 1;
//   return await this.save();
// };

// videoSchema.methods.removeDislike = async function () {
//   if (this.dislikes > 0) {
//     this.dislikes -= 1;
//   }
//   return await this.save();
// };

// // Static methods
// videoSchema.statics.getTrendingVideos = function (limit = 10, timeRange = "7d") {
//   const dateFilter = new Date();
//   switch (timeRange) {
//     case "1d":
//       dateFilter.setDate(dateFilter.getDate() - 1);
//       break;
//     case "7d":
//       dateFilter.setDate(dateFilter.getDate() - 7);
//       break;
//     case "30d":
//       dateFilter.setDate(dateFilter.getDate() - 30);
//       break;
//     default:
//       dateFilter.setDate(dateFilter.getDate() - 7);
//   }

//   return this.aggregate([
//     {
//       $match: {
//         isPublished: true,
//         createdAt: { $gte: dateFilter },
//       },
//     },
//     {
//       $addFields: {
//         score: {
//           $add: [
//             { $multiply: ["$views", 1] },
//             { $multiply: ["$likes", 2] },
//             { $multiply: [{ $subtract: ["$likes", "$dislikes"] }, 3] },
//           ],
//         },
//       },
//     },
//     { $sort: { score: -1 } },
//     { $limit: limit },
//   ]);
// };

// videoSchema.statics.getRelatedVideos = function (videoId, category, tags, limit = 10) {
//   return this.aggregate([
//     {
//       $match: {
//         _id: { $ne: new mongoose.Types.ObjectId(videoId) },
//         isPublished: true,
//         $or: [
//           { category: category },
//           { tags: { $in: tags } },
//         ],
//       },
//     },
//     { $sort: { views: -1 } },
//     { $limit: limit },
//   ]);
// };

// videoSchema.plugin(mongooseAggregatePaginate);

// export const Video = mongoose.model("Video", videoSchema);
// // src/routes/video.routes.js
// import { Router } from "express";
// import {
//   deleteVideo,
//   getAllVideos,
//   getVideoById,
//   publishAVideo,
//   togglePublishStatus,
//   updateVideo,
//   getUserVideos,
//   getTrendingVideos,
//   getVideoStats,
//   searchVideos,
//   getValidCategories,
//   getVideoUploadStatus,
// } from "../controllers/video.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { upload, handleMulterError } from "../middlewares/multer.middleware.js";

// const router = Router();

// /* ------------- PUBLIC ------------- */
// router.get("/", getAllVideos);
// router.get("/trending", getTrendingVideos);
// router.get("/search", searchVideos);
// router.get("/categories", getValidCategories);
// router.get("/user/:userId", getUserVideos);

// // Public watch (published videos). Owner can see unpublished if authenticated (controller handles).
// router.get("/:videoId", getVideoById);

// /* ------------- PROTECTED ------------- */
// router.use(verifyJWT);

// // Create (multipart fields)
// router.post(
//   "/",
//   upload.fields([
//     { name: "videoFile", maxCount: 1 },
//     { name: "thumbnail", maxCount: 1 },
//   ]),
//   handleMulterError,
//   publishAVideo
// );

// // Update (thumbnail optional via single upload)
// router.patch(
//   "/:videoId",
//   upload.single("thumbnail"),
//   handleMulterError,
//   updateVideo
// );

// // Delete
// router.delete("/:videoId", deleteVideo);

// // Management
// router.patch("/toggle/publish/:videoId", togglePublishStatus);
// router.get("/stats/:videoId", getVideoStats);
// router.get("/status/:videoId", getVideoUploadStatus);

// export default router;
// comment related:
// import mongoose from "mongoose"
// import {Comment} from "../models/comment.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const getVideoComments = asyncHandler(async (req, res) => {
//     //TODO: get all comments for a video
//     const {videoId} = req.params
//     const {page = 1, limit = 10} = req.query

// })

// const addComment = asyncHandler(async (req, res) => {
//     // TODO: add a comment to a video
// })

// const updateComment = asyncHandler(async (req, res) => {
//     // TODO: update a comment
// })

// const deleteComment = asyncHandler(async (req, res) => {
//     // TODO: delete a comment
// })

// export {
//     getVideoComments,
//     addComment,
//     updateComment,
//      deleteComment
//     }
// import mongoose, {Schema} from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const commentSchema = new Schema(
//     {
//         content: {
//             type: String,
//             required: true
//         },
//         video: {
//             type: Schema.Types.ObjectId,
//             ref: "Video"
//         },
//         owner: {
//             type: Schema.Types.ObjectId,
//             ref: "User"
//         }
//     },
//     {
//         timestamps: true
//     }
// )

// commentSchema.plugin(mongooseAggregatePaginate)

// export const Comment = mongoose.model("Comment", commentSchema)
// import { Router } from 'express';
// import {
//     addComment,
//     deleteComment,
//     getVideoComments,
//     updateComment,
// } from "../controllers/comment.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/:videoId").get(getVideoComments).post(addComment);
// router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

// export default router .
// like related:
// import mongoose, {isValidObjectId} from "mongoose"
// import {Like} from "../models/like.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const toggleVideoLike = asyncHandler(async (req, res) => {
//     const {videoId} = req.params
//     //TODO: toggle like on video
// })

// const toggleCommentLike = asyncHandler(async (req, res) => {
//     const {commentId} = req.params
//     //TODO: toggle like on comment

// })

// const toggleTweetLike = asyncHandler(async (req, res) => {
//     const {tweetId} = req.params
//     //TODO: toggle like on tweet
// }
// )

// const getLikedVideos = asyncHandler(async (req, res) => {
//     //TODO: get all liked videos
// })

// export {
//     toggleCommentLike,
//     toggleTweetLike,
//     toggleVideoLike,
//     getLikedVideos
// }
// import mongoose, { Schema } from "mongoose";

// const likeSchema = new Schema(
//   {
//     video: {
//       type: Schema.Types.ObjectId,
//       ref: "Video",
//     },
//     comment: {
//       type: Schema.Types.ObjectId,
//       ref: "Comment",
//     },
//     tweet: {
//       type: Schema.Types.ObjectId,
//       ref: "Tweet",
//     },
//     likedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// export const Like = mongoose.model("Like", likeSchema);.
// import { Router } from 'express';
// import {
//     getLikedVideos,
//     toggleCommentLike,
//     toggleVideoLike,
//     toggleTweetLike,
// } from "../controllers/like.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/toggle/v/:videoId").post(toggleVideoLike);
// router.route("/toggle/c/:commentId").post(toggleCommentLike);
// router.route("/toggle/t/:tweetId").post(toggleTweetLike);
// router.route("/videos").get(getLikedVideos);

// export default router.
// tweet related:
//  import mongoose, { isValidObjectId } from "mongoose"
// import {Tweet} from "../models/tweet.model.js"
// import {User} from "../models/user.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const createTweet = asyncHandler(async (req, res) => {
//     //TODO: create tweet
// })

// const getUserTweets = asyncHandler(async (req, res) => {
//     // TODO: get user tweets
// })

// const updateTweet = asyncHandler(async (req, res) => {
//     //TODO: update tweet
// })

// const deleteTweet = asyncHandler(async (req, res) => {
//     //TODO: delete tweet
// })

// export {
//     createTweet,
//     getUserTweets,
//     updateTweet,
//     deleteTweet
// }.
// import mongoose, {Schema} from "mongoose";

// const tweetSchema = new Schema({
//     content: {
//         type: String,
//         required: true
//     },
//     owner: {
//         type: Schema.Types.ObjectId,
//         ref: "User"
//     }
// }, {timestamps: true})

// export const Tweet = mongoose.model("Tweet", tweetSchema).
// import { Router } from 'express';
// import {
//     createTweet,
//     deleteTweet,
//     getUserTweets,
//     updateTweet,
// } from "../controllers/tweet.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/").post(createTweet);
// router.route("/user/:userId").get(getUserTweets);
// router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

// export default router.
// playlist related:
// import mongoose, { isValidObjectId } from "mongoose";
// import Playlist from "../models/playlist.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const createPlaylist = asyncHandler(async (req, res) => {
//   const { name, description } = req.body;

//   //TODO: create playlist
// });

// const getUserPlaylists = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   //TODO: get user playlists
// });

// const getPlaylistById = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;
//   //TODO: get playlist by id
// });

// const addVideoToPlaylist = asyncHandler(async (req, res) => {
//   const { playlistId, videoId } = req.params;
// });

// const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
//   const { playlistId, videoId } = req.params;
//   // TODO: remove video from playlist
// });

// const deletePlaylist = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;
//   // TODO: delete playlist
// });

// const updatePlaylist = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;
//   const { name, description } = req.body;
//   //TODO: update playlist
// });

// export {
//   createPlaylist,
//   getUserPlaylists,
//   getPlaylistById,
//   addVideoToPlaylist,
//   removeVideoFromPlaylist,
//   deletePlaylist,
//   updatePlaylist,
// };
// // models/Playlist.js
// import mongoose from "mongoose";

// const playlistSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Playlist", playlistSchema);
// import { Router } from 'express';
// import {
//     addVideoToPlaylist,
//     createPlaylist,
//     deletePlaylist,
//     getPlaylistById,
//     getUserPlaylists,
//     removeVideoFromPlaylist,
//     updatePlaylist,
// } from "../controllers/playlist.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/").post(createPlaylist)

// router
//     .route("/:playlistId")
//     .get(getPlaylistById)
//     .patch(updatePlaylist)
//     .delete(deletePlaylist);

// router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
// router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

// router.route("/user/:userId").get(getUserPlaylists);

// export default router
// dashboard related:
// import mongoose from "mongoose"
// import {Video} from "../models/video.model.js"
// import {Subscription} from "../models/subscription.model.js"
// import {Like} from "../models/like.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const getChannelStats = asyncHandler(async (req, res) => {
//     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
// })

// const getChannelVideos = asyncHandler(async (req, res) => {
//     // TODO: Get all the videos uploaded by the channel
// })

// export {
//     getChannelStats,
//     getChannelVideos
//     }
// import { Router } from 'express';
// import {
//     getChannelStats,
//     getChannelVideos,
// } from "../controllers/dashboard.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/stats").get(getChannelStats);
// router.route("/videos").get(getChannelVideos);

// export default router
// subscription related:
// import mongoose, {isValidObjectId} from "mongoose"
// import {User} from "../models/user.model.js"
// import { Subscription } from "../models/subscription.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const toggleSubscription = asyncHandler(async (req, res) => {
//     const {channelId} = req.params
//     // TODO: toggle subscription
// })

// // controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//     const {channelId} = req.params
// })

// // controller to return channel list to which user has subscribed
// const getSubscribedChannels = asyncHandler(async (req, res) => {
//     const { subscriberId } = req.params
// })

// export {
//     toggleSubscription,
//     getUserChannelSubscribers,
//     getSubscribedChannels
// }
// import mongoose, { Schema } from "mongoose";

// const subscriptionSchema = new Schema(
//   {
//     subscriber: {
//       type: Schema.Types.ObjectId, // one who is subscribing
//       ref: "User",
//     },
//     channel: {
//       type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// export const Subscription = mongoose.model("Subscription", subscriptionSchema);
// import { Router } from 'express';
// import {
//     getSubscribedChannels,
//     getUserChannelSubscribers,
//     toggleSubscription,
// } from "../controllers/subscription.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/c/:channelId")
//     .get(getSubscribedChannels)
//     .post(toggleSubscription);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);

// export default router.
// // FILE: src/app.js
// // ==============================
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import userRoutes from "./routes/user.routes.js";
// import videoRoutes from "./routes/video.routes.js";
// import commentRoutes from "./routes/comment.routes.js";
// import likeRoutes from "./routes/like.routes.js";
// import playlistRoutes from "./routes/playlist.routes.js";

// const app = express();

// // Security & body parsing
// app.use(helmet());
// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN || "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(cookieParser());

// // Throttle auth endpoints a bit
// const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use("/api/users/login", authLimiter);
// app.use("/api/users/register", authLimiter);
// app.use("/api/users/refresh-token", authLimiter);

// // Routes
// app.use("/api/users", userRoutes);
// app.use("/api/videos", videoRoutes);
// app.use("/api/comments", commentRoutes);
// app.use("/api/likes", likeRoutes);
// app.use("/api/playlists", playlistRoutes);

// // Health
// app.get("/", (req, res) => res.json({ message: "API running 🚀" }));

// // 404
// app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// // Centralized error handler
// // eslint-disable-next-line no-unused-vars
// app.use((err, req, res, next) => {
//   console.error(err);
//   const status = err.statusCode || 500;
//   res
//     .status(status)
//     .json({ error: status === 500 ? "Internal Server Error" : err.message });
// });

// export default app;
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import app from "./app.js";

// dotenv.config();

// const PORT = process.env.PORT || 8000;
// const MONGO_URI = process.env.MONGODB_URI;

// mongoose
//   .connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("✅ Connected to MongoDB");
//     app.listen(PORT, () => {
//       console.log(`🚀 Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ Failed to connect MongoDB:", err);
//     process.exit(1);
//   });
// // ✅ FILE: src/middlewares/error.middleware.js
// export const errorHandler = (err, req, res, next) => {
//   const statusCode = err.statusCode || 500;
//   const message = err.message || "Internal Server Error";

//   return res.status(statusCode).json({
//     success: false,
//     message,
//   });
// };
// // src/middlewares/multer.middleware.js
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { ApiError } from "../utils/ApiError.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Ensure temp directory exists
// const TEMP_DIR = path.resolve(process.cwd(), "public", "temp");
// if (!fs.existsSync(TEMP_DIR)) {
//   fs.mkdirSync(TEMP_DIR, { recursive: true });
// }

// // Size limits
// export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
// export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// // Allowed types
// export const ALLOWED_VIDEO_TYPES = new Set([
//   "video/mp4",
//   "video/avi",
//   "video/mov",
//   "video/wmv",
//   "video/flv",
//   "video/webm",
//   "video/mkv",
// ]);

// export const ALLOWED_IMAGE_TYPES = new Set([
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/webp",
//   "image/gif",
// ]);

// // Storage
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, TEMP_DIR),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname || "");
//     const name = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
//     cb(null, name);
//   },
// });

// // File filter (type-level validation; size enforced by limits)
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "videoFile") {
//     if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
//       return cb(
//         new ApiError(
//           400,
//           `Invalid video format. Allowed: ${Array.from(ALLOWED_VIDEO_TYPES)
//             .map((t) => t.split("/")[1])
//             .join(", ")}`
//         )
//       );
//     }
//   } else if (file.fieldname === "thumbnail") {
//     if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
//       return cb(
//         new ApiError(
//           400,
//           `Invalid image format. Allowed: ${Array.from(ALLOWED_IMAGE_TYPES)
//             .map((t) => t.split("/")[1])
//             .join(", ")}`
//         )
//       );
//     }
//   }
//   cb(null, true);
// };

// // Generic multi-file uploader (used for create)
// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     // Multer’s fileSize applies to each file separately.
//     // We set the max to video size; thumbnail is validated in controller too.
//     fileSize: MAX_VIDEO_SIZE,
//     files: 3,
//   },
// });

// // Single-purpose helpers
// export const uploadVideo = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: MAX_VIDEO_SIZE },
// });

// export const uploadImage = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: MAX_IMAGE_SIZE },
// });

// // Centralized Multer error handler (use right after multer middleware in routes)
// export const handleMulterError = (error, _req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     // Multer codes: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE, etc.
//     let message = "Upload error.";
//     if (error.code === "LIMIT_FILE_SIZE") {
//       message = "File too large. Max 500MB for video and 5MB for images.";
//     } else if (error.code === "LIMIT_FILE_COUNT") {
//       message = "Too many files. Only videoFile and thumbnail are allowed.";
//     } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
//       message =
//         'Unexpected file field. Allowed fields: "videoFile", "thumbnail".';
//     }
//     return res.status(400).json({ success: false, message, code: error.code });
//   }

//   if (error instanceof ApiError) {
//     return res
//       .status(error.statusCode)
//       .json({ success: false, message: error.message });
//   }

//   return next(error);
// };
// console.log("DB ENV:", process.env.MONGO_DB_URI); // Debug log
// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const connectionInstance = await mongoose.connect(process.env.MONGO_DB_URI);
//     console.log(
//       `\nMongoDB connected! Host: ${connectionInstance.connection.host}`
//     );
//   } catch (error) {
//     console.error("MONGODB connection FAILED ", error);
//     process.exit(1);
//   }
// };

// export default connectDB;
