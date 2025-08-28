import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes

// Create new playlist
router.route("/").post(createPlaylist);

// Get user's playlists
router.route("/user/:userId").get(getUserPlaylists);

// Get, update, and delete specific playlist
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

// Add video to playlist
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

// Remove video from playlist
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router;
