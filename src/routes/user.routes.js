import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerGeneralUser,
  loginGeneralUser,
} from "../controllers/user.controller.js";

const admin = ["admin"];
const hospital = ["hospital", "admin"];
const user = ["user", "admin"];

const router = Router();

router.route("/register").post(registerGeneralUser);
router.route("/login").post(loginGeneralUser);

export default router;
