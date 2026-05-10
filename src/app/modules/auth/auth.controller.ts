/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { AuthServices } from "./auth.service";
import { User } from "../user/user.model";
import { Role } from "../user/user.interface";

const credentialsLogin = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await AuthServices.credentialsLogin(req.body);

  setAuthCookie(res, tokens);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged In Successfully",
    data: {
      ...user,
      accessToken: tokens.accessToken,
    },
  });
});

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token recieved from cookies",
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string,
    );

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Access Token Retrived Successfully",
      data: tokenInfo,
    });
  },
);

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, name, picture } = req.body;

  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google email not found");
  }

  let user = await User.findOne({ email });

  // first time google login
  if (!user) {
    user = await User.create({
      name,
      email,
      picture,
      role: Role.TOURIST,
      auths: [
        {
          provider: "google",
          providerId: email,
        },
      ],
    });
  }

  const tokens = await createUserTokens(user);

  const { password, ...userWithoutPassword } = user.toObject();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Google login successful",
    data: {
      ...userWithoutPassword,
      accessToken: tokens.accessToken,
    },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    // secure: false,
    // sameSite: "lax"
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    // secure: false,
    // sameSite: "lax"
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
    data: undefined,
  });
});

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  googleLogin,
};
