import { Schema, model } from "mongoose";
import { ITour } from "./tour.interface";

export enum TourType {
  SEA_BEACH = "Sea Beach",
  CITY_LIFE = "City Life",
  VILLAGE_LIFE = "Village Life",
  HILL_TRACKS = "Hill Tracks",
  ADVENTURE = "Adventure",
  HISTORICAL = "Historical Place",
  RIVER_SIDE = "River Side",
  NIGHTLIFE = "Nightlife",
}

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

    tourType: {
      type: String,
      enum: Object.values(TourType),
      required: true,
    },
  },
  { timestamps: true }
);

export const Tour = model<ITour>("Tour", TourSchema);
