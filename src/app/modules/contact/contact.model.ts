import { Schema, model } from "mongoose";
import { IContactMessage } from "./contact.interface";

const contactSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

export const Contact = model<IContactMessage>("Contact", contactSchema);
