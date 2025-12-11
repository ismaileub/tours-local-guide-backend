import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { ITourInput } from "./tour.interface";
import { Tour } from "./tour.model";
import { fileUploader } from "../../helpers/fileUploader";

const createTour = async (req: Request, user: JwtPayload) => {
  if (user.role !== "GUIDE") {
    throw new AppError(403, "Only guides can create tours");
  }

  // Extract fields from req.body
  const payload = { ...req.body };

  // Upload image if exists
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    payload.coverPhoto = uploadResult?.secure_url;
  }

  // Add guide automatically
  const newTour = await Tour.create({
    ...payload,
    guide: user.userId,
  });

  return newTour;
};

const updateTour = async (req: Request, user: JwtPayload) => {
  if (user.role !== "GUIDE") {
    throw new AppError(403, "Only guides can update tours");
  }

  const { id } = req.params;

  // Check ownership
  const tour = await Tour.findOne({ _id: id, guide: user.userId });

  if (!tour) {
    throw new AppError(404, "Tour not found or unauthorized");
  }

  // Create payload from JSON only
  const payload: Partial<ITourInput> = {
    title: req.body.title,
    location: req.body.location,
    price: req.body.price ? Number(req.body.price) : undefined,
    duration: req.body.duration,
    description: req.body.description,
    spots: req.body.spots ? req.body.spots : undefined,
  };

  // ❌ DO NOT allow changing coverPhoto
  delete payload.coverPhoto;

  // Update tour (only fields that exist)
  const updatedTour = await Tour.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedTour;
};

const deleteTour = async (req: Request, user: JwtPayload) => {
  if (user.role !== "GUIDE") {
    throw new AppError(403, "Only guides can delete tours");
  }

  const { id } = req.params;

  const tour = await Tour.findOne({ _id: id, guide: user.userId });

  if (!tour) {
    throw new AppError(404, "Tour not found or unauthorized");
  }

  await Tour.findByIdAndDelete(id);

  return true;
};

export const TourServices = {
  createTour,
  deleteTour,
  updateTour,
};
