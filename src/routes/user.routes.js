import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerGeneralUser,
  loginGeneralUser,
  getUserData,
  updatePatientProfile,
  getPatientProfile, 
  updateEmergencyContact, 
  updateMedicalHistory,
  deleteEmergencyContact,
  deleteMedicalHistoryItem
} from "../controllers/user.controller.js";

const admin = ["admin"];
const hospital = ["hospital", "admin"];
const user = ["user", "admin"];

const router = Router();

router.route("/register").post(registerGeneralUser);
router.route("/login").post(loginGeneralUser);
// router.route("/profile").get(verifyJWT(user), getUserData);

// Profile routes
router.route("/profile").get(verifyJWT(user), getPatientProfile);
router.route("/update-profile").put(verifyJWT(user), updatePatientProfile);


// Emergency contact routes
router.route("/emergency-contacts").post(verifyJWT(user), updateEmergencyContact);
router.route("/emergency-contacts/:contactId").delete(verifyJWT(user), deleteEmergencyContact);

// Medical history routes
router.route("/medical-history/:type").post(verifyJWT(user), updateMedicalHistory);
router.route("/medical-history/:type/:itemId").delete(verifyJWT(user), deleteMedicalHistoryItem);

export default router;
