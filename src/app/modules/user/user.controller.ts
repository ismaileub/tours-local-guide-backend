/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import AppError from "../../errorHelpers/AppError";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);

    // res.status(httpStatus.CREATED).json({
    //     message: "User Created Successfully",
    //     user
    // })

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Created Successfully",
      data: user,
    });
  }
);
//
//
// const updateUser = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = req.params.id;

//     const verifiedToken = req.user;

//     const payload = req.body;
//     const user = await UserServices.updateUser(
//       userId,
//       payload,
//       verifiedToken as JwtPayload
//     );

//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.CREATED,
//       message: "User Updated Successfully",
//       data: user,
//     });
//   }
// );

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const updatedUser = await UserServices.updateUser(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User Updated Successfully",
    data: updatedUser,
  });
});

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get page and limit from query params, with defaults
    const { page = 1, limit = 10 } = req.query;

    // Pass them to the service (convert to number)
    const result = await UserServices.getAllUsers(Number(page), Number(limit));

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Users Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const verifiedUser = req.user as JwtPayload;

    const email = verifiedUser?.email;

    const user = await UserServices.getMeInfo(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Retrieved Successfully",
      data: user,
    });
  }
);

export const UserControllers = {
  createUser,
  getAllUsers,
  updateUser,
  getMe,
};

// route matching -> controller -> service -> model -> DB
