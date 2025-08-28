// FILE: src/utils/cloudinary.js
// ========================================
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file
export const uploadOnCloudinary = async (localFilePath, folder = "uploads") => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: "auto", // auto detects image, video, etc
    });

    // File uploaded, remove local file
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // remove temp file if failed
    }
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

// Delete file
export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image"
) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};
