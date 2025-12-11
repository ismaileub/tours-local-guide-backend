import Stripe from "stripe";
import { Payment, IPayment } from "./payment.model";
import { Booking } from "../booking.model";
import { envVars } from "../../../config/env";

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount: number) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert to cents
    currency: "usd",
    payment_method_types: ["card"],
  });
  return paymentIntent;
};

const savePayment = async (data: {
  bookingId: string;
  touristEmail: string;
  amount: number;
  method: string;
  transactionId: string;
}): Promise<IPayment> => {
  const booking = await Booking.findById(data.bookingId);
  if (!booking) throw new Error("Booking not found");

  const payment = await Payment.create({
    bookingId: data.bookingId,
    touristEmail: data.touristEmail,
    amount: data.amount,
    method: data.method,
    transactionId: data.transactionId,
    status: "completed",
  });

  // Update booking status
  booking.status = "COMPLETED";
  await booking.save();

  return payment;
};

const getPaymentByBookingId = async (bookingId: string) => {
  const payment = await Payment.findOne({ bookingId });
  if (!payment) throw new Error("Payment not found");
  return payment;
};

export const PaymentService = {
  createPaymentIntent,
  savePayment,
  getPaymentByBookingId,
};
