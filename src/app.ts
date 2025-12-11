import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import passport from "passport";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { AuthRoutes } from "./app/modules/auth/auth.routes";
import { UserRoutes } from "./app/modules/user/user.route";
import { TourRoutes } from "./app/modules/tour/tour.route";
import { BookingRoutes } from "./app/modules/booking/booking.route";
import { PaymentRoutes } from "./app/modules/booking/payment/payment.routes";

const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://parcel-delivery-system-frontend-delta.vercel.app",
    ],
    credentials: true,
  })
);

app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tours", TourRoutes);
app.use("/api/booking", BookingRoutes);
app.use("/api/payment", PaymentRoutes);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Tour Guide Backend",
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
