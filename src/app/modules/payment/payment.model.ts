import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  touristEmail: string;
  amount: number;
  method: string;
  transactionId: string;
  paymentDate: Date;
}

const paymentSchema = new Schema<IPayment>({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  touristEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  transactionId: { type: String, required: true },
  paymentDate: { type: Date, default: Date.now },
});

export const Payment = model<IPayment>("Payment", paymentSchema);
