import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TourServices } from "./tour.service";

const createTour = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const tour = await TourServices.createTour(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Tour created successfully",
    data: tour,
  });
});

const updateTour = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const tour = await TourServices.updateTour(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Tour updated successfully",
    data: tour,
  });
});

const deleteTour = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  await TourServices.deleteTour(req, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Tour deleted successfully",
    data: null,
  });
});

const getTourById = catchAsync(async (req: Request, res: Response) => {
  const tour = await TourServices.getTourById(req);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Tour fetched successfully",
    data: tour,
  });
});

const getAllTours = catchAsync(async (req: Request, res: Response) => {
  const tours = await TourServices.getAllTours(req);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Tours fetched successfully",
    data: tours,
  });
});

const getMyTours = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const tours = await TourServices.getMyTours(user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My tours fetched successfully",
    data: tours,
  });
});

export const TourControllers = {
  createTour,
  updateTour,
  deleteTour,
  getTourById,
  getAllTours,
  getMyTours,
};
