import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { BookingControllers } from "./booking.controller";
import { Role } from "../user/user.interface";

const router = Router();

// Tourist books a tour
router.post("/", checkAuth(Role.TOURIST), BookingControllers.createBooking);

// Guide marks booking as completed
router.patch(
  "/:id/complete",
  checkAuth(Role.GUIDE),
  BookingControllers.completeBooking
);

// Get booking (tourist or guide)
router.get(
  "/:id",
  checkAuth(Role.TOURIST, Role.GUIDE),
  BookingControllers.getBooking
);

// Get all bookings (with pagination)
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.GUIDE, Role.TOURIST),
  BookingControllers.getAllBookings
);

export const BookingRoutes = router;
