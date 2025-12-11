import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import { User } from "../modules/user/user.model";
import httpStatus from "http-status-codes";

// Middleware to check JWT & role
export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies?.accessToken || req.headers.authorization;

      if (!accessToken) {
        throw new AppError(httpStatus.FORBIDDEN, "No token received");
      }

      // Verify token
      const decoded = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      // Check if user exists in DB
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
      }

      if (!authRoles.includes(decoded.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not permitted to view this route!"
        );
      }

      // Store user info in request for future use
      req.user = decoded;
      console.log({ decoded });

      next();
    } catch (error) {
      next(error);
    }
  };
