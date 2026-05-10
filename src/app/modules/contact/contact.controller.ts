// contact.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { ContactService } from "./contact.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.createContactMessage(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Message sent successfully",
    data: result,
  });
});

const getAllMessages = catchAsync(async (_req: Request, res: Response) => {
  const result = await ContactService.getAllContactMessages();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contact messages retrieved successfully",
    data: result,
  });
});

export const ContactController = {
  sendMessage,
  getAllMessages,
};
