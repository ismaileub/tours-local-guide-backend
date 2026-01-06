/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { Booking } from "./booking.model";
import { Tour } from "../tour/tour.model";
import { User } from "../user/user.model";
import { StatusCodes } from "http-status-codes";
import { PipelineStage } from "mongoose";

// Create a booking (tour package or guide hire)
const createBooking = async (req: Request, user: JwtPayload) => {
  if (user.role !== "TOURIST") {
    throw new AppError(403, "Only tourists can create bookings");
  }

  const { bookingType, tourId, guideId, hourlyRate, hours, tourDate } =
    req.body;

  const bookingData: any = {
    bookingType,
    touristId: user.userId,
    tourDate,
    status: "PENDING",
    paymentStatus: "UNPAID",
    statusHistory: [
      {
        status: "PENDING",
        changedBy: user.userId,
        role: "TOURIST",
        changedAt: new Date(),
      },
    ],
  };

  let totalPrice = 0;

  if (bookingType === "GUIDE_HIRE") {
    if (!guideId || !hourlyRate || !hours) {
      throw new AppError(
        400,
        "guideId, hourlyRate, and hours are required for GUIDE_HIRE"
      );
    }

    // ✅ Validate guide exists and is a GUIDE
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== "GUIDE") {
      throw new AppError(404, "Guide not found");
    }
    bookingData.guideId = guideId;
    bookingData.hourlyRate = hourlyRate;
    bookingData.hours = hours;
    totalPrice = hourlyRate * hours;
  } else if (bookingType === "TOUR_PACKAGE") {
    if (!tourId) throw new AppError(400, "tourId is required for TOUR_PACKAGE");
    bookingData.tourId = tourId;

    // Fetch tour price from Tour model
    const tour = await Tour.findById(tourId);
    if (!tour) throw new AppError(404, "Tour not found");
    totalPrice = tour.price;
  }

  bookingData.totalPrice = totalPrice;

  const newBooking = await Booking.create(bookingData);
  return newBooking;
};

// Get single booking by id
const getBookingById = async (req: Request, user: JwtPayload) => {
  const { id } = req.params;

  const booking = await Booking.findById(id).populate(
    "touristId",
    "name email phone"
  );

  if (!booking) {
    throw new AppError(404, "Booking not found");
  }

  // 🔐 Authorization
  if (
    booking.touristId._id.toString() !== user.userId
    // &&
    // booking.guideId?._id?.toString() !== user.userId &&
    // user.role !== "ADMIN"
  ) {
    throw new AppError(403, "You are not allowed to view this booking");
  }

  return booking;
};

const getSingleBookingByTouristIdAndTargetId = async (
  req: Request,
  user: JwtPayload
) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Target ID is required");
  }

  // Try finding as GUIDE_HIRE first
  let booking = await Booking.findOne({
    touristId: user.userId,
    guideId: id,
    bookingType: "GUIDE_HIRE",
  }).populate("touristId", "name email phone");

  // If not found, try TOUR_PACKAGE
  if (!booking) {
    booking = await Booking.findOne({
      touristId: user.userId,
      tourId: id,
      bookingType: "TOUR_PACKAGE",
    }).populate("touristId", "name email phone");
  }

  if (!booking) {
    throw new AppError(StatusCodes.NOT_FOUND, "Booking not found");
  }

  return booking;
};

// Get all bookings for current user with pagination
const getAllBookingsOfLoggedInUser = async (
  user: JwtPayload,
  page = 1,
  limit = 8
) => {
  const skip = (page - 1) * limit;

  let filter: any = {};
  if (user.role === "TOURIST") filter = { touristId: user.userId };
  else if (user.role === "GUIDE") {
    filter = {
      $or: [{ guideId: user.userId }, { "tourId.guideId": user.userId }],
    };
  } else if (user.role === "ADMIN") filter = {};
  else throw new AppError(403, "Unauthorized");

  const bookings = await Booking.find(filter)
    .populate({
      path: "tourId",
      select: "title duration location guide",
      populate: {
        path: "guide",
        select: "name email phone",
      },
    })
    .populate("guideId", "name email phone")
    .populate("touristId", "name email phone")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalBookings = await Booking.countDocuments(filter);

  return {
    data: bookings,
    meta: {
      total: totalBookings,
      page,
      limit,
      totalPages: Math.ceil(totalBookings / limit),
    },
  };
};

