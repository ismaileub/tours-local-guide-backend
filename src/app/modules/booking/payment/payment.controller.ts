/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { PaymentService } from "./payment.service";

const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await PaymentService.createPaymentIntent(amount);
    //
    //
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const savePayment = async (req: Request, res: Response) => {
  try {
    const { bookingId, touristEmail, amount, method, transactionId } = req.body;
    const payment = await PaymentService.savePayment({
      bookingId,
      touristEmail,
      amount,
      method,
      transactionId,
    });
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const getPaymentByBookingId = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const payment = await PaymentService.getPaymentByBookingId(bookingId);
    res.json(payment);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const PaymentController = {
  createPaymentIntent,
  savePayment,
  getPaymentByBookingId,
};
