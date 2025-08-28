// src/routes/like.routes.js - Simplified
import { Router } from "express";
import {
  toggleVideoLike,
  toggleCommentLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
// Removed getLikedVideos route - now in user routes

export default router;
