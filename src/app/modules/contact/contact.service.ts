// contact.service.ts
import { IContactMessage } from "./contact.interface";
import { Contact } from "./contact.model";

const createContactMessage = async (payload: IContactMessage) => {
  const result = await Contact.create(payload);
  return result;
};

const getAllContactMessages = async () => {
  return await Contact.find().sort({ createdAt: -1 });
};
export const ContactService = {
  createContactMessage,
  getAllContactMessages,
};
