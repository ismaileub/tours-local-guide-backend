import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingServices } from "./booking.service";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const booking = await BookingServices.createBooking(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Booking created successfully",
    data: booking,
  });
});

const completeBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const booking = await BookingServices.markBookingComplete(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Booking marked as completed",
    data: booking,
  });
});

const getBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const booking = await BookingServices.getBookingById(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Booking fetched successfully",
    data: booking,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload; // JwtPayload
  const { page = 1, limit = 10 } = req.query;

  const result = await BookingServices.getAllBookings(
    req,
    user,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bookings retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const BookingControllers = {
  createBooking,
  completeBooking,
  getBooking,
  getAllBookings,
};
