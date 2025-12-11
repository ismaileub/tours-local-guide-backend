import { Schema, model } from "mongoose";
import { ITour } from "./tour.interface";

const TourSchema = new Schema<ITour>(
  {
    guide: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverPhoto: {
      type: String,
    },
    spots: {
      type: [String],
    },
  },
  { timestamps: true }
);

export const Tour = model<ITour>("Tour", TourSchema);
