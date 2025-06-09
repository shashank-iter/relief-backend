import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateHospitalProfile, getHospitalProfile, getHospitalDashboardStats } from "../controllers/hospital.controller.js";

const router = Router();

// Protect all patient routes
router.use(verifyJWT(["hospital", "admin"]));

// Hospital routes
router.route("/update-profile").put(updateHospitalProfile);
router.route("/profile").get(getHospitalProfile);
router.route("/dashboard").get(getHospitalDashboardStats);

export default router;
