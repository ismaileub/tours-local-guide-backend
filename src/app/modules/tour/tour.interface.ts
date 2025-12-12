import { Types } from "mongoose";
import { TourType } from "./tour.model";

export interface ITour {
  _id?: Types.ObjectId;
  guide: Types.ObjectId;
  title: string;
  location: string;
  price: number;
  duration: string;
  description: string;
  coverPhoto?: string;
  spots?: string[];
  tourType: TourType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITourInput {
  title: string;
  location: string;
  price: number;
  duration: string;
  description: string;
  spots: string[];
  coverPhoto?: string;
  tourType: TourType;
}
