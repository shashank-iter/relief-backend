import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  getUserData,
  registerHospitalUser,
  loginHospitalUser
} from "../controllers/user.controller.js";

const admin = ["admin"];
const hospital = ["hospital", "admin"];
const user = ["user", "admin"];

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/hospital/register").post(registerHospitalUser)
router.route("/hospital/login").post(loginHospitalUser);

// route to access user details.
router.route("/me").post(verifyJWT([...user, ...hospital]), getUserData);

export default router;
