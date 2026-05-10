import express from "express";
import { PaymentController } from "./payment.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.post("/create-payment-intent", PaymentController.createPaymentIntent);
router.post("/save-payment", PaymentController.savePayment);
router.get("/:bookingId", PaymentController.getPaymentByBookingId);
router.get(
  "/",
  checkAuth(Role.ADMIN),
  PaymentController.getAllPaymentsForAdmin,
);

export const PaymentRoutes = router;
