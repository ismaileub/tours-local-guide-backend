import express from "express";
import { PaymentController } from "./payment.controller";

const router = express.Router();

// Stripe payment intent
router.post("/create-payment-intent", PaymentController.createPaymentIntent);

// Save payment after successful Stripe transaction
router.post("/", PaymentController.savePayment);

// Get payment info for a booking
router.get("/:bookingId", PaymentController.getPaymentByBookingId);

export const PaymentRoutes = router;
