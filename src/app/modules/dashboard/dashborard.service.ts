import { Types } from "mongoose";
import { Booking } from "../booking/booking.model";
import { Tour } from "../tour/tour.model";
import { User } from "../user/user.model";

// ADMIN
const adminSummary = async () => {
  const totalUsers = await User.countDocuments();
  const totalGuides = await User.countDocuments({ role: "GUIDE" });
  const totalTourists = await User.countDocuments({ role: "TOURIST" });
  const totalTours = await Tour.countDocuments();

  const completedBookings = await Booking.find({ status: "COMPLETED" });

  const totalCompletedBookings = completedBookings.length;

  const totalRevenue = completedBookings.reduce(
    (sum, booking) => sum + (booking.totalPrice || 0),
    0,
  );

  return {
    totalUsers,
    totalGuides,
    totalTourists,
    totalTours,
    totalCompletedBookings,
    totalRevenue,
  };
};

// GUIDE
// const guideSummary = async (guideId: string) => {
//   const myTours = await Tour.countDocuments({ guide: guideId });
//   const bookings = await Booking.find({ guideId });

//   const completed = bookings.filter((b) => b.status === "COMPLETED");
//   const totalEarnings = completed.reduce((sum, b) => sum + b.totalPrice, 0);

//   return {
//     myTours,
//     totalBookings: bookings.length,
//     completedBookings: completed.length,
//     totalEarnings,
//   };
// };

const guideSummary = async (guideId: string) => {
  const guideObjectId = new Types.ObjectId(guideId);

  const myTours = await Tour.countDocuments({ guide: guideObjectId });

  const stats = await Booking.aggregate([
    // Join tour to get guide for TOUR_PACKAGE
    {
      $lookup: {
        from: "tours",
        localField: "tourId",
        foreignField: "_id",
        as: "tour",
      },
    },
    { $unwind: { path: "$tour", preserveNullAndEmptyArrays: true } },

    // Match bookings belonging to this guide
    {
      $match: {
        $or: [
          { guideId: guideObjectId }, // GUIDE_HIRE
          { "tour.guide": guideObjectId }, // TOUR_PACKAGE
        ],
      },
    },

    {
      $group: {
        _id: null,

        totalBookings: { $sum: 1 },

        //  Pending Requests (decision needed)
        pendingRequests: {
          $sum: {
            $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0],
          },
        },

        totalConfirmed: {
          $sum: {
            $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0],
          },
        },

        totalCancelled: {
          $sum: {
            $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0],
          },
        },

        completedBookings: {
          $sum: {
            $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0],
          },
        },

        totalEarnings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "COMPLETED"] },
                  { $eq: ["$paymentStatus", "PAID"] },
                ],
              },
              "$totalPrice",
              0,
            ],
          },
        },

        pendingPayment: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "COMPLETED"] },
                  { $eq: ["$paymentStatus", "UNPAID"] },
                ],
              },
              "$totalPrice",
              0,
            ],
          },
        },
      },
    },
  ]);

  const result = stats[0] || {};

  return {
    myTours,
    totalBookings: result.totalBookings || 0,
    pendingRequests: result.pendingRequests || 0,
    totalConfirmed: result.totalConfirmed || 0,
    totalCancelled: result.totalCancelled || 0,
    completedBookings: result.completedBookings || 0,
    totalEarnings: result.totalEarnings || 0,
    pendingPayment: result.pendingPayment || 0,
  };
};

// TOURIST
// const touristSummary = async (touristId: string) => {
//   const bookings = await Booking.find({ touristId });

//   const completed = bookings.filter(b => b.status === "COMPLETED");

//   const totalSpent = completed
//     .filter(b => b.paymentStatus === "PAID")
//     .reduce((sum, b) => sum + b.totalPrice, 0);

//   const unpaid = completed.filter(b => b.paymentStatus === "UNPAID");

//   const unpaidAmount = unpaid.reduce(
//     (sum, b) => sum + b.totalPrice,
//     0
//   );

//   return {
//     myBookings: bookings.length,
//     completedTours: completed.length,
//     totalSpent,
//     unpaidAmount,
//     unpaidBookings: unpaid.length,
//   };
// };

const touristSummary = async (touristId: string) => {
  const touristObjectId = new Types.ObjectId(touristId);

  const stats = await Booking.aggregate([
    { $match: { touristId: touristObjectId } },
    {
      $group: {
        _id: null,

        myBookings: { $sum: 1 },

        completedTours: {
          $sum: {
            $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0],
          },
        },

        totalSpent: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "COMPLETED"] },
                  { $eq: ["$paymentStatus", "PAID"] },
                ],
              },
              "$totalPrice",
              0,
            ],
          },
        },

        unpaidAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "COMPLETED"] },
                  { $eq: ["$paymentStatus", "UNPAID"] },
                ],
              },
              "$totalPrice",
              0,
            ],
          },
        },

        unpaidBookings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "COMPLETED"] },
                  { $eq: ["$paymentStatus", "UNPAID"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const result = stats[0] || {};

  return {
    myBookings: result.myBookings || 0,
    completedTours: result.completedTours || 0,
    totalSpent: result.totalSpent || 0,
    unpaidAmount: result.unpaidAmount || 0,
    unpaidBookings: result.unpaidBookings || 0,
  };
};

export const DashboardService = {
  adminSummary,
  guideSummary,
  touristSummary,
};
