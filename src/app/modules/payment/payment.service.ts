import Stripe from "stripe";
import { Payment, IPayment } from "./payment.model";
import { envVars } from "../../config/env";
import { Booking } from "../booking/booking.model";

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

interface SavePaymentDTO {
  bookingId: string;
  touristEmail: string;
  amount: number;
  method: string;
  transactionId: string;
}

const getBookingById = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");
  return booking;
};

const createPaymentIntent = async (amount: number) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    payment_method_types: ["card"],
  });
  return paymentIntent;
};

const savePayment = async (data: SavePaymentDTO): Promise<IPayment> => {
  const booking = await Booking.findById(data.bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.paymentStatus === "PAID") throw new Error("Booking already paid");

  const payment = await Payment.create({
    bookingId: data.bookingId,
    touristEmail: data.touristEmail,
    amount: data.amount,
    method: data.method,
    transactionId: data.transactionId,
    paymentDate: new Date(),
  });

  // Update booking
  booking.paymentStatus = "PAID";
  await booking.save();

  return payment;
};

const getPaymentByBookingId = async (bookingId: string) => {
  const payment = await Payment.findOne({ bookingId });
  if (!payment) throw new Error("Payment not found");
  return payment;
};

const getAllPaymentsForAdmin = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const payments = await Payment.find()
    .sort({ paymentDate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments();
  const totalMoneyResult = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const totalMoney = totalMoneyResult[0]?.totalAmount || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      totalMoney,
    },
    data: payments,
  };
};

export const PaymentService = {
  getBookingById,
  createPaymentIntent,
  savePayment,
  getPaymentByBookingId,
  getAllPaymentsForAdmin,
};
