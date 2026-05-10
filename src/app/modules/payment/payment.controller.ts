/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { Booking } from "../booking/booking.model";

/**
 * Create Stripe Payment Intent (Individual booking payment)
 */
const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    throw new Error("Booking ID is required");
  }

  const booking = await PaymentService.getBookingById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.paymentStatus === "PAID") {
    throw new Error("Booking already paid");
  }

  if (booking.status !== "COMPLETED") {
    throw new Error("Booking not confirmed");
  }

  const paymentIntent = await PaymentService.createPaymentIntent(
    booking.totalPrice,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment intent created",
    data: {
      clientSecret: paymentIntent.client_secret,
    },
  });
});

/**
 * Save payment info after successful Stripe payment
 */
const savePayment = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, transactionId } = req.body;
  const booking = (await Booking.findById(bookingId).populate(
    "touristId",
    "name email phone",
  )) as unknown as {
    touristId: { name: string; email: string; phone: string };
    totalPrice: number;
    _id: string;
  };
  //console.log(req.body);

  if (!bookingId || !transactionId || !booking) {
    throw new Error("Invalid payment data");
  }

  const payment = await PaymentService.savePayment({
    bookingId,
    touristEmail: booking.touristId.email,
    amount: booking.totalPrice,
    method: "card",
    transactionId,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment saved successfully",
    data: payment,
  });
});

/**
 * Get payment info by booking ID
 */
const getPaymentByBookingId = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params;

    const payment = await PaymentService.getPaymentByBookingId(bookingId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment retrieved successfully",
      data: payment,
    });
  },
);

const getAllPaymentsForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await PaymentService.getAllPaymentsForAdmin(page, limit);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment history retrieved",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const PaymentController = {
  createPaymentIntent,
  savePayment,
  getPaymentByBookingId,
  getAllPaymentsForAdmin,
};
