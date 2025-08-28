// ==============================
// FILE: src/models/user.model.js - FIXED VERSION
// ==============================
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SocialSchema = new Schema(
  {
    youtube: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_\.]+$/i, // letters, numbers, underscore, dot
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match:
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // exclude by default
    },
    avatar: {
      type: String,
      required: true, // per your earlier spec
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },

    bio: { type: String, trim: true, maxlength: 200 },
    location: { type: String, trim: true, maxlength: 60 },
    social: { type: SocialSchema, default: {} },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Auth & security
    refreshToken: { type: String, select: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // App features - FIXED: Moved watchLater inside the schema
    watchHistory: [
      {
        video: {
          type: Schema.Types.ObjectId,
          ref: "Video",
        },
        watchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    watchLater: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

// Pre-save: hash password if modified
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

UserSchema.methods.getPublicProfile = function () {
  const {
    _id,
    username,
    fullName,
    email,
    avatar,
    coverImage,
    bio,
    location,
    social,
    role,
    isEmailVerified,
    lastLogin,
    createdAt,
    updatedAt,
  } = this;
  return {
    _id,
    username,
    fullName,
    email,
    avatar,
    coverImage,
    bio,
    location,
    social,
    role,
    isEmailVerified,
    lastLogin,
    createdAt,
    updatedAt,
  };
};

// Hide sensitive fields in JSON
function hideSensitive(doc, ret) {
  delete ret.password;
  delete ret.refreshToken;
  delete ret.emailVerificationToken;
  delete ret.emailVerificationExpires;
  delete ret.passwordResetToken;
  delete ret.passwordResetExpires;
  delete ret.__v;
  return ret;
}
UserSchema.set("toJSON", { virtuals: true, transform: hideSensitive });
UserSchema.set("toObject", { virtuals: true, transform: hideSensitive });

export const User = mongoose.model("User", UserSchema);
