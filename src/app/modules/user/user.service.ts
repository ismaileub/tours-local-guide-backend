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

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // const isAdmin = user.role === Role.ADMIN;
  // const isSelfUpdate = user._id?.toString() === existingUser._id.toString();

  // if (!isSelfUpdate && !isAdmin) {
  //   throw new AppError(
  //     httpStatus.FORBIDDEN,
  //     "You can only update your own profile"
  //   );
  // }

  // Password → hash it
  // if (payload.password) {
  //   payload.password = await bcryptjs.hash(
  //     payload.password,
  //     Number(envVars.BCRYPT_SALT_ROUND)
  //   );
  // }

  // File upload → Cloudinary
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    payload.picture = uploadResult?.secure_url;
  }

  // Update user in DB
  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");

  return updatedUser;
};

const getAllUsers = async (page = 1, limit = 10) => {
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

export const getUserById = async (id: string) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

export const UserServices = {
  createUser,
  getAllUsers,
  updateUser,
  getMeInfo,
  getUserById,
};
