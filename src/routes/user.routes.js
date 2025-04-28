import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  getUserData,
} from "../controllers/user.controller.js";

const admin = ["admin"];
const hospital = ["hospital", "admin"];
const user = ["user", "admin"];

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// route to access user details.
router.route("/me").post(verifyJWT([...user, ...hospital]), getUserData);

export default router;