//get all booking for admin
const getAllBookings = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    // 🔹 Tourist
    {
      $lookup: {
        from: "users",
        localField: "touristId",
        foreignField: "_id",
        as: "tourist",
      },
    },
    { $unwind: "$tourist" },

    // 🔹 Tour (for TOUR_PACKAGE)
    {
      $lookup: {
        from: "tours",
        localField: "tourId",
        foreignField: "_id",
        as: "tour",
      },
    },
    { $unwind: { path: "$tour", preserveNullAndEmptyArrays: true } },

    // 🔹 Guide from GUIDE_HIRE
    {
      $lookup: {
        from: "users",
        localField: "guideId",
        foreignField: "_id",
        as: "hireGuide",
      },
    },
    { $unwind: { path: "$hireGuide", preserveNullAndEmptyArrays: true } },

    // 🔹 Guide from TOUR_PACKAGE (tour.guide)
    {
      $lookup: {
        from: "users",
        localField: "tour.guide",
        foreignField: "_id",
        as: "tourGuide",
      },
    },
    { $unwind: { path: "$tourGuide", preserveNullAndEmptyArrays: true } },

    { $sort: { createdAt: -1 } },

    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },

          {
            $project: {
              bookingType: 1,
              tourDate: 1,
              totalPrice: 1,
              status: 1,
              paymentStatus: 1,
              createdAt: 1,

              tourist: {
                name: "$tourist.name",
                email: "$tourist.email",
                phone: "$tourist.phone",
              },

              // 👇 Dynamic guide based on booking type
              guide: {
                $cond: [
                  { $eq: ["$bookingType", "GUIDE_HIRE"] },
                  {
                    name: "$hireGuide.name",
                    email: "$hireGuide.email",
                    phone: "$hireGuide.phone",
                  },
                  {
                    name: "$tourGuide.name",
                    email: "$tourGuide.email",
                    phone: "$tourGuide.phone",
                  },
                ],
              },

              tour: {
                $cond: [
                  { $eq: ["$bookingType", "TOUR_PACKAGE"] },
                  { title: "$tour.title" },
                  "$$REMOVE",
                ],
              },
            },
          },
        ],

        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await Booking.aggregate(pipeline);

  const total = result[0]?.totalCount[0]?.count || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result[0]?.data || [],
  };
};

const updateBookingStatus = async (req: Request, user: JwtPayload) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["CANCELLED", "CONFIRMED", "COMPLETED"].includes(status)) {
    throw new AppError(400, "Invalid status");
  }

  const booking = await Booking.findById(id).populate("tourId");

  if (!booking) throw new AppError(404, "Booking not found");

  const now = new Date();

  if (status === booking.status) {
    return;
  }

  // TOURIST rules
  if (user.role === "TOURIST") {
    if (booking.touristId.toString() !== user.userId)
      throw new AppError(403, "Unauthorized");

    if (status === "CANCELLED") {
      if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
        throw new AppError(
          400,
          "Can not cancel after booking is confirmed or completed"
        );
      }
      booking.status = "CANCELLED";
      booking.statusHistory.push({
        status: "CANCELLED",
        changedBy: user.userId,
        role: user.role,
      });
    } else if (status === "CONFIRMED") {
      throw new AppError(403, "Tourist cannot confirm booking");
    } else if (status === "COMPLETED") {
      throw new AppError(403, "Tourist can not mark booking complete");
    }
  }

  // GUIDE rules
  if (user.role === "GUIDE") {
    // GUIDE_HIRE
    if (
      booking.bookingType === "GUIDE_HIRE" &&
      booking.guideId?.toString() !== user.userId
    )
      throw new AppError(403, "Unauthorized");

    // TOUR_PACKAGE: guide comes from tour
    // if (
    //   booking.bookingType === "TOUR_PACKAGE" &&
    //   booking.tourId?.guideId.toString() !== user.userId
    // )
    //   throw new AppError(403, "Unauthorized");

    if (status === "CANCELLED") {
      if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
        throw new AppError(
          400,
          "Can not cancel after confirmation or complete"
        );
      }
      booking.status = "CANCELLED";
      booking.statusHistory.push({
        status: "CANCELLED",
        changedBy: user.userId,
        role: user.role,
      });
    } else if (status === "COMPLETED") {
      if (booking.status !== "CONFIRMED") {
        throw new AppError(400, "Cannot complete booking before confirmed");
      }
      if (booking.tourDate > now) {
        throw new AppError(400, "Cannot complete booking before tour date");
      }
      booking.status = "COMPLETED";
      // booking.completedAt = now;
      booking.statusHistory.push({
        status: "COMPLETED",
        changedBy: user.userId,
        role: "GUIDE",
        changedAt: now,
      });
    } else if (status === "CONFIRMED") {
      booking.status = "CONFIRMED";
      booking.statusHistory.push({
        status: "CONFIRMED",
        changedBy: user.userId,
        role: user.role,
      });
    }
  }

  await booking.save();
  return booking;
};

