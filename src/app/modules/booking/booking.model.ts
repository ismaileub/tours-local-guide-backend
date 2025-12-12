import { Schema, model, Types } from "mongoose";

export interface IBooking {
  _id?: Types.ObjectId;
  tourId: Types.ObjectId;
  guideId: Types.ObjectId;
  touristId: Types.ObjectId;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID";
  paymentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
    guideId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    touristId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },
    paymentId: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Booking = model<IBooking>("Booking", bookingSchema);
