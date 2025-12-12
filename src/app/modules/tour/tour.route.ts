/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";

import { fileUploader } from "../../helpers/fileUploader";
import { TourControllers } from "./tour.controller";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/create",
  checkAuth(Role.GUIDE),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      return TourControllers.createTour(req, res, next);
    } catch (err) {
      console.error("JSON parse error:", err);
      next(err);
    }
  }
);

router.get("/", TourControllers.getAllTours);
router.get("/my-tours", checkAuth(Role.GUIDE), TourControllers.getMyTours);

router.get("/:id", TourControllers.getTourById);

router.patch("/:id", checkAuth(Role.GUIDE), TourControllers.updateTour);

router.delete("/:id", checkAuth(Role.GUIDE), TourControllers.deleteTour);

export const TourRoutes = router;