// Get pending bookings for a specific guide
const getPendingBookingsForGuide = async (req: Request, user: JwtPayload) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const filter = {
    $or: [
      { bookingType: "GUIDE_HIRE", guideId: user.userId },
      { bookingType: "TOUR_PACKAGE" },
    ],
    status: { $in: ["PENDING", "CANCELLED"] },
  };

  const total = await Booking.countDocuments(filter);

  const bookings = await Booking.find(filter)
    .populate("touristId", "name email phone picture")
    .populate("guideId", "name email")
    .populate({
      path: "tourId",
      match: { guide: user.userId },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // filter out TOUR_PACKAGE bookings where tourId does not match guide
  const finalBookings = bookings.filter(
    (b) =>
      b.bookingType === "GUIDE_HIRE" ||
      (b.bookingType === "TOUR_PACKAGE" && b.tourId)
  );

  return {
    data: finalBookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
// const getConfirmedAndCompleteBookingsForGuide = async (
//   req: Request,
//   user: JwtPayload
// ) => {
//   const page = Number(req.query.page || 1);
//   const limit = Number(req.query.limit || 10);
//   const skip = (page - 1) * limit;

//   // Step 1: Get all GUIDE_HIRE bookings for this guide
//   const guideHireFilter = {
//     bookingType: "GUIDE_HIRE",
//     guideId: user.userId,
//     status: { $in: ["COMPLETED", "CONFIRMED"] },
//   };

//   // Step 2: Get TOUR_PACKAGE bookings where the guide matches
//   const tourPackageFilter = {
//     bookingType: "TOUR_PACKAGE",
//     status: { $in: ["COMPLETED", "CONFIRMED"] },
//   };

//   // Count documents for pagination
//   const totalGuideHire = await Booking.countDocuments(guideHireFilter);
//   const totalTourPackage = await Booking.countDocuments({
//     ...tourPackageFilter,
//     tourId: { $exists: true }, // will filter later in code
//   });

//   const total = totalGuideHire + totalTourPackage;

//   // Step 3: Fetch bookings with pagination
//   const bookings = await Booking.find({
//     $or: [guideHireFilter, tourPackageFilter],
//   })
//     .populate("touristId", "name email phone picture")
//     .populate("guideId", "name email")
//     .populate({
//       path: "tourId",
//       match: { guide: user.userId }, // only guide's tours
//     })
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit);

//   // Step 4: Filter out TOUR_PACKAGE that are not for this guide
//   const finalBookings = bookings.filter(
//     (b) =>
//       b.bookingType === "GUIDE_HIRE" ||
//       (b.bookingType === "TOUR_PACKAGE" && b.tourId)
//   );

//   return {
//     data: finalBookings,
//     meta: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };
const getConfirmedAndCompleteBookingsForGuide = async (
  req: Request,
  user: JwtPayload
) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const guideHireFilter = {
    bookingType: "GUIDE_HIRE",
    guideId: user.userId,
    status: { $in: ["COMPLETED", "CONFIRMED"] },
  };

  const tourPackageFilter = {
    bookingType: "TOUR_PACKAGE",
    status: { $in: ["COMPLETED", "CONFIRMED"] },
  };

  const totalGuideHire = await Booking.countDocuments(guideHireFilter);
  const totalTourPackage = await Booking.countDocuments({
    ...tourPackageFilter,
    tourId: { $exists: true },
  });

  const total = totalGuideHire + totalTourPackage;

  // Fetch bookings
  const bookings = await Booking.find({
    $or: [guideHireFilter, tourPackageFilter],
  })
    .populate("touristId", "name email phone picture")
    .populate("guideId", "name email")
    .populate({
      path: "tourId",
      match: { guide: user.userId },
    })
    .sort({
      // Custom sorting: CONFIRMED first, COMPLETED later, then newest first
      status: 1, // We'll handle it manually after fetching
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);

  // Filter TOUR_PACKAGE not for this guide
  const finalBookings = bookings.filter(
    (b) =>
      b.bookingType === "GUIDE_HIRE" ||
      (b.bookingType === "TOUR_PACKAGE" && b.tourId)
  );

  // Sort manually by status: CONFIRMED first, COMPLETED last
  finalBookings.sort((a, b) => {
    const order: Record<string, number> = { CONFIRMED: 0, COMPLETED: 1 };
    const aOrder = order[a.status] ?? 2; // unknown statuses get lowest priority
    const bOrder = order[b.status] ?? 2;
    return aOrder - bOrder;
  });

  return {
    data: finalBookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getBookingsNeedPayment = async (userId: string) => {
  const bookings = await Booking.find({
    touristId: userId,
    status: "COMPLETED",
    paymentStatus: { $ne: "PAID" },
  }).sort({ createdAt: -1 });

  return bookings;
};
const getAllUnpaidBookingsOfGuide = async (user: JwtPayload) => {
  // Step 1: fetch all unpaid completed bookings
  const bookings = await Booking.find({
    paymentStatus: { $ne: "PAID" },
    status: "COMPLETED",
  })
    .populate({
      path: "tourId",
      select: "title guide",
    })
    .populate({
      path: "touristId",
      select: "name email",
    })
    .populate({
      path: "guideId",
      select: "name email picture",
    });

  // Step 2: role-based filtering
  let filteredBookings = bookings;

  if (user.role === "GUIDE") {
    filteredBookings = bookings.filter((booking) => {
      if (booking.bookingType === "GUIDE_HIRE") {
        return booking.guideId?._id.toString() === user.userId;
      } else if (booking.bookingType === "TOUR_PACKAGE") {
        return (booking.tourId as any)?.guide.toString() === user.userId;
      }
      return false;
    });
  }

  if (user.role === "TOURIST") {
    filteredBookings = bookings.filter(
      (booking) => booking.touristId.toString() === user.userId
    );
  }

  return filteredBookings;
};

const getPaidBookings = async (req: Request, user: JwtPayload) => {
  // Step 1: fetch all paid completed bookings
  const bookings = await Booking.find({
    paymentStatus: "PAID",
    status: "COMPLETED",
  })
    .populate("tourId")
    .populate("touristId")
    .populate("guideId");

  // Step 2: role-based filtering
  let filteredBookings = bookings;

  if (user.role === "GUIDE") {
    filteredBookings = bookings.filter((booking) => {
      if (booking.bookingType === "GUIDE_HIRE") {
        return booking.guideId?._id.toString() === user.userId;
      } else if (booking.bookingType === "TOUR_PACKAGE") {
        return (booking.tourId as any)?.guide?.toString() === user.userId;
      }
      return false;
    });
  }

  if (user.role === "TOURIST") {
    filteredBookings = await Booking.find({
      touristId: user.userId,
      paymentStatus: "PAID",
    });
  }

  // Step 3: no paid booking found
  if (filteredBookings.length === 0) {
    throw new AppError(404, "No paid bookings found");
  }

  return filteredBookings;
};

export const BookingServices = {
  createBooking,
  updateBookingStatus,
  getBookingById,
  getAllBookings,
  getPendingBookingsForGuide,
  getConfirmedAndCompleteBookingsForGuide,
  getSingleBookingByTouristIdAndTargetId,
  getBookingsNeedPayment,
  getPaidBookings,
  getAllUnpaidBookingsOfGuide,
  getAllBookingsOfLoggedInUser,
};
