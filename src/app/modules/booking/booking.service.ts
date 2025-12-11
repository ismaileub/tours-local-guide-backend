import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { Booking } from "./booking.model";

const createBooking = async (req: Request, user: JwtPayload) => {
  if (user.role !== "TOURIST") {
    throw new AppError(403, "Only tourists can book tours");
  }

  const { tourId, guideId } = req.body;

  const newBooking = await Booking.create({
    tourId,
    guideId,
    touristId: user.userId,
    status: "PENDING",
    paymentStatus: "UNPAID",
  });

  return newBooking;
};

const markBookingComplete = async (req: Request, user: JwtPayload) => {
  if (user.role !== "GUIDE") {
    throw new AppError(403, "Only guides can mark tours complete");
  }

  const { id } = req.params;

  const booking = await Booking.findOne({ _id: id, guideId: user.userId });

  if (!booking) {
    throw new AppError(404, "Booking not found or unauthorized");
  }

  booking.status = "COMPLETED";
  booking.completedAt = new Date();

  await booking.save();

  return booking;
};

const getBookingById = async (req: Request, user: JwtPayload) => {
  const { id } = req.params;

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(404, "Booking not found");
  }

  // Only involved users can access
  if (
    (user.role === "TOURIST" && booking.touristId.toString() !== user.userId) ||
    (user.role === "GUIDE" && booking.guideId.toString() !== user.userId)
  ) {
    throw new AppError(403, "Unauthorized");
  }

  return booking;
};

const getAllBookings = async (
  req: Request,
  user: JwtPayload,
  page = 1,
  limit = 10
) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  let filter = {};

  // Filter bookings based on user role
  if (user.role === "TOURIST") {
    filter = { touristId: user.userId };
  } else if (user.role === "GUIDE") {
    filter = { guideId: user.userId };
  } else if (user.role === "ADMIN") {
    filter = {}; // Admin sees all
  } else {
    throw new AppError(403, "Unauthorized to view bookings");
  }

  const bookings = await Booking.find(filter)
    .populate("tourId", "title price") // optional populate
    .populate("guideId", "name email")
    .populate("touristId", "name email")
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 });

  const totalBookings = await Booking.countDocuments(filter);

  return {
    data: bookings,
    meta: {
      total: totalBookings,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalBookings / limitNumber),
    },
  };
};
export const BookingServices = {
  createBooking,
  markBookingComplete,
  getBookingById,
  getAllBookings,
};
