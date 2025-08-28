// src/routes/video.routes.js
import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getUserVideos,
  getTrendingVideos,
  getVideoStats,
  searchVideos,
  getValidCategories,
  getVideoUploadStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload, handleMulterError } from "../middlewares/multer.middleware.js";

const router = Router();

/* ------------- PUBLIC ------------- */
router.get("/", getAllVideos);
router.get("/trending", getTrendingVideos);
router.get("/search", searchVideos);
router.get("/categories", getValidCategories);
router.get("/user/:userId", getUserVideos);

// Public watch (published videos). Owner can see unpublished if authenticated (controller handles).
router.get("/:videoId", getVideoById);

/* ------------- PROTECTED ------------- */
router.use(verifyJWT);

// Create (multipart fields)
router.post(
  "/",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  handleMulterError,
  publishAVideo
);

// Update (thumbnail optional via single upload)
router.patch(
  "/:videoId",
  upload.single("thumbnail"),
  handleMulterError,
  updateVideo
);

// Delete
router.delete("/:videoId", deleteVideo);

// Management
router.patch("/toggle/publish/:videoId", togglePublishStatus);
router.get("/stats/:videoId", getVideoStats);
router.get("/status/:videoId", getVideoUploadStatus);

export default router;
