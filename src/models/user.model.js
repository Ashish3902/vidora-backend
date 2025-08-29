// ==============================
// FILE: src/models/user.model.js - REBUILT VERSION
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
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, underscore and dot",
      ],
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [60, "Full name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // exclude by default
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required"],
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [200, "Bio cannot exceed 200 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [60, "Location cannot exceed 60 characters"],
    },
    social: {
      type: SocialSchema,
      default: () => ({}),
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Auth & security
    refreshToken: {
      type: String,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Video platform features
    watchHistory: [
      {
        video: {
          type: Schema.Types.ObjectId,
          ref: "Video",
          required: true,
        },
        watchedAt: {
          type: Date,
          default: Date.now,
        },
        watchDuration: {
          type: Number, // seconds watched
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    watchLater: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    // Additional user data
    subscribersCount: {
      type: Number,
      default: 0,
    },
    subscriptionsCount: {
      type: Number,
      default: 0,
    },
    videosCount: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===============================
// INDEXES (No duplicates)
// ===============================
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1 });

// Compound indexes for better query performance
UserSchema.index({ isActive: 1, role: 1 });
UserSchema.index({ username: 1, isActive: 1 });

// ===============================
// PRE-SAVE MIDDLEWARE
// ===============================
UserSchema.pre("save", async function (next) {
  // Hash password only if modified
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Update last login on save if user is logging in
UserSchema.pre("save", function (next) {
  if (this.isNew || !this.isModified()) {
    return next();
  }

  // Update lastLogin if user is being updated (typically on login)
  if (!this.lastLogin || this.isModified("refreshToken")) {
    this.lastLogin = new Date();
  }

  next();
});

// ===============================
// INSTANCE METHODS
// ===============================
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

UserSchema.methods.generateAccessToken = function () {
  try {
    return jwt.sign(
      {
        _id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
        issuer: "video-platform",
      }
    );
  } catch (error) {
    throw new Error("Token generation failed");
  }
};

UserSchema.methods.generateRefreshToken = function () {
  try {
    return jwt.sign(
      { _id: this._id },
      process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
        issuer: "video-platform",
      }
    );
  } catch (error) {
    throw new Error("Refresh token generation failed");
  }
};

UserSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    username: this.username,
    fullName: this.fullName,
    avatar: this.avatar,
    coverImage: this.coverImage,
    bio: this.bio,
    location: this.location,
    social: this.social,
    subscribersCount: this.subscribersCount,
    subscriptionsCount: this.subscriptionsCount,
    videosCount: this.videosCount,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

UserSchema.methods.getPrivateProfile = function () {
  return {
    ...this.getPublicProfile(),
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    watchHistory: this.watchHistory,
    watchLater: this.watchLater,
  };
};

// Method to add video to watch history
UserSchema.methods.addToWatchHistory = function (
  videoId,
  watchDuration = 0,
  completed = false
) {
  // Remove existing entry for this video
  this.watchHistory = this.watchHistory.filter(
    (item) => item.video.toString() !== videoId.toString()
  );

  // Add new entry at the beginning
  this.watchHistory.unshift({
    video: videoId,
    watchedAt: new Date(),
    watchDuration,
    completed,
  });

  // Keep only last 1000 entries
  if (this.watchHistory.length > 1000) {
    this.watchHistory = this.watchHistory.slice(0, 1000);
  }

  return this.save();
};

// Method to add video to watch later
UserSchema.methods.addToWatchLater = function (videoId) {
  // Check if video is already in watch later
  if (!this.watchLater.includes(videoId)) {
    this.watchLater.push(videoId);
  }
  return this.save();
};

// Method to remove video from watch later
UserSchema.methods.removeFromWatchLater = function (videoId) {
  this.watchLater = this.watchLater.filter(
    (id) => id.toString() !== videoId.toString()
  );
  return this.save();
};

// ===============================
// STATIC METHODS
// ===============================
UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email, isActive: true }).select(
    "+password"
  );

  if (!user) {
    throw new Error("Invalid login credentials");
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new Error("Invalid login credentials");
  }

  return user;
};

UserSchema.statics.findByUsername = function (username) {
  return this.findOne({
    username: username.toLowerCase(),
    isActive: true,
  });
};

// ===============================
// VIRTUALS
// ===============================
UserSchema.virtual("isVerified").get(function () {
  return this.isEmailVerified;
});

UserSchema.virtual("profileCompleteness").get(function () {
  let score = 0;
  if (this.fullName) score += 20;
  if (this.bio) score += 20;
  if (this.location) score += 20;
  if (this.coverImage) score += 20;
  if (this.isEmailVerified) score += 20;
  return score;
});

// ===============================
// TRANSFORM FUNCTIONS
// ===============================
function hideSensitiveData(doc, ret, options) {
  delete ret.password;
  delete ret.refreshToken;
  delete ret.emailVerificationToken;
  delete ret.emailVerificationExpires;
  delete ret.passwordResetToken;
  delete ret.passwordResetExpires;
  delete ret.__v;
  return ret;
}

UserSchema.set("toJSON", {
  virtuals: true,
  transform: hideSensitiveData,
});

UserSchema.set("toObject", {
  virtuals: true,
  transform: hideSensitiveData,
});

// ===============================
// ERROR HANDLING
// ===============================
UserSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    next(new Error(message));
  } else {
    next(error);
  }
});

export const User = mongoose.model("User", UserSchema);
