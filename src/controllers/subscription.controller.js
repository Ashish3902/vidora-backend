// src/controllers/subscription.controller.js
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  let isSubscribed;
  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    isSubscribed = false;
  } else {
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    isSubscribed = true;
  }

  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed, subscriberCount },
        `${isSubscribed ? "Subscribed to" : "Unsubscribed from"} channel successfully`
      )
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const pipeline = [
    { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$subscriberDetails" },
    {
      $project: {
        subscriber: "$subscriberDetails",
        subscribedAt: "$createdAt",
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const subscribers = await Subscription.aggregatePaginate(
    Subscription.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const pipeline = [
    { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$channelDetails" },
    {
      $project: {
        channel: "$channelDetails",
        subscribedAt: "$createdAt",
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const subscriptions = await Subscription.aggregatePaginate(
    Subscription.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
