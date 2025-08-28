import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, // cloudinary url
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    duration: {
      type: Number,
      required: true,
      min: [0, "Duration cannot be negative"],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, "Likes cannot be negative"],
    },
    dislikes: {
      type: Number,
      default: 0,
      min: [0, "Dislikes cannot be negative"],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      default: "General",
      enum: [
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
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cloudinaryVideoId: {
      type: String,
      required: true,
    },
    cloudinaryThumbnailId: {
      type: String,
    },
    // Video metadata
    resolution: {
      type: String,
    },
    format: {
      type: String,
    },
    size: {
      type: Number, // in bytes
    },
    // Engagement tracking
    watchTime: {
      type: Number,
      default: 0, // total watch time in seconds
    },
    averageWatchTime: {
      type: Number,
      default: 0, // average watch time per view in seconds
    },
    // Privacy settings
    isPrivate: {
      type: Boolean,
      default: false,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowLikes: {
      type: Boolean,
      default: true,
    },
    // SEO fields
    metaTitle: {
      type: String,
      maxlength: [60, "Meta title cannot exceed 60 characters"],
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Add computed fields
        ret.engagementRate =
          ret.views > 0 ? (((ret.likes || 0) / ret.views) * 100).toFixed(2) : 0;
        ret.durationFormatted = formatDuration(ret.duration);
        ret.viewsFormatted = formatViews(ret.views);
        return ret;
      },
    },
  }
);

// Helper functions for formatting
const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const formatViews = (views) => {
  if (!views) return "0 views";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
};

// Indexes for better performance
videoSchema.index({ title: "text", description: "text", tags: "text" });
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ category: 1, isPublished: 1 });
videoSchema.index({ views: -1 });
videoSchema.index({ likes: -1 });
videoSchema.index({ createdAt: -1 });

// Virtual for like ratio
videoSchema.virtual("likeRatio").get(function () {
  const total = this.likes + this.dislikes;
  return total > 0 ? ((this.likes / total) * 100).toFixed(1) : 0;
});

// Instance methods
videoSchema.methods.incrementViews = async function () {
  this.views += 1;
  return await this.save();
};

videoSchema.methods.addLike = async function () {
  this.likes += 1;
  return await this.save();
};

videoSchema.methods.removeLike = async function () {
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return await this.save();
};

videoSchema.methods.addDislike = async function () {
  this.dislikes += 1;
  return await this.save();
};

videoSchema.methods.removeDislike = async function () {
  if (this.dislikes > 0) {
    this.dislikes -= 1;
  }
  return await this.save();
};

// Static methods
videoSchema.statics.getTrendingVideos = function (
  limit = 10,
  timeRange = "7d"
) {
  const dateFilter = new Date();
  switch (timeRange) {
    case "1d":
      dateFilter.setDate(dateFilter.getDate() - 1);
      break;
    case "7d":
      dateFilter.setDate(dateFilter.getDate() - 7);
      break;
    case "30d":
      dateFilter.setDate(dateFilter.getDate() - 30);
      break;
    default:
      dateFilter.setDate(dateFilter.getDate() - 7);
  }

  return this.aggregate([
    {
      $match: {
        isPublished: true,
        createdAt: { $gte: dateFilter },
      },
    },
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
    { $limit: limit },
  ]);
};

videoSchema.statics.getRelatedVideos = function (
  videoId,
  category,
  tags,
  limit = 10
) {
  return this.aggregate([
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(videoId) },
        isPublished: true,
        $or: [{ category: category }, { tags: { $in: tags } }],
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
};

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
