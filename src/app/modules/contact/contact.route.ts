import { Router } from "express";
import { ContactController } from "./contact.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.post("/", ContactController.sendMessage);

router.get("/", checkAuth(Role.ADMIN), ContactController.getAllMessages);

export const ContactRoutes = router;
