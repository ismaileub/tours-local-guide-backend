/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { fileUploader } from "../../helpers/fileUploader";
import { Request } from "express";
import { Review } from "../review/review.model";
import mongoose from "mongoose";
import { Tour } from "../tour/tour.model";
import { Booking } from "../booking/booking.model";

const createUser = async (payload: Partial<IUser>) => {
  // Check if body is missing
  if (!payload) {
    throw new AppError(400, "Request body is required");
  }

  const { email, password, role, ...rest } = payload;

  if (!email && !password) {
    throw new AppError(400, "Email and Password is required to create user");
  }

  // Custom validation
  if (!email) {
    throw new AppError(400, "Email is required");
  }

  if (!password) {
    throw new AppError(400, "Password is required");
  }

  // Check if user already exists
  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(400, "User already exists");
  }

  // Prevent assigning admin
  if (payload.role === Role.ADMIN) {
    throw new AppError(403, "Only Super Admin can assign 'ADMIN' roles.");
  }

  // Default role
  if (!payload.role) {
    payload.role = Role.GUIDE;
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
    role: role || Role.TOURIST,
    ...rest,
  });

  return user;
};

const updateUser = async (req: Request, user: JwtPayload) => {
  const userId = user.userId;
  const payload = { ...req.body };
  //console.log({ payload });

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // File upload → Cloudinary
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    payload.picture = uploadResult?.secure_url;
  }
  if (payload.languages) {
    payload.languages = payload.languages.map((l: string) => l.toLowerCase());
  }

  // Update user in DB
  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");

  return updatedUser;
};

const getAllUsers = async (page = 1, limit = 8) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const users = await User.find({})
    .select("-password")
    .skip(skip)
    .limit(limitNumber);

  const totalUsers = await User.countDocuments();

  return {
    data: users,
    meta: {
      total: totalUsers,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalUsers / limitNumber),
    },
  };
};

const getMeInfo = async (email: string) => {
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email not found in token");
  }

  const user = await User.findOne({ email }).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const getUserById = async (id: string) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // If the user is a GUIDE, fetch reviews
  if (user.role === "GUIDE") {
    const reviews = await Review.aggregate([
      {
        $match: {
          targetId: new mongoose.Types.ObjectId(id),
          targetType: "GUIDE",
        },
      },
      // Join reviewer info
      {
        $lookup: {
          from: "users",
          localField: "reviewerId",
          foreignField: "_id",
          as: "reviewer",
        },
      },
      { $unwind: "$reviewer" },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          reviewer: {
            _id: "$reviewer._id",
            name: "$reviewer.name",
            picture: "$reviewer.picture",
          },
        },
      },
      // Calculate average rating
      {
        $group: {
          _id: "$targetId",
          reviews: { $push: "$$ROOT" },
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return {
      ...user.toObject(),
      reviews: reviews[0]?.reviews || [],
      avgRating: reviews[0]?.avgRating || 0,
      totalReviews: reviews[0]?.totalReviews || 0,
    };
  }

  return user;
};

// const getAllGuides = async (page = 1, limit = 10, language?: string) => {
//   const pageNumber = Number(page);
//   const limitNumber = Number(limit);

//   const skip = (pageNumber - 1) * limitNumber;
//   const filter: Record<string, any> = {
//     role: "GUIDE",
//   };

//   if (language) {
//     filter.languages = { $in: [language.toLowerCase()] };
//   }

//   const guides = await User.find(filter)
//     .select("-password")
//     .skip(skip)
//     .limit(limitNumber);

//   const totalGuides = await User.countDocuments({ role: "GUIDE" });

//   return {
//     data: guides,
//     meta: {
//       total: totalGuides,
//       page: pageNumber,
//       limit: limitNumber,
//       totalPages: Math.ceil(totalGuides / limitNumber),
//     },
//   };
// };

const getAllGuides = async (
  page = 1,
  limit = 6,
  language?: string,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc"
) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage: any = {
    role: "GUIDE",
  };

  if (language) {
    matchStage.languages = { $in: [language.toLowerCase()] };
  }

  const aggregationPipeline: any[] = [
    { $match: matchStage },

    // Join reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "targetId",
        as: "reviews",
      },
    },

    // Calculate ratings
    {
      $addFields: {
        totalReviews: { $size: "$reviews" },
        avgRating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $round: [{ $avg: "$reviews.rating" }, 1] },
            0,
          ],
        },
      },
    },

    // Return only what you need
    {
      $project: {
        name: 1,
        address: 1,
        languages: 1,
        picture: 1,
        pricePerHour: 1,
        bio: 1,
        avgRating: 1,
        totalReviews: 1,
      },
    },
  ];

  // Only add $sort if sortBy is provided
  if (sortBy) {
    const order = sortOrder === "desc" ? -1 : 1;
    aggregationPipeline.push({ $sort: { [sortBy]: order } });
  }

  aggregationPipeline.push({ $skip: skip }, { $limit: limitNumber });

  const guides = await User.aggregate(aggregationPipeline);

  const total = await User.countDocuments(matchStage);

  return {
    data: guides,
    meta: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

const deleteUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  user.isDeleted = true;
  await user.save();

  // if (user.role === "GUIDE") {
  //   // Soft delete tours
  //   await Tour.updateMany({ guide: user._id }, { $set: { isDeleted: true } });

  //   // Cancel all bookings associated with this guide
  //   await Booking.updateMany(
  //     { guide: user._id },
  //     { $set: { status: "CANCELED" } }
  //   );
  // } else if (user.role === "TOURIST") {
  //   // Cancel all bookings made by tourist
  //   await Booking.updateMany(
  //     { tourist: user._id },
  //     { $set: { status: "CANCELED" } }
  //   );
  // }

  return user;
};

export const UserServices = {
  createUser,
  getAllUsers,
  updateUser,
  getMeInfo,
  getUserById,
  getAllGuides,
  deleteUser,
};
