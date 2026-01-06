import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { envVars } from "../config/env";

// Multer: DISK storage (local only)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY_API_SECRET,
});

// Upload from local file path
const uploadToCloudinary = async (file: Express.Multer.File) => {
  return await cloudinary.uploader.upload(file.path, {
    folder: "tours",
  });
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
