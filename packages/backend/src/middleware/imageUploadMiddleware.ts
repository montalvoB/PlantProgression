import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";

class ImageFormatError extends Error {}

const storageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    // TODO 1: Read IMAGE_UPLOAD_DIR env var inside this function
    const uploadDir = process.env.IMAGE_UPLOAD_DIR || "uploads";
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // TODO 2: Determine file extension based on mimetype
    let fileExtension = "";
    switch (file.mimetype) {
      case "image/png":
        fileExtension = "png";
        break;
      case "image/jpg":
      case "image/jpeg":
        fileExtension = "jpg";
        break;
      default:
        // Unsupported type
        cb(new ImageFormatError("Unsupported image type"), "");
        return;
    }

    // Generate random file name to avoid collisions
    const fileName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + fileExtension;
    console.log("Saving file as:", fileName);
    cb(null, fileName);
  },
});

export const imageMiddlewareFactory = multer({
  storage: storageEngine,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

export function handleImageFileErrors(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError || err instanceof ImageFormatError) {
    res.status(400).send({
      error: "Bad Request",
      message: err.message,
    });
    return;
  }
  next(err); // For other errors, pass along
}
