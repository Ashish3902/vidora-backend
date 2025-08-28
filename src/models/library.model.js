// src/models/library.model.js - Dedicated Library Model
import mongoose, { Schema } from "mongoose";

// Watch Later Schema
const watchLaterSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Watch History Schema
const watchHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
      type: Number, // in seconds
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create indexes for performance
watchLaterSchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, watchedAt: -1 });

// Export Models
export const WatchLater = mongoose.model("WatchLater", watchLaterSchema);
export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
