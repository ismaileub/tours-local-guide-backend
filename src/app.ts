import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { AuthRoutes } from "./app/modules/auth/auth.routes";
import { UserRoutes } from "./app/modules/user/user.route";
import { TourRoutes } from "./app/modules/tour/tour.route";
import { BookingRoutes } from "./app/modules/booking/booking.route";
import { PaymentRoutes } from "./app/modules/payment/payment.routes";
import { ReviewRoutes } from "./app/modules/review/review.route";
import { DashboardRoutes } from "./app/modules/dashboard/dashboard.route";
import { ContactRoutes } from "./app/modules/contact/contact.route";

const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://tour-guide-frontend-amber.vercel.app",
    ],
    credentials: true,
  }),
);

app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tours", TourRoutes);
app.use("/api/booking", BookingRoutes);
app.use("/api/review", ReviewRoutes);
app.use("/api/payment", PaymentRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/contact", ContactRoutes);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Tour Guide Backend",
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
