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

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const booking = await BookingServices.updateBookingStatus(req, user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Booking updated successfully",
    data: booking,
  });
});

// const getAllBookings = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as JwtPayload;
//   const page = Number(req.query.page) || 1;
//   const limit = Number(req.query.limit) || 10;
//   const result = await BookingServices.getAllBookings(req, user, page, limit);

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Bookings retrieved successfully",
//     data: result.data,
//     meta: result.meta,
//   });
// });

//get all booking fo admin
const getAllBookingsOfLoggedInUser = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const result = await BookingServices.getAllBookingsOfLoggedInUser(
      user,
      page,
      limit,
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Bookings retrieved successfully of current logged user",
      data: result.data,
      meta: result.meta,
    });
  },
);
const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await BookingServices.getAllBookings(page, limit);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bookings retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPendingBookingsForGuide = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await BookingServices.getPendingBookingsForGuide(req, user);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Pending bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getConfirmedAndCompleteBookingsForGuide = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result =
      await BookingServices.getConfirmedAndCompleteBookingsForGuide(req, user);

    console.log(result);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Confirmed and Completed bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleBookingByTouristIdAndTargetId = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const booking =
      await BookingServices.getSingleBookingByTouristIdAndTargetId(req, user);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Booking retrieved successfully",
      data: booking,
    });
  },
);

const getBookingsNeedPayment = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const bookings = await BookingServices.getBookingsNeedPayment(user.userId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Bookings that need payment retrieved successfully",
      data: bookings,
    });
  },
);

const getAllUnpaidBookingsOfGuide = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const bookings = await BookingServices.getAllUnpaidBookingsOfGuide(user);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Unpaid bookings retrieved successfully",
      data: bookings,
    });
  },
);

const getPaidBookings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const result = await BookingServices.getPaidBookings(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Paid bookings retrieved successfully",
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const result = await BookingServices.getBookingById(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Booking retrieved successfully",
    data: result,
  });
});

export const BookingControllers = {
  createBooking,
  updateBooking,
  getAllBookings,
  getPendingBookingsForGuide,
  getConfirmedAndCompleteBookingsForGuide,
  getSingleBookingByTouristIdAndTargetId,
  getBookingsNeedPayment,
  getPaidBookings,
  getBookingById,
  getAllUnpaidBookingsOfGuide,
  getAllBookingsOfLoggedInUser,
};
