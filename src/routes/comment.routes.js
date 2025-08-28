import { Router } from 'express';
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes

// Get comments for a video and add new comment
router.route("/:videoId").get(getVideoComments).post(addComment);

// Update and delete specific comment
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
